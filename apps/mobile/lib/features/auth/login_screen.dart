import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api.dart';

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
  String? _devHint;

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
          _devHint = res['devCode'] == null
              ? null
              : 'Development code: ${res['devCode']}';
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
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              _codeSent ? 'Enter your code' : 'Log in or sign up',
              style: t.headlineMedium,
            ),
            const SizedBox(height: 6),
            Text(
              _codeSent
                  ? 'Sent to ${_phone.text}'
                  : 'We’ll send a 6-digit code to your phone.',
            ),
            const SizedBox(height: 24),
            if (!_codeSent)
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                autofillHints: const [AutofillHints.telephoneNumber],
                decoration: const InputDecoration(labelText: 'Phone number'),
              )
            else ...[
              TextField(
                controller: _code,
                keyboardType: TextInputType.number,
                maxLength: 6,
                autofillHints: const [AutofillHints.oneTimeCode],
                decoration: const InputDecoration(
                  labelText: '6-digit code',
                  counterText: '',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _name,
                decoration: const InputDecoration(
                  labelText: 'Your name (new accounts)',
                ),
              ),
            ],
            if (_devHint != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(_devHint!),
              ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: Text(_codeSent ? 'Continue' : 'Send code'),
            ),
          ],
        ),
      ),
    );
  }
}
