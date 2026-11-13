/// Mirrors GET /v1/profiles/mine. Permission rules themselves live in the API (packages/shared).
class MyProfile {
  MyProfile({
    required this.id,
    required this.fullName,
    required this.status,
    required this.city,
    required this.country,
    required this.relation,
    required this.role,
    required this.invitationPending,
    required this.permissions,
  });

  final String id;
  final String fullName;
  final String status;
  final String? city;
  final String country;
  final String relation;
  final String role;
  final bool invitationPending;
  final Map<String, String> permissions;

  factory MyProfile.fromJson(Map<String, dynamic> json) {
    final p = json['profile'] as Map<String, dynamic>;
    final a = json['access'] as Map<String, dynamic>;
    return MyProfile(
      id: p['id'] as String,
      fullName: p['fullName'] as String,
      status: p['status'] as String,
      city: p['currentCity'] as String?,
      country: p['currentCountry'] as String,
      relation: a['relation'] as String,
      role: a['role'] as String,
      invitationPending: json['invitationPending'] as bool? ?? false,
      permissions: Map<String, String>.from(a['permissions'] as Map),
    );
  }

  bool can(String permission) => permissions[permission] == 'ALLOW';

  String get relationLabel => relation == 'SELF'
      ? 'Your profile'
      : 'You are their ${relation.toLowerCase()}';
  String get statusLabel => status.replaceAll('_', ' ').toLowerCase();
  String get location => city == null ? country : '$city, $country';
}
