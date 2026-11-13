'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@fm/ui';
import { api, ApiError, session } from '@/lib/api';

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
      setError(e instanceof ApiError ? (e.body.issues?.[0]?.message ?? e.message) : 'Something went wrong');
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
      setHint(res.devCode ? `Development code: ${res.devCode}` : null);
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

  const input =
    'h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <a href="/" className="mb-8 font-display text-xl font-semibold text-brand-600">
        Free Matrimony
      </a>
      <Card className="p-8">
        <h1 className="text-2xl font-semibold">{step === 'phone' ? 'Log in or sign up' : 'Enter your code'}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {step === 'phone' ? 'We’ll send a 6-digit code to your phone.' : `Sent to ${phone}`}
        </p>
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void (step === 'phone' ? requestCode() : verify());
          }}
        >
          {step === 'phone' ? (
            <input className={input} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          ) : (
            <>
              <input className={input} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
              <input className={input} placeholder="Your name (new accounts)" value={name} onChange={(e) => setName(e.target.value)} />
            </>
          )}
          {hint && <p className="text-sm text-gold-500">{hint}</p>}
          {error && <p className="text-sm text-brand-600">{error}</p>}
          <Button type="submit" size="lg" disabled={busy}>
            {step === 'phone' ? 'Send code' : 'Continue'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
