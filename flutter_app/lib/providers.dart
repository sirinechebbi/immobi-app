import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/favorites_repository.dart';
import 'data/listing_repository.dart';
import 'models/listing.dart';

final firestoreProvider = Provider<FirebaseFirestore>((ref) => FirebaseFirestore.instance);

final listingsRepositoryProvider =
    Provider((ref) => ListingsRepository(ref.watch(firestoreProvider)));

final favoritesRepositoryProvider =
    Provider((ref) => FavoritesRepository(ref.watch(firestoreProvider)));

/// The logged-in user, or null for a visitor.
final authStateProvider =
    StreamProvider<User?>((ref) => FirebaseAuth.instance.authStateChanges());

/// Ids of the favorites of the logged-in user (empty for a visitor).
final favoriteIdsProvider = StreamProvider<List<String>>((ref) {
  final user = ref.watch(authStateProvider).value;
  if (user == null) return Stream.value(const <String>[]);
  return ref.watch(favoritesRepositoryProvider).watchIds(user.uid);
});

/// One listing by id, loaded once and cached.
final listingProvider = FutureProvider.family<Listing?, String>(
  (ref, id) => ref.watch(listingsRepositoryProvider).fetchListing(id),
);