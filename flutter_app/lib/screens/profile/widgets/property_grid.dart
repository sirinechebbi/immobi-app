import 'package:flutter/material.dart';

import '../../../models/property.dart';
import '../../home/widgets/property_card.dart';
import '../../shared/placeholder_screen.dart';

class PropertyGrid extends StatelessWidget {
  const PropertyGrid({super.key, required this.biens});

  final List<Property> biens;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 20,
        childAspectRatio: 0.62,
      ),
      itemCount: biens.length,
      itemBuilder: (context, i) {
        final p = biens[i];
        return PropertyCard(
          property: p,
          onTap: () {
            // TODO: remplacer par la page de détails
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => PlaceholderScreen(titre: p.titre, showBack: true),
              ),
            );
          },
        );
      },
    );
  }
}