import 'package:cloud_firestore/cloud_firestore.dart';

class FavoritesRepository {
  FavoritesRepository(this._db);
  final FirebaseFirestore _db;

  DocumentReference<Map<String, dynamic>> _doc(String uid) =>
      _db.collection('users').doc(uid).collection('private').doc('favorites');

  /// Live list of favorite ids (oldest first, newest last).
  Stream<List<String>> watchIds(String uid) {
    return _doc(uid).snapshots().map(
          (snap) => List<String>.from((snap.data()?['listingIds'] as List?) ?? const []),
        );
  }

  /// Adds or removes one id. arrayUnion / arrayRemove are atomic on the server.
  Future<void> toggle(String uid, String listingId, {required bool isFavorite}) {
    return _doc(uid).set({
      'listingIds': isFavorite
          ? FieldValue.arrayRemove([listingId])
          : FieldValue.arrayUnion([listingId]),
    }, SetOptions(merge: true));
  }
}