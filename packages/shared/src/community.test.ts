import { describe, expect, it } from 'vitest';
import { COMMUNITIES, normalizeCommunity, normalizeSubCommunity, searchCommunities, subCommunitiesFor } from './community';

describe('communities', () => {
  it('has no duplicate names or aliases within a religion', () => {
    for (const [religion, list] of Object.entries(COMMUNITIES)) {
      const seen = new Map<string, string>();
      for (const c of list)
        for (const n of [c.name, ...(c.aliases ?? [])]) {
          const k = n.toLowerCase().replace(/[^a-z0-9]+/g, '');
          const owner = seen.get(k);
          if (owner && owner !== c.name) throw new Error(`${religion}: "${n}" is used by ${owner} and ${c.name}`);
          seen.set(k, c.name);
        }
    }
  });

  it('normalises spellings within the religion', () => {
    expect(normalizeCommunity(' nayar ', 'HINDU')).toBe('Nair');
    expect(normalizeCommunity('Tiyya', 'HINDU')).toBe('Thiyya');
    expect(normalizeCommunity('orthodox', 'CHRISTIAN')).toBe('Malankara Orthodox Syrian');
    expect(normalizeCommunity('ossan', 'MUSLIM')).toBe('Ossan');
    expect(normalizeCommunity('Nair', 'CHRISTIAN')).toBe('Nair');
    expect(normalizeCommunity('Something new', 'HINDU')).toBe('Something new');
    expect(normalizeSubCommunity('menon', 'HINDU')).toBe('Menon');
  });

  it('lists sub-castes and searches by alias or sub-caste', () => {
    expect(subCommunitiesFor('HINDU', 'nair')).toContain('Kiriyathil Nair');
    expect(searchCommunities('ezh', 'HINDU')[0].name).toBe('Ezhava');
    expect(searchCommunities('warrier', 'HINDU')[0].name).toBe('Ambalavasi');
    expect(searchCommunities('ipc', 'CHRISTIAN')[0].name).toBe('Pentecostal');
  });
});
