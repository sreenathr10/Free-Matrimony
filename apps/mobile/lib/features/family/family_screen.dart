import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/enums.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';
import 'models.dart';

final myProfilesProvider = FutureProvider.autoDispose<List<MyProfile>>((
  ref,
) async {
  final res =
      await ref.watch(apiProvider).request('GET', '/profiles/mine') as List;
  return res.map((e) => MyProfile.fromJson(e as Map<String, dynamic>)).toList();
});

class FamilyScreen extends ConsumerWidget {
  const FamilyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profiles = ref.watch(myProfilesProvider);
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 20,
        title: const Logo(size: 28),
        actions: [
          IconButton(
            tooltip: 'Log out',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await ref.read(tokenStoreProvider).clear();
              if (context.mounted) context.go('/');
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      floatingActionButton: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(100),
          boxShadow: [
            BoxShadow(
              color: Brand.rose600.withValues(alpha: 0.4),
              blurRadius: 24,
              offset: const Offset(0, 10),
              spreadRadius: -6,
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          onPressed: () => context.go('/profiles/new'),
          backgroundColor: Brand.rose600,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: const StadiumBorder(),
          icon: const Icon(Icons.person_add_alt_1_rounded),
          label: const Text(
            'Create profile',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ),
      body: MeshBackground(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(myProfilesProvider.future),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
            children: [
              Text('Your family', style: t.headlineMedium),
              const SizedBox(height: 4),
              Text(
                'Profiles you manage or help with. Everyone has their own login.',
                style: t.bodyMedium,
              ),
              const SizedBox(height: 20),
              ...profiles.when(
                loading: () => [
                  for (var i = 0; i < 2; i++)
                    Container(
                      height: 132,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Surfaces.of(context).sunken,
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                ],
                error: (e, _) => [
                  EmptyPanel(
                    icon: Icons.cloud_off_rounded,
                    title: 'Could not load your family',
                    body: '$e',
                    action: OutlinedButton(
                      onPressed: () => ref.invalidate(myProfilesProvider),
                      child: const Text('Try again'),
                    ),
                  ),
                ],
                data: (items) => items.isEmpty
                    ? [
                        const EmptyPanel(
                          icon: Icons.favorite_rounded,
                          title: 'No profiles yet',
                          body:
                              'Create one for yourself, or for a son, daughter or sibling.',
                        ),
                      ]
                    : [
                        for (final (i, p) in items.indexed)
                          FadeSlideIn(
                            delay: i * 60,
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _ProfileCard(profile: p),
                            ),
                          ),
                      ],
              ),
            ],
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
    final s = Surfaces.of(context);
    final live = profile.status == 'LIVE';
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: profile.invitationPending
            ? null
            : () => context.go('/profiles/${profile.id}'),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  InitialsAvatar(name: profile.fullName, size: 52),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(profile.fullName, style: t.titleMedium),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Icon(Icons.place_rounded, size: 14, color: s.faint),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                profile.location,
                                style: t.bodySmall,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (!profile.invitationPending)
                    Icon(Icons.chevron_right_rounded, color: s.faint),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  Pill(profile.relationLabel, tone: PillTone.brand),
                  Pill(
                    humanize(profile.status),
                    tone: live ? PillTone.verified : PillTone.neutral,
                    icon: live ? Icons.verified_rounded : null,
                  ),
                  if (profile.invitationPending)
                    const Pill(
                      'Invitation',
                      tone: PillTone.gold,
                      icon: Icons.mail_rounded,
                    ),
                ],
              ),
              if (profile.invitationPending) ...[
                const SizedBox(height: 14),
                GradientButton(
                  label: 'Accept invite',
                  icon: Icons.check_rounded,
                  onPressed: () async {
                    await ref
                        .read(apiProvider)
                        .request(
                          'POST',
                          '/profiles/${profile.id}/members/accept',
                        );
                    ref.invalidate(myProfilesProvider);
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
