import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

const cloudinaryCloudName = 'cjhknma8';
const cloudinaryUploadPreset = 'immo_unsigned';

Future<String> uploadPhoto(XFile file) async {
  final uri = Uri.parse('https://api.cloudinary.com/v1_1/$cloudinaryCloudName/image/upload');

  final request = http.MultipartRequest('POST', uri)
    ..fields['upload_preset'] = cloudinaryUploadPreset
    ..files.add(
      http.MultipartFile.fromBytes(
        'file',
        await file.readAsBytes(),
        filename: file.name.isEmpty ? 'photo.jpg' : file.name,
      ),
    );

  final response = await http.Response.fromStream(await request.send());
  final data = jsonDecode(response.body) as Map<String, dynamic>;
  final url = data['secure_url'];

  if (response.statusCode != 200 || url is! String) {
    final error = data['error'];
    final message = error is Map ? error['message'] as String? : null;
    throw Exception(message ?? "Échec de l'envoi de la photo.");
  }
  return url;
}