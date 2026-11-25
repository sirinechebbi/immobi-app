import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../models/property.dart';
import '../../services/favorites_store.dart';
import '../../services/property_service.dart';
import 'widgets/property_grid.dart';
import 'widgets/sub_page_scaffold.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  late final Stream<List<Property>> _stream = PropertyService().streamLatest();

  @override
  Widget build(BuildContext context) {
    return SubPageScaffold(
      titre: 'Mes favoris',
      child: StreamBuilder<List<Property>>(
        stream: _stream,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const EmptyState(
              icon: Icons.error_outline_rounded,
              titre: 'Une erreur est survenue',
              message: 'Impossible de charger vos favoris. Vérifiez votre connexion.',
            );
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          // Se met à jour dès qu'on ajoute ou retire un cœur
          return ListenableBuilder(
            listenable: FavoritesStore.instance,
            builder: (context, _) {
              final ids = FavoritesStore.instance.ids;
              final biens = snapshot.data!.where((p) => ids.contains(p.id)).toList();

              if (biens.isEmpty) {
                return const EmptyState(
                  icon: Icons.favorite_border_rounded,
                  titre: 'Aucun favori',
                  message: "Touchez le cœur d'une annonce pour la retrouver ici.",
                );
              }
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        '${biens.length} favori${biens.length > 1 ? 's' : ''}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.muted,
                        ),
                      ),
                    ),
                  ),
                  Expanded(child: PropertyGrid(biens: biens)),
                ],
              );
            },
          );
        },
      ),
    );
  }
}