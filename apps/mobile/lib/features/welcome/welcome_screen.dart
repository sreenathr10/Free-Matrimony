import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme.dart';
import '../../core/widgets.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  static const _points = [
    (
      Icons.verified_user_rounded,
      'Every profile verified',
      'Selfie and ID checks before anyone sees a profile.',
    ),
    (
      Icons.diversity_3_rounded,
      'Made for families',
      'Mom, dad and siblings get their own logins and access.',
    ),
    (
      Icons.lock_rounded,
      'Private by default',
      'Blurred photos and masked numbers until you accept.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final s = Surfaces.of(context);
    return Scaffold(
      body: MeshBackground(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, box) => SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: box.maxHeight),
                child: IntrinsicHeight(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Logo(size: 34),
                        const Spacer(),
                        FadeSlideIn(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: s.raised,
                              borderRadius: BorderRadius.circular(100),
                              border: Border.all(color: s.line),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.auto_awesome_rounded,
                                  size: 14,
                                  color: Brand.gold,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'For Malayalis everywhere',
                                  style: t.labelMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        FadeSlideIn(
                          delay: 80,
                          child: Text.rich(
                            TextSpan(
                              style: t.displaySmall?.copyWith(height: 1.1),
                              children: [
                                const TextSpan(text: 'Find your person.\n'),
                                WidgetSpan(
                                  alignment: PlaceholderAlignment.baseline,
                                  baseline: TextBaseline.alphabetic,
                                  child: GradientText(
                                    'Bring your family',
                                    style: t.displaySmall?.copyWith(
                                      fontStyle: FontStyle.italic,
                                      height: 1.1,
                                    ),
                                  ),
                                ),
                                const TextSpan(text: ' along.'),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        for (final (i, (icon, title, body)) in _points.indexed)
                          FadeSlideIn(
                            delay: 160 + i * 80,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: s.raised.withValues(alpha: 0.85),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: s.line),
                              ),
                              child: Row(
                                children: [
                                  IconTile(icon, size: 42),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(title, style: t.titleSmall),
                                        Text(body, style: t.bodySmall),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        const Spacer(),
                        const SizedBox(height: 20),
                        FadeSlideIn(
                          delay: 420,
                          child: GradientButton(
                            label: 'Get started',
                            icon: Icons.arrow_forward_rounded,
                            onPressed: () => context.go('/login'),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Center(
                          child: Text(
                            'Free to join. Verified members only.',
                            style: t.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
