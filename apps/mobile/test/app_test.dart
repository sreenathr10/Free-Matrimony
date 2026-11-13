import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:free_matrimony/app.dart';
import 'package:free_matrimony/core/api.dart';
import 'package:free_matrimony/features/family/models.dart';

class MemoryTokenStore implements TokenStore {
  String? token;
  @override
  Future<String?> read() async => token;
  @override
  Future<void> write(String t) async => token = t;
  @override
  Future<void> clear() async => token = null;
}

void main() {
  testWidgets('welcome screen leads to login', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [tokenStoreProvider.overrideWithValue(MemoryTokenStore())],
        child: const FreeMatrimonyApp(),
      ),
    );
    expect(find.text('Every profile verified'), findsOneWidget);
    await tester.tap(find.text('Get started'));
    await tester.pumpAndSettle();
    expect(find.text('Log in or sign up'), findsOneWidget);
    expect(find.text('Send code'), findsOneWidget);
  });

  test('parses a profile from /profiles/mine', () {
    final p = MyProfile.fromJson({
      'invitationPending': true,
      'profile': {
        'id': 'p1',
        'fullName': 'Anjali Nair',
        'status': 'PENDING_VERIFICATION',
        'currentCity': 'Dubai',
        'currentCountry': 'AE',
      },
      'access': {
        'relation': 'MOTHER',
        'role': 'PARENT',
        'permissions': {'CHAT': 'ALLOW', 'MANAGE_PRIVACY': 'DENY'},
      },
    });
    expect(p.relationLabel, 'You are their mother');
    expect(p.statusLabel, 'pending verification');
    expect(p.location, 'Dubai, AE');
    expect(p.can('CHAT'), isTrue);
    expect(p.can('MANAGE_PRIVACY'), isFalse);
    expect(p.invitationPending, isTrue);
  });
}
