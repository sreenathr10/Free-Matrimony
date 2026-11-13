'use client';

import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Check,
  HeartHandshake,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
import { Button, Card, ChoiceCard, Field, Input, Select, Textarea, buttonClass, cn } from '@fm/ui';
import { AppHeader } from '@/components/AppHeader';
import { api, ApiError } from '@/lib/api';

type Form = Record<string, string>;

const WHO = [
  {
    value: 'SELF',
    label: 'Myself',
    description: 'I’m looking for a partner',
    icon: <User className="h-5 w-5" />,
  },
  {
    value: 'MOTHER',
    label: 'My son or daughter',
    description: 'I’m their mother',
    icon: <HeartHandshake className="h-5 w-5" />,
  },
  {
    value: 'FATHER',
    label: 'My son or daughter',
    description: 'I’m their father',
    icon: <Baby className="h-5 w-5" />,
  },
  {
    value: 'BROTHER',
    label: 'My sibling',
    description: 'I’m their brother',
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: 'SISTER',
    label: 'My sibling',
    description: 'I’m their sister',
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: 'GUARDIAN',
    label: 'Someone in my care',
    description: 'I’m their guardian',
    icon: <Shield className="h-5 w-5" />,
  },
];

const steps = [
  {
    label: 'For',
    title: 'Who is this profile for?',
    sub: 'Families can create a profile together. The candidate always has the final say.',
    fields: ['createdAs'],
  },
  {
    label: 'Basics',
    title: 'The basics',
    sub: 'Their name stays private until an interest is accepted.',
    fields: ['fullName', 'gender', 'dateOfBirth', 'maritalStatus'],
  },
  {
    label: 'Background',
    title: 'Family background',
    sub: 'Helps matches from the right community and region find them.',
    fields: ['religion', 'community', 'star', 'nativeDistrict'],
  },
  {
    label: 'Today',
    title: 'Life today',
    sub: 'Where they live, what they do, and a few words in their own voice.',
    fields: ['currentCountry', 'currentCity', 'heightCm', 'education', 'occupation', 'about'],
  },
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

  const set = (k: string) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  /** Validate just this step's fields with the shared schema. */
  function validateStep() {
    const result = createProfileSchema.safeParse(toPayload(form));
    const stepFields: readonly string[] = steps[step].fields;
    const errs: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const k = String(issue.path[0]);
        if (stepFields.includes(k) && !errs[k])
          errs[k] = issue.message === 'Required' ? 'Required' : issue.message;
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
      const profile = await api<{ id: string }>('/profiles', {
        method: 'POST',
        body: JSON.stringify(toPayload(form)),
      });
      router.push(`/profiles/${profile.id}?created=1`);
    } catch (e) {
      setErrors({
        form:
          e instanceof ApiError
            ? (e.body.issues?.[0]?.message ?? e.message)
            : 'Something went wrong',
      });
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-mesh">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <ol className="flex items-center gap-2">
          {steps.map((st, i) => (
            <li key={st.label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-all duration-300',
                  i < step && 'bg-verified text-white',
                  i === step && 'bg-brand-gradient text-white shadow-glow',
                  i > step && 'border border-line-strong bg-surface-raised text-ink-faint',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-semibold sm:block',
                  i === step ? 'text-ink' : 'text-ink-faint',
                )}
              >
                {st.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    'h-px flex-1 transition-colors',
                    i < step ? 'bg-verified' : 'bg-line-strong',
                  )}
                />
              )}
            </li>
          ))}
        </ol>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">
              {steps[step].title}
            </h1>
            <p className="mt-2 text-ink-muted">{steps[step].sub}</p>

            <Card className="mt-8 flex flex-col gap-5 p-6 sm:p-8">
              {step === 0 && (
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                  {WHO.map((w) => (
                    <ChoiceCard
                      key={w.value}
                      selected={form.createdAs === w.value}
                      onClick={() => setForm((f) => ({ ...f, createdAs: w.value }))}
                      icon={w.icon}
                      title={w.label}
                      description={w.description}
                    />
                  ))}
                  {errors.createdAs && (
                    <p className="text-sm font-medium text-brand-600 sm:col-span-2">
                      Choose one to continue
                    </p>
                  )}
                  {form.createdAs && form.createdAs !== 'SELF' && (
                    <p className="rounded-2xl bg-surface-sunken p-4 text-sm text-ink-muted sm:col-span-2">
                      You can invite them afterwards. Their profile only goes live once they give
                      consent themselves.
                    </p>
                  )}
                </div>
              )}

              {step === 1 && (
                <>
                  <Field label="Full name" error={errors.fullName}>
                    <Input
                      value={form.fullName ?? ''}
                      onChange={set('fullName')}
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Gender" error={errors.gender}>
                    <Select
                      value={form.gender ?? ''}
                      onChange={set('gender')}
                      placeholder="Select"
                      options={[
                        { value: 'FEMALE', label: 'Female' },
                        { value: 'MALE', label: 'Male' },
                      ]}
                    />
                  </Field>
                  <Field label="Date of birth" error={errors.dateOfBirth}>
                    <Input
                      type="date"
                      value={form.dateOfBirth ?? ''}
                      onChange={set('dateOfBirth')}
                    />
                  </Field>
                  <Field label="Marital status" error={errors.maritalStatus}>
                    <Select
                      value={form.maritalStatus}
                      onChange={set('maritalStatus')}
                      options={toOptions(MARITAL_STATUSES)}
                    />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <Field label="Religion" error={errors.religion}>
                    <Select
                      value={form.religion ?? ''}
                      onChange={set('religion')}
                      placeholder="Select"
                      options={toOptions(RELIGIONS)}
                    />
                  </Field>
                  <Field
                    label="Community"
                    hint="For example Nair, Ezhava, Syrian Catholic, Sunni"
                    error={errors.community}
                  >
                    <Input value={form.community ?? ''} onChange={set('community')} />
                  </Field>
                  <Field label="Star (nakshatra)" hint="Optional" error={errors.star}>
                    <Select
                      value={form.star ?? ''}
                      onChange={set('star')}
                      placeholder="Not specified"
                      options={toOptions(STARS)}
                    />
                  </Field>
                  <Field label="Native district" hint="Optional" error={errors.nativeDistrict}>
                    <Select
                      value={form.nativeDistrict ?? ''}
                      onChange={set('nativeDistrict')}
                      placeholder="Not specified"
                      options={toOptions(KERALA_DISTRICTS)}
                    />
                  </Field>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Country you live in" error={errors.currentCountry}>
                      <Select
                        value={form.currentCountry}
                        onChange={set('currentCountry')}
                        options={COUNTRY_OPTIONS}
                      />
                    </Field>
                    <Field label="City" error={errors.currentCity}>
                      <Input value={form.currentCity ?? ''} onChange={set('currentCity')} />
                    </Field>
                    <Field label="Height (cm)" error={errors.heightCm}>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={form.heightCm ?? ''}
                        onChange={set('heightCm')}
                      />
                    </Field>
                    <Field label="Education" error={errors.education}>
                      <Input value={form.education ?? ''} onChange={set('education')} />
                    </Field>
                  </div>
                  <Field label="Occupation" error={errors.occupation}>
                    <Input value={form.occupation ?? ''} onChange={set('occupation')} />
                  </Field>
                  <Field
                    label="About"
                    hint="A few lines in their own voice work best"
                    error={errors.about}
                  >
                    <Textarea value={form.about ?? ''} onChange={set('about')} maxLength={2000} />
                  </Field>
                </>
              )}

              {errors.form && <p className="text-sm text-brand-600">{errors.form}</p>}

              <div className="flex justify-between gap-3 pt-2">
                {step > 0 ? (
                  <button
                    type="button"
                    className={buttonClass('ghost')}
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : (
                  <span />
                )}
                <Button
                  onClick={next}
                  loading={busy}
                  size="lg"
                  iconRight={<ArrowRight className="h-5 w-5" />}
                >
                  {step === steps.length - 1 ? 'Create profile' : 'Continue'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
