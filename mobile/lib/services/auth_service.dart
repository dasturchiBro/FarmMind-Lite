import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  static const _userKey = 'farm_user';

  static Future<User?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString(_userKey);
    if (json == null) return null;
    try {
      return User.fromJson(jsonDecode(json) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> storeUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<void> clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  static Future<Map<String, dynamic>> login(
      String email, String password) async {
    final res = await ApiService.login(email: email, password: password);
    final userMap = res['user'] as Map<String, dynamic>?;
    if (userMap != null) {
      await storeUser(User.fromJson(userMap));
    }
    return res;
  }

  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String region,
    required String role,
    required String password,
  }) async {
    final res = await ApiService.register(
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      region: region,
      role: role,
      password: password,
    );
    final userMap = res['user'] as Map<String, dynamic>?;
    if (userMap != null) {
      await storeUser(User.fromJson(userMap));
    }
    return res;
  }

  static Future<void> logout() async {
    await clearUser();
  }
}
