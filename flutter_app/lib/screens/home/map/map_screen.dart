import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/theme/app_colors.dart' show AppColors;
import '../../../core/theme/app_colors.dart';
import '/models/property.dart';
import '/models/property_filters.dart';
import '/services/property_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key, this.typeInitial = TypeAnnonce.tout});

  final TypeAnnonce typeInitial;

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  static const _tunisie = LatLng(34.0, 9.5);

  late final Stream<List<Property>> _stream = PropertyService().streamLatest();
  late TypeAnnonce _type = widget.typeInitial;
  Property? _selection;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _header(context),
            Expanded(
              child: StreamBuilder<List<Property>>(
                stream: _stream,
                builder: (context, snapshot) {
                  final biens = (snapshot.data ?? const <Property>[]).where((p) {
                    if (!p.aUnePosition) return false;
                    if (_type == TypeAnnonce.louer) return p.aLouer;
                    if (_type == TypeAnnonce.acheter) return !p.aLouer;
                    return true;
                  }).toList();

                  return Stack(
                    children: [
                      FlutterMap(
                        options: MapOptions(
                          initialCenter: _tunisie,
                          initialZoom: 6,
                          onTap: (_, __) => setState(() => _selection = null),
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'com.immo.immo_app',
                          ),
                          MarkerLayer(
                            markers: [
                              for (final p in biens)
                                Marker(
                                  point: LatLng(p.latitude!, p.longitude!),
                                  width: 48,
                                  height: 48,
                                  alignment: Alignment.topCenter,
                                  child: GestureDetector(
                                    onTap: () => setState(() => _selection = p),
                                    child: Icon(
                                      Icons.location_on,
                                      size: _selection?.id == p.id ? 52 : 44,
                                      color: _selection?.id == p.id
                                          ? const Color(0xFF1B5E3A)
                                          : AppColors.primary,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const RichAttributionWidget(
                            attributions: [TextSourceAttribution('© OpenStreetMap contributors')],
                          ),
                        ],
                      ),
                      Positioned(
                        top: 12,
                        left: 16,
                        right: 16,
                        child: Row(
                          children: [
                            // Le sélecteur se réduit si l'écran est étroit (pas d'overflow)
                            Flexible(
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerLeft,
                                child: _segmented(),
                              ),
                            ),
                            const SizedBox(width: 10),
                            _compteur(biens.length),
                          ],
                        ),
                      ),
                      if (_selection != null)
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: 28,
                          child: _CarteSelection(
                            property: _selection!,
                            onClose: () => setState(() => _selection = null),
                            onTap: () {
                              // TODO: ouvrir la page de détails
                            },
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Container(
      height: 56,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEAEDEB))),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.chevron_left_rounded, size: 36, color: AppColors.primary),
          ),
          const Expanded(
            child: Text(
              'Carte',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700, color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 48), // équilibre le bouton retour pour centrer le titre
        ],
      ),
    );
  }

  BoxDecoration get _carteBlanche => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      );

  Widget _segmented() {
    const labels = {
      TypeAnnonce.tout: 'Tout',
      TypeAnnonce.acheter: 'Acheter',
      TypeAnnonce.louer: 'Louer',
    };
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: _carteBlanche,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final e in labels.entries)
            GestureDetector(
              onTap: () => setState(() {
                _type = e.key;
                _selection = null;
              }),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: _type == e.key ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  e.value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: _type == e.key ? Colors.white : AppColors.text,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _compteur(int n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      decoration: _carteBlanche,
      child: Text(
        '$n annonce${n > 1 ? 's' : ''}',
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _CarteSelection extends StatelessWidget {
  const _CarteSelection({
    required this.property,
    required this.onClose,
    required this.onTap,
  });

  final Property property;
  final VoidCallback onClose;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final image = property.premiereImage;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.18),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 84,
                height: 84,
                child: image == null
                    ? Container(color: AppColors.field)
                    : Image.network(
                        image,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: AppColors.field),
                      ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    property.prixAffiche,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  Text(
                    property.titre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${property.resume} · ${property.ville}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, color: AppColors.muted),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: onClose,
              icon: const Icon(Icons.close, color: AppColors.muted),
            ),
          ],
        ),
      ),
    );
  }
}