import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../models/property.dart';
import '../../services/property_service.dart';
import '../shared/placeholder_screen.dart';
import 'widgets/property_grid.dart';
import 'widgets/sub_page_scaffold.dart';

class MyListingsScreen extends StatefulWidget {
  const MyListingsScreen({super.key});

  @override
  State<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends State<MyListingsScreen> {
  late final String? _uid = FirebaseAuth.instance.currentUser?.uid;
  late final Stream<List<Property>>? _stream =
      _uid == null ? null : PropertyService().streamByUser(_uid!);

  void _publier() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const PlaceholderScreen(titre: 'Publier une annonce', showBack: true),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SubPageScaffold(
      titre: 'Mes annonces',
      child: _stream == null
          ? const EmptyState(
              icon: Icons.lock_outline_rounded,
              titre: 'Connexion requise',
              message: 'Connectez-vous pour voir vos annonces.',
            )
          : StreamBuilder<List<Property>>(
              stream: _stream,
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return const EmptyState(
                    icon: Icons.error_outline_rounded,
                    titre: 'Une erreur est survenue',
                    message: 'Impossible de charger vos annonces. Vérifiez votre connexion.',
                  );
                }
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                final biens = snapshot.data!;
                if (biens.isEmpty) {
                  return EmptyState(
                    icon: Icons.home_work_outlined,
                    titre: "Aucune annonce publiée",
                    message: "Vous n'avez pas encore publié d'annonce.",
                    actionLabel: 'Publier une annonce',
                    onAction: _publier,
                  );
                }
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          '${biens.length} annonce${biens.length > 1 ? 's' : ''}',
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
            ),
    );
  }
}