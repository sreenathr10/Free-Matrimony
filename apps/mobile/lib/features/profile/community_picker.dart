import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/api.dart';
import '../../core/theme.dart';

/// A caste, denomination or sect, with sub-castes and other spellings.
class Community {
  Community.fromJson(Map<String, dynamic> j)
    : name = j['name'] as String,
      subs = (j['subs'] as List?)?.cast<String>() ?? const [],
      aliases = (j['aliases'] as List?)?.cast<String>() ?? const [],
      outsideKerala = j['outsideKerala'] == true;

  final String name;
  final List<String> subs;
  final List<String> aliases;
  final bool outsideKerala;
}

class ReligionCommunities {
  ReligionCommunities.fromJson(Map<String, dynamic> j)
    : label = j['label'] as String,
      subLabel = j['subLabel'] as String,
      communities = (j['communities'] as List)
          .map((e) => Community.fromJson(e as Map<String, dynamic>))
          .toList();

  final String label;
  final String subLabel;
  final List<Community> communities;
}

/// The shared list from the API (same data the website uses), cached for the session.
final communitiesProvider = FutureProvider<Map<String, ReligionCommunities>>((
  ref,
) async {
  final res =
      await ref.watch(apiProvider).request('GET', '/reference/communities')
          as Map<String, dynamic>;
  final religions = res['religions'] as Map<String, dynamic>;
  return religions.map(
    (k, v) =>
        MapEntry(k, ReligionCommunities.fromJson(v as Map<String, dynamic>)),
  );
});

class PickerOption {
  const PickerOption(
    this.value, {
    this.hint,
    this.keywords = const [],
    this.group,
  });
  final String value;
  final String? hint;
  final List<String> keywords;
  final String? group;
}

List<PickerOption> communityOptions(ReligionCommunities r) {
  final sorted = [
    ...r.communities.where((c) => !c.outsideKerala),
    ...r.communities.where((c) => c.outsideKerala),
  ];
  return [
    for (final c in sorted)
      PickerOption(
        c.name,
        hint: c.subs.isNotEmpty
            ? c.subs.take(4).join(', ') +
                  (c.subs.length > 4 ? ' and ${c.subs.length - 4} more' : '')
            : c.aliases.isNotEmpty
            ? 'Also: ${c.aliases.take(3).join(', ')}'
            : null,
        keywords: [...c.aliases, ...c.subs],
        group: c.outsideKerala ? 'Elsewhere in India' : 'Kerala',
      ),
  ];
}

String _norm(String s) => s.toLowerCase().replaceAll(RegExp('[^a-z0-9]'), '');

/// Best matches first: name starts with the query, then any spelling or sub-caste.
List<PickerOption> rankOptions(List<PickerOption> options, String query) {
  final q = _norm(query);
  if (q.isEmpty) return options;
  int score(PickerOption o) {
    if (_norm(o.value).startsWith(q)) return 0;
    final words = [o.value, ...o.keywords].map(_norm);
    if (words.any((w) => w.startsWith(q))) return 1;
    if (words.any((w) => w.contains(q))) return 2;
    return 9;
  }

  final scored =
      [
          for (final (i, o) in options.indexed) (o, score(o), i),
        ].where((e) => e.$2 < 9).toList()
        ..sort((a, b) => a.$2 != b.$2 ? a.$2 - b.$2 : a.$3 - b.$3);
  return [for (final e in scored) e.$1];
}

/// A form field that opens a searchable sheet. The member can also add a value that isn't listed.
class SearchPickerField extends StatelessWidget {
  const SearchPickerField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.enabled = true,
    this.helper,
  });

  final String label;
  final String? value;
  final List<PickerOption> options;
  final ValueChanged<String?> onChanged;
  final bool enabled;
  final String? helper;

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null && value!.isNotEmpty;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: enabled
          ? () async {
              final picked = await showModalBottomSheet<String>(
                context: context,
                isScrollControlled: true,
                useSafeArea: true,
                showDragHandle: true,
                builder: (_) => _PickerSheet(
                  title: label,
                  options: options,
                  selected: value,
                ),
              );
              if (picked != null) onChanged(picked);
            }
          : null,
      child: InputDecorator(
        isEmpty: !hasValue,
        decoration: InputDecoration(
          labelText: label,
          helperText: helper,
          enabled: enabled,
          suffixIcon: hasValue && enabled
              ? IconButton(
                  tooltip: 'Clear',
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => onChanged(null),
                )
              : const Icon(Icons.search_rounded),
        ),
        child: Text(
          hasValue ? value! : '',
          style: const TextStyle(fontSize: 16),
        ),
      ),
    );
  }
}

class _PickerSheet extends StatefulWidget {
  const _PickerSheet({
    required this.title,
    required this.options,
    required this.selected,
  });
  final String title;
  final List<PickerOption> options;
  final String? selected;

  @override
  State<_PickerSheet> createState() => _PickerSheetState();
}

class _PickerSheetState extends State<_PickerSheet> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final s = Surfaces.of(context);
    final t = Theme.of(context).textTheme;
    final results = rankOptions(widget.options, _query);
    final typed = _query.trim();
    final exact = results.any(
      (o) =>
          _norm(o.value) == _norm(typed) ||
          o.keywords.any((k) => _norm(k) == _norm(typed)),
    );
    final showAdd = typed.length > 1 && !exact;
    final rows = <Widget>[];
    String? lastGroup;
    for (final o in results) {
      if (_query.isEmpty && o.group != null && o.group != lastGroup) {
        rows.add(
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
            child: Text(
              o.group!.toUpperCase(),
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
                color: s.faint,
              ),
            ),
          ),
        );
      }
      lastGroup = o.group;
      final on = o.value == widget.selected;
      rows.add(
        ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          title: Text(
            o.value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          subtitle: o.hint == null
              ? null
              : Text(o.hint!, maxLines: 1, overflow: TextOverflow.ellipsis),
          trailing: on
              ? const Icon(Icons.check_circle_rounded, color: Brand.rose600)
              : null,
          onTap: () => Navigator.pop(context, o.value),
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.85,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: Text(widget.title, style: t.titleLarge),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  hintText: 'Search or type your own',
                  prefixIcon: Icon(Icons.search_rounded),
                ),
                onChanged: (v) => setState(() => _query = v),
                onSubmitted: (_) {
                  if (results.isNotEmpty) {
                    Navigator.pop(context, results.first.value);
                  } else if (showAdd) {
                    Navigator.pop(context, typed);
                  }
                },
              ),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: ListView(
                children: [
                  ...rows,
                  if (showAdd)
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                      ),
                      leading: const Icon(
                        Icons.add_circle_outline_rounded,
                        color: Brand.rose600,
                      ),
                      title: Text(
                        'Add “$typed”',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: Brand.rose600,
                        ),
                      ),
                      onTap: () => Navigator.pop(context, typed),
                    ),
                  if (results.isEmpty && !showAdd)
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text('Type to add it', style: t.bodyMedium),
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Caste (or denomination, or sect), sub-caste and "caste no bar", worded for the religion.
class CommunityFields extends ConsumerWidget {
  const CommunityFields({
    super.key,
    required this.religion,
    required this.community,
    required this.subCaste,
    required this.casteNoBar,
    required this.onChanged,
  });

  final String? religion;
  final String? community;
  final String? subCaste;
  final bool casteNoBar;
  final void Function({String? community, String? subCaste, bool? casteNoBar})
  onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(communitiesProvider);
    final r = data.value?[religion ?? 'OTHER'];
    final label = r?.label ?? 'Community';
    final subLabel = r?.subLabel ?? 'Sub-caste';
    final options = r == null ? <PickerOption>[] : communityOptions(r);
    final subs = r == null
        ? const <String>[]
        : r.communities.where((c) => c.name == community).firstOrNull?.subs ??
              const <String>[];
    final christian = religion == 'CHRISTIAN';

    return Column(
      children: [
        SearchPickerField(
          label: label,
          value: community,
          options: options,
          enabled: religion != null,
          helper: religion == null
              ? 'Choose a religion first'
              : data.isLoading
              ? 'Loading the list…'
              : 'Search, or add your own if it isn’t listed',
          onChanged: (v) => onChanged(community: v ?? '', subCaste: ''),
        ),
        if (community != null && community!.isNotEmpty) ...[
          const SizedBox(height: 12),
          SearchPickerField(
            label: '$subLabel (optional)',
            value: subCaste,
            options: [for (final s in subs) PickerOption(s)],
            onChanged: (v) => onChanged(subCaste: v ?? ''),
          ),
        ],
        const SizedBox(height: 4),
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          value: casteNoBar,
          onChanged: (v) => onChanged(casteNoBar: v),
          title: Text(
            christian ? 'Denomination no bar' : 'Caste no bar',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          subtitle: Text(
            christian
                ? 'Open to proposals from any denomination'
                : 'Open to proposals from any caste',
          ),
        ),
      ],
    );
  }
}
