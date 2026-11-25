import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/property.dart';

class PropertyService {
  final _col = FirebaseFirestore.instance.collection('properties');

  Stream<List<Property>> streamLatest() {
    return _col
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map(Property.fromDoc).toList());
  }
}