import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../services/auth_service.dart';
import '../home/auth/login_screen.dart';
import '../home/auth/register_screen.dart';
import '../shared/placeholder_screen.dart';
import 'favorites_screen.dart';
import 'my_listings_screen.dart';
import 'widgets/profile_widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.userChanges(),
        builder: (context, snapshot) {
          final user = snapshot.data;
          if (snapshot.connectionState == ConnectionState.waiting && user == null) {
            return const Center(child: CircularProgressIndicator());
          }
          return user == null ? const _InvitePage() : _ProfilConnecte(user: user);
        },
      ),
    );
  }
}


class _InvitePage extends StatelessWidget {
  const _InvitePage();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 104,
              height: 104,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.person_outline_rounded, size: 52, color: AppColors.primary),
            ),
            const SizedBox(height: 28),
            const Text(
              'Bienvenue sur ImmoBi',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.primary),
            ),
            const SizedBox(height: 12),
            const Text(
              'Connectez-vous pour publier des annonces, enregistrer vos favoris et contacter les annonceurs.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, height: 1.5, color: AppColors.muted),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: FilledButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                child: const Text('Se connecter', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const RegisterScreen()),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary, width: 2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                child: const Text('Créer un compte', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfilConnecte extends StatelessWidget {
  const _ProfilConnecte({required this.user});

  final User user;

  static const _mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];

  String get _nom {
    final n = user.displayName?.trim() ?? '';
    return n.isEmpty ? 'Utilisateur' : n;
  }

  String get _initiales {
    final mots = (user.displayName ?? '').trim().split(RegExp(r'\s+')).where((m) => m.isNotEmpty).toList();
    if (mots.isEmpty) {
      final e = user.email ?? '?';
      return e.isEmpty ? '?' : e[0].toUpperCase();
    }
    final first = mots.first[0];
    final second = mots.length > 1 ? mots[1][0] : '';
    return (first + second).toUpperCase();
  }

  String? get _membreDepuis {
    final d = user.metadata.creationTime;
    if (d == null) return null;
    return 'Membre depuis ${_mois[d.month - 1]} ${d.year}';
  }

  void _snack(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _ouvrir(BuildContext context, String titre) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PlaceholderScreen(titre: titre, showBack: true)),
    );
  }

  Future<void> _modifierNom(BuildContext context) async {
    final ctrl = TextEditingController(text: user.displayName ?? '');
    final nouveau = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Text('Modifier mon nom', style: TextStyle(fontWeight: FontWeight.w700)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            hintText: 'Nom complet',
            filled: true,
            fillColor: AppColors.field,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Annuler', style: TextStyle(color: AppColors.muted)),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(ctrl.text.trim()),
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    ctrl.dispose();

    if (nouveau == null || nouveau.length < 2 || nouveau == user.displayName) return;
    try {
      await AuthService().updateNom(nouveau);
      if (context.mounted) _snack(context, 'Nom mis à jour.');
    } catch (e) {
      if (context.mounted) _snack(context, AuthService.messageErreur(e));
    }
  }

  

  Future<void> _deconnecter(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Text('Se déconnecter ?', style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text('Vous pourrez vous reconnecter à tout moment.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler', style: TextStyle(color: AppColors.muted)),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Déconnexion'),
          ),
        ],
      ),
    );
    if (ok == true) await AuthService().signOut();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      children: [
        const Text(
          'Profil',
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: AppColors.primary),
        ),
        const SizedBox(height: 20),

        // En-tête : avatar + nom + e-mail
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 34,
                backgroundColor: Colors.white,
                child: Text(
                  _initiales,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _nom,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.email ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, color: Colors.white70),
                    ),
                    if (_membreDepuis != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        _membreDepuis!,
                        style: const TextStyle(fontSize: 13, color: Colors.white70),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 26),

        ProfileGroup(
          titre: 'Mon compte',
          children: [
            ProfileTile(
              icon: Icons.edit_outlined,
              label: 'Modifier mon nom',
              onTap: () => _modifierNom(context),
            ),
            ProfileTile(
              icon: Icons.home_work_outlined,
              label: 'Mes annonces',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const MyListingsScreen()),
              ),
            ),
            ProfileTile(
              icon: Icons.favorite_border_rounded,
              label: 'Mes favoris',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const FavoritesScreen()),
              ),
            ),
            
          ],
        ),
        const SizedBox(height: 22),

        ProfileGroup(
          titre: 'Application',
          children: [
            ProfileTile(
              icon: Icons.info_outline_rounded,
              label: 'À propos',
              onTap: () => showAboutDialog(
                context: context,
                applicationName: 'ImmoBi',
                applicationVersion: '1.0.0',
              ),
            ),
          ],
        ),
        const SizedBox(height: 28),

        SizedBox(
          height: 56,
          child: OutlinedButton.icon(
            onPressed: () => _deconnecter(context),
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Déconnexion', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.redAccent,
              side: const BorderSide(color: Colors.redAccent, width: 1.5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            ),
          ),
        ),
      ],
    );
  }
}