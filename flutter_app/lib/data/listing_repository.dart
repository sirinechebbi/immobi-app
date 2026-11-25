import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/listing.dart';
import '../services/geohash.dart';

class NewListingInput {
  const NewListingInput({
    required this.transaction,
    required this.propertyType,
    required this.title,
    required this.description,
    required this.price,
    required this.city,
    required this.address,
    required this.lat,
    required this.lng,
    required this.photos,
    this.surfaceM2,
    this.rooms,
  });

  final String transaction;
  final String propertyType;
  final String title;
  final String description;
  final num price;
  final num? surfaceM2;
  final int? rooms;
  final String city;
  final String address;
  final double lat;
  final double lng;
  final List<String> photos; // Cloudinary URLs
}

class ListingsRepository {
  ListingsRepository(this._db);
  final FirebaseFirestore _db;

  Future<Listing?> fetchListing(String id) async {
    final snap = await _db.collection('listings').doc(id).get();
    return snap.exists ? Listing.fromDoc(snap) : null;
  }

  Future<String> createListing({
    required NewListingInput input,
    required String ownerId,
    String? ownerName,
  }) async {
    final title = input.title.trim();
    final ref = await _db.collection('listings').add({
      'ownerId': ownerId,
      'ownerName': ownerName,
      'title': title,
      'titleLower': title.toLowerCase(),
      'description': input.description.trim(),
      'propertyType': input.propertyType,
      'transaction': input.transaction,
      'price': input.price,
      'currency': 'TND',
      'surfaceM2': input.surfaceM2,
      'rooms': input.rooms,
      'city': input.city.trim(),
      'address': input.address.trim(),
      'lat': input.lat,
      'lng': input.lng,
      'geohash': geohashEncode(input.lat, input.lng),
      'photos': input.photos,
      'coverUrl': input.photos.isNotEmpty ? input.photos.first : null,
      'status': 'active',
      'viewsCount': 0,
      'createdAt': FieldValue.serverTimestamp(),
    });
    return ref.id;
  }
}