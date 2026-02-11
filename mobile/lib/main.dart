import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/api_config.dart';
import 'providers/auth_provider.dart';
import 'screens/calendar_screen.dart';
import 'screens/doctor_screen.dart';
import 'screens/estimator_screen.dart';
import 'screens/home_screen.dart';
import 'screens/irrigation_screen.dart';
import 'screens/login_screen.dart';
import 'screens/market_screen.dart';
import 'screens/marketplace_screen.dart';
import 'screens/register_screen.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Default: Android emulator uses 10.0.2.2 to reach host's localhost
  // For iOS simulator use http://localhost:8080
  // For physical device use your PC's IP e.g. http://192.168.1.100:8080
  
  runApp(const FarmMindApp());
}

class FarmMindApp extends StatelessWidget {
  const FarmMindApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider()..loadUser(),
      child: MaterialApp(
        title: 'FarmMind Lite',
        theme: AppTheme.light,
        initialRoute: '/',
        routes: {
          '/': (ctx) => const AuthWrapper(),
          '/login': (ctx) => const LoginScreen(),
          '/register': (ctx) => const RegisterScreen(),
          '/home': (ctx) => const HomeScreen(),
          '/marketplace': (ctx) => const MarketplaceScreen(),
          '/market': (ctx) => const MarketScreen(),
          '/irrigation': (ctx) => const IrrigationScreen(),
          '/doctor': (ctx) => const DoctorScreen(),
          '/estimator': (ctx) => const EstimatorScreen(),
          '/calendar': (ctx) => const CalendarScreen(),
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (_, auth, __) {
        if (auth.loading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (auth.isLoggedIn) {
          return const HomeScreen();
        }
        return const LoginScreen();
      },
    );
  }
}
