import 'package:flutter_test/flutter_test.dart';
import 'package:free_matrimony/features/profile/community_picker.dart';

void main() {
  test('community search matches names, spellings and sub-castes', () {
    final r = ReligionCommunities.fromJson({
      'label': 'Caste',
      'subLabel': 'Sub-caste',
      'communities': [
        {
          'name': 'Nair',
          'aliases': ['Nayar'],
          'subs': ['Menon', 'Pillai'],
        },
        {
          'name': 'Ezhava',
          'aliases': ['Izhava'],
        },
        {'name': 'Bunt', 'outsideKerala': true},
      ],
    });
    final options = communityOptions(r);
    expect(options.last.group, 'Elsewhere in India');
    expect(rankOptions(options, 'ezh').first.value, 'Ezhava');
    expect(rankOptions(options, 'menon').first.value, 'Nair');
    expect(rankOptions(options, 'nay').first.value, 'Nair');
    expect(rankOptions(options, 'zzz'), isEmpty);
  });
}
