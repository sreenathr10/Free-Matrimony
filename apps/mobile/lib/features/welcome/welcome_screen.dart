import 'package:material_ui/material_ui.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  static const _points = [
    (Icons.verified_rounded, 'Every profile verified', 'Selfie and ID checks before anyone sees a profile.'),
    (Icons.family_restroom_rounded, 'Made for families', 'Mom, dad and siblings get their own logins and access.'),
    (Icons.lock_rounded, 'Private by default', 'Blurred photos and masked numbers until you accept.'),
  ];

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Free Matrimony', style: t.titleLarge?.copyWith(color: Brand.rose, fontWeight: FontWeight.w700)),
              const Spacer(),
              Text('Find your person.\nBring your family along.', style: t.displaySmall),
              const SizedBox(height: 32),
              for (final (icon, title, body) in _points)
                Padding(
                  padding: const EdgeInsets.only(bottom: 18),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(icon, color: Brand.rose),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                            Text(body, style: t.bodyMedium?.copyWith(color: t.bodySmall?.color)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              const Spacer(),
              FilledButton(onPressed: () => context.go('/login'), child: const Text('Get started')),
            ],
          ),
        ),
      ),
    );
  }
}
