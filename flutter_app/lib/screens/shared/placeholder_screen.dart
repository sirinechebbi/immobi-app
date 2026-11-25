import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Écran temporaire pour Favoris, Chat, Profil, Publier, Connexion, etc.
class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key, required this.titre, this.showBack = false});

  final String titre;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: showBack
          ? AppBar(title: Text(titre), backgroundColor: Colors.white, elevation: 0)
          : null,
      body: SafeArea(
        child: Center(
          child: Text(
            showBack ? 'Bientôt disponible' : '$titre\nBientôt disponible',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.muted, fontSize: 18),
          ),
        ),
      ),
    );
  }
}