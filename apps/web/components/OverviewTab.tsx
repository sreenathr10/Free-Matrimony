'use client';

import { useState } from 'react';
import { COUNTRY_OPTIONS, KERALA_DISTRICTS, MARITAL_STATUSES, STARS, countryName, humanize, toOptions } from '@fm/shared';
import { Badge, Button, Card, Field, Input, ProgressBar, Select, Textarea } from '@fm/ui';
import { api, ApiError } from '@/lib/api';
import type { ProfileResponse } from '@/lib/types';

const EDITABLE = ['fullName', 'maritalStatus', 'community', 'star', 'nativeDistrict', 'currentCountry', 'currentCity', 'heightCm', 'education', 'occupation', 'about'] as const;

function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

export function OverviewTab({ data, reload }: { data: ProfileResponse; reload: () => void }) {
  const { profile, access, completeness } = data;
  const canEdit = access.permissions.EDIT_PROFILE === 'ALLOW';
  const canSuggest = access.permissions.EDIT_PROFILE === 'SUGGEST';
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const startEdit = () => {
    setForm(Object.fromEntries(EDITABLE.map((k) => [k, profile[k] == null ? '' : String(profile[k])])));
    setEditing(true);
    setMsg(null);
  };
  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const changes: Record<string, unknown> = {};
    for (const k of EDITABLE) {
      const before = profile[k] == null ? '' : String(profile[k]);
      if (form[k] !== before && form[k] !== '') changes[k] = k === 'heightCm' ? Number(form[k]) : form[k];
    }
    if (Object.keys(changes).length === 0) return setEditing(false);
    try {
      await api(`/profiles/${profile.id}${canEdit ? '' : '/suggestions'}`, {
        method: canEdit ? 'PATCH' : 'POST',
        body: JSON.stringify(changes),
      });
      setEditing(false);
      setMsg(canEdit ? 'Saved' : 'Suggestion sent. Someone with edit access will review it.');
      reload();
    } catch (e) {
      setMsg(e instanceof ApiError ? (e.body.issues?.[0]?.message ?? e.message) : 'Could not save');
    }
  }

  async function action(path: string) {
    setMsg(null);
    try {
      await api(`/profiles/${profile.id}/${path}`, { method: 'POST' });
      reload();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }

  const rows: [string, string | null][] = [
    ['Age', `${age(profile.dateOfBirth)} years`],
    ['Marital status', humanize(profile.maritalStatus)],
    ['Religion', humanize(profile.religion)],
    ['Community', profile.community],
    ['Star', profile.star && humanize(profile.star)],
    ['Native district', profile.nativeDistrict && humanize(profile.nativeDistrict)],
    ['Lives in', [profile.currentCity, countryName(profile.currentCountry)].filter(Boolean).join(', ')],
    ['Height', profile.heightCm ? `${profile.heightCm} cm` : null],
    ['Education', profile.education],
    ['Occupation', profile.occupation],
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Profile strength</h2>
          <span className="text-sm font-medium tabular-nums">{completeness.percent}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar percent={completeness.percent} />
        </div>
        {completeness.nextSteps.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1 text-sm text-ink-muted">
            {completeness.nextSteps.map((s) => (
              <li key={s.key}>• {s.hint}</li>
            ))}
          </ul>
        )}
      </Card>

      {profile.status === 'DRAFT' && (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">{profile.candidateConsentAt ? 'Ready for verification' : 'Waiting for consent'}</h2>
            <p className="text-sm text-ink-muted">
              {profile.candidateConsentAt
                ? 'Submit the profile to our verification team. It goes live once ID and selfie checks pass.'
                : access.role === 'CANDIDATE'
                  ? 'Confirm that you agree to this profile being shown to matches.'
                  : 'The candidate must join and give consent before the profile can go live. Invite them from the Family tab.'}
            </p>
          </div>
          {access.role === 'CANDIDATE' && !profile.candidateConsentAt && <Button onClick={() => action('consent')}>I consent</Button>}
          {profile.candidateConsentAt && canEdit && <Button onClick={() => action('submit')}>Submit for verification</Button>}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Details</h2>
          {!editing && (canEdit || canSuggest) && (
            <Button variant="secondary" size="sm" onClick={startEdit}>
              {canEdit ? 'Edit' : 'Suggest changes'}
            </Button>
          )}
        </div>

        {!editing ? (
          <>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wide text-ink-muted">{k}</dt>
                  <dd>{v || <span className="text-ink-muted">Not added</span>}</dd>
                </div>
              ))}
            </dl>
            {profile.about && <p className="mt-5 whitespace-pre-line border-t border-line pt-4">{profile.about}</p>}
          </>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={form.fullName} onChange={set('fullName')} /></Field>
            <Field label="Marital status"><Select value={form.maritalStatus} onChange={set('maritalStatus')} options={toOptions(MARITAL_STATUSES)} /></Field>
            <Field label="Community"><Input value={form.community} onChange={set('community')} /></Field>
            <Field label="Star"><Select value={form.star} onChange={set('star')} placeholder="Not specified" options={toOptions(STARS)} /></Field>
            <Field label="Native district"><Select value={form.nativeDistrict} onChange={set('nativeDistrict')} placeholder="Not specified" options={toOptions(KERALA_DISTRICTS)} /></Field>
            <Field label="Country"><Select value={form.currentCountry} onChange={set('currentCountry')} options={COUNTRY_OPTIONS} /></Field>
            <Field label="City"><Input value={form.currentCity} onChange={set('currentCity')} /></Field>
            <Field label="Height (cm)"><Input type="number" value={form.heightCm} onChange={set('heightCm')} /></Field>
            <Field label="Education"><Input value={form.education} onChange={set('education')} /></Field>
            <Field label="Occupation"><Input value={form.occupation} onChange={set('occupation')} /></Field>
            <div className="sm:col-span-2">
              <Field label="About"><Textarea value={form.about} onChange={set('about')} maxLength={2000} /></Field>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={save}>{canEdit ? 'Save' : 'Send suggestion'}</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-ink-muted">{msg}</p>}
      </Card>

      <div className="flex gap-2">
        <Badge tone="brand">Your role: {humanize(access.role)}</Badge>
        {access.isFamilyAdmin && <Badge>Family admin</Badge>}
      </div>
    </div>
  );
}
