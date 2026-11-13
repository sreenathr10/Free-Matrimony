import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/enums.dart';

class CreateProfileScreen extends ConsumerStatefulWidget {
  const CreateProfileScreen({super.key});

  @override
  ConsumerState<CreateProfileScreen> createState() =>
      _CreateProfileScreenState();
}

class _CreateProfileScreenState extends ConsumerState<CreateProfileScreen> {
  int _step = 0;
  final _form = <String, String>{
    'maritalStatus': 'NEVER_MARRIED',
    'currentCountry': 'IN',
  };
  final _keys = List.generate(4, (_) => GlobalKey<FormState>());
  bool _busy = false;
  String? _error;

  static const _titles = [
    'Who is this profile for?',
    'The basics',
    'Background',
    'Life today',
  ];

  void _set(String k, String? v) =>
      setState(() => v == null || v.isEmpty ? _form.remove(k) : _form[k] = v);
  String? _required(String? v) =>
      (v == null || v.trim().isEmpty) ? 'Required' : null;

  Future<void> _next() async {
    if (_step == 0 && _form['createdAs'] == null) {
      setState(() => _error = 'Choose one to continue');
      return;
    }
    if (!(_keys[_step].currentState?.validate() ?? true)) return;
    setState(() => _error = null);
    if (_step < 3) {
      setState(() => _step++);
      return;
    }
    setState(() => _busy = true);
    try {
      final body = <String, dynamic>{..._form};
      if (body['heightCm'] != null) {
        body['heightCm'] = int.tryParse(body['heightCm']);
      }
      final res = await ref
          .read(apiProvider)
          .request('POST', '/profiles', body);
      if (mounted) context.go('/profiles/${res['id']}');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _dropdown(
    String key,
    String label,
    Iterable<MapEntry<String, String>> options, {
    bool required = false,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: _form[key],
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: [
        if (!required)
          const DropdownMenuItem(value: '', child: Text('Not specified')),
        for (final o in options)
          DropdownMenuItem(
            value: o.key,
            child: Text(o.value, overflow: TextOverflow.ellipsis),
          ),
      ],
      validator: required ? _required : null,
      onChanged: (v) => _set(key, v),
    );
  }

  Widget _text(
    String key,
    String label, {
    bool required = false,
    TextInputType? keyboard,
    int maxLines = 1,
  }) {
    return TextFormField(
      initialValue: _form[key],
      keyboardType: keyboard,
      maxLines: maxLines,
      decoration: InputDecoration(labelText: label),
      validator: required ? _required : null,
      onChanged: (v) => _set(key, v),
    );
  }

  Iterable<MapEntry<String, String>> _opts(List<String> values) =>
      values.map((v) => MapEntry(v, humanize(v)));

  List<Widget> _fields() {
    switch (_step) {
      case 0:
        return [
          RadioGroup<String>(
            groupValue: _form['createdAs'],
            onChanged: (v) => _set('createdAs', v),
            child: Column(
              children: [
                for (final e in createdAsOptions.entries)
                  RadioListTile<String>(value: e.key, title: Text(e.value)),
              ],
            ),
          ),
          if (_form['createdAs'] != null && _form['createdAs'] != 'SELF')
            const Text(
              'You can invite them afterwards. Their profile only goes live once they consent themselves.',
            ),
        ];
      case 1:
        return [
          _text('fullName', 'Full name', required: true),
          _dropdown(
            'gender',
            'Gender',
            const {'FEMALE': 'Female', 'MALE': 'Male'}.entries,
            required: true,
          ),
          TextFormField(
            readOnly: true,
            controller: TextEditingController(text: _form['dateOfBirth'] ?? ''),
            decoration: const InputDecoration(
              labelText: 'Date of birth',
              suffixIcon: Icon(Icons.calendar_today_rounded),
            ),
            validator: _required,
            onTap: () async {
              final now = DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime(now.year - 25),
                firstDate: DateTime(now.year - 80),
                lastDate: DateTime(now.year - 18, now.month, now.day),
              );
              if (picked != null) {
                _set('dateOfBirth', picked.toIso8601String().substring(0, 10));
              }
            },
          ),
          _dropdown(
            'maritalStatus',
            'Marital status',
            _opts(maritalStatuses),
            required: true,
          ),
        ];
      case 2:
        return [
          _dropdown('religion', 'Religion', _opts(religions), required: true),
          _text('community', 'Community'),
          _dropdown('star', 'Star (nakshatra)', _opts(stars)),
          _dropdown(
            'nativeDistrict',
            'Native district',
            _opts(keralaDistricts),
          ),
        ];
      default:
        return [
          _dropdown(
            'currentCountry',
            'Country you live in',
            countries.entries,
            required: true,
          ),
          _text('currentCity', 'City'),
          _text('heightCm', 'Height (cm)', keyboard: TextInputType.number),
          _text('education', 'Education'),
          _text('occupation', 'Occupation'),
          _text('about', 'About', maxLines: 4),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        title: Text('Step ${_step + 1} of 4'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () =>
              _step == 0 ? context.go('/family') : setState(() => _step--),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _keys[_step],
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              LinearProgressIndicator(
                value: (_step + 1) / 4,
                borderRadius: BorderRadius.circular(8),
              ),
              const SizedBox(height: 24),
              Text(
                _titles[_step],
                style: t.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 20),
              for (final f in _fields())
                Padding(padding: const EdgeInsets.only(bottom: 16), child: f),
              if (_error != null)
                Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: _busy ? null : _next,
                child: Text(_step == 3 ? 'Create profile' : 'Continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
