'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { humanize } from '@fm/shared';
import { Badge, Card, Tabs } from '@fm/ui';
import { FamilyTab } from '@/components/FamilyTab';
import { OverviewTab } from '@/components/OverviewTab';
import { PhotosTab } from '@/components/PhotosTab';
import { PreferencesTab } from '@/components/PreferencesTab';
import { SuggestionsTab } from '@/components/SuggestionsTab';
import { api, session } from '@/lib/api';
import type { ProfileResponse } from '@/lib/types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'photos', label: 'Photos' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'family', label: 'Family and access' },
  { id: 'suggestions', label: 'Suggestions' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const created = useSearchParams().get('created');
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<ProfileResponse | null>(null);

  const reload = useCallback(() => api<ProfileResponse>(`/profiles/${id}`).then(setData), [id]);
  useEffect(() => {
    if (!session.get()) return router.replace('/login');
    reload().catch(() => router.replace('/family'));
  }, [reload, router]);

  if (!data) return <main className="mx-auto max-w-3xl px-6 py-12"><Card className="animate-pulse text-ink-muted">Loading…</Card></main>;
  const { profile, access } = data;
  const canEdit = access.permissions.EDIT_PROFILE === 'ALLOW';

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a href="/family" className="text-sm text-ink-muted hover:text-ink">← Your family</a>
      {created && (
        <Card className="mt-6 border-verified/30 bg-verified/5">
          Profile created. Next, add photos and partner preferences{access.role !== 'CANDIDATE' && ', and invite the candidate from Family and access'}.
        </Card>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">{profile.fullName}</h1>
        <Badge tone={profile.status === 'LIVE' ? 'verified' : 'neutral'}>{humanize(profile.status)}</Badge>
      </div>
      <div className="mt-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <div className="mt-6">
        {tab === 'overview' && <OverviewTab data={data} reload={reload} />}
        {tab === 'photos' && <PhotosTab profileId={id} canEdit={canEdit} onChange={reload} />}
        {tab === 'preferences' && <PreferencesTab profileId={id} canEdit={canEdit} onChange={reload} />}
        {tab === 'family' && <FamilyTab profileId={id} me={access} />}
        {tab === 'suggestions' && <SuggestionsTab profileId={id} canReview={canEdit} onChange={reload} />}
      </div>
    </main>
  );
}
