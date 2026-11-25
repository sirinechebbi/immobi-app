import 'package:cloud_firestore/cloud_firestore.dart';

class Listing {
  const Listing({
    required this.id,
    required this.ownerId,
    required this.title,
    required this.propertyType,
    required this.transaction,
    required this.price,
    required this.currency,
    required this.description,
    required this.photos,
    this.surfaceM2,
    this.rooms,
    this.city,
    this.coverUrl,
    this.createdAt,
  });

  final String id;
  final String ownerId;
  final String title;
  final String propertyType;
  final String transaction; // 'vente' | 'location'
  final num price;
  final String currency;
  final String description;
  final List<String> photos;
  final num? surfaceM2;
  final int? rooms;
  final String? city;
  final String? coverUrl;
  final DateTime? createdAt;

  factory Listing.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? const <String, dynamic>{};
    final photos = List<String>.from((d['photos'] as List?) ?? const []);
    return Listing(
      id: doc.id,
      ownerId: (d['ownerId'] as String?) ?? '',
      title: (d['title'] as String?) ?? '',
      propertyType: (d['propertyType'] as String?) ?? 'autre',
      transaction: (d['transaction'] as String?) ?? 'vente',
      price: (d['price'] as num?) ?? 0,
      currency: (d['currency'] as String?) ?? 'TND',
      description: (d['description'] as String?) ?? '',
      photos: photos,
      surfaceM2: d['surfaceM2'] as num?,
      rooms: (d['rooms'] as num?)?.toInt(),
      city: d['city'] as String?,
      coverUrl: (d['coverUrl'] as String?) ?? (photos.isNotEmpty ? photos.first : null),
      createdAt: (d['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  /// "280 000 DT" or "850 DT /mois"
  String get priceLabel {
    final n = price.round().toString().replaceAllMapped(
          RegExp(r'\B(?=(\d{3})+(?!\d))'),
          (_) => ' ',
        );
    final cur = currency == 'TND' ? 'DT' : currency;
    return '$n $cur${transaction == 'location' ? ' /mois' : ''}';
  }
}