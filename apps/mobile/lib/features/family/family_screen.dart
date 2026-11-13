import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api.dart';
import '../../core/theme.dart';
import 'models.dart';

final myProfilesProvider = FutureProvider.autoDispose<List<MyProfile>>((ref) async {
  final res = await ref.watch(apiProvider).request('GET', '/profiles/mine') as List;
  return res.map((e) => MyProfile.fromJson(e as Map<String, dynamic>)).toList();
});

class FamilyScreen extends ConsumerWidget {
  const FamilyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profiles = ref.watch(myProfilesProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Your family'),
        actions: [
          IconButton(
            tooltip: 'Log out',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await ref.read(tokenStoreProvider).clear();
              if (context.mounted) context.go('/');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(myProfilesProvider.future),
        child: profiles.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(padding: const EdgeInsets.all(24), children: [Text('$e')]),
          data: (items) => items.isEmpty
              ? ListView(
                  padding: const EdgeInsets.all(24),
                  children: const [Text('No profiles yet. Profile creation is coming in the next milestone.')],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => _ProfileCard(profile: items[i]),
                ),
        ),
      ),
    );
  }
}

class _ProfileCard extends ConsumerWidget {
  const _ProfileCard({required this.profile});
  final MyProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(profile.fullName, style: t.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text('${profile.relationLabel} · ${profile.location}', style: t.bodyMedium),
            const SizedBox(height: 10),
            Wrap(spacing: 8, children: [
              Chip(
                label: Text(profile.statusLabel),
                avatar: profile.status == 'LIVE' ? const Icon(Icons.verified_rounded, color: Brand.verified, size: 18) : null,
              ),
              Chip(label: Text(profile.role.toLowerCase())),
            ]),
            if (profile.invitationPending) ...[
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () async {
                  await ref.read(apiProvider).request('POST', '/profiles/${profile.id}/members/accept');
                  ref.invalidate(myProfilesProvider);
                },
                child: const Text('Accept invite'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
