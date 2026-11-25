import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../constants/property.dart';
import '../../core/theme.dart';
import '../../models/listing.dart';
import '../../providers.dart';

/// "95" instead of "95.0"
String _clean(num v) => v == v.roundToDouble() ? v.toInt().toString() : v.toString();

class FavoritesPage extends ConsumerWidget {
  const FavoritesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    if (auth.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final user = auth.value;
    if (user == null) return const _GuestView();

    final favorites = ref.watch(favoriteIdsProvider);
    final count = favorites.value?.length ?? 0;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Mes favoris',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: AppColors.primary,
                    child: Text('$count', style: const TextStyle(color: Colors.white, fontSize: 12)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: favorites.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) =>
                    const Center(child: Text('Impossible de charger vos favoris.')),
                data: (ids) {
                  if (ids.isEmpty) return const _EmptyView();
                  final ordered = ids.reversed.toList(); // newest first
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    itemCount: ordered.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 16),
                    itemBuilder: (context, index) =>
                        _FavoriteCard(listingId: ordered[index], uid: user.uid),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FavoriteCard extends ConsumerWidget {
  const _FavoriteCard({required this.listingId, required this.uid});

  final String listingId;
  final String uid;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listing = ref.watch(listingProvider(listingId));

    return listing.when(
      loading: () => const SizedBox(height: 220, child: Center(child: CircularProgressIndicator())),
      error: (error, stack) => const SizedBox.shrink(), // deleted listing: hidden
      data: (l) => l == null ? const SizedBox.shrink() : _card(context, ref, l),
    );
  }

  Widget _card(BuildContext context, WidgetRef ref, Listing l) {
    final details = [
      if (l.surfaceM2 != null) '${_clean(l.surfaceM2!)} m²',
      if (l.rooms != null) '${l.rooms} ${l.rooms! > 1 ? 'pièces' : 'pièce'}',
    ].join(' · ');

    const placeholder = ColoredBox(
      color: AppColors.surface,
      child: Center(child: Icon(Icons.home_outlined, color: AppColors.muted, size: 40)),
    );

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: InkWell(
        // TODO: context.push('/listing/${l.id}') once the details page exists
        onTap: () {},
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 180,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (l.coverUrl != null)
                    CachedNetworkImage(
                      imageUrl: l.coverUrl!,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => placeholder,
                      errorWidget: (context, url, error) => placeholder,
                    )
                  else
                    placeholder,
                  Positioned(
                    left: 10,
                    top: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        transactionLabels[l.transaction] ?? 'Vente',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 6, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            l.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                          ),
                        ),
                      ),
                      IconButton(
                        tooltip: 'Retirer des favoris',
                        icon: const Icon(Icons.favorite, color: AppColors.primary),
                        onPressed: () {
                          ref
                              .read(favoritesRepositoryProvider)
                              .toggle(uid, l.id, isFavorite: true)
                              .catchError((Object e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Impossible de modifier vos favoris.')),
                              );
                            }
                          });
                        },
                      ),
                    ],
                  ),
                  if (l.city != null && l.city!.isNotEmpty)
                    Text(l.city!, style: const TextStyle(color: AppColors.muted)),
                  if (details.isNotEmpty)
                    Text(details, style: const TextStyle(color: AppColors.muted)),
                  const SizedBox(height: 6),
                  Text(
                    l.priceLabel,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 17,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.favorite_border, size: 64, color: AppColors.primary),
            SizedBox(height: 12),
            Text('Aucun favori pour le moment',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
            SizedBox(height: 8),
            Text(
              "Appuyez sur le cœur d'une annonce pour la retrouver ici.",
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.muted),
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
              const Icon(Icons.favorite_border, size: 64, color: AppColors.primary),
              const SizedBox(height: 12),
              const Text('Vos favoris vous attendent',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
              const SizedBox(height: 8),
              const Text(
                'Connectez-vous pour enregistrer les annonces qui vous plaisent.',
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