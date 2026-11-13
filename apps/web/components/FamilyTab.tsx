'use client';

import { Crown, Mail, Pencil, Phone, Send, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  ACCESS_LABELS,
  CANDIDATE_ONLY_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  PERMISSIONS,
  PERMISSION_LABELS,
  RELATIONS,
  humanize,
  type AccessLevel,
  type FamilyRole,
  type Permission,
} from '@fm/shared';
import { Avatar, Badge, Button, Card, Field, Input, Select, cn } from '@fm/ui';
import { api, ApiError } from '@/lib/api';
import type { Access, Member } from '@/lib/types';

const levelsFor = (p: Permission): AccessLevel[] =>
  p === 'EDIT_PROFILE' ? ['DENY', 'SUGGEST', 'ALLOW'] : ['DENY', 'APPROVAL', 'ALLOW'];

export function FamilyTab({ profileId, me }: { profileId: string; me: Access }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [phone, setPhone] = useState('+91');
  const [relation, setRelation] = useState('MOTHER');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Record<Permission, AccessLevel>>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const isCandidate = me.role === 'CANDIDATE';
  const canInvite = me.permissions.MANAGE_FAMILY === 'ALLOW';
  const load = () => api<Member[]>(`/profiles/${profileId}/members`).then(setMembers);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const fail = (e: unknown) =>
    setMsg(
      e instanceof ApiError ? (e.body.issues?.[0]?.message ?? e.message) : 'Something went wrong',
    );

  async function invite() {
    setMsg(null);
    try {
      await api(`/profiles/${profileId}/members`, {
        method: 'POST',
        body: JSON.stringify({ phone, relation }),
      });
      setPhone('+91');
      setMsg('Invitation sent. They can accept after logging in with that number.');
      load();
    } catch (e) {
      fail(e);
    }
  }

  function startEdit(m: Member) {
    const defaults = DEFAULT_PERMISSIONS[m.role as FamilyRole];
    setDraft(
      Object.fromEntries(
        PERMISSIONS.filter((p) => m.permissions[p] !== defaults[p]).map((p) => [
          p,
          m.permissions[p],
        ]),
      ),
    );
    setEditing(m.memberId);
  }

  async function savePermissions(m: Member) {
    try {
      await api(`/profiles/${profileId}/members/${m.memberId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ overrides: draft }),
      });
      setEditing(null);
      load();
    } catch (e) {
      fail(e);
    }
  }

  async function remove(m: Member) {
    try {
      await api(`/profiles/${profileId}/members/${m.memberId}`, { method: 'DELETE' });
      load();
    } catch (e) {
      fail(e);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {members.map((m, i) => {
        const role = m.role as FamilyRole;
        const display = m.name ?? m.invitedPhone ?? 'Invited';
        return (
          <motion.div
            key={m.memberId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={m.name ?? humanize(m.relation)}
                    size={48}
                    ring={role === 'CANDIDATE'}
                  />
                  <div>
                    <div className="font-semibold">
                      {display}{' '}
                      {m.memberId === me.memberId && <span className="text-ink-muted">(you)</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge tone="brand">
                        {m.relation === 'SELF' ? 'Candidate' : humanize(m.relation)}
                      </Badge>
                      {m.isFamilyAdmin && (
                        <Badge tone="gold" icon={<Crown className="h-3 w-3" />}>
                          Family admin
                        </Badge>
                      )}
                      {m.status === 'INVITED' && (
                        <Badge tone="warning" icon={<Mail className="h-3 w-3" />}>
                          Invite pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isCandidate && role !== 'CANDIDATE' && editing !== m.memberId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEdit(m)}
                      icon={<Pencil className="h-3.5 w-3.5" />}
                    >
                      Change access
                    </Button>
                  )}
                  {role !== 'CANDIDATE' &&
                    canInvite &&
                    (isCandidate || me.isFamilyAdmin) &&
                    m.memberId !== me.memberId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(m)}
                        icon={<UserMinus className="h-3.5 w-3.5" />}
                      >
                        Remove
                      </Button>
                    )}
                </div>
              </div>

              <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                {PERMISSIONS.map((p) => {
                  const locked = role === 'CANDIDATE' || CANDIDATE_ONLY_PERMISSIONS.includes(p);
                  const value =
                    editing === m.memberId
                      ? (draft[p] ?? DEFAULT_PERMISSIONS[role][p])
                      : m.permissions[p];
                  return (
                    <div
                      key={p}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunken px-3 py-2"
                    >
                      <span className="text-ink-muted">{PERMISSION_LABELS[p]}</span>
                      {editing === m.memberId && !locked ? (
                        <select
                          className="rounded-lg border border-line-strong bg-surface-raised px-2 py-1 text-sm font-medium focus:border-brand-400 focus:outline-none"
                          value={value}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [p]: e.target.value as AccessLevel }))
                          }
                        >
                          {levelsFor(p).map((l) => (
                            <option key={l} value={l}>
                              {ACCESS_LABELS[l]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            value === 'DENY' && 'bg-line text-ink-faint',
                            value === 'ALLOW' &&
                              'bg-verified-soft text-[#05603a] dark:bg-verified/15 dark:text-verified',
                            (value === 'APPROVAL' || value === 'SUGGEST') &&
                              'bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300',
                          )}
                        >
                          {ACCESS_LABELS[value]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {editing === m.memberId && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => savePermissions(m)}
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  >
                    Save access
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}

      {canInvite && (
        <Card variant="feature" className="border-brand-200/60 dark:border-brand-900/60">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">Invite a family member</h2>
              <p className="text-sm text-ink-muted">
                They get their own login. {isCandidate ? 'You' : 'The candidate'} can change what
                they can do at any time.
              </p>
            </div>
          </div>
          <div className="relative mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Phone number">
              <Input
                type="tel"
                icon={<Phone className="h-4 w-4" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Relation to the candidate">
              <Select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                options={RELATIONS.map((r) => ({
                  value: r,
                  label: r === 'SELF' ? 'The candidate themself' : humanize(r),
                }))}
              />
            </Field>
            <Button onClick={invite} icon={<Send className="h-4 w-4" />}>
              Send invite
            </Button>
          </div>
        </Card>
      )}
      {msg && <p className="text-sm text-ink-muted">{msg}</p>}
    </div>
  );
}
