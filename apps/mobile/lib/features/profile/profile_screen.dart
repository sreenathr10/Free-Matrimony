import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/enums.dart';
import '../../core/theme.dart';

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
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/family'),
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

  Future<void> _post(String path) async {
    try {
      await ref
          .read(apiProvider)
          .request('POST', '/profiles/${widget.id}/$path');
      ref.invalidate(profileProvider(widget.id));
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.data;
    final p = d.profile;
    final t = Theme.of(context).textTheme;
    final percent = (d.completeness['percent'] as num).toInt();
    final steps = (d.completeness['nextSteps'] as List)
        .cast<Map<String, dynamic>>();
    final details = <(String, String?)>[
      ('Marital status', humanize(p['maritalStatus'] as String)),
      ('Religion', humanize(p['religion'] as String)),
      ('Community', p['community'] as String?),
      ('Star', p['star'] == null ? null : humanize(p['star'] as String)),
      (
        'Native district',
        p['nativeDistrict'] == null
            ? null
            : humanize(p['nativeDistrict'] as String),
      ),
      (
        'Lives in',
        [
          p['currentCity'],
          countries[p['currentCountry']] ?? p['currentCountry'],
        ].whereType<String>().join(', '),
      ),
      ('Education', p['education'] as String?),
      ('Occupation', p['occupation'] as String?),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      children: [
        Text(
          p['fullName'] as String,
          style: t.headlineMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          children: [
            Chip(label: Text(humanize(p['status'] as String))),
            Chip(label: Text(humanize(d.access['role'] as String))),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Profile strength',
                        style: t.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Text('$percent%'),
                  ],
                ),
                const SizedBox(height: 10),
                LinearProgressIndicator(
                  value: percent / 100,
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(8),
                ),
                for (final s in steps)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('• ${s['hint']}'),
                  ),
              ],
            ),
          ),
        ),
        if (p['status'] == 'DRAFT') ...[
          const SizedBox(height: 12),
          if (d.isCandidate && p['candidateConsentAt'] == null)
            FilledButton(
              onPressed: () => _post('consent'),
              child: const Text('I consent to this profile'),
            )
          else if (p['candidateConsentAt'] != null && d.canEdit)
            FilledButton(
              onPressed: () => _post('submit'),
              child: const Text('Submit for verification'),
            )
          else
            const Text(
              'The candidate must join and give consent before this profile can go live.',
            ),
        ],
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: Text(
                'Photos',
                style: t.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            if (d.canEdit)
              TextButton.icon(
                onPressed: _uploading || d.photos.length >= 8
                    ? null
                    : _addPhoto,
                icon: const Icon(Icons.add_photo_alternate_rounded),
                label: Text(_uploading ? 'Uploading…' : 'Add'),
              ),
          ],
        ),
        const SizedBox(height: 8),
        if (d.photos.isEmpty)
          const Text(
            'No photos yet. Matches see a blurred version until an interest is accepted.',
          )
        else
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 3 / 4,
            children: [
              for (final ph in d.photos)
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(ph['url'] as String, fit: BoxFit.cover),
                      if (ph['isPrimary'] == true)
                        const Positioned(
                          left: 6,
                          top: 6,
                          child: Icon(Icons.star_rounded, color: Brand.gold),
                        ),
                    ],
                  ),
                ),
            ],
          ),
        const SizedBox(height: 20),
        Text(
          'Details',
          style: t.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        for (final (k, v) in details)
          ListTile(
            contentPadding: EdgeInsets.zero,
            dense: true,
            title: Text(k),
            trailing: Text(v ?? 'Not added'),
          ),
        if (p['about'] != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(p['about'] as String),
          ),
      ],
    );
  }
}
