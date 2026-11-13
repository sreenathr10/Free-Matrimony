import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:free_matrimony/core/api.dart';
import 'package:free_matrimony/core/enums.dart';
import 'package:free_matrimony/features/profile/create_profile_screen.dart';

class _NoTokens implements TokenStore {
  @override
  Future<String?> read() async => null;
  @override
  Future<void> write(String t) async {}
  @override
  Future<void> clear() async {}
}

void main() {
  test('humanize turns enum values into labels', () {
    expect(humanize('NEVER_MARRIED'), 'Never married');
    expect(humanize('THIRUVANANTHAPURAM'), 'Thiruvananthapuram');
  });

  testWidgets('wizard requires a choice, then validates the basics', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [tokenStoreProvider.overrideWithValue(_NoTokens())],
        child: const MaterialApp(home: CreateProfileScreen()),
      ),
    );
    expect(find.text('Who is this profile for?'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text('Choose one to continue'), findsOneWidget);

    await tester.tap(find.text('Myself'));
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('The basics'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text('Required'), findsWidgets);
    expect(find.text('The basics'), findsOneWidget);
  });
}
