import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Garde en mémoire les ids des annonces favorites de l'utilisateur connecté.
/// Données : users/{uid}/favorites/{propertyId}
class FavoritesStore extends ChangeNotifier {
  FavoritesStore._();
  static final FavoritesStore instance = FavoritesStore._();

  final _db = FirebaseFirestore.instance;
  StreamSubscription<User?>? _authSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _favSub;
  Set<String> _ids = {};

  Set<String> get ids => _ids;
  bool isFavorite(String propertyId) => _ids.contains(propertyId);

  /// À appeler une fois, après Firebase.initializeApp().
  void init() {
    _authSub?.cancel();
    _authSub = FirebaseAuth.instance.authStateChanges().listen(_onUser);
  }

  void _onUser(User? user) {
    _favSub?.cancel();
    if (user == null) {
      _ids = {};
      notifyListeners();
      return;
    }
    _favSub = _db
        .collection('users')
        .doc(user.uid)
        .collection('favorites')
        .snapshots()
        .listen(
      (snap) {
        _ids = snap.docs.map((d) => d.id).toSet();
        notifyListeners();
      },
      onError: (e) => debugPrint('Favoris : $e'),
    );
  }

  /// Ajoute ou retire un favori. Retourne false si personne n'est connecté.
  Future<bool> toggle(String propertyId) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return false;

    final ref = _db
        .collection('users')
        .doc(user.uid)
        .collection('favorites')
        .doc(propertyId);

    if (_ids.contains(propertyId)) {
      await ref.delete();
    } else {
      await ref.set({'createdAt': FieldValue.serverTimestamp()});
    }
    return true;
  }
}