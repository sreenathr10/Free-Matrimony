'use client';

import { useEffect, useState } from 'react';
import { COUNTRY_OPTIONS, KERALA_DISTRICTS, MARITAL_STATUSES, RELIGIONS, STARS, toOptions } from '@fm/shared';
import { Button, Card, ChipPicker, Field, Input, Textarea } from '@fm/ui';
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

const empty: Prefs = {
  ageMin: 21, ageMax: 40, religions: [], communities: [], stars: [], maritalStatuses: [], nativeDistricts: [], countries: [], requirePorutham: false,
};

export function PreferencesTab({ profileId, canEdit, onChange }: { profileId: string; canEdit: boolean; onChange: () => void }) {
  const [p, setP] = useState<Prefs>(empty);
  const [communities, setCommunities] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<Prefs | Record<string, never>>(`/profiles/${profileId}/preferences`).then((r) => {
      if ('ageMin' in r) {
        setP(r as Prefs);
        setCommunities((r as Prefs).communities.join(', '));
      }
    });
  }, [profileId]);

  const update = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setP((s) => ({ ...s, [k]: v }));
  const num = (v: string) => (v === '' ? null : Number(v));

  async function save() {
    setMsg(null);
    const body = {
      ...p,
      heightMinCm: p.heightMinCm ?? undefined,
      heightMaxCm: p.heightMaxCm ?? undefined,
      educationNotes: p.educationNotes || undefined,
      communities: communities.split(',').map((c) => c.trim()).filter(Boolean),
    };
    try {
      await api(`/profiles/${profileId}/preferences`, { method: 'PUT', body: JSON.stringify(body) });
      setMsg('Preferences saved');
      onChange();
    } catch (e) {
      setMsg(e instanceof ApiError ? (e.body.issues?.[0]?.message ?? e.message) : 'Could not save');
    }
  }

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h2 className="font-semibold">Partner preferences</h2>
        <p className="text-sm text-ink-muted">Used for daily picks and search. Leave a list empty for no preference.</p>
      </div>
      <fieldset disabled={!canEdit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Age from"><Input type="number" value={p.ageMin} onChange={(e) => update('ageMin', Number(e.target.value))} /></Field>
          <Field label="Age to"><Input type="number" value={p.ageMax} onChange={(e) => update('ageMax', Number(e.target.value))} /></Field>
          <Field label="Height from (cm)"><Input type="number" value={p.heightMinCm ?? ''} onChange={(e) => update('heightMinCm', num(e.target.value))} /></Field>
          <Field label="Height to (cm)"><Input type="number" value={p.heightMaxCm ?? ''} onChange={(e) => update('heightMaxCm', num(e.target.value))} /></Field>
        </div>
        <Field label="Religion"><ChipPicker options={toOptions(RELIGIONS)} value={p.religions} onChange={(v) => update('religions', v)} /></Field>
        <Field label="Communities" hint="Separate with commas"><Input value={communities} onChange={(e) => setCommunities(e.target.value)} /></Field>
        <Field label="Marital status"><ChipPicker options={toOptions(MARITAL_STATUSES)} value={p.maritalStatuses} onChange={(v) => update('maritalStatuses', v)} /></Field>
        <Field label="Living in"><ChipPicker options={COUNTRY_OPTIONS} value={p.countries} onChange={(v) => update('countries', v)} /></Field>
        <Field label="Native district"><ChipPicker options={toOptions(KERALA_DISTRICTS)} value={p.nativeDistricts} onChange={(v) => update('nativeDistricts', v)} /></Field>
        <Field label="Stars"><ChipPicker options={toOptions(STARS)} value={p.stars} onChange={(v) => update('stars', v)} /></Field>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={p.requirePorutham} onChange={(e) => update('requirePorutham', e.target.checked)} />
          <span>Horoscope (porutham) match required</span>
        </label>
        <Field label="Education and career notes"><Textarea value={p.educationNotes ?? ''} onChange={(e) => update('educationNotes', e.target.value)} maxLength={300} /></Field>
      </fieldset>
      {canEdit && (
        <div className="flex items-center gap-3">
          <Button onClick={save}>Save preferences</Button>
          {msg && <span className="text-sm text-ink-muted">{msg}</span>}
        </div>
      )}
    </Card>
  );
}
