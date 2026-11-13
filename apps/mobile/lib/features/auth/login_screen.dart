import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phone = TextEditingController(text: '+91');
  final _code = TextEditingController();
  final _name = TextEditingController();
  bool _codeSent = false;
  bool _busy = false;
  String? _error;
  String? _devCode;

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final api = ref.read(apiProvider);
    try {
      if (!_codeSent) {
        final res = await api.request('POST', '/auth/otp/request', {
          'phone': _phone.text.trim(),
        });
        setState(() {
          _codeSent = true;
          _devCode = res['devCode'] as String?;
        });
      } else {
        final res = await api.request('POST', '/auth/otp/verify', {
          'phone': _phone.text.trim(),
          'code': _code.text.trim(),
          if (_name.text.trim().isNotEmpty) 'name': _name.text.trim(),
        });
        await ref.read(tokenStoreProvider).write(res['accessToken'] as String);
        if (mounted) context.go('/family');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not reach the server');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final s = Surfaces.of(context);
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => _codeSent
              ? setState(() {
                  _codeSent = false;
                  _code.clear();
                })
              : context.go('/'),
        ),
      ),
      body: MeshBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: IconTile(
                  _codeSent ? Icons.sms_rounded : Icons.phone_iphone_rounded,
                  size: 52,
                  filled: true,
                ),
              ),
              const SizedBox(height: 20),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: Column(
                  key: ValueKey(_codeSent),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _codeSent ? 'Enter your code' : 'Log in or sign up',
                      style: t.headlineMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _codeSent
                          ? 'We sent a 6-digit code to ${_phone.text}.'
                          : 'We’ll send a 6-digit code to your phone. Include your country code.',
                      style: t.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              if (!_codeSent)
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'Phone number',
                    prefixIcon: Icon(Icons.call_rounded),
                  ),
                )
              else ...[
                TextField(
                  controller: _code,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  autofocus: true,
                  textAlign: TextAlign.center,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 14,
                  ),
                  decoration: InputDecoration(
                    hintText: '••••••',
                    hintStyle: TextStyle(color: s.faint, letterSpacing: 14),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _name,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Your name (new accounts)',
                    prefixIcon: Icon(Icons.person_rounded),
                  ),
                ),
              ],
              if (_devCode != null && _codeSent)
                Container(
                  margin: const EdgeInsets.only(top: 14),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF3A2A0C)
                        : Brand.gold100,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    'Development code: $_devCode',
                    style: const TextStyle(
                      color: Brand.gold600,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              if (_error != null)
                Container(
                  margin: const EdgeInsets.only(top: 14),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(
                      context,
                    ).colorScheme.errorContainer.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onErrorContainer,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              const SizedBox(height: 28),
              GradientButton(
                label: _codeSent ? 'Verify and continue' : 'Send code',
                icon: Icons.arrow_forward_rounded,
                loading: _busy,
                onPressed: _submit,
              ),
              const SizedBox(height: 18),
              Center(
                child: Text(
                  'By continuing you agree to our terms and privacy policy.',
                  style: t.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
