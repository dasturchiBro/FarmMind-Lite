import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/calendar_event.dart';
import '../models/crop_type.dart';
import '../models/doctor.dart';
import '../models/estimation.dart';
import '../models/irrigation.dart';
import '../models/market_price.dart';
import '../models/marketplace_listing.dart';
import '../models/platform_analytics.dart';
import '../models/weather.dart';

class ApiService {
  static String get _base => ApiConfig.baseUrl;

  static Future<Map<String, dynamic>> _get(String path,
      {Map<String, String>? query}) async {
    final uri = Uri.parse('$_base$path').replace(queryParameters: query);
    final resp = await http.get(uri);
    return _handleResponse(resp);
  }

  static Future<Map<String, dynamic>> _post(String path,
      {Object? body, Map<String, String>? headers}) async {
    final uri = Uri.parse('$_base$path');
    final resp = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        ...?headers,
      },
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(resp);
  }

  static Future<Map<String, dynamic>> _postMultipart(
    String path, {
    required Map<String, String> fields,
    required String fileField,
    required File file,
  }) async {
    final uri = Uri.parse('$_base$path');
    var request = http.MultipartRequest('POST', uri);
    request.fields.addAll(fields);
    request.files.add(await http.MultipartFile.fromPath(fileField, file.path));
    var streamed = await request.send();
    var resp = await http.Response.fromStream(streamed);
    return _handleResponse(resp);
  }

  static Future<Map<String, dynamic>> _delete(String path) async {
    final uri = Uri.parse('$_base$path');
    final resp = await http.delete(uri);
    return _handleResponse(resp);
  }

  static dynamic _handleResponse(http.Response resp) {
    final body = resp.body.isEmpty ? '{}' : resp.body;
    final decoded = jsonDecode(body) as dynamic;
    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      return decoded is Map ? decoded : {'data': decoded};
    }
    final msg = decoded is Map && decoded['error'] != null
        ? decoded['error'] as String
        : 'Request failed';
    throw ApiException(msg, resp.statusCode);
  }

  // --- Auth ---
  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String region,
    required String role,
    required String password,
  }) async {
    return _post('/api/register', body: {
      'full_name': fullName,
      'email': email,
      'phone_number': phoneNumber,
      'region': region,
      'role': role,
      'password': password,
    });
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    return _post('/api/login', body: {
      'email': email,
      'password': password,
    });
  }

  // --- Crops ---
  static Future<List<CropType>> getCropTypes() async {
    final data = await _get('/api/crops');
    if (data is! List) return [];
    return (data as List)
        .map((e) => CropType.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // --- Marketplace ---
  static Future<List<MarketplaceListing>> getMarketplaceListings({
    String? cropTypeId,
    String? minPrice,
    String? maxPrice,
    String? region,
  }) async {
    final q = <String, String>{};
    if (cropTypeId != null && cropTypeId != 'All')
      q['crop_type_id'] = cropTypeId;
    if (minPrice != null && minPrice.isNotEmpty) q['min_price'] = minPrice;
    if (maxPrice != null && maxPrice.isNotEmpty) q['max_price'] = maxPrice;
    if (region != null && region != 'All') q['region'] = region;

    final data = await _get('/api/marketplace', query: q.isEmpty ? null : q);
    if (data is! List) return [];
    return (data as List)
        .map((e) => MarketplaceListing.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // --- Market Prices ---
  static Future<List<MarketPrice>> getLatestPrices() async {
    final data = await _get('/api/prices');
    if (data is! List) return [];
    return (data as List)
        .map((e) => MarketPrice.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<void> submitPrice({
    required int cropTypeId,
    required String region,
    required double pricePerKg,
    String volumeTier = 'retail',
    int? userId,
  }) async {
    await _post('/api/prices', body: {
      'crop_type_id': cropTypeId,
      'region': region,
      'price_per_kg': pricePerKg,
      'volume_tier': volumeTier,
      if (userId != null && userId > 0) 'user_id': userId,
    });
  }

  static Future<void> deletePrice(int id, int userId) async {
    await _delete('/api/prices/$id?user_id=$userId');
  }

  // --- Irrigation ---
  static Future<IrrigationSchedule> getIrrigationSchedule({
    required String crop,
    required String plantingDate,
    String region = 'Tashkent',
    String lang = 'en',
  }) async {
    final data = await _get('/api/irrigation', query: {
      'crop': crop,
      'planting_date': plantingDate,
      'region': region,
      'lang': lang,
    });
    return IrrigationSchedule.fromJson(data as Map<String, dynamic>);
  }

  static Future<void> saveIrrigationSchedule({
    required int userId,
    required String cropName,
    required String region,
    required String plantingDate,
    required List<Map<String, dynamic>> reminders,
  }) async {
    await _post('/api/irrigation/save', body: {
      'user_id': userId,
      'crop_name': cropName,
      'region': region,
      'planting_date': plantingDate,
      'reminders': reminders,
    });
  }

  static Future<List<SavedIrrigationSchedule>> getSavedSchedules(
      int userId) async {
    final data =
        await _get('/api/irrigation/saved', query: {'user_id': '$userId'});
    if (data is! List) return [];
    return (data as List)
        .map((e) => SavedIrrigationSchedule.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<void> toggleIrrigationStep(int stepId) async {
    await _post('/api/irrigation/steps/$stepId/toggle');
  }

  static Future<void> deleteSavedSchedule(int scheduleId) async {
    await _delete('/api/irrigation/saved/$scheduleId');
  }

  // --- Estimator ---
  static Future<CropEstimation> getEstimation({
    required String crop,
    required double area,
  }) async {
    final data = await _get('/api/estimate', query: {
      'crop': crop,
      'area': area.toString(),
    });
    return CropEstimation.fromJson(data as Map<String, dynamic>);
  }

  // --- Doctor ---
  static Future<DoctorAnalysis> analyzeCrop(File imageFile) async {
    final data = await _postMultipart(
      '/api/doctor/analyze',
      fields: {},
      fileField: 'image',
      file: imageFile,
    );
    return DoctorAnalysis.fromJson(data as Map<String, dynamic>);
  }

  // --- Weather ---
  static Future<WeatherCurrent> getCurrentWeather(
      {String location = 'Tashkent'}) async {
    final data =
        await _get('/api/weather/current', query: {'location': location});
    return WeatherCurrent.fromJson(data as Map<String, dynamic>);
  }

  static Future<ForecastResponse> getWeatherForecast(
      {String location = 'Tashkent'}) async {
    final data =
        await _get('/api/weather/forecast', query: {'location': location});
    return ForecastResponse.fromJson(data as Map<String, dynamic>);
  }

  // --- Calendar ---
  static Future<List<CalendarEvent>> getCalendarEvents({
    int? userId,
    int? year,
    int? month,
  }) async {
    final q = <String, String>{};
    if (userId != null && userId > 0) q['user_id'] = '$userId';
    if (year != null) q['year'] = '$year';
    if (month != null) q['month'] = '$month';

    final data =
        await _get('/api/calendar/events', query: q.isEmpty ? null : q);
    final events = data['events'] as List? ?? [];
    return events
        .map((e) => CalendarEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<void> createCalendarEvent({
    required int userId,
    required String title,
    required String type,
    required String date,
    String notes = '',
  }) async {
    await _post('/api/calendar/events', body: {
      'user_id': userId,
      'title': title,
      'type': type,
      'date': date,
      'notes': notes,
    });
  }

  // --- Analytics ---
  static Future<PlatformAnalytics> getPlatformAnalytics() async {
    final data = await _get('/api/analytics');
    return PlatformAnalytics.fromJson(data as Map<String, dynamic>);
  }

  // --- Health ---
  static Future<bool> healthCheck() async {
    try {
      final resp = await http.get(Uri.parse('$_base/health'));
      if (resp.statusCode == 200) {
        final j = jsonDecode(resp.body) as Map;
        return j['status'] == 'up';
      }
    } catch (_) {}
    return false;
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);
  @override
  String toString() => message;
}

// Irrigation schedule from GET (reminders array)
class IrrigationSchedule {
  final String cropName;
  final List<IrrigationReminder> reminders;

  IrrigationSchedule({
    required this.cropName,
    required this.reminders,
  });

  factory IrrigationSchedule.fromJson(Map<String, dynamic> json) {
    List<IrrigationReminder> list = [];
    if (json['reminders'] != null) {
      for (var r in json['reminders'] as List) {
        list.add(IrrigationReminder.fromJson(r as Map<String, dynamic>));
      }
    }
    return IrrigationSchedule(
      cropName: json['crop_name'] as String? ?? '',
      reminders: list,
    );
  }
}

class ForecastResponse {
  final List<WeatherDaily> daily;

  ForecastResponse({this.daily = const []});

  factory ForecastResponse.fromJson(Map<String, dynamic> json) {
    List<WeatherDaily> list = [];
    if (json['daily'] != null) {
      for (var d in json['daily'] as List) {
        list.add(WeatherDaily.fromJson(d as Map<String, dynamic>));
      }
    }
    return ForecastResponse(daily: list);
  }
}
