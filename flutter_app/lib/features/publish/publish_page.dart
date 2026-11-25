import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../constants/property.dart';
import '../../core/theme.dart';
import '../../data/listing_repository.dart';
import '../../providers.dart';
import '../../services/cloudinary_service.dart';
import '../../services/location_service.dart';

const _maxPhotos = 10;

/// "95", "95,5" or "1 200" -> number. Empty or invalid -> null.
double? _parseNumber(String value) {
  final cleaned = value.replaceAll(RegExp(r'\s'), '').replaceAll(',', '.');
  if (cleaned.isEmpty) return null;
  return double.tryParse(cleaned);
}

String _errorText(Object e) => e.toString().replaceFirst('Exception: ', '');

class PublishPage extends ConsumerStatefulWidget {
  const PublishPage({super.key});

  @override
  ConsumerState<PublishPage> createState() => _PublishPageState();
}

class _PublishPageState extends ConsumerState<PublishPage> {
  final _picker = ImagePicker();

  final _title = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _surface = TextEditingController();
  final _rooms = TextEditingController();
  final _city = TextEditingController();
  final _address = TextEditingController();

  String _transaction = 'vente';
  String _propertyType = 'appartement';
  Coords? _coords;
  final List<XFile> _photos = [];

  bool _locating = false;
  bool _submitting = false;
  String _progress = '';
  String? _error;

  @override
  void dispose() {
    for (final c in [_title, _description, _price, _surface, _rooms, _city, _address]) {
      c.dispose();
    }
    super.dispose();
  }

  // ---------- Photos ----------
  Future<void> _pickPhotos() async {
    final remaining = _maxPhotos - _photos.length;
    if (remaining <= 0) return;
    final picked = await _picker.pickMultiImage(imageQuality: 60, maxWidth: 1600);
    if (!mounted || picked.isEmpty) return;
    setState(() => _photos.addAll(picked.take(remaining)));
  }

  // ---------- Position ----------
  Future<void> _useMyLocation() async {
    setState(() {
      _locating = true;
      _error = null;
    });
    try {
      final c = await getCurrentCoords();
      final place = await reverseGeocode(c);
      if (!mounted) return;
      setState(() {
        _coords = c;
        if (place != null) {
          if (_city.text.trim().isEmpty && place.city.isNotEmpty) _city.text = place.city;
          if (_address.text.trim().isEmpty && place.address.isNotEmpty) {
            _address.text = place.address;
          }
        }
      });
    } catch (e) {
      if (mounted) setState(() => _error = _errorText(e));
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _locateFromAddress() async {
    final query = [_address.text, _city.text].where((s) => s.trim().isNotEmpty).join(', ');
    if (query.isEmpty) {
      setState(() => _error = "Saisissez l'adresse ou la ville d'abord.");
      return;
    }
    setState(() {
      _locating = true;
      _error = null;
    });
    try {
      final c = await geocodeAddress(query);
      if (!mounted) return;
      setState(() {
        if (c == null) {
          _error = 'Adresse introuvable. Essayez avec « Ma position ».';
        } else {
          _coords = c;
        }
      });
    } catch (_) {
      if (mounted) setState(() => _error = 'Impossible de localiser cette adresse.');
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  // ---------- Publication ----------
  String? _validate() {
    if (_title.text.trim().length < 5) return 'Le titre doit contenir au moins 5 caractères.';
    final p = _parseNumber(_price.text);
    if (p == null || p <= 0) return 'Indiquez un prix valide.';
    if (_city.text.trim().isEmpty) return 'Indiquez la ville.';
    if (_coords == null) {
      return "Enregistrez la position du bien (Ma position ou Depuis l'adresse).";
    }
    if (_photos.isEmpty) return 'Ajoutez au moins une photo.';
    return null;
  }

  void _resetForm() {
    for (final c in [_title, _description, _price, _surface, _rooms, _city, _address]) {
      c.clear();
    }
    setState(() {
      _transaction = 'vente';
      _propertyType = 'appartement';
      _coords = null;
      _photos.clear();
    });
  }

  Future<void> _submit(User user) async {
    final problem = _validate();
    if (problem != null) {
      setState(() => _error = problem);
      return;
    }
    setState(() {
      _error = null;
      _submitting = true;
    });
    try {
      // 1) upload each photo to Cloudinary to get its URL
      final urls = <String>[];
      for (var i = 0; i < _photos.length; i++) {
        setState(() => _progress = 'Envoi des photos ${i + 1}/${_photos.length}…');
        urls.add(await uploadPhoto(_photos[i]));
        if (!mounted) return;
      }

      // 2) create the listing in Firestore with those URLs
      setState(() => _progress = "Création de l'annonce…");
      await ref.read(listingsRepositoryProvider).createListing(
            ownerId: user.uid,
            ownerName: user.displayName,
            input: NewListingInput(
              transaction: _transaction,
              propertyType: _propertyType,
              title: _title.text,
              description: _description.text,
              price: _parseNumber(_price.text)!,
              surfaceM2: _parseNumber(_surface.text),
              rooms: _parseNumber(_rooms.text)?.toInt(),
              city: _city.text,
              address: _address.text,
              lat: _coords!.lat,
              lng: _coords!.lng,
              photos: urls,
            ),
          );

      if (!mounted) return;
      _resetForm();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Annonce publiée : elle est maintenant en ligne.')),
      );
    } on FirebaseException catch (e) {
      if (mounted) {
        setState(() => _error = e.code == 'permission-denied'
            ? 'Publication refusée par les règles Firestore.'
            : (e.message ?? 'Une erreur est survenue.'));
      }
    } catch (e) {
      if (mounted) setState(() => _error = _errorText(e));
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
          _progress = '';
        });
      }
    }
  }

  // ---------- UI ----------
  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 6),
        child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      );

  Widget _photoTile(XFile file, int index) {
    return SizedBox(
      width: 96,
      height: 96,
      child: Stack(
        children: [
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(File(file.path), fit: BoxFit.cover),
            ),
          ),
          if (index == 0)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 2),
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(12)),
                ),
                child: const Text(
                  'Couverture',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 11),
                ),
              ),
            ),
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: () => setState(() => _photos.removeAt(index)),
              child: const CircleAvatar(
                radius: 11,
                backgroundColor: Colors.black54,
                child: Icon(Icons.close, size: 14, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _addPhotoTile() {
    return InkWell(
      onTap: _pickPhotos,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 96,
        height: 96,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.primary, width: 1.5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.add, size: 32, color: AppColors.primary),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    if (auth.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final user = auth.value;

    // Visitors can browse the app, but publishing needs an account.
    if (user == null) return const _GuestView();

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          children: [
            Text(
              'Publier une annonce',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),

            SegmentedButton<String>(
              segments: [
                for (final e in transactionLabels.entries)
                  ButtonSegment(value: e.key, label: Text(e.value)),
              ],
              selected: {_transaction},
              onSelectionChanged: (s) => setState(() => _transaction = s.first),
              style: SegmentedButton.styleFrom(
                selectedBackgroundColor: AppColors.primary,
                selectedForegroundColor: Colors.white,
              ),
            ),

            _label('Type de bien'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final e in propertyLabels.entries)
                  ChoiceChip(
                    label: Text(e.value),
                    selected: _propertyType == e.key,
                    onSelected: (_) => setState(() => _propertyType = e.key),
                    selectedColor: AppColors.primary,
                    checkmarkColor: Colors.white,
                    labelStyle: TextStyle(
                      color: _propertyType == e.key ? Colors.white : AppColors.text,
                    ),
                  ),
              ],
            ),

            _label('Titre'),
            TextField(
              controller: _title,
              maxLength: 120,
              decoration: const InputDecoration(
                hintText: 'Ex : Appartement S+2 vue mer',
                counterText: '',
              ),
            ),
            _label('Description'),
            TextField(
              controller: _description,
              maxLines: 5,
              maxLength: 5000,
              decoration: const InputDecoration(
                hintText: 'Décrivez le bien : état, étage, équipements…',
                counterText: '',
              ),
            ),
            _label(_transaction == 'vente' ? 'Prix (DT)' : 'Loyer mensuel (DT)'),
            TextField(
              controller: _price,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(hintText: 'Ex : 280000'),
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _label('Surface (m²)'),
                      TextField(
                        controller: _surface,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(hintText: '95'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _label('Pièces'),
                      TextField(
                        controller: _rooms,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: '3'),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            _label('Ville'),
            TextField(controller: _city, decoration: const InputDecoration(hintText: 'Ex : Sousse')),
            _label('Adresse'),
            TextField(
              controller: _address,
              decoration: const InputDecoration(hintText: 'Rue, quartier'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _locating ? null : _useMyLocation,
                    child: const Text('Ma position'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _locating ? null : _locateFromAddress,
                    child: const Text("Depuis l'adresse"),
                  ),
                ),
              ],
            ),
            if (_locating)
              const Padding(
                padding: EdgeInsets.only(top: 12),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (_coords != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '✓ Position enregistrée (${_coords!.lat.toStringAsFixed(4)}, ${_coords!.lng.toStringAsFixed(4)})',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500),
                ),
              ),

            _label('Photos (${_photos.length}/$_maxPhotos)'),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (var i = 0; i < _photos.length; i++) _photoTile(_photos[i], i),
                if (_photos.length < _maxPhotos) _addPhotoTile(),
              ],
            ),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.error),
                ),
              ),

            const SizedBox(height: 20),
            FilledButton(
              onPressed: _submitting ? null : () => _submit(user),
              child: _submitting
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        ),
                        const SizedBox(width: 12),
                        Flexible(child: Text(_progress)),
                      ],
                    )
                  : const Text("Publier l'annonce"),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuestView extends StatelessWidget {
  const _GuestView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Publier une annonce',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Connectez-vous ou créez un compte pour publier votre bien.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.muted),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.push('/login'),
                child: const Text('Se connecter'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}