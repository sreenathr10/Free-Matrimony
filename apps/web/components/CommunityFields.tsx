'use client';

import { useMemo } from 'react';
import {
  COMMUNITY_LABEL,
  SUB_COMMUNITY_LABEL,
  communitiesFor,
  subCommunitiesFor,
  type Community,
} from '@fm/shared';
import { Combobox, Field, Toggle, type ComboOption } from '@fm/ui';

type Religion = keyof typeof COMMUNITY_LABEL;

/** Turns the shared community list into picker options, Kerala first. */
export function communityOptions(religion?: string | null, groupByReligion = false): ComboOption[] {
  const religions = religion ? [religion] : (Object.keys(COMMUNITY_LABEL) as Religion[]);
  const seen = new Set<string>();
  const out: ComboOption[] = [];
  for (const r of religions) {
    const list: readonly Community[] = communitiesFor(r);
    const sorted = [
      ...list.filter((c) => !c.outsideKerala),
      ...list.filter((c) => c.outsideKerala),
    ];
    for (const c of sorted) {
      if (seen.has(c.name)) continue;
      seen.add(c.name);
      const where = c.outsideKerala ? 'Elsewhere in India' : 'Kerala';
      out.push({
        value: c.name,
        label: c.name,
        hint: c.subs?.length
          ? `${c.subs.slice(0, 4).join(', ')}${c.subs.length > 4 ? ` and ${c.subs.length - 4} more` : ''}`
          : c.aliases?.length
            ? `Also: ${c.aliases.slice(0, 3).join(', ')}`
            : undefined,
        keywords: [...(c.aliases ?? []), ...(c.subs ?? [])],
        group: groupByReligion
          ? `${titleCase(r)}${c.outsideKerala ? ' · elsewhere in India' : ''}`
          : where,
      });
    }
  }
  return out;
}

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export interface CommunityValue {
  community: string;
  subCaste: string;
  casteNoBar: boolean;
}

/** Caste (or denomination, or sect) then sub-caste, worded for the chosen religion. */
export function CommunityFields({
  religion,
  value,
  onChange,
  errors,
  showNoBar = true,
}: {
  religion?: string | null;
  value: CommunityValue;
  onChange: (v: CommunityValue) => void;
  errors?: { community?: string; subCaste?: string };
  showNoBar?: boolean;
}) {
  const r = (religion && religion in COMMUNITY_LABEL ? religion : 'OTHER') as Religion;
  const options = useMemo(() => communityOptions(religion), [religion]);
  const subs = useMemo(
    () => subCommunitiesFor(religion, value.community).map((s) => ({ value: s, label: s })),
    [religion, value.community],
  );
  const label = COMMUNITY_LABEL[r];
  const subLabel = SUB_COMMUNITY_LABEL[r];
  const noList = religion === 'NONE';

  return (
    <>
      <Field
        label={label}
        error={errors?.community}
        hint={noList ? 'Optional' : 'Search, or type your own if it isn’t listed'}
      >
        <Combobox
          aria-label={label}
          options={options}
          value={value.community}
          onChange={(community) => onChange({ ...value, community, subCaste: '' })}
          placeholder={religion ? `Search ${label.toLowerCase()}` : 'Choose a religion first'}
          disabled={!religion}
          allowCustom
          customLabel={(t) => `Add “${t}”`}
          emptyText="Not in the list yet. Keep typing to add it."
        />
      </Field>
      {value.community && (
        <Field label={subLabel} error={errors?.subCaste} hint="Optional">
          <Combobox
            aria-label={subLabel}
            options={subs}
            value={value.subCaste}
            onChange={(subCaste) => onChange({ ...value, subCaste })}
            placeholder={
              subs.length ? `Search ${subLabel.toLowerCase()}` : `Type ${subLabel.toLowerCase()}`
            }
            allowCustom
            customLabel={(t) => `Add “${t}”`}
            emptyText="Type to add it"
          />
        </Field>
      )}
      {showNoBar && (
        <div className="sm:col-span-2">
          <Toggle
            checked={value.casteNoBar}
            onChange={(casteNoBar) => onChange({ ...value, casteNoBar })}
            label={`${r === 'CHRISTIAN' ? 'Denomination' : 'Caste'} no bar: open to proposals from any ${r === 'CHRISTIAN' ? 'denomination' : 'caste'}`}
          />
        </div>
      )}
    </>
  );
}
