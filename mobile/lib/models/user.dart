class User {
  final int id;
  final String fullName;
  final String email;
  final String phoneNumber;
  final String region;
  final String role;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.region,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      fullName: json['full_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phoneNumber: json['phone_number'] as String? ?? '',
      region: json['region'] as String? ?? '',
      role: json['role'] as String? ?? 'farmer',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'full_name': fullName,
        'email': email,
        'phone_number': phoneNumber,
        'region': region,
        'role': role,
      };
}
