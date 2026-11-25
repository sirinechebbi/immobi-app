import 'package:flutter/material.dart';

import '../widgets/app_bottom_nav.dart';
import 'home/home_screen.dart';
import 'shared/placeholder_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  final _pages = const [
    HomeScreen(),
    PlaceholderScreen(titre: 'Favoris'),
    SizedBox.shrink(),
    PlaceholderScreen(titre: 'Chat'),
    PlaceholderScreen(titre: 'Profil'),
  ];

  void _onTap(int i) {
    if (i == 2) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => const PlaceholderScreen(titre: 'Publier une annonce', showBack: true),
        ),
      );
      return;
    }
    setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: AppBottomNav(currentIndex: _index, onTap: _onTap),
    );
  }
}