'use client';

import { ArrowLeft, ArrowRight, BadgeCheck, Lock, Phone, PhoneOff, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Logo, LogoMark } from '@fm/ui';
import { OtpInput } from '@/components/OtpInput';
import { api, ApiError, session } from '@/lib/api';

const points = [
  { icon: BadgeCheck, text: 'Every profile is selfie and ID verified' },
  { icon: Users, text: 'Your family helps, with the access you choose' },
  { icon: Lock, text: 'Photos stay blurred until you accept' },
  { icon: PhoneOff, text: 'No sales calls. Ever.' },
];

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? (e.body.issues?.[0]?.message ?? e.message)
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  const requestCode = () =>
    run(async () => {
      const res = await api<{ devCode?: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setHint(res.devCode ?? null);
      setStep('code');
    });

  const verify = () =>
    run(async () => {
      const res = await api<{ accessToken: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code, name: name || undefined }),
      });
      session.set(res.accessToken);
      router.push('/family');
    });

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-brand-gradient p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />
        <LogoMark
          size={300}
          mono
          className="pointer-events-none absolute -bottom-16 -right-10 text-white/[0.06]"
        />
        <a href="/" className="relative">
          <span className="inline-flex items-center gap-3 rounded-full bg-white/95 py-2 pl-2 pr-4 text-ink shadow-lift">
            <Logo size={30} className="text-[15px]" />
          </span>
        </a>
        <div className="relative mt-auto">
          <h1 className="max-w-md font-display text-5xl font-semibold leading-tight tracking-tight">
            The way <span className="italic text-gold-200">families</span> find matches today.
          </h1>
          <ul className="mt-10 space-y-4">
            {points.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                className="flex items-center gap-3 text-white/90"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form */}
      <section className="relative flex flex-col bg-mesh px-6 py-8 sm:px-12 lg:bg-none">
        <a href="/" className="lg:hidden">
          <Logo size={32} />
        </a>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 'code' ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: step === 'code' ? -24 : 24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 'code' && (
                <button
                  onClick={() => setStep('phone')}
                  className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" /> Change number
                </button>
              )}
              <h2 className="font-display text-4xl font-semibold tracking-tight">
                {step === 'phone' ? 'Welcome' : 'Check your phone'}
              </h2>
              <p className="mt-2 text-ink-muted">
                {step === 'phone'
                  ? 'Log in or create an account with your mobile number.'
                  : `We sent a 6-digit code to ${phone}.`}
              </p>

              <form
                className="mt-8 flex flex-col gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void (step === 'phone' ? requestCode() : verify());
                }}
              >
                {step === 'phone' ? (
                  <Field
                    label="Mobile number"
                    hint="Include your country code, for example +91 or +971"
                  >
                    <Input
                      icon={<Phone className="h-4 w-4" />}
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoFocus
                    />
                  </Field>
                ) : (
                  <>
                    <OtpInput value={code} onChange={setCode} autoFocus />
                    {hint && (
                      <p className="rounded-xl bg-gold-100 px-3 py-2 text-sm text-gold-600 dark:bg-gold-500/15 dark:text-gold-300">
                        Development mode: your code is{' '}
                        <span className="font-bold tracking-widest">{hint}</span>
                      </p>
                    )}
                    <Field label="Your name" hint="Only needed the first time">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </Field>
                  </>
                )}
                {error && (
                  <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  loading={busy}
                  disabled={step === 'code' && code.length < 6}
                  iconRight={<ArrowRight className="h-5 w-5" />}
                >
                  {step === 'phone' ? 'Send code' : 'Verify and continue'}
                </Button>
              </form>
              <p className="mt-8 text-center text-xs text-ink-faint">
                By continuing you agree to our terms and privacy policy.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
