import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/enums.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

final verificationProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>?, String>((ref, id) async {
      final res = await ref
          .watch(apiProvider)
          .request('GET', '/profiles/$id/verification');
      return res is Map<String, dynamic> && res.containsKey('id') ? res : null;
    });

/// The path from draft to live: consent, the candidate's selfie and ID, then submit.
/// Only the candidate can consent or upload identity documents.
class VerificationCard extends ConsumerStatefulWidget {
  const VerificationCard({
    super.key,
    required this.profile,
    required this.isCandidate,
    required this.canSubmit,
    required this.onChanged,
  });

  final Map<String, dynamic> profile;
  final bool isCandidate;
  final bool canSubmit;
  final VoidCallback onChanged;

  @override
  ConsumerState<VerificationCard> createState() => _VerificationCardState();
}

class _VerificationCardState extends ConsumerState<VerificationCard> {
  String? _busy;
  String? _idType;

  String get _id => widget.profile['id'] as String;

  String _defaultId() => switch (widget.profile['currentCountry']) {
    'IN' => 'AADHAAR',
    'AE' => 'EMIRATES_ID',
    _ => 'PASSPORT',
  };

  void _error(Object e) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(e is ApiException ? e.message : 'Something went wrong'),
      ),
    );
  }

  Future<void> _upload(
    String file,
    ImageSource source,
    CameraDevice camera,
  ) async {
    final picked = await ImagePicker().pickImage(
      source: source,
      preferredCameraDevice: camera,
      maxWidth: 2400,
      imageQuality: 90,
    );
    if (picked == null) return;
    setState(() => _busy = file);
    final api = ref.read(apiProvider);
    try {
      final bytes = await picked.readAsBytes();
      final type =
          picked.mimeType ??
          (picked.name.toLowerCase().endsWith('.png')
              ? 'image/png'
              : 'image/jpeg');
      final res = await api.request(
        'POST',
        '/profiles/$_id/verification/uploads',
        {'file': file, 'contentType': type, 'sizeBytes': bytes.length},
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
        '/profiles/$_id/verification/uploads/$file/confirm',
      );
      ref.invalidate(verificationProvider(_id));
    } catch (e) {
      _error(e);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _post(String path, [Map<String, dynamic>? body]) async {
    setState(() => _busy = path);
    try {
      await ref.read(apiProvider).request('POST', '/profiles/$_id/$path', body);
      ref.invalidate(verificationProvider(_id));
      widget.onChanged();
    } catch (e) {
      _error(e);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final s = Surfaces.of(context);
    final status = widget.profile['status'] as String;

    if (status == 'LIVE' || status == 'HIDDEN') {
      return const _Banner(
        icon: Icons.verified_rounded,
        color: Brand.verified,
        title: 'Verified',
        body:
            'Our team checked the selfie and ID. Matches see a verified badge.',
      );
    }
    if (status == 'PENDING_VERIFICATION') {
      return const _Banner(
        icon: Icons.schedule_rounded,
        color: Brand.gold,
        title: 'In review',
        body:
            'Our verification team is checking the selfie and ID. This usually takes less than a day.',
      );
    }
    if (status != 'DRAFT') return const SizedBox.shrink();

    final v = ref.watch(verificationProvider(_id)).value;
    final collecting = v?['status'] == 'COLLECTING';
    final files = collecting ? (v!['files'] as Map) : const {};
    final idType = _idType ?? (v?['idDocumentType'] as String?) ?? _defaultId();
    final needsBack = idNeedsBack(idType);
    final consented = widget.profile['candidateConsentAt'] != null;
    final selfie = files['SELFIE'] == true;
    final front = files['ID_FRONT'] == true;
    final back = files['ID_BACK'] == true;
    final ready = consented && selfie && front && (!needsBack || back);
    final rejection = v?['status'] == 'REJECTED'
        ? v!['rejection'] as Map?
        : null;
    final me = widget.isCandidate;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const IconTile(Icons.verified_user_rounded, filled: true),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Get verified to go live', style: t.titleMedium),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'A live selfie and a government ID. Only our verification team sees them, never matches.',
              style: t.bodySmall,
            ),
            if (rejection != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(
                    context,
                  ).colorScheme.errorContainer.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  'Not approved: ${rejection['message']}${rejection['note'] == null ? '' : '\nNote: ${rejection['note']}'}',
                  style: t.bodySmall?.copyWith(color: s.ink),
                ),
              ),
            ],
            const SizedBox(height: 14),
            _Step(
              n: 1,
              done: consented,
              title: 'Candidate’s consent',
              detail: consented
                  ? 'Given'
                  : (me
                        ? 'Agree to being shown to matches'
                        : 'Waiting for the candidate'),
              action: me && !consented
                  ? _SmallButton(
                      'I consent',
                      Icons.check_rounded,
                      _busy == 'consent',
                      () => _post('consent'),
                    )
                  : null,
            ),
            _Step(
              n: 2,
              done: selfie,
              title: 'Live selfie',
              detail: selfie
                  ? 'Uploaded'
                  : (me
                        ? 'Face the camera in good light'
                        : 'The candidate takes this'),
              action: me && consented
                  ? _SmallButton(
                      selfie ? 'Retake' : 'Selfie',
                      Icons.photo_camera_front_rounded,
                      _busy == 'SELFIE',
                      () => _upload(
                        'SELFIE',
                        ImageSource.camera,
                        CameraDevice.front,
                      ),
                    )
                  : null,
            ),
            _Step(
              n: 3,
              done: front && (!needsBack || back),
              title: 'Government ID',
              detail: me
                  ? 'Flat, with all corners visible'
                  : 'The candidate uploads this',
            ),
            if (me && consented) ...[
              DropdownButtonFormField<String>(
                initialValue: idType,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Document'),
                items: [
                  for (final e in idDocumentTypes.entries)
                    DropdownMenuItem(value: e.key, child: Text(e.value)),
                ],
                onChanged: (v) => setState(() => _idType = v),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _SmallButton(
                    front
                        ? (needsBack ? 'Front ✓' : 'Page ✓')
                        : (needsBack ? 'Front' : 'Photo page'),
                    Icons.badge_rounded,
                    _busy == 'ID_FRONT',
                    () => _upload(
                      'ID_FRONT',
                      ImageSource.camera,
                      CameraDevice.rear,
                    ),
                  ),
                  if (needsBack)
                    _SmallButton(
                      back ? 'Back ✓' : 'Back',
                      Icons.badge_outlined,
                      _busy == 'ID_BACK',
                      () => _upload(
                        'ID_BACK',
                        ImageSource.camera,
                        CameraDevice.rear,
                      ),
                    ),
                ],
              ),
            ],
            if (widget.canSubmit) ...[
              const SizedBox(height: 16),
              GradientButton(
                label: 'Submit for verification',
                icon: Icons.send_rounded,
                loading: _busy == 'submit',
                onPressed: ready
                    ? () => _post('submit', {'idDocumentType': idType})
                    : null,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({
    required this.n,
    required this.done,
    required this.title,
    required this.detail,
    this.action,
  });
  final int n;
  final bool done;
  final String title;
  final String detail;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    final t = Theme.of(context).textTheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: s.sunken,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: done ? Brand.verified : s.raised,
              border: done ? null : Border.all(color: s.line),
            ),
            child: Center(
              child: done
                  ? const Icon(
                      Icons.check_rounded,
                      size: 16,
                      color: Colors.white,
                    )
                  : Text(
                      '$n',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: s.muted,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: t.titleSmall),
                Text(detail, style: t.bodySmall),
              ],
            ),
          ),
          ?action,
        ],
      ),
    );
  }
}

class _SmallButton extends StatelessWidget {
  const _SmallButton(this.label, this.icon, this.busy, this.onPressed);
  final String label;
  final IconData icon;
  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 40),
        backgroundColor: Brand.rose600,
        foregroundColor: Colors.white,
        textStyle: const TextStyle(
          fontFamily: Brand.sans,
          fontWeight: FontWeight.w700,
          fontSize: 13.5,
        ),
      ),
      onPressed: busy ? null : onPressed,
      icon: busy
          ? const SizedBox.square(
              dimension: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Icon(icon, size: 18),
      label: Text(label),
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: t.titleMedium),
                Text(body, style: t.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
