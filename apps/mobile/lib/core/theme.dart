import 'package:material_ui/material_ui.dart';

/// Brand colours shared with the web apps (packages/ui/src/theme.css).
class Brand {
  static const rose = Color(0xFFCF2E4C);
  static const gold = Color(0xFFD49A1F);
  static const verified = Color(0xFF0F9D58);
}

ThemeData buildTheme(Brightness brightness) {
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.rose,
    brightness: brightness,
    primary: Brand.rose,
  );
  final base = ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    brightness: brightness,
  );
  return base.copyWith(
    scaffoldBackgroundColor: brightness == Brightness.light
        ? const Color(0xFFFFFCFA)
        : const Color(0xFF141110),
    textTheme: base.textTheme.copyWith(
      displaySmall: base.textTheme.displaySmall?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outlineVariant),
      ),
    ),
  );
}
