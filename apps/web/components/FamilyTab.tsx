'use client';

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
import { Badge, Button, Card, Field, Input, Select } from '@fm/ui';
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

  const fail = (e: unknown) => setMsg(e instanceof ApiError ? (e.body.issues?.[0]?.message ?? e.message) : 'Something went wrong');

  async function invite() {
    setMsg(null);
    try {
      await api(`/profiles/${profileId}/members`, { method: 'POST', body: JSON.stringify({ phone, relation }) });
      setPhone('+91');
      setMsg('Invitation sent. They can accept after logging in with that number.');
      load();
    } catch (e) {
      fail(e);
    }
  }

  function startEdit(m: Member) {
    const defaults = DEFAULT_PERMISSIONS[m.role as FamilyRole];
    setDraft(Object.fromEntries(PERMISSIONS.filter((p) => m.permissions[p] !== defaults[p]).map((p) => [p, m.permissions[p]])));
    setEditing(m.memberId);
  }

  async function savePermissions(m: Member) {
    try {
      await api(`/profiles/${profileId}/members/${m.memberId}/permissions`, { method: 'PATCH', body: JSON.stringify({ overrides: draft }) });
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
      {members.map((m) => {
        const role = m.role as FamilyRole;
        return (
          <Card key={m.memberId}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {m.name ?? m.invitedPhone ?? 'Invited'} {m.memberId === me.memberId && <span className="text-ink-muted">(you)</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge tone="brand">{m.relation === 'SELF' ? 'Candidate' : humanize(m.relation)}</Badge>
                  {m.isFamilyAdmin && <Badge>Family admin</Badge>}
                  {m.status === 'INVITED' && <Badge tone="warning">Invite pending</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                {isCandidate && role !== 'CANDIDATE' && editing !== m.memberId && (
                  <Button size="sm" variant="secondary" onClick={() => startEdit(m)}>
                    Change access
                  </Button>
                )}
                {role !== 'CANDIDATE' && canInvite && (isCandidate || me.isFamilyAdmin) && m.memberId !== me.memberId && (
                  <Button size="sm" variant="ghost" onClick={() => remove(m)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {PERMISSIONS.map((p) => {
                const locked = role === 'CANDIDATE' || CANDIDATE_ONLY_PERMISSIONS.includes(p);
                const value = editing === m.memberId ? (draft[p] ?? DEFAULT_PERMISSIONS[role][p]) : m.permissions[p];
                return (
                  <div key={p} className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-0">
                    <span className="text-ink-muted">{PERMISSION_LABELS[p]}</span>
                    {editing === m.memberId && !locked ? (
                      <select
                        className="rounded-lg border border-line bg-surface px-2 py-1 text-sm"
                        value={value}
                        onChange={(e) => setDraft((d) => ({ ...d, [p]: e.target.value as AccessLevel }))}
                      >
                        {levelsFor(p).map((l) => (
                          <option key={l} value={l}>
                            {ACCESS_LABELS[l]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={value === 'DENY' ? 'text-ink-muted' : 'font-medium'}>{ACCESS_LABELS[value]}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {editing === m.memberId && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => savePermissions(m)}>Save access</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            )}
          </Card>
        );
      })}

      {canInvite && (
        <Card>
          <h2 className="font-semibold">Invite a family member</h2>
          <p className="text-sm text-ink-muted">They get their own login. {isCandidate ? 'You' : 'The candidate'} can change what they can do at any time.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Phone number"><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <Field label="Relation to the candidate">
              <Select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                options={RELATIONS.map((r) => ({ value: r, label: r === 'SELF' ? 'The candidate themself' : humanize(r) }))}
              />
            </Field>
            <Button onClick={invite}>Send invite</Button>
          </div>
        </Card>
      )}
      {msg && <p className="text-sm text-ink-muted">{msg}</p>}
    </div>
  );
}
