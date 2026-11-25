import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class AuthService {
  final _auth = FirebaseAuth.instance;
  final _db = FirebaseFirestore.instance;

  Future<void> signIn(String email, String password) async {
    await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> register({
    required String nom,
    required String email,
    required String password,
  }) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    final user = cred.user;
    if (user == null) return;

    await user.updateDisplayName(nom.trim());

    // Profil dans Firestore (n'empêche pas l'inscription si les règles refusent l'écriture)
    try {
      await _db.collection('users').doc(user.uid).set({
        'nom': nom.trim(),
        'email': email.trim(),
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Profil Firestore non créé : $e');
    }
  }

  Future<void> updateNom(String nom) async {
    final user = _auth.currentUser;
    if (user == null) return;
    await user.updateDisplayName(nom.trim());
    await user.reload();
    try {
      await _db
          .collection('users')
          .doc(user.uid)
          .set({'nom': nom.trim()}, SetOptions(merge: true));
    } catch (e) {
      debugPrint('Profil Firestore non mis à jour : $e');
    }
  }

  Future<void> resetPassword(String email) {
    return _auth.sendPasswordResetEmail(email: email.trim());
  }

  Future<void> signOut() => _auth.signOut();

  /// Traduit les erreurs Firebase en messages lisibles.
  static String messageErreur(Object e) {
    if (e is FirebaseAuthException) {
      switch (e.code) {
        case 'invalid-email':
          return "L'adresse e-mail n'est pas valide.";
        case 'user-disabled':
          return 'Ce compte a été désactivé.';
        case 'user-not-found':
        case 'wrong-password':
        case 'invalid-credential':
          return 'E-mail ou mot de passe incorrect.';
        case 'email-already-in-use':
          return 'Un compte existe déjà avec cet e-mail.';
        case 'weak-password':
          return 'Mot de passe trop faible (6 caractères minimum).';
        case 'network-request-failed':
          return 'Pas de connexion internet.';
        case 'too-many-requests':
          return 'Trop de tentatives. Réessayez plus tard.';
        case 'operation-not-allowed':
          return "La connexion par e-mail n'est pas activée dans Firebase.";
      }
    }
    return 'Une erreur est survenue. Réessayez.';
  }
}