import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/theme.dart';
import 'features/auth/login_screen.dart';
import 'features/family/family_screen.dart';
import 'features/profile/create_profile_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/welcome/welcome_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    routes: [
      GoRoute(path: '/', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/family', builder: (_, _) => const FamilyScreen()),
      GoRoute(
        path: '/profiles/new',
        builder: (_, _) => const CreateProfileScreen(),
      ),
      GoRoute(
        path: '/profiles/:id',
        builder: (_, s) => ProfileScreen(id: s.pathParameters['id']!),
      ),
    ],
  );
});

class FreeMatrimonyApp extends ConsumerWidget {
  const FreeMatrimonyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Free Matrimony',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      routerConfig: ref.watch(routerProvider),
    );
  }
}
