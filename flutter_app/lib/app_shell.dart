import 'package:flutter/material.dart';

import 'features/favorites/favorites_page.dart';
import 'features/publish/publish_page.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [PublishPage(), FavoritesPage()],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.add_circle_outline), label: 'Publier'),
          NavigationDestination(icon: Icon(Icons.favorite_border), label: 'Favoris'),
        ],
      ),
    );
  }
}