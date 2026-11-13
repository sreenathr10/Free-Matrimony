'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AccessLevel, Permission } from '@fm/shared';
import { Badge, Button, Card, buttonClass } from '@fm/ui';
import { api, session } from '@/lib/api';

interface MyProfile {
  profile: { id: string; fullName: string; status: string; currentCity: string | null; currentCountry: string };
  invitationPending: boolean;
  access: { relation: string; role: string; permissions: Record<Permission, AccessLevel> };
}

const relationLabel = (r: string) => (r === 'SELF' ? 'Your profile' : `You are their ${r.toLowerCase()}`);

export default function FamilyPage() {
  const router = useRouter();
  const [items, setItems] = useState<MyProfile[] | null>(null);

  const load = () => api<MyProfile[]>('/profiles/mine').then(setItems);

  useEffect(() => {
    if (!session.get()) {
      router.replace('/login');
      return;
    }
    load().catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = async (id: string) => {
    await api(`/profiles/${id}/members/accept`, { method: 'POST' });
    await load();
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Your family</h1>
        <Button variant="ghost" size="sm" onClick={() => { session.clear(); router.push('/'); }}>
          Log out
        </Button>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted">Profiles you manage or have been invited to.</p>
        <a href="/profiles/new" className={buttonClass('primary', 'sm')}>
          Create a profile
        </a>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {items === null && <Card className="animate-pulse text-ink-muted">Loading…</Card>}
        {items?.length === 0 && (
          <Card>
            <p>No profiles yet. Create one for yourself or for a son, daughter or sibling.</p>
          </Card>
        )}
        {items?.map(({ profile, access, invitationPending }) => (
          <Card key={profile.id} className="flex items-center justify-between gap-4">
            <div>
              {invitationPending ? (
                <div className="text-lg font-semibold">{profile.fullName}</div>
              ) : (
                <a href={`/profiles/${profile.id}`} className="text-lg font-semibold hover:text-brand-600">
                  {profile.fullName}
                </a>
              )}
              <div className="text-sm text-ink-muted">
                {relationLabel(access.relation)} · {profile.currentCity ? `${profile.currentCity}, ` : ''}
                {profile.currentCountry}
              </div>
              <div className="mt-2 flex gap-2">
                <Badge tone={profile.status === 'LIVE' ? 'verified' : 'neutral'}>{profile.status.replace('_', ' ').toLowerCase()}</Badge>
                <Badge tone="brand">{access.role.toLowerCase()}</Badge>
              </div>
            </div>
            {invitationPending && <Button onClick={() => accept(profile.id)}>Accept invite</Button>}
          </Card>
        ))}
      </div>
    </main>
  );
}
