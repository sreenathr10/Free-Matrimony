'use client';

import {
  ArrowRight,
  BadgeCheck,
  Bot,
  ClipboardList,
  Fingerprint,
  Globe2,
  IdCard,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  CHECK_LABELS,
  ID_DOCUMENT_LABELS,
  REJECTION_REASONS,
  countryName,
  humanize,
  type VerificationStatus,
} from '@fm/shared';
import { Avatar, Badge, EmptyState, Skeleton, StatTile, cn, useStaff } from '@fm/ui';
import { age, ago, since, type QueueItem, type Stats } from '@/lib/types';

/** The list of verifications for one view of the queue. */
export function QueueList({
  status,
  flagged,
  showStats,
}: {
  status: VerificationStatus;
  flagged?: boolean;
  showStats?: boolean;
}) {
  const { client } = useStaff();
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams({
      status,
      ...(flagged === undefined ? {} : { flagged: String(flagged) }),
    });
    client.api<QueueItem[]>(`/staff/verifications?${q}`).then(setItems, (e) => setError(e.message));
    if (showStats) client.api<Stats>('/staff/verifications/stats').then(setStats, () => undefined);
  }, [client, status, flagged, showStats]);

  const waiting = status === 'IN_REVIEW';

  return (
    <div className="flex flex-col gap-6">
      {showStats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Waiting"
            value={stats ? String(stats.waiting) : '…'}
            icon={<ClipboardList />}
            tone="brand"
            hint="Oldest first"
          />
          <StatTile
            label="Flagged by checks"
            value={stats ? String(stats.flagged) : '…'}
            icon={<Bot />}
            tone="gold"
          />
          <StatTile
            label="Approved today"
            value={stats ? String(stats.approvedToday) : '…'}
            icon={<BadgeCheck />}
            tone="verified"
          />
          <StatTile
            label="Rejected today"
            value={stats ? String(stats.rejectedToday) : '…'}
            icon={<XCircle />}
            tone="neutral"
          />
        </div>
      )}

      {error && <p className="text-sm text-brand-600">{error}</p>}
      {!items ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Fingerprint className="h-6 w-6" />}
          title={waiting ? 'The queue is empty' : 'Nothing here yet'}
          body={
            waiting
              ? 'New profiles appear here once the candidate consents and the family submits.'
              : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((v, i) => (
            <motion.li
              key={v.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.03 }}
            >
              <a
                href={`/review/${v.id}`}
                className="group flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift md:flex-row md:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Avatar name={v.profile.fullName} size={48} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">{v.profile.fullName}</span>
                      {v.flagged && waiting && (
                        <Badge tone="gold" icon={<Bot className="h-3 w-3" />}>
                          Needs a closer look
                        </Badge>
                      )}
                      {v.status === 'APPROVED' && <Badge tone="verified">Approved</Badge>}
                      {v.status === 'REJECTED' && <Badge tone="neutral">Rejected</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                      <span>
                        {age(v.profile.dateOfBirth)} · {humanize(v.profile.gender)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Globe2 className="h-3.5 w-3.5" />{' '}
                        {[v.profile.currentCity, countryName(v.profile.currentCountry)]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                      {v.idDocumentType && (
                        <span className="inline-flex items-center gap-1">
                          <IdCard className="h-3.5 w-3.5" /> {ID_DOCUMENT_LABELS[v.idDocumentType]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 md:max-w-xs md:justify-end">
                  {waiting &&
                    v.issues.map((c) => (
                      <span
                        key={c.key}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          c.result === 'FAIL'
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                            : 'bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300',
                        )}
                      >
                        {CHECK_LABELS[c.key]}
                      </span>
                    ))}
                  {v.status === 'REJECTED' && v.rejectionReason && (
                    <span className="text-xs text-ink-muted">
                      {REJECTION_REASONS[v.rejectionReason].split('.')[0]}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 md:w-44 md:justify-end">
                  <span className="text-sm text-ink-muted">
                    {waiting
                      ? since(v.submittedAt) === 'just now'
                        ? 'Just arrived'
                        : `Waiting ${since(v.submittedAt)}`
                      : v.decidedAt
                        ? `${ago(v.decidedAt)} · ${v.reviewerName ?? ''}`
                        : ''}
                  </span>
                  <ArrowRight className="h-5 w-5 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
                </div>
              </a>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
