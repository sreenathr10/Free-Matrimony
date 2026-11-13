import 'package:material_ui/material_ui.dart';

/// Brand tokens. These mirror packages/ui/src/theme.css so the app and the website look like one product.
class Brand {
  static const rose50 = Color(0xFFFFF1F3);
  static const rose100 = Color(0xFFFFE3E8);
  static const rose300 = Color(0xFFFFA1B3);
  static const rose400 = Color(0xFFFB6D8B);
  static const rose = Color(0xFFEE3F68);
  static const rose600 = Color(0xFFD2224F);
  static const rose700 = Color(0xFFB01743);
  static const rose950 = Color(0xFF44051A);

  static const gold100 = Color(0xFFFDF3D7);
  static const gold300 = Color(0xFFF6CF6B);
  static const gold = Color(0xFFD99D1C);
  static const gold600 = Color(0xFFB87B12);

  static const verified = Color(0xFF0E9F6E);
  static const verifiedSoft = Color(0xFFDEF7EC);

  static const sans = 'Jakarta';
  static const display = 'Fraunces';

  static const gradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [rose, rose700],
  );
  static const goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [gold300, gold],
  );
}

/// Surface and text colours that change with light and dark mode.
@immutable
class Surfaces extends ThemeExtension<Surfaces> {
  const Surfaces({
    required this.surface,
    required this.sunken,
    required this.raised,
    required this.ink,
    required this.muted,
    required this.faint,
    required this.line,
  });

  final Color surface, sunken, raised, ink, muted, faint, line;

  static const light = Surfaces(
    surface: Color(0xFFFFFBF8),
    sunken: Color(0xFFFBF3EE),
    raised: Color(0xFFFFFFFF),
    ink: Color(0xFF1F1418),
    muted: Color(0xFF6E5F63),
    faint: Color(0xFFA3959A),
    line: Color(0xFFF0E4DF),
  );
  static const dark = Surfaces(
    surface: Color(0xFF120C0E),
    sunken: Color(0xFF0C0809),
    raised: Color(0xFF1B1316),
    ink: Color(0xFFF7EEF0),
    muted: Color(0xFFB6A6AB),
    faint: Color(0xFF7F6F74),
    line: Color(0xFF2C2025),
  );

  static Surfaces of(BuildContext context) =>
      Theme.of(context).extension<Surfaces>() ??
      (Theme.of(context).brightness == Brightness.dark ? dark : light);

  @override
  Surfaces copyWith() => this;

  @override
  Surfaces lerp(Surfaces? other, double t) {
    if (other == null) return this;
    return Surfaces(
      surface: Color.lerp(surface, other.surface, t)!,
      sunken: Color.lerp(sunken, other.sunken, t)!,
      raised: Color.lerp(raised, other.raised, t)!,
      ink: Color.lerp(ink, other.ink, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      faint: Color.lerp(faint, other.faint, t)!,
      line: Color.lerp(line, other.line, t)!,
    );
  }
}

ThemeData buildTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  final s = dark ? Surfaces.dark : Surfaces.light;
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.rose,
    brightness: brightness,
    primary: dark ? Brand.rose400 : Brand.rose600,
    secondary: Brand.gold,
    surface: s.surface,
    onSurface: s.ink,
    surfaceContainerLowest: s.raised,
    surfaceContainerLow: s.raised,
    surfaceContainer: s.sunken,
    surfaceContainerHighest: s.sunken,
    outlineVariant: s.line,
  );
  final base = ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    brightness: brightness,
    fontFamily: Brand.sans,
  );
  final tt = base.textTheme.apply(bodyColor: s.ink, displayColor: s.ink);
  TextStyle? display(TextStyle? t) => t?.copyWith(
    fontFamily: Brand.display,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.8,
  );
  final field = OutlineInputBorder(
    borderRadius: BorderRadius.circular(14),
    borderSide: BorderSide(color: s.line, width: 1.2),
  );

  return base.copyWith(
    scaffoldBackgroundColor: s.surface,
    extensions: [s],
    textTheme: tt.copyWith(
      displayLarge: display(tt.displayLarge),
      displayMedium: display(tt.displayMedium),
      displaySmall: display(tt.displaySmall),
      headlineLarge: display(tt.headlineLarge),
      headlineMedium: display(tt.headlineMedium),
      headlineSmall: display(tt.headlineSmall),
      titleLarge: tt.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
      titleMedium: tt.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      bodyMedium: tt.bodyMedium?.copyWith(color: s.muted, height: 1.45),
      bodySmall: tt.bodySmall?.copyWith(color: s.muted),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      foregroundColor: s.ink,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: Brand.sans,
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: s.ink,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(
          fontFamily: Brand.sans,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 44),
        shape: const StadiumBorder(),
        side: BorderSide(color: s.line, width: 1.2),
        foregroundColor: s.ink,
        textStyle: const TextStyle(
          fontFamily: Brand.sans,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        textStyle: const TextStyle(
          fontFamily: Brand.sans,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: s.raised,
      border: field,
      enabledBorder: field,
      focusedBorder: field.copyWith(
        borderSide: const BorderSide(color: Brand.rose400, width: 1.6),
      ),
      labelStyle: TextStyle(color: s.muted),
      floatingLabelStyle: TextStyle(
        color: dark ? Brand.rose300 : Brand.rose600,
        fontWeight: FontWeight.w600,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: s.raised,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: s.line),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: s.sunken,
      side: BorderSide.none,
      shape: const StadiumBorder(),
      labelStyle: TextStyle(
        fontFamily: Brand.sans,
        fontWeight: FontWeight.w600,
        color: s.ink,
        fontSize: 12.5,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: s.ink,
      contentTextStyle: TextStyle(fontFamily: Brand.sans, color: s.surface),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: Brand.rose),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: FadeForwardsPageTransitionsBuilder(),
      },
    ),
  );
}
