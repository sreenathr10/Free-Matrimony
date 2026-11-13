'use client';

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  History,
  IdCard,
  ScanFace,
  ShieldAlert,
  X,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@fm/client';
import {
  CHECK_LABELS,
  ID_DOCUMENT_LABELS,
  REJECTION_REASONS,
  REJECTION_REASON_KEYS,
  countryName,
  humanize,
  type CheckOutcome,
  type RejectionReason,
} from '@fm/shared';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  SectionTitle,
  Select,
  Skeleton,
  Textarea,
  cn,
  useStaff,
} from '@fm/ui';
import { age, ago, type Detail, type QueueItem } from '@/lib/types';

const resultStyle = {
  PASS: { icon: CheckCircle2, cls: 'text-verified', label: 'Pass' },
  REVIEW: { icon: AlertTriangle, cls: 'text-gold-500', label: 'Check' },
  FAIL: { icon: XCircle, cls: 'text-brand-600', label: 'Fail' },
} as const;

const REASON_LABELS: Record<RejectionReason, string> = {
  SELFIE_UNCLEAR: 'Selfie unclear',
  FACE_MISMATCH: 'Face does not match photos',
  ID_UNREADABLE: 'ID unreadable',
  ID_MISMATCH: 'Name or date of birth do not match',
  PHOTOS_NOT_GENUINE: 'Photos not genuine',
  DUPLICATE_ACCOUNT: 'Duplicate account',
  UNDERAGE: 'Under age',
  OTHER: 'Other',
};

export function Review({ id }: { id: string }) {
  const { client } = useStaff();
  const router = useRouter();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<{ url: string; label: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<RejectionReason>('SELFIE_UNCLEAR');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const load = useCallback(
    () => client.api<Detail>(`/staff/verifications/${id}`).then(setD, (e) => setError(e.message)),
    [client, id],
  );
  useEffect(() => {
    void load();
  }, [load]);

  /** After a decision, go straight to the next profile waiting, oldest first. */
  async function next() {
    const queue = await client.api<QueueItem[]>('/staff/verifications?status=IN_REVIEW');
    const nextItem = queue.find((q) => q.id !== id);
    router.push(nextItem ? `/review/${nextItem.id}` : '/');
  }

  async function decide(decision: 'APPROVE' | 'REJECT') {
    setBusy(decision === 'APPROVE' ? 'approve' : 'reject');
    setError(null);
    try {
      await client.api(`/staff/verifications/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify(
          decision === 'APPROVE'
            ? { decision, note: note || undefined }
            : { decision, reason, note: note || undefined },
        ),
      });
      await next();
    } catch (e) {
      setError(e instanceof ApiError ? e.friendly : 'Could not save the decision');
      setBusy(null);
    }
  }

  if (!d) {
    return error ? (
      <p className="text-brand-600">{error}</p>
    ) : (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-[32rem] rounded-card" />
        <Skeleton className="h-[32rem] rounded-card" />
      </div>
    );
  }

  const p = d.profile;
  const open = d.status === 'IN_REVIEW';

  return (
    <div>
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Queue
      </a>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar name={p.fullName} size={56} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{p.fullName}</h1>
            {d.status === 'APPROVED' && (
              <Badge tone="verified" icon={<BadgeCheck className="h-3 w-3" />}>
                Approved
              </Badge>
            )}
            {d.status === 'REJECTED' && <Badge>Rejected</Badge>}
            {open && d.flagged && (
              <Badge tone="gold" icon={<ShieldAlert className="h-3 w-3" />}>
                Needs a closer look
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Submitted {ago(d.submittedAt)} ·{' '}
            {d.idDocumentType ? ID_DOCUMENT_LABELS[d.idDocumentType] : 'No ID type'} ·{' '}
            {d.provider === 'mock' ? 'Development checks' : d.provider}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Evidence */}
        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle
              title="Compare faces"
              description="The live selfie next to the profile photos."
            />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Doc
                url={d.documents.selfie}
                label="Live selfie"
                icon={<ScanFace className="h-3.5 w-3.5" />}
                highlight
                onZoom={setZoom}
              />
              {d.photos.slice(0, 5).map((ph, i) => (
                <Doc
                  key={ph.id}
                  url={ph.url}
                  label={ph.isPrimary ? 'Main photo' : `Photo ${i + 1}`}
                  onZoom={setZoom}
                />
              ))}
              {d.photos.length === 0 && (
                <div className="grid aspect-[3/4] place-items-center rounded-2xl border-2 border-dashed border-line-strong p-4 text-center text-sm text-ink-muted">
                  No profile photos yet
                </div>
              )}
            </div>
          </Card>
          <Card>
            <SectionTitle
              title="Government ID"
              description={`Check the name and date of birth: ${p.fullName}, ${new Date(p.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Doc
                url={d.documents.idFront}
                label="Front"
                icon={<IdCard className="h-3.5 w-3.5" />}
                wide
                onZoom={setZoom}
              />
              {d.documents.idBack && (
                <Doc
                  url={d.documents.idBack}
                  label="Back"
                  icon={<IdCard className="h-3.5 w-3.5" />}
                  wide
                  onZoom={setZoom}
                />
              )}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-faint">
              <Clock className="h-3.5 w-3.5" /> Document links expire after{' '}
              {Math.round(d.documents.expiresInSeconds / 60)} minutes. Reload the page for fresh
              ones. Viewing is recorded.
            </p>
          </Card>
        </div>

        {/* Facts and decision */}
        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle title="Automatic checks" />
            <ul className="mt-4 flex flex-col gap-2">
              {d.checks.map((c) => (
                <CheckRow key={c.key} check={c} />
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle title="Profile" />
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {(
                [
                  ['Age', `${age(p.dateOfBirth)} (${p.dateOfBirth})`],
                  ['Gender', humanize(p.gender)],
                  ['Religion', humanize(p.religion)],
                  ['Community', [p.community, p.subCaste].filter(Boolean).join(' · ') || null],
                  ['Marital status', humanize(p.maritalStatus)],
                  ['Native district', p.nativeDistrict && humanize(p.nativeDistrict)],
                  [
                    'Lives in',
                    [p.currentCity, countryName(p.currentCountry)].filter(Boolean).join(', '),
                  ],
                  ['Occupation', p.occupation],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-ink-faint">{k}</dt>
                  <dd className="font-medium">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {open ? (
            <Card variant="feature" className="sticky top-24">
              <SectionTitle title="Decision" />
              <AnimatePresence initial={false}>
                {rejecting && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex flex-col gap-4">
                      <Field label="Reason">
                        <Select
                          value={reason}
                          onChange={(e) => setReason(e.target.value as RejectionReason)}
                          options={REJECTION_REASON_KEYS.map((k) => ({
                            value: k,
                            label: REASON_LABELS[k],
                          }))}
                        />
                      </Field>
                      <p className="rounded-xl bg-surface-sunken px-3 py-2 text-sm text-ink-muted">
                        <span className="font-semibold text-ink">The family will see: </span>
                        {REJECTION_REASONS[reason]}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-4">
                <Field
                  label="Note"
                  hint={rejecting ? 'Shown to the family' : 'Optional, for the audit trail'}
                >
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    rows={2}
                  />
                </Field>
              </div>
              {error && <p className="mt-3 text-sm font-medium text-brand-600">{error}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                {rejecting ? (
                  <>
                    <Button
                      variant="primary"
                      loading={busy === 'reject'}
                      onClick={() => decide('REJECT')}
                      icon={<XCircle className="h-4 w-4" />}
                    >
                      Reject and notify
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setRejecting(false)}
                      icon={<X className="h-4 w-4" />}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => decide('APPROVE')}
                      disabled={!!busy}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-verified px-5 font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-60"
                    >
                      <BadgeCheck className="h-5 w-5" />{' '}
                      {busy === 'approve' ? 'Approving…' : 'Approve and go live'}
                    </button>
                    <Button
                      variant="secondary"
                      onClick={() => setRejecting(true)}
                      icon={<XCircle className="h-4 w-4" />}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <SectionTitle
                title={d.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                description={d.decidedAt ? ago(d.decidedAt) : undefined}
              />
              {d.rejectionReason && (
                <p className="mt-3 text-sm">{REJECTION_REASONS[d.rejectionReason]}</p>
              )}
              {d.reviewerNote && (
                <p className="mt-2 text-sm text-ink-muted">Note: {d.reviewerNote}</p>
              )}
            </Card>
          )}

          <Card>
            <SectionTitle
              title="History"
              description={
                d.previous.length ? `${d.previous.length} earlier attempt(s)` : 'First attempt'
              }
            />
            <ol className="mt-4 flex flex-col gap-3 border-l border-line pl-4">
              {d.history.slice(0, 12).map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface-raised bg-brand-400" />
                  <span className="font-medium">{humanize(h.action.replace(/[._]/g, '_'))}</span>
                  <span className="text-ink-muted">
                    {' '}
                    · {h.actorName ?? 'System'} · {ago(h.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
              <History className="h-3.5 w-3.5" /> From the audit log
            </p>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {zoom && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
          >
            <motion.figure
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="max-h-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoom.url}
                alt={zoom.label}
                className="max-h-[85vh] rounded-2xl object-contain"
              />
              <figcaption className="mt-3 flex items-center justify-between text-sm text-white/80">
                {zoom.label}
                <button
                  onClick={() => setZoom(null)}
                  className="inline-flex items-center gap-1 font-semibold text-white"
                >
                  <X className="h-4 w-4" /> Close
                </button>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Doc({
  url,
  label,
  icon,
  highlight,
  wide,
  onZoom,
}: {
  url: string | null;
  label: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  wide?: boolean;
  onZoom: (z: { url: string; label: string }) => void;
}) {
  if (!url) return null;
  return (
    <button
      onClick={() => onZoom({ url, label })}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-line text-left',
        wide ? 'aspect-[3/2]' : 'aspect-[3/4]',
        highlight ? 'border-brand-400 ring-2 ring-brand-400/40' : 'border-line',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
        {icon}
        {label}
      </span>
      <ZoomIn className="absolute bottom-2 right-2 h-5 w-5 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function CheckRow({ check }: { check: CheckOutcome }) {
  const s = resultStyle[check.result];
  const Icon = s.icon;
  return (
    <li
      className={cn(
        'flex gap-3 rounded-2xl px-3 py-2.5',
        check.result === 'PASS' ? 'bg-surface-sunken' : 'bg-gold-100/60 dark:bg-gold-500/10',
        check.result === 'FAIL' && 'bg-brand-50 dark:bg-brand-950/40',
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', s.cls)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{CHECK_LABELS[check.key]}</span>
          {check.score !== undefined && (
            <span className="text-xs tabular-nums text-ink-muted">
              {Math.round(check.score * 100)}%
            </span>
          )}
        </div>
        <p className="text-xs text-ink-muted">{check.detail}</p>
      </div>
    </li>
  );
}
