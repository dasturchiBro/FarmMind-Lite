class WeatherCurrent {
  final double temp;
  final double feelsLike;
  final int humidity;
  final int pressure;
  final double windSpeed;
  final double uvIndex;
  final String condition;
  final String sunrise;
  final String sunset;

  WeatherCurrent({
    required this.temp,
    required this.feelsLike,
    required this.humidity,
    required this.pressure,
    required this.windSpeed,
    this.uvIndex = 0,
    required this.condition,
    required this.sunrise,
    required this.sunset,
  });

  factory WeatherCurrent.fromJson(Map<String, dynamic> json) {
    return WeatherCurrent(
      temp: (json['temp'] as num?)?.toDouble() ?? 0,
      feelsLike: (json['feels_like'] as num?)?.toDouble() ?? 0,
      humidity: json['humidity'] as int? ?? 0,
      pressure: json['pressure'] as int? ?? 0,
      windSpeed: (json['wind_speed'] as num?)?.toDouble() ?? 0,
      uvIndex: (json['uv_index'] as num?)?.toDouble() ?? 0,
      condition: json['condition'] as String? ?? '',
      sunrise: json['sunrise'] as String? ?? '06:00',
      sunset: json['sunset'] as String? ?? '19:00',
    );
  }
}

class WeatherDaily {
  final String date;
  final double tempMax;
  final double tempMin;
  final String condition;
  final int rainChance;

  WeatherDaily({
    required this.date,
    required this.tempMax,
    required this.tempMin,
    required this.condition,
    this.rainChance = 0,
  });

  factory WeatherDaily.fromJson(Map<String, dynamic> json) {
    return WeatherDaily(
      date: json['date'] as String? ?? '',
      tempMax: (json['temp_max'] as num?)?.toDouble() ?? 0,
      tempMin: (json['temp_min'] as num?)?.toDouble() ?? 0,
      condition: json['condition'] as String? ?? '',
      rainChance: json['rain_chance'] as int? ?? 0,
    );
  }
}
