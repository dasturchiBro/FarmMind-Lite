import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _loading = true;

  User? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get loading => _loading;

  Future<void> loadUser() async {
    _loading = true;
    notifyListeners();
    _user = await AuthService.getStoredUser();
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final res = await AuthService.login(email, password);
    _user = User.fromJson(res['user'] as Map<String, dynamic>);
    notifyListeners();
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String region,
    required String role,
    required String password,
  }) async {
    final res = await AuthService.register(
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      region: region,
      role: role,
      password: password,
    );
    _user = User.fromJson(res['user'] as Map<String, dynamic>);
    notifyListeners();
  }

  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    notifyListeners();
  }
}
