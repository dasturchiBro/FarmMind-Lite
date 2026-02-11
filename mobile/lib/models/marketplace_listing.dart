class MarketplaceListing {
  final int id;
  final int farmerId;
  final String farmerName;
  final String farmerPhone;
  final int cropTypeId;
  final String cropName;
  final double quantityKg;
  final double pricePerKg;
  final String harvestReadyDate;
  final String description;
  final String region;
  final String imageUrl;
  final List<String> images;
  final double latitude;
  final double longitude;
  final String createdAt;
  final List<String> tags;
  final int viewCount;
  final int contactCount;
  final double averageRating;
  final int reviewCount;

  MarketplaceListing({
    required this.id,
    required this.farmerId,
    required this.farmerName,
    required this.farmerPhone,
    required this.cropTypeId,
    required this.cropName,
    required this.quantityKg,
    required this.pricePerKg,
    required this.harvestReadyDate,
    required this.description,
    required this.region,
    required this.imageUrl,
    required this.images,
    this.latitude = 0,
    this.longitude = 0,
    required this.createdAt,
    this.tags = const [],
    this.viewCount = 0,
    this.contactCount = 0,
    this.averageRating = 0,
    this.reviewCount = 0,
  });

  factory MarketplaceListing.fromJson(Map<String, dynamic> json) {
    List<String> imgList = [];
    if (json['image_url'] != null && (json['image_url'] as String).isNotEmpty) {
      imgList.add(json['image_url'] as String);
    }
    if (json['images'] != null) {
      for (var img in json['images'] as List) {
        if (img != null && img.toString().isNotEmpty)
          imgList.add(img.toString());
      }
    }
    List<String> tagList = [];
    if (json['tags'] != null) {
      for (var t in json['tags'] as List) {
        if (t != null) tagList.add(t.toString());
      }
    }
    return MarketplaceListing(
      id: json['id'] as int,
      farmerId: json['farmer_id'] as int,
      farmerName: json['farmer_name'] as String? ?? '',
      farmerPhone: json['farmer_phone'] as String? ?? '',
      cropTypeId: json['crop_type_id'] as int,
      cropName: json['crop_name'] as String? ?? '',
      quantityKg: (json['quantity_kg'] as num?)?.toDouble() ?? 0,
      pricePerKg: (json['price_per_kg'] as num?)?.toDouble() ?? 0,
      harvestReadyDate:
          json['harvest_ready_date'] as String? ?? 'Not specified',
      description: json['description'] as String? ?? '',
      region: json['region'] as String? ?? '',
      imageUrl: json['image_url'] as String? ?? '',
      images: imgList,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      createdAt: json['created_at'] as String? ?? '',
      tags: tagList,
      viewCount: json['view_count'] as int? ?? 0,
      contactCount: json['contact_count'] as int? ?? 0,
      averageRating: (json['average_rating'] as num?)?.toDouble() ?? 0,
      reviewCount: json['review_count'] as int? ?? 0,
    );
  }
}
