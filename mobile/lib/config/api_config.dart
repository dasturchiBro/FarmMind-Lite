class ApiConfig {
  static String baseUrl = 'http://10.0.2.2:8080';

  static void init(String url) {
    baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static String get uploadsBase => baseUrl;
}
