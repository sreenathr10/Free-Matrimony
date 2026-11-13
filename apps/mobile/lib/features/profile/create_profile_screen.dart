import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/enums.dart';
import '../../core/theme.dart';
import '../../core/widgets.dart';

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
  static const _subtitles = [
    'Families can create a profile together. The candidate always has the final say.',
    'Their name stays private until an interest is accepted.',
    'Helps matches from the right community and region find them.',
    'Where they live, what they do, and a few words in their own voice.',
  ];
  static const _stepLabels = ['For', 'Basics', 'Background', 'Today'];
  static const _who = [
    ('SELF', 'Myself', 'I’m looking for a partner', Icons.person_rounded),
    (
      'MOTHER',
      'My son or daughter',
      'I’m their mother',
      Icons.favorite_rounded,
    ),
    (
      'FATHER',
      'My son or daughter',
      'I’m their father',
      Icons.volunteer_activism_rounded,
    ),
    ('BROTHER', 'My sibling', 'I’m their brother', Icons.people_alt_rounded),
    ('SISTER', 'My sibling', 'I’m their sister', Icons.people_alt_rounded),
    (
      'GUARDIAN',
      'Someone in my care',
      'I’m their guardian',
      Icons.shield_rounded,
    ),
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
          for (final (value, title, sub, icon) in _who)
            _ChoiceTile(
              selected: _form['createdAs'] == value,
              title: title,
              subtitle: sub,
              icon: icon,
              onTap: () => _set('createdAs', value),
            ),
          if (_form['createdAs'] != null && _form['createdAs'] != 'SELF')
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Surfaces.of(context).sunken,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'You can invite them afterwards. Their profile only goes live once they consent themselves.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
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
        top: false,
        child: Form(
          key: _keys[_step],
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
            children: [
              _StepBar(step: _step, labels: _stepLabels),
              const SizedBox(height: 26),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                transitionBuilder: (c, a) => FadeTransition(
                  opacity: a,
                  child: SlideTransition(
                    position: Tween(
                      begin: const Offset(0.06, 0),
                      end: Offset.zero,
                    ).animate(a),
                    child: c,
                  ),
                ),
                child: Column(
                  key: ValueKey(_step),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_titles[_step], style: t.headlineMedium),
                    const SizedBox(height: 6),
                    Text(_subtitles[_step], style: t.bodyMedium),
                    const SizedBox(height: 22),
                    for (final f in _fields())
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: f,
                      ),
                  ],
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              GradientButton(
                label: _step == 3 ? 'Create profile' : 'Continue',
                icon: _step == 3
                    ? Icons.check_rounded
                    : Icons.arrow_forward_rounded,
                loading: _busy,
                onPressed: _next,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StepBar extends StatelessWidget {
  const _StepBar({required this.step, required this.labels});
  final int step;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    return Row(
      children: [
        for (var i = 0; i < labels.length; i++)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 350),
                  curve: Curves.easeOutCubic,
                  height: 6,
                  margin: const EdgeInsets.only(right: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    gradient: i <= step ? Brand.gradient : null,
                    color: i <= step ? null : s.line,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  labels[i],
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: i == step ? s.ink : s.faint,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });
  final bool selected;
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    final t = Theme.of(context).textTheme;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      selected: selected,
      button: true,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        decoration: BoxDecoration(
          color: selected
              ? (dark ? Brand.rose950.withValues(alpha: 0.6) : Brand.rose50)
              : s.raised,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? Brand.rose400 : s.line,
            width: selected ? 1.8 : 1.2,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Brand.rose.withValues(alpha: 0.18),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  IconTile(icon, size: 42, filled: selected),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: t.titleSmall),
                        Text(subtitle, style: t.bodySmall),
                      ],
                    ),
                  ),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      selected
                          ? Icons.check_circle_rounded
                          : Icons.radio_button_unchecked_rounded,
                      key: ValueKey(selected),
                      color: selected ? Brand.rose600 : s.faint,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
