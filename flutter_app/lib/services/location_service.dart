import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

// geocoding 5.x: create one Geocoding object and call the methods on it
final Geocoding _geocoding = Geocoding();

class Coords {
  const Coords(this.lat, this.lng);
  final double lat;
  final double lng;
}

/// GPS position of the phone ("Ma position").
Future<Coords> getCurrentCoords() async {
  if (!await Geolocator.isLocationServiceEnabled()) {
    throw Exception('Activez la localisation de votre téléphone.');
  }
  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied ||
      permission == LocationPermission.deniedForever) {
    throw Exception('Autorisation de localisation refusée.');
  }
  final pos = await Geolocator.getCurrentPosition(
    locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
  );
  return Coords(pos.latitude, pos.longitude);
}

/// Address text -> coordinates ("Depuis l'adresse"). Null if nothing is found.
Future<Coords?> geocodeAddress(String query) async {
  final results = await _geocoding.locationFromAddress(query);
  if (results.isEmpty) return null;
  return Coords(results.first.latitude, results.first.longitude);
}

String _firstNotEmpty(List<String?> values) {
  for (final v in values) {
    if (v != null && v.isNotEmpty) return v;
  }
  return '';
}

/// Coordinates -> city and street, used to pre-fill the form.
Future<({String city, String address})?> reverseGeocode(Coords c) async {
  try {
    final places = await _geocoding.placemarkFromCoordinates(c.lat, c.lng);
    if (places.isEmpty) return null;
    final p = places.first;
    return (
      city: _firstNotEmpty([p.locality, p.subAdministrativeArea, p.administrativeArea]),
      address: p.street ?? '',
    );
  } catch (_) {
    return null;
  }
}