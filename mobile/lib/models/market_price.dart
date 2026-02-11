class MarketPrice {
  final int? id;
  final String crop;
  final String region;
  final double retailPrice;
  final double wholesalePrice;
  final String updatedAt;
  final String history;
  final int distFarmers;
  final int anonReports;
  final int? submittedBy;

  MarketPrice({
    this.id,
    required this.crop,
    required this.region,
    required this.retailPrice,
    required this.wholesalePrice,
    required this.updatedAt,
    this.history = '[]',
    this.distFarmers = 0,
    this.anonReports = 0,
    this.submittedBy,
  });

  factory MarketPrice.fromJson(Map<String, dynamic> json) {
    return MarketPrice(
      id: json['id'] as int?,
      crop: json['crop'] as String? ?? '',
      region: json['region'] as String? ?? '',
      retailPrice: (json['retail_price'] as num?)?.toDouble() ?? 0,
      wholesalePrice: (json['wholesale_price'] as num?)?.toDouble() ?? 0,
      updatedAt: json['updated_at']?.toString() ?? '',
      history: json['history']?.toString() ?? '[]',
      distFarmers: json['dist_farmers'] as int? ?? 0,
      anonReports: json['anon_reports'] as int? ?? 0,
      submittedBy: json['submitted_by'] as int?,
    );
  }
}
