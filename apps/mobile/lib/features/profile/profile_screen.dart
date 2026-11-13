import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/enums.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';
import 'verification_card.dart';

class ProfileData {
  ProfileData(this.json, this.photos);
  final Map<String, dynamic> json;
  final List<Map<String, dynamic>> photos;

  Map<String, dynamic> get profile => json['profile'] as Map<String, dynamic>;
  Map<String, dynamic> get access => json['access'] as Map<String, dynamic>;
  Map<String, dynamic> get completeness =>
      json['completeness'] as Map<String, dynamic>;
  bool get canEdit => (access['permissions'] as Map)['EDIT_PROFILE'] == 'ALLOW';
  bool get isCandidate => access['role'] == 'CANDIDATE';
}

final profileProvider = FutureProvider.autoDispose.family<ProfileData, String>((
  ref,
  id,
) async {
  final api = ref.watch(apiProvider);
  final results = await Future.wait([
    api.request('GET', '/profiles/$id'),
    api.request('GET', '/profiles/$id/photos'),
  ]);
  return ProfileData(
    results[0] as Map<String, dynamic>,
    (results[1] as List).cast<Map<String, dynamic>>(),
  );
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(profileProvider(id));
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        foregroundColor: Colors.white,
        leading: Padding(
          padding: const EdgeInsets.only(left: 8),
          child: IconButton.filledTonal(
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withValues(alpha: 0.2),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => context.go('/family'),
          ),
        ),
      ),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (d) => RefreshIndicator(
          onRefresh: () => ref.refresh(profileProvider(id).future),
          child: _ProfileBody(id: id, data: d),
        ),
      ),
    );
  }
}

class _ProfileBody extends ConsumerStatefulWidget {
  const _ProfileBody({required this.id, required this.data});
  final String id;
  final ProfileData data;

  @override
  ConsumerState<_ProfileBody> createState() => _ProfileBodyState();
}

class _ProfileBodyState extends ConsumerState<_ProfileBody> {
  bool _uploading = false;

  Future<void> _addPhoto() async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 2400,
      imageQuality: 90,
    );
    if (file == null) return;
    setState(() => _uploading = true);
    final api = ref.read(apiProvider);
    try {
      final bytes = await file.readAsBytes();
      final type =
          file.mimeType ??
          (file.name.toLowerCase().endsWith('.png')
              ? 'image/png'
              : 'image/jpeg');
      final res = await api.request(
        'POST',
        '/profiles/${widget.id}/photos/uploads',
        {'contentType': type, 'sizeBytes': bytes.length},
      );
      final upload = res['upload'] as Map<String, dynamic>;
      final put = await http.put(
        Uri.parse(upload['url'] as String),
        headers: Map<String, String>.from(upload['headers'] as Map),
        body: bytes,
      );
      if (put.statusCode >= 300) {
        throw ApiException(put.statusCode, 'Upload failed');
      }
      await api.request(
        'POST',
        '/profiles/${widget.id}/photos/${res['photoId']}/confirm',
      );
      ref.invalidate(profileProvider(widget.id));
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  int _age(String dob) {
    final d = DateTime.parse(dob);
    final now = DateTime.now();
    var a = now.year - d.year;
    if (now.month < d.month || (now.month == d.month && now.day < d.day)) a--;
    return a;
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.data;
    final p = d.profile;
    final t = Theme.of(context).textTheme;
    final s = Surfaces.of(context);
    final percent = (d.completeness['percent'] as num).toInt();
    final steps = (d.completeness['nextSteps'] as List)
        .cast<Map<String, dynamic>>();
    final place = [
      p['currentCity'],
      countries[p['currentCountry']] ?? p['currentCountry'],
    ].whereType<String>().join(', ');
    final live = p['status'] == 'LIVE';
    final details = <(IconData, String, String?)>[
      (Icons.cake_rounded, 'Age', '${_age(p['dateOfBirth'] as String)} years'),
      (
        Icons.favorite_rounded,
        'Marital status',
        humanize(p['maritalStatus'] as String),
      ),
      (
        Icons.temple_hindu_rounded,
        'Religion',
        humanize(p['religion'] as String),
      ),
      (
        Icons.groups_rounded,
        communityLabel(p['religion'] as String?),
        p['community'] == null
            ? null
            : [p['community'], p['subCaste']].whereType<String>().join(' · ') +
                  (p['casteNoBar'] == true ? ' (caste no bar)' : ''),
      ),
      (
        Icons.star_rounded,
        'Star',
        p['star'] == null ? null : humanize(p['star'] as String),
      ),
      (
        Icons.home_rounded,
        'Native district',
        p['nativeDistrict'] == null
            ? null
            : humanize(p['nativeDistrict'] as String),
      ),
      (Icons.place_rounded, 'Lives in', place),
      (
        Icons.straighten_rounded,
        'Height',
        p['heightCm'] == null ? null : '${p['heightCm']} cm',
      ),
      (Icons.school_rounded, 'Education', p['education'] as String?),
      (Icons.work_rounded, 'Occupation', p['occupation'] as String?),
    ];

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        // Hero: gradient banner with the avatar overlapping it.
        SizedBox(
          height: 230,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                height: 180,
                decoration: const BoxDecoration(gradient: Brand.gradient),
                child: const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment(0.8, -0.6),
                      radius: 0.9,
                      colors: [Color(0x88F6CF6B), Color(0x00F6CF6B)],
                    ),
                  ),
                  child: Align(
                    alignment: Alignment(1.15, 0.9),
                    child: Opacity(
                      opacity: 0.12,
                      child: LogoMark(size: 170, mono: Colors.white),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 20,
                bottom: 0,
                child: InitialsAvatar(
                  name: p['fullName'] as String,
                  size: 96,
                  ring: true,
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Flexible(
                    child: Text(
                      p['fullName'] as String,
                      style: t.headlineMedium,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Pill(
                    p['verifiedAt'] != null
                        ? 'Verified'
                        : humanize(p['status'] as String),
                    tone: live ? PillTone.verified : PillTone.neutral,
                    icon: live ? Icons.verified_rounded : null,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 12,
                runSpacing: 4,
                children: [
                  if (p['occupation'] != null)
                    _Meta(
                      Icons.work_outline_rounded,
                      p['occupation'] as String,
                    ),
                  if (place.isNotEmpty) _Meta(Icons.place_outlined, place),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                children: [
                  Pill(
                    'You: ${humanize(d.access['role'] as String)}',
                    tone: PillTone.brand,
                  ),
                  if (d.access['isFamilyAdmin'] == true)
                    const Pill(
                      'Family admin',
                      tone: PillTone.gold,
                      icon: Icons.workspace_premium_rounded,
                    ),
                ],
              ),
              const SizedBox(height: 20),

              // Strength
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          StrengthRing(percent: percent, size: 64),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Profile strength', style: t.titleMedium),
                                Text(
                                  steps.isEmpty
                                      ? 'Everything is filled in'
                                      : 'Complete profiles get up to 3 times more interest.',
                                  style: t.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      for (final st in steps)
                        Container(
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: s.sunken,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              const IconTile(
                                Icons.auto_awesome_rounded,
                                size: 28,
                                gold: true,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  st['hint'] as String,
                                  style: t.bodyMedium?.copyWith(color: s.ink),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),
              VerificationCard(
                profile: p,
                isCandidate: d.isCandidate,
                canSubmit: d.canEdit,
                onChanged: () => ref.invalidate(profileProvider(widget.id)),
              ),

              const SizedBox(height: 12),
              SectionCard(
                title: 'Photos',
                subtitle: '${d.photos.length} of 8 · blurred until you accept',
                icon: Icons.photo_library_rounded,
                child: d.photos.isEmpty && !d.canEdit
                    ? Text('No photos yet.', style: t.bodyMedium)
                    : GridView.count(
                        crossAxisCount: 3,
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        childAspectRatio: 3 / 4,
                        children: [
                          for (final ph in d.photos)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  Image.network(
                                    ph['url'] as String,
                                    fit: BoxFit.cover,
                                  ),
                                  if (ph['isPrimary'] == true)
                                    const Positioned(
                                      left: 6,
                                      top: 6,
                                      child: Pill(
                                        'Main',
                                        tone: PillTone.gold,
                                        icon: Icons.star_rounded,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          if (d.canEdit && d.photos.length < 8)
                            Material(
                              color: s.sunken,
                              borderRadius: BorderRadius.circular(16),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(16),
                                onTap: _uploading ? null : _addPhoto,
                                child: Center(
                                  child: _uploading
                                      ? const SizedBox.square(
                                          dimension: 22,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.4,
                                          ),
                                        )
                                      : Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.add_photo_alternate_rounded,
                                              color: Brand.rose600,
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Add',
                                              style: t.labelMedium?.copyWith(
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            ),
                        ],
                      ),
              ),
              const SizedBox(height: 12),
              SectionCard(
                title: 'Details',
                icon: Icons.badge_rounded,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (p['about'] != null)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                        decoration: BoxDecoration(
                          color: s.sunken,
                          borderRadius: BorderRadius.circular(16),
                          border: const Border(
                            left: BorderSide(color: Brand.rose400, width: 4),
                          ),
                        ),
                        child: Text(
                          p['about'] as String,
                          style: TextStyle(
                            fontFamily: Brand.display,
                            fontStyle: FontStyle.italic,
                            fontSize: 17,
                            height: 1.4,
                            color: s.ink,
                          ),
                        ),
                      ),
                    for (final (icon, k, v) in details)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          children: [
                            IconTile(icon, size: 34),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    k,
                                    style: t.labelSmall?.copyWith(
                                      color: s.faint,
                                    ),
                                  ),
                                  Text(
                                    v == null || v.isEmpty ? 'Not added' : v,
                                    style: t.bodyLarge?.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: v == null || v.isEmpty
                                          ? s.faint
                                          : s.ink,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: s.faint),
        const SizedBox(width: 4),
        Text(text, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
