import 'package:cloud_firestore/cloud_firestore.dart';

class Property {
  Property({
    required this.id,
    required this.titre,
    required this.ville,
    required this.type,
    required this.statut,
    required this.prix,
    required this.pieces,
    required this.surface,
    required this.images,
    required this.createdAt,
  });

  final String id;
  final String titre;
  final String ville;
  final String type; // Appartement, Maison, Villa, Terrain, Bureau
  final String statut; // 'louer' ou 'vendre'
  final num prix;
  final int pieces;
  final num surface;
  final List<String> images;
  final DateTime? createdAt;

  bool get aLouer => statut == 'louer';
  String get badge => aLouer ? 'À louer' : 'À vendre';
  String? get premiereImage => images.isEmpty ? null : images.first;

  String get prixAffiche => '${_formatNombre(prix)} DT${aLouer ? ' /mois' : ''}';

  String get resume {
    final parts = <String>[type];
    if (pieces > 0) parts.add('$pieces p.');
    if (surface > 0) parts.add('$surface m²');
    return parts.join(' · ');
  }

  String get dateRelative {
    if (createdAt == null) return '';
    final jours = DateTime.now().difference(createdAt!).inDays;
    if (jours <= 0) return "Aujourd'hui";
    if (jours < 30) return 'Il y a $jours j';
    final mois = jours ~/ 30;
    return 'Il y a $mois mois';
  }

  factory Property.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? {};
    return Property(
      id: doc.id,
      titre: d['titre'] ?? '',
      ville: d['ville'] ?? '',
      type: d['type'] ?? '',
      statut: d['statut'] ?? 'vendre',
      prix: d['prix'] ?? 0,
      pieces: (d['pieces'] ?? 0).toInt(),
      surface: d['surface'] ?? 0,
      images: List<String>.from(d['images'] ?? const []),
      createdAt: (d['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  static String _formatNombre(num n) {
    final s = n.round().toString();
    final b = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) b.write(' ');
      b.write(s[i]);
    }
    return b.toString();
  }
}