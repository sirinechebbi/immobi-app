import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: TestScreen(),
    );
  }
}

class TestScreen extends StatelessWidget {
  const TestScreen({super.key});

  Future<int> _countListings() async {
    final snap = await FirebaseFirestore.instance
        .collection('listings')
        .where('status', isEqualTo: 'active')
        .limit(10)
        .get();
    return snap.docs.length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Test Firebase')),
      body: Center(
        child: FutureBuilder<int>(
          future: _countListings(),
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const CircularProgressIndicator();
            }
            if (snapshot.hasError) {
              return Text('Erreur : ${snapshot.error}');
            }
            return Text('Firebase connecté ✅\nAnnonces trouvées : ${snapshot.data}',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 20));
          },
        ),
      ),
    );
  }
}