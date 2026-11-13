'use client';

import {
  CalendarRange,
  Check,
  Globe2,
  Heart,
  Lock,
  Ruler,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  COUNTRY_OPTIONS,
  KERALA_DISTRICTS,
  MARITAL_STATUSES,
  RELIGIONS,
  STARS,
  toOptions,
} from '@fm/shared';
import { Button, Card, ChipPicker, Combobox, Field, Input, Textarea, Toggle } from '@fm/ui';
import { communityOptions } from './CommunityFields';
import { api, ApiError } from '@/lib/api';

interface Prefs {
  ageMin: number;
  ageMax: number;
  heightMinCm?: number | null;
  heightMaxCm?: number | null;
  religions: string[];
  communities: string[];
  stars: string[];
  maritalStatuses: string[];
  nativeDistricts: string[];
  countries: string[];
  educationNotes?: string | null;
  requirePorutham: boolean;
}

/** Options for the chosen religions (all religions when none is chosen), grouped by religion when there are several. */
function communityOptionsFor(religions: string[]) {
  if (religions.length === 1) return communityOptions(religions[0]);
  if (religions.length === 0) return communityOptions(null, true);
  return religions.flatMap((r) =>
    communityOptions(r).map((o) => ({
      ...o,
      group: `${r.charAt(0)}${r.slice(1).toLowerCase()}${o.group === 'Kerala' ? '' : ' · elsewhere in India'}`,
    })),
  );
}

const empty: Prefs = {
  ageMin: 21,
  ageMax: 40,
  religions: [],
  communities: [],
  stars: [],
  maritalStatuses: [],
  nativeDistricts: [],
  countries: [],
  requirePorutham: false,
};

export function PreferencesTab({
  profileId,
  canEdit,
  onChange,
}: {
  profileId: string;
  canEdit: boolean;
  onChange: () => void;
}) {
  const [p, setP] = useState<Prefs>(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Prefs | Record<string, never>>(`/profiles/${profileId}/preferences`).then((r) => {
      if ('ageMin' in r) {
        setP(r as Prefs);
      }
    });
  }, [profileId]);

  const update = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setP((s) => ({ ...s, [k]: v }));
  const num = (v: string) => (v === '' ? null : Number(v));

  async function save() {
    setMsg(null);
    setSaving(true);
    const body = {
      ...p,
      heightMinCm: p.heightMinCm ?? undefined,
      heightMaxCm: p.heightMaxCm ?? undefined,
      educationNotes: p.educationNotes || undefined,
    };
    try {
      await api(`/profiles/${profileId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setMsg('Preferences saved');
      onChange();
    } catch (e) {
      setMsg(e instanceof ApiError ? (e.body.issues?.[0]?.message ?? e.message) : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-2xl bg-surface-sunken px-4 py-3 text-sm text-ink-muted">
          <Lock className="h-4 w-4" /> You can view these preferences. Only family members with edit
          access can change them.
        </div>
      )}
      <fieldset disabled={!canEdit} className="flex flex-col gap-4">
        <Section
          icon={<CalendarRange className="h-4 w-4" />}
          title="Age and height"
          description="The range you would like daily picks to come from."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Age from">
              <Input
                type="number"
                value={p.ageMin}
                onChange={(e) => update('ageMin', Number(e.target.value))}
              />
            </Field>
            <Field label="Age to">
              <Input
                type="number"
                value={p.ageMax}
                onChange={(e) => update('ageMax', Number(e.target.value))}
              />
            </Field>
            <Field label="Height from (cm)">
              <Input
                type="number"
                icon={<Ruler className="h-4 w-4" />}
                value={p.heightMinCm ?? ''}
                onChange={(e) => update('heightMinCm', num(e.target.value))}
              />
            </Field>
            <Field label="Height to (cm)">
              <Input
                type="number"
                icon={<Ruler className="h-4 w-4" />}
                value={p.heightMaxCm ?? ''}
                onChange={(e) => update('heightMaxCm', num(e.target.value))}
              />
            </Field>
          </div>
        </Section>
        <Section
          icon={<Users className="h-4 w-4" />}
          title="Religion and community"
          description="Leave a list empty for no preference."
        >
          <Field label="Religion">
            <ChipPicker
              options={toOptions(RELIGIONS)}
              value={p.religions}
              onChange={(v) => update('religions', v)}
            />
          </Field>
          <Field
            label="Castes or denominations"
            hint={
              p.communities.length
                ? 'Only these will be suggested'
                : 'Empty means caste no bar. Search by name, sub-caste or spelling.'
            }
          >
            <Combobox
              multiple
              aria-label="Castes or denominations"
              options={communityOptionsFor(p.religions)}
              value={p.communities}
              onChange={(v) => update('communities', v)}
              placeholder="Any caste"
              allowCustom
              customLabel={(t) => `Add “${t}”`}
            />
          </Field>
          <Field label="Marital status">
            <ChipPicker
              options={toOptions(MARITAL_STATUSES)}
              value={p.maritalStatuses}
              onChange={(v) => update('maritalStatuses', v)}
            />
          </Field>
        </Section>
        <Section
          icon={<Globe2 className="h-4 w-4" />}
          title="Where they are"
          description="Their current country and their roots in Kerala."
        >
          <Field label="Living in">
            <ChipPicker
              options={COUNTRY_OPTIONS}
              value={p.countries}
              onChange={(v) => update('countries', v)}
            />
          </Field>
          <Field label="Native district">
            <ChipPicker
              options={toOptions(KERALA_DISTRICTS)}
              value={p.nativeDistricts}
              onChange={(v) => update('nativeDistricts', v)}
            />
          </Field>
        </Section>
        <Section
          icon={<Star className="h-4 w-4" />}
          title="Horoscope"
          description="Only used if your family follows it."
        >
          <Field label="Stars">
            <ChipPicker
              options={toOptions(STARS)}
              value={p.stars}
              onChange={(v) => update('stars', v)}
            />
          </Field>
          <div className="rounded-2xl bg-surface-sunken px-4 py-3">
            <Toggle
              label="Horoscope (porutham) match required"
              checked={p.requirePorutham}
              onChange={(v) => update('requirePorutham', v)}
            />
          </div>
        </Section>
        <Section
          icon={<Sparkles className="h-4 w-4" />}
          title="Anything else"
          description="Education, career or anything that matters to you."
        >
          <Field label="Education and career notes">
            <Textarea
              value={p.educationNotes ?? ''}
              onChange={(e) => update('educationNotes', e.target.value)}
              maxLength={300}
            />
          </Field>
        </Section>
      </fieldset>
      {canEdit && (
        <div className="sticky bottom-4 z-10 bg-surface-raised/95 backdrop-blur-xl flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 shadow-lift">
          <span className="flex items-center gap-2 text-sm text-ink-muted">
            {msg ? (
              <>
                <Check className="h-4 w-4 text-verified" /> {msg}
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 text-brand-500" /> Used for daily picks and search
              </>
            )}
          </span>
          <Button onClick={save} loading={saving}>
            Save preferences
          </Button>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}
