class CropEstimation {
  final String cropName;
  final double minYieldKg;
  final double maxYieldKg;
  final double minIncomeUsd;
  final double maxIncomeUsd;
  final double avgPricePerKg;

  CropEstimation({
    required this.cropName,
    required this.minYieldKg,
    required this.maxYieldKg,
    required this.minIncomeUsd,
    required this.maxIncomeUsd,
    required this.avgPricePerKg,
  });

  double get estimatedYield => (minYieldKg + maxYieldKg) / 2;
  double get grossIncome => (minIncomeUsd + maxIncomeUsd) / 2;

  factory CropEstimation.fromJson(Map<String, dynamic> json) {
    return CropEstimation(
      cropName: json['crop_name'] as String? ?? '',
      minYieldKg: (json['min_yield_kg'] as num?)?.toDouble() ?? 0,
      maxYieldKg: (json['max_yield_kg'] as num?)?.toDouble() ?? 0,
      minIncomeUsd: (json['min_income_usd'] as num?)?.toDouble() ?? 0,
      maxIncomeUsd: (json['max_income_usd'] as num?)?.toDouble() ?? 0,
      avgPricePerKg: (json['avg_price_per_kg'] as num?)?.toDouble() ?? 0,
    );
  }
}
