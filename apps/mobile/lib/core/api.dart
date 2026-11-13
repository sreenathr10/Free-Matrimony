import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000/v1');

/// Where the login token is kept. Secure storage on device; swappable in tests.
abstract class TokenStore {
  Future<String?> read();
  Future<void> write(String token);
  Future<void> clear();
}

class SecureTokenStore implements TokenStore {
  static const _key = 'fm_token';
  final _storage = const FlutterSecureStorage();

  @override
  Future<String?> read() => _storage.read(key: _key);
  @override
  Future<void> write(String token) => _storage.write(key: _key, value: token);
  @override
  Future<void> clear() => _storage.delete(key: _key);
}

class ApiException implements Exception {
  ApiException(this.status, this.message);
  final int status;
  final String message;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(this.tokens, {http.Client? client}) : _http = client ?? http.Client();
  final TokenStore tokens;
  final http.Client _http;

  Future<dynamic> request(String method, String path, [Map<String, dynamic>? body]) async {
    final token = await tokens.read();
    final req = http.Request(method, Uri.parse('$apiUrl$path'))
      ..headers['Content-Type'] = 'application/json'
      ..headers.addAll(token == null ? {} : {'Authorization': 'Bearer $token'});
    if (body != null) req.body = jsonEncode(body);
    final res = await http.Response.fromStream(await _http.send(req));
    final decoded = res.body.isEmpty ? null : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final issues = decoded is Map ? decoded['issues'] : null;
      final msg = issues is List && issues.isNotEmpty
          ? issues.first['message'].toString()
          : (decoded is Map ? decoded['message']?.toString() : null) ?? 'Request failed (${res.statusCode})';
      throw ApiException(res.statusCode, msg);
    }
    return decoded;
  }
}

final tokenStoreProvider = Provider<TokenStore>((_) => SecureTokenStore());
final apiProvider = Provider<ApiClient>((ref) => ApiClient(ref.watch(tokenStoreProvider)));
