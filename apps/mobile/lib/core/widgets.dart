import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';

import 'theme.dart';

/// The brand mark: two interlocking rings (rose and gold) with a small diamond, drawn to match
/// packages/ui/assets/mark.svg.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 36, this.mono});

  final double size;

  /// Draw in a single colour, for use on gradient backgrounds.
  final Color? mono;

  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: size,
    child: CustomPaint(painter: _MarkPainter(mono)),
  );
}

class _MarkPainter extends CustomPainter {
  _MarkPainter(this.mono);
  final Color? mono;

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 64;
    canvas.scale(k);
    Paint ring(Gradient g, Rect r) => Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..shader = mono == null ? g.createShader(r) : null
      ..color = mono ?? Colors.black;
    const roseG = LinearGradient(
      colors: [Color(0xFFF0567A), Color(0xFFA81C42)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
    const goldG = LinearGradient(
      colors: [Color(0xFFF8D57A), Color(0xFFCF8E14)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
    final left = Rect.fromCircle(center: const Offset(25, 38), radius: 13);
    final right = Rect.fromCircle(center: const Offset(39, 38), radius: 13);
    final rose = ring(roseG, const Rect.fromLTWH(10, 22, 30, 30));
    final gold = ring(goldG, const Rect.fromLTWH(26, 22, 28, 30));
    canvas.drawOval(left, rose);
    canvas.drawOval(right, gold);
    // Rose passes over gold at the top crossing, so the rings interlock.
    canvas.drawArc(left, -1.396, 0.785, false, rose);
    final diamond = Path()
      ..moveTo(32, 8)
      ..lineTo(36.5, 14)
      ..lineTo(32, 20)
      ..lineTo(27.5, 14)
      ..close();
    canvas.drawPath(
      diamond,
      Paint()
        ..shader = mono == null
            ? goldG.createShader(const Rect.fromLTWH(27, 8, 10, 12))
            : null
        ..color = mono ?? Colors.black,
    );
  }

  @override
  bool shouldRepaint(_MarkPainter old) => old.mono != mono;
}

/// Mark plus the "FreeMatrimony" wordmark.
class Logo extends StatelessWidget {
  const Logo({super.key, this.size = 32, this.onDark = false});
  final double size;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    final style = TextStyle(
      fontFamily: Brand.display,
      fontSize: size * 0.62,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.4,
      color: onDark ? Colors.white : s.ink,
    );
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        LogoMark(size: size, mono: onDark ? Colors.white : null),
        const SizedBox(width: 8),
        Text('Free', style: style),
        onDark
            ? Text('Matrimony', style: style.copyWith(color: Brand.gold300))
            : GradientText('Matrimony', style: style),
      ],
    );
  }
}

class GradientText extends StatelessWidget {
  const GradientText(this.text, {super.key, this.style});
  final String text;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) => ShaderMask(
    blendMode: BlendMode.srcIn,
    shaderCallback: (r) => const LinearGradient(
      colors: [Brand.rose, Brand.rose700, Brand.gold],
      stops: [0.1, 0.55, 1],
    ).createShader(r),
    child: Text(text, style: style),
  );
}

/// Primary call to action: rose gradient pill with a soft glow.
class GradientButton extends StatelessWidget {
  const GradientButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 200),
      opacity: enabled || loading ? 1 : 0.55,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: Brand.gradient,
          borderRadius: BorderRadius.circular(100),
          boxShadow: [
            BoxShadow(
              color: Brand.rose600.withValues(alpha: 0.35),
              blurRadius: 24,
              offset: const Offset(0, 10),
              spreadRadius: -6,
            ),
          ],
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(100),
            onTap: enabled ? onPressed : null,
            child: SizedBox(
              height: 56,
              child: Center(
                child: loading
                    ? const SizedBox.square(
                        dimension: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.4,
                          color: Colors.white,
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            label,
                            style: const TextStyle(
                              fontFamily: Brand.sans,
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (icon != null) ...[
                            const SizedBox(width: 8),
                            Icon(icon, color: Colors.white, size: 20),
                          ],
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Soft rose and gold glows behind a screen, like the website's `bg-mesh`.
class MeshBackground extends StatelessWidget {
  const MeshBackground({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    Widget glow(Alignment a, Color c, double r) => Positioned.fill(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: a,
            radius: r,
            colors: [
              c.withValues(alpha: dark ? 0.16 : 0.2),
              c.withAlpha(0),
            ],
          ),
        ),
      ),
    );
    return Stack(
      children: [
        glow(const Alignment(-1.1, -1.1), Brand.rose, 1.1),
        glow(const Alignment(1.2, -0.8), Brand.gold300, 0.9),
        glow(const Alignment(0, 1.4), Brand.rose600, 0.9),
        child,
      ],
    );
  }
}

/// Initials on a gradient circle, used until photos are visible.
class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar({
    super.key,
    required this.name,
    this.size = 48,
    this.ring = false,
  });
  final String name;
  final double size;
  final bool ring;

  static const _palettes = [
    [Color(0xFFFB6D8B), Color(0xFFC026D3)],
    [Color(0xFFF6CF6B), Color(0xFFEE3F68)],
    [Color(0xFFFB923C), Color(0xFFD2224F)],
    [Color(0xFF34D399), Color(0xFF0E9F6E)],
    [Color(0xFF818CF8), Color(0xFFD2224F)],
  ];

  @override
  Widget build(BuildContext context) {
    final initials = name
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .take(2)
        .map((w) => w[0].toUpperCase())
        .join();
    final colors =
        _palettes[name.codeUnits.fold(0, (a, b) => a + b) % _palettes.length];
    return Container(
      width: size,
      height: size,
      padding: EdgeInsets.all(ring ? 3 : 0),
      decoration: ring
          ? BoxDecoration(
              shape: BoxShape.circle,
              color: Surfaces.of(context).raised,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            )
          : null,
      child: DecoratedBox(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: Text(
            initials,
            style: TextStyle(
              fontFamily: Brand.sans,
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: size * 0.36,
            ),
          ),
        ),
      ),
    );
  }
}

enum PillTone { brand, gold, verified, neutral }

class Pill extends StatelessWidget {
  const Pill(this.label, {super.key, this.tone = PillTone.neutral, this.icon});
  final String label;
  final PillTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final (bg, fg) = switch (tone) {
      PillTone.brand => (
        dark ? Brand.rose950 : Brand.rose50,
        dark ? Brand.rose300 : Brand.rose700,
      ),
      PillTone.gold => (
        dark ? const Color(0xFF3A2A0C) : Brand.gold100,
        dark ? Brand.gold300 : Brand.gold600,
      ),
      PillTone.verified => (
        dark ? const Color(0xFF0B2A20) : Brand.verifiedSoft,
        Brand.verified,
      ),
      PillTone.neutral => (s.sunken, s.muted),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontFamily: Brand.sans,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}

/// Small rounded square holding an icon, tinted with the brand colour.
class IconTile extends StatelessWidget {
  const IconTile(
    this.icon, {
    super.key,
    this.size = 40,
    this.filled = false,
    this.gold = false,
  });
  final IconData icon;
  final double size;
  final bool filled;
  final bool gold;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.32),
        gradient: filled ? (gold ? Brand.goldGradient : Brand.gradient) : null,
        color: filled
            ? null
            : gold
            ? (dark ? const Color(0xFF3A2A0C) : Brand.gold100)
            : (dark ? Brand.rose950 : Brand.rose50),
      ),
      child: Icon(
        icon,
        size: size * 0.5,
        color: filled
            ? Colors.white
            : gold
            ? (dark ? Brand.gold300 : Brand.gold600)
            : (dark ? Brand.rose300 : Brand.rose600),
      ),
    );
  }
}

/// Circular profile-strength meter with a rose-to-gold sweep.
class StrengthRing extends StatelessWidget {
  const StrengthRing({super.key, required this.percent, this.size = 64});
  final int percent;
  final double size;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: percent / 100),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (_, v, _) => SizedBox.square(
        dimension: size,
        child: CustomPaint(
          painter: _RingPainter(v, s.line),
          child: Center(
            child: Text(
              '${(v * 100).round()}%',
              style: TextStyle(
                fontFamily: Brand.sans,
                fontWeight: FontWeight.w800,
                fontSize: size * 0.22,
                color: s.ink,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.value, this.track);
  final double value;
  final Color track;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 6.0;
    final rect = Offset.zero & size;
    final r = rect.deflate(stroke / 2);
    canvas.drawArc(
      r,
      0,
      math.pi * 2,
      false,
      Paint()
        ..color = track
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke,
    );
    canvas.drawArc(
      r,
      -math.pi / 2,
      math.pi * 2 * value,
      false,
      Paint()
        ..shader = const SweepGradient(
          colors: [Brand.rose400, Brand.gold300, Brand.rose400],
          transform: GradientRotation(-math.pi / 2),
        ).createShader(rect)
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = stroke,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.value != value;
}

/// Fades and slides a child in, with an optional delay, for staggered entrances.
class FadeSlideIn extends StatelessWidget {
  const FadeSlideIn({super.key, required this.child, this.delay = 0});
  final Widget child;
  final int delay;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 500 + delay),
      curve: Interval(delay / (500 + delay), 1, curve: Curves.easeOutCubic),
      builder: (_, v, c) => Opacity(
        opacity: v,
        child: Transform.translate(offset: Offset(0, 16 * (1 - v)), child: c),
      ),
      child: child,
    );
  }
}

/// A card section with an icon, title and optional subtitle.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.icon,
    this.trailing,
  });
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? trailing;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  IconTile(icon!, size: 36),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: t.titleMedium),
                      if (subtitle != null) Text(subtitle!, style: t.bodySmall),
                    ],
                  ),
                ),
                ?trailing,
              ],
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

/// Dashed-border placeholder for empty lists.
class EmptyPanel extends StatelessWidget {
  const EmptyPanel({
    super.key,
    required this.icon,
    required this.title,
    this.body,
    this.action,
  });
  final IconData icon;
  final String title;
  final String? body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    final t = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
      decoration: BoxDecoration(
        color: s.sunken.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: s.line, width: 1.4),
      ),
      child: Column(
        children: [
          IconTile(icon, size: 56),
          const SizedBox(height: 14),
          Text(title, style: t.titleMedium, textAlign: TextAlign.center),
          if (body != null) ...[
            const SizedBox(height: 4),
            Text(body!, style: t.bodyMedium, textAlign: TextAlign.center),
          ],
          if (action != null) ...[const SizedBox(height: 18), action!],
        ],
      ),
    );
  }
}
