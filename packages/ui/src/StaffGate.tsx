'use client';

import { ApiError, type Client } from '@fm/client';
import type { StaffRole } from '@fm/shared';
import { ArrowRight, KeyRound, Phone, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Field, Input } from './Form';
import { Logo, LogoMark } from './Logo';

export interface StaffUser {
  id: string;
  phone: string;
  role: StaffRole;
  name?: string | null;
}

interface StaffContextValue {
  staff: StaffUser;
  client: Client;
  signOut: () => void;
}

const StaffContext = createContext<StaffContextValue | null>(null);

/** The signed-in staff member and the portal's API client. Only inside <StaffGate>. */
export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be used inside <StaffGate>');
  return ctx;
}

/** Same as useStaff, but returns null outside a gate (for shared layout pieces). */
export const useOptionalStaff = () => useContext(StaffContext);

/**
 * Protects a staff portal: shows the OTP sign-in until a staff member with one of `roles` is signed in.
 * Admins can enter every portal. The API checks the role again on every request.
 */
export function StaffGate({ client, portal, roles, children }: { client: Client; portal: string; roles: StaffRole[]; children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'signed-out' | StaffUser>('checking');

  const load = useCallback(async () => {
    if (!client.session.get()) return setState('signed-out');
    try {
      const me = await client.api<StaffUser>('/staff/me');
      if (me.role !== 'ADMIN' && !roles.includes(me.role)) throw new ApiError(403, { message: 'wrong portal' });
      setState(me);
    } catch {
      client.session.clear();
      setState('signed-out');
    }
  }, [client, roles]);

  useEffect(() => {
    void load();
  }, [load]);

  const signOut = useCallback(() => {
    client.session.clear();
    setState('signed-out');
  }, [client]);

  if (state === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-sunken">
        <LogoMark size={56} className="animate-pulse" />
      </div>
    );
  }
  if (state === 'signed-out') return <StaffSignIn client={client} portal={portal} roles={roles} onSignedIn={load} />;
  return <StaffContext.Provider value={{ staff: state, client, signOut }}>{children}</StaffContext.Provider>;
}

function StaffSignIn({ client, portal, roles, onSignedIn }: { client: Client; portal: string; roles: StaffRole[]; onSignedIn: () => void }) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (step === 'phone') {
        const res = await client.api<{ devCode?: string }>('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) });
        setDevCode(res.devCode ?? null);
        setStep('code');
      } else {
        const res = await client.api<{ accessToken: string; user: { staffRole: StaffRole | null } }>('/auth/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ phone, code }),
        });
        const role = res.user.staffRole;
        if (!role || (role !== 'ADMIN' && !roles.includes(role))) {
          setError('This number does not have access to this portal. Ask an admin to add you.');
          setStep('phone');
          setCode('');
          return;
        }
        client.session.set(res.accessToken);
        onSignedIn();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.friendly : 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-surface-sunken bg-mesh px-5">
      <LogoMark size={420} mono className="pointer-events-none absolute -bottom-24 -right-24 text-brand-500/[0.05]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-card border border-line bg-surface-raised p-8 shadow-lift"
      >
        <Logo size={36} subtitle={portal} />
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {step === 'phone' ? 'Use the work phone number an admin added you with.' : `Enter the 6-digit code sent to ${phone}.`}
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              {step === 'phone' ? (
                <Field label="Phone number">
                  <Input icon={<Phone className="h-4 w-4" />} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
                </Field>
              ) : (
                <Field label="Code">
                  <Input
                    icon={<KeyRound className="h-4 w-4" />}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="tracking-[0.4em]"
                    autoFocus
                  />
                </Field>
              )}
            </motion.div>
          </AnimatePresence>
          {step === 'code' && devCode && (
            <p className="rounded-xl bg-gold-100 px-3 py-2 text-sm text-gold-600 dark:bg-gold-500/15 dark:text-gold-300">
              Development mode: your code is <span className="font-bold tracking-widest">{devCode}</span>
            </p>
          )}
          {error && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">{error}</p>}
          <Button type="submit" size="lg" loading={busy} disabled={step === 'code' && code.length < 6} iconRight={<ArrowRight className="h-5 w-5" />}>
            {step === 'phone' ? 'Send code' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 flex items-center gap-2 text-xs text-ink-faint">
          <ShieldCheck className="h-3.5 w-3.5" /> Every action in this portal is recorded in the audit log.
        </p>
      </motion.div>
    </main>
  );
}
