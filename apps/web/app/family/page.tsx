'use client';

import { ArrowRight, Clock, HeartHandshake, MapPin, Plus, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { countryName, humanize, type AccessLevel, type Permission } from '@fm/shared';
import { Avatar, Badge, Button, EmptyState, PageTransition, Skeleton, buttonClass } from '@fm/ui';
import { AppHeader } from '@/components/AppHeader';
import { api, session } from '@/lib/api';

interface MyProfile {
  profile: {
    id: string;
    fullName: string;
    status: string;
    currentCity: string | null;
    currentCountry: string;
  };
  invitationPending: boolean;
  access: { relation: string; role: string; permissions: Record<Permission, AccessLevel> };
}

const relationLabel = (r: string) =>
  r === 'SELF' ? 'Your own profile' : `You are their ${r.toLowerCase()}`;

function StatusBadge({ status }: { status: string }) {
  if (status === 'LIVE')
    return (
      <Badge tone="verified" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        Live and verified
      </Badge>
    );
  if (status === 'PENDING_VERIFICATION')
    return (
      <Badge tone="warning" icon={<Clock className="h-3.5 w-3.5" />}>
        Being verified
      </Badge>
    );
  return <Badge>{humanize(status)}</Badge>;
}

export default function FamilyPage() {
  const router = useRouter();
  const [items, setItems] = useState<MyProfile[] | null>(null);
  const load = () => api<MyProfile[]>('/profiles/mine').then(setItems);

  useEffect(() => {
    if (!session.get()) return router.replace('/login');
    load().catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = async (id: string) => {
    await api(`/profiles/${id}/members/accept`, { method: 'POST' });
    await load();
  };

  return (
    <div className="min-h-screen bg-mesh">
      <AppHeader />
      <PageTransition className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
              Your family
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Profiles you look after
            </h1>
            <p className="mt-2 text-ink-muted">
              Your own profile, and those you help with for a son, daughter or sibling.
            </p>
          </div>
          <a href="/profiles/new" className={buttonClass('primary')}>
            <Plus className="h-4 w-4" /> Create a profile
          </a>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items === null &&
            [0, 1].map((i) => (
              <div key={i} className="rounded-card border border-line bg-surface-raised p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>
            ))}

          {items?.length === 0 && (
            <div className="md:col-span-2">
              <EmptyState
                icon={<HeartHandshake className="h-7 w-7" />}
                title="No profiles yet"
                body="Create one for yourself, or for a son, daughter or sibling. It takes about five minutes."
                action={
                  <a href="/profiles/new" className={buttonClass('primary')}>
                    Create the first profile <ArrowRight className="h-4 w-4" />
                  </a>
                }
              />
            </div>
          )}

          {items?.map(({ profile, access, invitationPending }, i) => {
            const body = (
              <>
                <div className="flex items-start gap-4">
                  <Avatar name={profile.fullName} size={64} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xl font-semibold tracking-tight">
                      {profile.fullName}
                    </div>
                    <div className="mt-0.5 text-sm text-ink-muted">
                      {relationLabel(access.relation)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                      <MapPin className="h-3.5 w-3.5" />
                      {[profile.currentCity, countryName(profile.currentCountry)]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                  {!invitationPending && (
                    <ArrowRight className="h-5 w-5 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
                  )}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <StatusBadge status={profile.status} />
                  <Badge tone="brand">
                    {access.role === 'CANDIDATE' ? 'You' : humanize(access.role)}
                  </Badge>
                  {invitationPending && (
                    <Button size="sm" className="ml-auto" onClick={() => accept(profile.id)}>
                      Accept invitation
                    </Button>
                  )}
                </div>
              </>
            );
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {invitationPending ? (
                  <div className="rounded-card border-2 border-dashed border-brand-200 bg-surface-raised p-6">
                    {body}
                  </div>
                ) : (
                  <a
                    href={`/profiles/${profile.id}`}
                    className="group block rounded-card border border-line bg-surface-raised p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
                  >
                    {body}
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      </PageTransition>
    </div>
  );
}
