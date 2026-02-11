class PlatformAnalytics {
  final int totalListings;
  final int totalFarmers;
  final int totalBuyers;
  final int activeListings;
  final int totalPriceReports;
  final double averagePriceChange;
  final String lastUpdated;
  final List<RegionalStat> regionalBreakdown;

  PlatformAnalytics({
    this.totalListings = 0,
    this.totalFarmers = 0,
    this.totalBuyers = 0,
    this.activeListings = 0,
    this.totalPriceReports = 0,
    this.averagePriceChange = 0,
    this.lastUpdated = '',
    this.regionalBreakdown = const [],
  });

  factory PlatformAnalytics.fromJson(Map<String, dynamic> json) {
    List<RegionalStat> regions = [];
    if (json['regional_breakdown'] != null) {
      for (var r in json['regional_breakdown'] as List) {
        regions.add(RegionalStat.fromJson(r as Map<String, dynamic>));
      }
    }
    return PlatformAnalytics(
      totalListings: json['total_listings'] as int? ?? 0,
      totalFarmers: json['total_farmers'] as int? ?? 0,
      totalBuyers: json['total_buyers'] as int? ?? 0,
      activeListings: json['active_listings'] as int? ?? 0,
      totalPriceReports: json['total_price_reports'] as int? ?? 0,
      averagePriceChange:
          (json['average_price_change'] as num?)?.toDouble() ?? 0,
      lastUpdated: json['last_updated']?.toString() ?? '',
      regionalBreakdown: regions,
    );
  }
}

class RegionalStat {
  final String region;
  final int listings;
  final int farmers;

  RegionalStat({
    required this.region,
    required this.listings,
    required this.farmers,
  });

  factory RegionalStat.fromJson(Map<String, dynamic> json) {
    return RegionalStat(
      region: json['region'] as String? ?? '',
      listings: json['listings'] as int? ?? 0,
      farmers: json['farmers'] as int? ?? 0,
    );
  }
}
