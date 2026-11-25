import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../models/property.dart';
import '../../services/property_service.dart';
import '../shared/placeholder_screen.dart';
import 'widgets/category_chips.dart';
import 'widgets/property_card.dart';
import 'widgets/search_row.dart';
import 'widgets/welcome_banner.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _categories = ['Tout', 'Appartement', 'Maison', 'Villa', 'Terrain', 'Bureau'];

  final _service = PropertyService();
  late final Stream<List<Property>> _stream = _service.streamLatest();

  String _categorie = 'Tout';
  String _recherche = '';
  bool _bannerFerme = false;

  void _ouvrir(String titre) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PlaceholderScreen(titre: titre, showBack: true)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final connecte = FirebaseAuth.instance.currentUser != null;
    final afficherBanner = !connecte && !_bannerFerme;

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          if (afficherBanner)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: WelcomeBanner(
                  onClose: () => setState(() => _bannerFerme = true),
                  onLogin: () => _ouvrir('Connexion'),
                  onRegister: () => _ouvrir('Créer un compte'),
                ),
              ),
            ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 14),
              child: Text(
                'Les bonnes trouvailles',
                style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: AppColors.primary),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SearchRow(
                onChanged: (v) => setState(() => _recherche = v),
                onMapTap: () => _ouvrir('Carte'),
                onFilterTap: () => _ouvrir('Filtres'),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 16)),
          SliverToBoxAdapter(
            child: CategoryChips(
              categories: _categories,
              selected: _categorie,
              onSelected: (c) => setState(() => _categorie = c),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Les dernières annonces',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  GestureDetector(
                    onTap: () => _ouvrir('Toutes les annonces'),
                    child: const Text(
                      'Tout voir',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          StreamBuilder<List<Property>>(
            stream: _stream,
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return const _Message('Impossible de charger les annonces.');
              }
              if (!snapshot.hasData) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                );
              }

              final q = _recherche.trim().toLowerCase();
              final biens = snapshot.data!.where((p) {
                final okCat = _categorie == 'Tout' || p.type == _categorie;
                final okQuery = q.isEmpty ||
                    p.titre.toLowerCase().contains(q) ||
                    p.ville.toLowerCase().contains(q);
                return okCat && okQuery;
              }).toList();

              if (biens.isEmpty) {
                return const _Message('Aucune annonce ne correspond à votre recherche.');
              }

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                sliver: SliverGrid.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 20,
                    childAspectRatio: 0.62,
                  ),
                  itemCount: biens.length,
                  itemBuilder: (_, i) => PropertyCard(
                    property: biens[i],
                    onTap: () => _ouvrir(biens[i].titre),
                    onFavorite: () {
                      // TODO: ajouter aux favoris (connexion requise)
                    },
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message(this.texte);

  final String texte;

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Text(
          texte,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.muted, fontSize: 16),
        ),
      ),
    );
  }
}