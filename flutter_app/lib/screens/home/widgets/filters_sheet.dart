import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/property_filters.dart';
import '../../../widgets/pill_chip.dart';

/// Ouvre la feuille de filtres. Retourne les nouveaux filtres, ou null si fermée.
Future<PropertyFilters?> showFiltersSheet(
  BuildContext context,
  PropertyFilters actuel,
) {
  return showModalBottomSheet<PropertyFilters>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
    ),
    builder: (_) => _FiltersSheet(initial: actuel),
  );
}

class _FiltersSheet extends StatefulWidget {
  const _FiltersSheet({required this.initial});

  final PropertyFilters initial;

  @override
  State<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<_FiltersSheet> {
  static const _types = {
    TypeAnnonce.tout: 'Tout',
    TypeAnnonce.acheter: 'Acheter',
    TypeAnnonce.louer: 'Louer',
  };
  static const _tris = {
    Tri.recentes: 'Plus récentes',
    Tri.prixCroissant: 'Prix croissant',
    Tri.prixDecroissant: 'Prix décroissant',
  };

  late TypeAnnonce _type = widget.initial.type;
  late int _pieces = widget.initial.piecesMin;
  late Tri _tri = widget.initial.tri;
  late final _minCtrl = TextEditingController(
    text: widget.initial.prixMin?.round().toString() ?? '',
  );
  late final _maxCtrl = TextEditingController(
    text: widget.initial.prixMax?.round().toString() ?? '',
  );

  @override
  void dispose() {
    _minCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  num? _parse(String s) => num.tryParse(s.replaceAll(RegExp(r'\s'), ''));

  void _appliquer() {
    var min = _parse(_minCtrl.text);
    var max = _parse(_maxCtrl.text);
    // Si min > max, on les inverse plutôt que d'afficher 0 résultat
    if (min != null && max != null && min > max) {
      final tmp = min;
      min = max;
      max = tmp;
    }
    Navigator.of(context).pop(
      PropertyFilters(
        type: _type,
        prixMin: min,
        prixMax: max,
        piecesMin: _pieces,
        tri: _tri,
      ),
    );
  }

  void _reinitialiser() {
    Navigator.of(context).pop(const PropertyFilters());
  }

  Widget _titre(String texte) => Padding(
        padding: const EdgeInsets.only(top: 24, bottom: 14),
        child: Text(texte, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
      );

  Widget _champPrix(TextEditingController ctrl, String hint) {
    return Expanded(
      child: TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(fontSize: 16),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.muted, fontSize: 16),
          filled: true,
          fillColor: AppColors.field,
          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final clavier = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: clavier),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Filtres',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, size: 30),
                ),
              ],
            ),

            _titre("Type d'annonce"),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final e in _types.entries)
                  PillChip(
                    label: e.value,
                    selected: _type == e.key,
                    onTap: () => setState(() => _type = e.key),
                  ),
              ],
            ),

            _titre('Prix (TND)'),
            Row(
              children: [
                _champPrix(_minCtrl, 'Min'),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14),
                  child: Text('à', style: TextStyle(fontSize: 16, color: AppColors.muted)),
                ),
                _champPrix(_maxCtrl, 'Max'),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              "Astuce : choisissez d'abord Acheter ou Louer, les prix de vente et de location sont très différents.",
              style: TextStyle(fontSize: 14, height: 1.4, color: AppColors.muted),
            ),

            _titre('Pièces minimum'),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (var n = 0; n <= 5; n++)
                  PillChip(
                    label: n == 0 ? 'Tous' : '$n+',
                    selected: _pieces == n,
                    onTap: () => setState(() => _pieces = n),
                  ),
              ],
            ),

            _titre('Trier par'),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final e in _tris.entries)
                  PillChip(
                    label: e.value,
                    selected: _tri == e.key,
                    onTap: () => setState(() => _tri = e.key),
                  ),
              ],
            ),

            const SizedBox(height: 28),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 58,
                    child: OutlinedButton(
                      onPressed: _reinitialiser,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      ),
                      child: const Text(
                        'Réinitialiser',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: SizedBox(
                    height: 58,
                    child: FilledButton(
                      onPressed: _appliquer,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      ),
                      child: const Text(
                        'Appliquer',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}