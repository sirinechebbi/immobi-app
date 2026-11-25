import 'package:flutter/material.dart';

import '../screens/home/auth/login_screen.dart';
import '../services/favorites_store.dart';

/// Ajoute / retire un favori. Si l'utilisateur n'est pas connecté,
/// propose de se connecter.
Future<void> basculerFavori(BuildContext context, String propertyId) async {
  final messenger = ScaffoldMessenger.of(context);
  final navigator = Navigator.of(context);

  try {
    final ok = await FavoritesStore.instance.toggle(propertyId);
    if (!ok) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: const Text('Connectez-vous pour ajouter des favoris.'),
            action: SnackBarAction(
              label: 'Se connecter',
              onPressed: () => navigator.push(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              ),
            ),
          ),
        );
    }
  } catch (_) {
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(content: Text("Impossible de mettre à jour vos favoris.")),
      );
  }
}