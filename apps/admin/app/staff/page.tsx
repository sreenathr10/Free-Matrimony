'use client';

import { Phone, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@fm/client';
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from '@fm/shared';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
  Select,
  Skeleton,
  useStaff,
} from '@fm/ui';
import { Portal } from '@/components/Portal';

interface StaffMember {
  id: string;
  phone: string;
  name: string | null;
  role: StaffRole;
  createdAt: string;
}

const ROLE_HELP: Record<StaffRole, string> = {
  ADMIN: 'Everything, including staff and pricing',
  SUPPORT_AGENT: 'Customer service portal: tickets and reports',
  VERIFIER: 'Verification portal: review IDs and selfies',
};
const roleTone = { ADMIN: 'brand', SUPPORT_AGENT: 'gold', VERIFIER: 'verified' } as const;

function StaffManager() {
  const { client, staff: me } = useStaff();
  const [list, setList] = useState<StaffMember[] | null>(null);
  const [form, setForm] = useState({ phone: '+91', name: '', role: 'VERIFIER' as StaffRole });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(
    () => client.api<StaffMember[]>('/staff/members').then(setList),
    [client],
  );
  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await client.api('/staff/members', { method: 'POST', body: JSON.stringify(form) });
      setMsg({ ok: true, text: `${form.name} can now sign in with ${form.phone}.` });
      setForm({ phone: '+91', name: '', role: form.role });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.friendly : 'Could not add' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: StaffMember) {
    try {
      await client.api(`/staff/members/${m.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.friendly : 'Could not remove' });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card className="p-0">
        <div className="border-b border-line p-6">
          <SectionTitle
            title="Team"
            description="People with access to the staff portals. Removing someone takes effect immediately."
          />
        </div>
        {!list ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {list.map((m) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <Avatar name={m.name ?? m.phone} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {m.name ?? 'No name'}{' '}
                      {m.id === me.id && <span className="font-normal text-ink-muted">(you)</span>}
                    </div>
                    <div className="text-sm text-ink-muted">{m.phone}</div>
                  </div>
                  <Badge tone={roleTone[m.role]}>{STAFF_ROLE_LABELS[m.role]}</Badge>
                  {m.id !== me.id && (
                    <button
                      onClick={() => remove(m)}
                      className="grid h-9 w-9 place-items-center rounded-full text-ink-faint hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40"
                      aria-label={`Remove ${m.name ?? m.phone}`}
                      title="Remove staff access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>

      <Card variant="feature" className="h-fit">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
            <UserPlus className="h-5 w-5" />
          </span>
          <SectionTitle
            title="Add a team member"
            description="They sign in with a code sent to this phone."
          />
        </div>
        <form onSubmit={add} className="mt-6 flex flex-col gap-4">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Phone number">
            <Input
              icon={<Phone className="h-4 w-4" />}
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Role" hint={ROLE_HELP[form.role]}>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
              options={STAFF_ROLES.map((r) => ({ value: r, label: STAFF_ROLE_LABELS[r] }))}
            />
          </Field>
          {msg && (
            <p
              className={
                msg.ok
                  ? 'rounded-xl bg-verified-soft px-3 py-2 text-sm text-[#05603a] dark:bg-verified/15 dark:text-verified'
                  : 'rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700'
              }
            >
              {msg.text}
            </p>
          )}
          <Button type="submit" loading={busy} icon={<ShieldCheck className="h-4 w-4" />}>
            Give access
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function StaffPage() {
  return (
    <Portal title="Staff and roles">
      <StaffManager />
    </Portal>
  );
}
