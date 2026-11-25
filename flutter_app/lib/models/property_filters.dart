import 'property.dart';

enum TypeAnnonce { tout, acheter, louer }

enum Tri { recentes, prixCroissant, prixDecroissant }

class PropertyFilters {
  const PropertyFilters({
    this.type = TypeAnnonce.tout,
    this.prixMin,
    this.prixMax,
    this.piecesMin = 0,
    this.tri = Tri.recentes,
  });

  final TypeAnnonce type;
  final num? prixMin;
  final num? prixMax;
  final int piecesMin; 
  final Tri tri;

  bool get estParDefaut =>
      type == TypeAnnonce.tout &&
      prixMin == null &&
      prixMax == null &&
      piecesMin == 0 &&
      tri == Tri.recentes;

  List<Property> appliquer(List<Property> biens) {
    final resultat = biens.where((p) {
      if (type == TypeAnnonce.louer && !p.aLouer) return false;
      if (type == TypeAnnonce.acheter && p.aLouer) return false;
      if (prixMin != null && p.prix < prixMin!) return false;
      if (prixMax != null && p.prix > prixMax!) return false;
      if (piecesMin > 0 && p.pieces < piecesMin) return false;
      return true;
    }).toList();

    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    switch (tri) {
      case Tri.recentes:
        resultat.sort((a, b) =>
            (b.createdAt ?? epoch).compareTo(a.createdAt ?? epoch));
      case Tri.prixCroissant:
        resultat.sort((a, b) => a.prix.compareTo(b.prix));
      case Tri.prixDecroissant:
        resultat.sort((a, b) => b.prix.compareTo(a.prix));
    }
    return resultat;
  }
}