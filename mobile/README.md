# FarmMind Lite - Mobile App

Flutter mobile app for the FarmMind Lite agricultural platform. Connects to the existing Go backend API.

## Features

- **Authentication**: Login and Register (farmer/buyer roles)
- **Home**: Dashboard with market pulse stats and quick navigation
- **Marketplace**: Browse farmer listings, view details, contact sellers
- **Market Prices**: Real-time crowdsourced price data by crop and region
- **Irrigation Planner**: Generate and save science-based irrigation schedules
- **AI Crop Doctor**: Upload crop photos for disease/pest diagnosis (Gemini AI)
- **Profit Estimator**: Calculate yield and income projections by crop and area
- **Calendar**: View irrigation, harvest, and marketplace events

## Prerequisites

- Flutter 3.16+ ([Install Flutter](https://flutter.dev/docs/get-started/install))
- Backend API running on `localhost:8080` (see main project README)

## Setup

1. Ensure the FarmMind Lite backend is running:
   ```bash
   cd backend
   go run cmd/api/main.go
   ```

2. Configure API base URL in `lib/main.dart` or `lib/config/api_config.dart`:
   - **Android Emulator**: `http://10.0.2.2:8080` (default)
   - **iOS Simulator**: `http://localhost:8080`
   - **Physical device**: `http://YOUR_PC_IP:8080` (e.g. `http://192.168.1.100:8080`)

3. Install dependencies:
   ```bash
   cd mobile
   flutter pub get
   ```

## Run

```bash
flutter run
```

For a specific device:
```bash
flutter run -d chrome    # Web
flutter run -d android   # Android emulator
flutter run -d ios       # iOS simulator (macOS only)
```

## Build

```bash
flutter build apk        # Android APK
flutter build appbundle  # Android App Bundle (Play Store)
flutter build ios        # iOS (requires macOS)
```

## Project Structure

```
lib/
├── config/       # API configuration
├── models/       # Data models (User, Listing, Price, etc.)
├── providers/    # Auth state (Provider)
├── screens/      # UI screens
├── services/     # API & auth services
├── theme/        # App theme
└── main.dart     # Entry point
```
