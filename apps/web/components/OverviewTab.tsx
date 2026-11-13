'use client';

import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Church,
  GraduationCap,
  Briefcase,
  Heart,
  Home,
  MapPin,
  Pencil,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  COUNTRY_OPTIONS,
  KERALA_DISTRICTS,
  MARITAL_STATUSES,
  STARS,
  countryName,
  humanize,
  toOptions,
} from '@fm/shared';
import { Badge, Button, Card, Field, Input, SectionTitle, Select, Textarea } from '@fm/ui';
import type { ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import type { ProfileResponse } from '@/lib/types';

const EDITABLE = [
  'fullName',
  'maritalStatus',
  'community',
  'star',
  'nativeDistrict',
  'currentCountry',
  'currentCity',
  'heightCm',
  'education',
  'occupation',
  'about',
] as const;

function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  return (
    now.getFullYear() -
    d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
  );
}

export function OverviewTab({ data, reload }: { data: ProfileResponse; reload: () => void }) {
  const { profile, access, completeness } = data;
  const canEdit = access.permissions.EDIT_PROFILE === 'ALLOW';
  const canSuggest = access.permissions.EDIT_PROFILE === 'SUGGEST';
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const startEdit = () => {
    setForm(
      Object.fromEntries(EDITABLE.map((k) => [k, profile[k] == null ? '' : String(profile[k])])),
    );
    setEditing(true);
    setMsg(null);
  };
  const set = (k: string) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const changes: Record<string, unknown> = {};
    for (const k of EDITABLE) {
      const before = profile[k] == null ? '' : String(profile[k]);
      if (form[k] !== before && form[k] !== '')
        changes[k] = k === 'heightCm' ? Number(form[k]) : form[k];
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

  const rows: [string, string | null, ReactNode][] = [
    ['Age', `${age(profile.dateOfBirth)} years`, <CalendarDays key="i" className="h-4 w-4" />],
    ['Marital status', humanize(profile.maritalStatus), <Heart key="i" className="h-4 w-4" />],
    ['Religion', humanize(profile.religion), <Church key="i" className="h-4 w-4" />],
    ['Community', profile.community, <Users key="i" className="h-4 w-4" />],
    ['Star', profile.star && humanize(profile.star), <Star key="i" className="h-4 w-4" />],
    [
      'Native district',
      profile.nativeDistrict && humanize(profile.nativeDistrict),
      <Home key="i" className="h-4 w-4" />,
    ],
    [
      'Lives in',
      [profile.currentCity, countryName(profile.currentCountry)].filter(Boolean).join(', '),
      <MapPin key="i" className="h-4 w-4" />,
    ],
    [
      'Height',
      profile.heightCm ? `${profile.heightCm} cm` : null,
      <Ruler key="i" className="h-4 w-4" />,
    ],
    ['Education', profile.education, <GraduationCap key="i" className="h-4 w-4" />],
    ['Occupation', profile.occupation, <Briefcase key="i" className="h-4 w-4" />],
  ];

  return (
    <div className="flex flex-col gap-4">
      {completeness.nextSteps.length > 0 && (
        <Card>
          <SectionTitle
            title="Make this profile stand out"
            description="Complete profiles get up to 3 times more interest."
          />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {completeness.nextSteps.map((s) => (
              <li
                key={s.key}
                className="flex items-center gap-3 rounded-2xl bg-surface-sunken px-4 py-3 text-sm"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-600 dark:bg-gold-500/15">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="flex-1">{s.hint}</span>
                <ArrowRight className="h-4 w-4 text-ink-faint" />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {profile.status === 'DRAFT' && (
        <Card
          variant="feature"
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-2xl" />
          <div className="relative flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              {profile.candidateConsentAt ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <BadgeCheck className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2 className="font-semibold">
                {profile.candidateConsentAt ? 'Ready for verification' : 'Waiting for consent'}
              </h2>
              <p className="text-sm text-ink-muted">
                {profile.candidateConsentAt
                  ? 'Submit the profile to our verification team. It goes live once ID and selfie checks pass.'
                  : access.role === 'CANDIDATE'
                    ? 'Confirm that you agree to this profile being shown to matches.'
                    : 'The candidate must join and give consent before the profile can go live. Invite them from the Family tab.'}
              </p>
            </div>
          </div>
          {access.role === 'CANDIDATE' && !profile.candidateConsentAt && (
            <Button onClick={() => action('consent')}>I consent</Button>
          )}
          {profile.candidateConsentAt && canEdit && (
            <Button onClick={() => action('submit')}>Submit for verification</Button>
          )}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Details</h2>
          {!editing && (canEdit || canSuggest) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={startEdit}
              icon={<Pencil className="h-3.5 w-3.5" />}
            >
              {canEdit ? 'Edit' : 'Suggest changes'}
            </Button>
          )}
        </div>

        {!editing ? (
          <>
            {profile.about && (
              <blockquote className="mt-4 rounded-2xl border-l-4 border-brand-400 bg-surface-sunken px-5 py-4 font-display text-lg italic leading-relaxed whitespace-pre-line">
                {profile.about}
              </blockquote>
            )}
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {rows.map(([k, v, icon]) => (
                <div
                  key={k}
                  className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-ink-faint">{k}</dt>
                    <dd className="truncate font-medium">
                      {v || <span className="font-normal text-ink-faint">Not added</span>}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={form.fullName} onChange={set('fullName')} />
            </Field>
            <Field label="Marital status">
              <Select
                value={form.maritalStatus}
                onChange={set('maritalStatus')}
                options={toOptions(MARITAL_STATUSES)}
              />
            </Field>
            <Field label="Community">
              <Input value={form.community} onChange={set('community')} />
            </Field>
            <Field label="Star">
              <Select
                value={form.star}
                onChange={set('star')}
                placeholder="Not specified"
                options={toOptions(STARS)}
              />
            </Field>
            <Field label="Native district">
              <Select
                value={form.nativeDistrict}
                onChange={set('nativeDistrict')}
                placeholder="Not specified"
                options={toOptions(KERALA_DISTRICTS)}
              />
            </Field>
            <Field label="Country">
              <Select
                value={form.currentCountry}
                onChange={set('currentCountry')}
                options={COUNTRY_OPTIONS}
              />
            </Field>
            <Field label="City">
              <Input value={form.currentCity} onChange={set('currentCity')} />
            </Field>
            <Field label="Height (cm)">
              <Input type="number" value={form.heightCm} onChange={set('heightCm')} />
            </Field>
            <Field label="Education">
              <Input value={form.education} onChange={set('education')} />
            </Field>
            <Field label="Occupation">
              <Input value={form.occupation} onChange={set('occupation')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="About">
                <Textarea value={form.about} onChange={set('about')} maxLength={2000} />
              </Field>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={save}>{canEdit ? 'Save' : 'Send suggestion'}</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-ink-muted">{msg}</p>}
      </Card>

      <div className="flex gap-2">
        <Badge tone="brand" icon={<Users className="h-3.5 w-3.5" />}>
          Your role: {humanize(access.role)}
        </Badge>
        {access.isFamilyAdmin && (
          <Badge tone="gold" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
            Family admin
          </Badge>
        )}
      </div>
    </div>
  );
}
