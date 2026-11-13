'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  COUNTRY_OPTIONS,
  KERALA_DISTRICTS,
  MARITAL_STATUSES,
  RELIGIONS,
  STARS,
  createProfileSchema,
  toOptions,
} from '@fm/shared';
import { Button, Card, Field, Input, ProgressBar, Select, Textarea, buttonClass, cn } from '@fm/ui';
import { api, ApiError } from '@/lib/api';

type Form = Record<string, string>;

const WHO = [
  { value: 'SELF', label: 'Myself' },
  { value: 'MOTHER', label: 'My son or daughter (I’m the mother)' },
  { value: 'FATHER', label: 'My son or daughter (I’m the father)' },
  { value: 'BROTHER', label: 'My sibling (I’m their brother)' },
  { value: 'SISTER', label: 'My sibling (I’m their sister)' },
  { value: 'GUARDIAN', label: 'Someone I’m a guardian for' },
];

const steps = [
  { title: 'Who is this profile for?', fields: ['createdAs'] },
  { title: 'The basics', fields: ['fullName', 'gender', 'dateOfBirth', 'maritalStatus'] },
  { title: 'Background', fields: ['religion', 'community', 'star', 'nativeDistrict'] },
  { title: 'Life today', fields: ['currentCountry', 'currentCity', 'heightCm', 'education', 'occupation', 'about'] },
] as const;

function toPayload(f: Form) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v === '') continue;
    out[k] = k === 'heightCm' ? Number(v) : v;
  }
  return out;
}

export default function NewProfile() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({ maritalStatus: 'NEVER_MARRIED', currentCountry: 'IN' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /** Validate just this step's fields with the shared schema. */
  function validateStep() {
    const result = createProfileSchema.safeParse(toPayload(form));
    const stepFields: readonly string[] = steps[step].fields;
    const errs: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const k = String(issue.path[0]);
        if (stepFields.includes(k) && !errs[k]) errs[k] = issue.message === 'Required' ? 'Required' : issue.message;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function next() {
    if (!validateStep()) return;
    if (step < steps.length - 1) return setStep(step + 1);
    setBusy(true);
    try {
      const profile = await api<{ id: string }>('/profiles', { method: 'POST', body: JSON.stringify(toPayload(form)) });
      router.push(`/profiles/${profile.id}?created=1`);
    } catch (e) {
      setErrors({ form: e instanceof ApiError ? (e.body.issues?.[0]?.message ?? e.message) : 'Something went wrong' });
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <a href="/family" className="text-sm text-ink-muted hover:text-ink">
        ← Your family
      </a>
      <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
        <span>
          Step {step + 1} of {steps.length}
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar percent={((step + 1) / steps.length) * 100} />
      </div>
      <h1 className="mt-8 font-display text-3xl font-semibold">{steps[step].title}</h1>

      <Card className="mt-6 flex flex-col gap-5">
        {step === 0 && (
          <div className="flex flex-col gap-2" role="radiogroup">
            {WHO.map((w) => (
              <button
                key={w.value}
                type="button"
                role="radio"
                aria-checked={form.createdAs === w.value}
                onClick={() => setForm((f) => ({ ...f, createdAs: w.value }))}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition-colors',
                  form.createdAs === w.value ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-200',
                )}
              >
                {w.label}
              </button>
            ))}
            {errors.createdAs && <p className="text-sm text-brand-600">Choose one to continue</p>}
            {form.createdAs && form.createdAs !== 'SELF' && (
              <p className="mt-2 text-sm text-ink-muted">
                You can invite them afterwards. Their profile only goes live once they give consent themselves.
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <>
            <Field label="Full name" error={errors.fullName}>
              <Input value={form.fullName ?? ''} onChange={set('fullName')} autoComplete="off" />
            </Field>
            <Field label="Gender" error={errors.gender}>
              <Select value={form.gender ?? ''} onChange={set('gender')} placeholder="Select" options={[{ value: 'FEMALE', label: 'Female' }, { value: 'MALE', label: 'Male' }]} />
            </Field>
            <Field label="Date of birth" error={errors.dateOfBirth}>
              <Input type="date" value={form.dateOfBirth ?? ''} onChange={set('dateOfBirth')} />
            </Field>
            <Field label="Marital status" error={errors.maritalStatus}>
              <Select value={form.maritalStatus} onChange={set('maritalStatus')} options={toOptions(MARITAL_STATUSES)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Religion" error={errors.religion}>
              <Select value={form.religion ?? ''} onChange={set('religion')} placeholder="Select" options={toOptions(RELIGIONS)} />
            </Field>
            <Field label="Community" hint="For example Nair, Ezhava, Syrian Catholic, Sunni" error={errors.community}>
              <Input value={form.community ?? ''} onChange={set('community')} />
            </Field>
            <Field label="Star (nakshatra)" hint="Optional" error={errors.star}>
              <Select value={form.star ?? ''} onChange={set('star')} placeholder="Not specified" options={toOptions(STARS)} />
            </Field>
            <Field label="Native district" hint="Optional" error={errors.nativeDistrict}>
              <Select value={form.nativeDistrict ?? ''} onChange={set('nativeDistrict')} placeholder="Not specified" options={toOptions(KERALA_DISTRICTS)} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Country you live in" error={errors.currentCountry}>
                <Select value={form.currentCountry} onChange={set('currentCountry')} options={COUNTRY_OPTIONS} />
              </Field>
              <Field label="City" error={errors.currentCity}>
                <Input value={form.currentCity ?? ''} onChange={set('currentCity')} />
              </Field>
              <Field label="Height (cm)" error={errors.heightCm}>
                <Input type="number" inputMode="numeric" value={form.heightCm ?? ''} onChange={set('heightCm')} />
              </Field>
              <Field label="Education" error={errors.education}>
                <Input value={form.education ?? ''} onChange={set('education')} />
              </Field>
            </div>
            <Field label="Occupation" error={errors.occupation}>
              <Input value={form.occupation ?? ''} onChange={set('occupation')} />
            </Field>
            <Field label="About" hint="A few lines in their own voice work best" error={errors.about}>
              <Textarea value={form.about ?? ''} onChange={set('about')} maxLength={2000} />
            </Field>
          </>
        )}

        {errors.form && <p className="text-sm text-brand-600">{errors.form}</p>}

        <div className="flex justify-between gap-3 pt-2">
          {step > 0 ? (
            <button type="button" className={buttonClass('ghost')} onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          <Button onClick={next} disabled={busy}>
            {step === steps.length - 1 ? 'Create profile' : 'Continue'}
          </Button>
        </div>
      </Card>
    </main>
  );
}
