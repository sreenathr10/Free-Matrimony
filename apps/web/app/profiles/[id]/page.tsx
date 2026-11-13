'use client';

import {
  Briefcase,
  Cake,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  MessageSquareText,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { use, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { countryName, humanize } from '@fm/shared';
import { Avatar, Badge, Card, PageTransition, ProgressRing, Skeleton, Tabs } from '@fm/ui';
import { AppHeader } from '@/components/AppHeader';
import { FamilyTab } from '@/components/FamilyTab';
import { OverviewTab } from '@/components/OverviewTab';
import { PhotosTab } from '@/components/PhotosTab';
import { PreferencesTab } from '@/components/PreferencesTab';
import { SuggestionsTab } from '@/components/SuggestionsTab';
import { api, session } from '@/lib/api';
import type { ProfileResponse } from '@/lib/types';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'photos', label: 'Photos', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'preferences', label: 'Preferences', icon: <Heart className="h-4 w-4" /> },
  { id: 'family', label: 'Family and access', icon: <Users className="h-4 w-4" /> },
  { id: 'suggestions', label: 'Suggestions', icon: <MessageSquareText className="h-4 w-4" /> },
] as const;
type Tab = (typeof TABS)[number]['id'];

function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}

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

  return (
    <div className="min-h-screen bg-mesh">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-5 py-8">
        {!data ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-12" />
            <Skeleton className="h-64 rounded-card" />
          </div>
        ) : (
          <PageTransition>
            <ProfileView
              data={data}
              id={id}
              created={!!created}
              tab={tab}
              setTab={setTab}
              reload={reload}
            />
          </PageTransition>
        )}
      </main>
    </div>
  );
}

function ProfileView({
  data,
  id,
  created,
  tab,
  setTab,
  reload,
}: {
  data: ProfileResponse;
  id: string;
  created: boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  reload: () => Promise<void>;
}) {
  const { profile, access, completeness } = data;
  const canEdit = access.permissions.EDIT_PROFILE === 'ALLOW';
  const live = profile.status === 'LIVE';
  const place = [profile.currentCity, countryName(profile.currentCountry)]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      {created && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified-soft px-4 py-3 text-sm text-[#05603a] dark:bg-verified/10 dark:text-verified"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Profile created. Next, add photos and partner preferences
            {access.role !== 'CANDIDATE' && ', and invite the candidate from Family and access'}.
          </span>
        </motion.div>
      )}

      <Card className="relative overflow-clip p-0!">
        <div className="h-24 bg-brand-gradient sm:h-28">
          <div className="h-full w-full bg-[radial-gradient(circle_at_85%_20%,rgb(246_207_107/0.55),transparent_45%)]" />
        </div>
        <div className="flex flex-col gap-5 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar
              name={profile.fullName}
              size={88}
              ring
              className="border-4 border-surface-raised"
            />
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight">
                  {profile.fullName}
                </h1>
                <Badge tone={live ? 'verified' : 'neutral'}>{humanize(profile.status)}</Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <Cake className="h-3.5 w-3.5" /> {age(profile.dateOfBirth)} yrs
                </span>
                {profile.occupation && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {profile.occupation}
                  </span>
                )}
                {place && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {place}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
            <ProgressRing
              percent={completeness.percent}
              size={56}
              stroke={6}
              label="Profile strength"
            />
            <div className="text-sm">
              <div className="font-semibold">Profile strength</div>
              <div className="text-ink-muted">
                {completeness.nextSteps.length
                  ? `${completeness.nextSteps.length} steps left`
                  : 'All done'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="sticky top-16 z-10 mt-6 rounded-2xl bg-surface/80 backdrop-blur">
        <Tabs tabs={TABS} active={tab} onChange={setTab} id="profile-tabs" />
      </div>
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-6"
      >
        {tab === 'overview' && <OverviewTab data={data} reload={reload} />}
        {tab === 'photos' && <PhotosTab profileId={id} canEdit={canEdit} onChange={reload} />}
        {tab === 'preferences' && (
          <PreferencesTab profileId={id} canEdit={canEdit} onChange={reload} />
        )}
        {tab === 'family' && <FamilyTab profileId={id} me={access} />}
        {tab === 'suggestions' && (
          <SuggestionsTab profileId={id} canReview={canEdit} onChange={reload} />
        )}
      </motion.div>
    </>
  );
}
