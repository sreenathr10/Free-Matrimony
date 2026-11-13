'use client';

import {
  BadgeCheck,
  Camera,
  Check,
  Clock,
  IdCard,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ID_DOCUMENT_LABELS,
  ID_DOCUMENT_TYPES,
  PHOTO_CONTENT_TYPES,
  idNeedsBack,
  type IdDocumentType,
  type VerificationFile,
} from '@fm/shared';
import { Button, Card, Field, Select, cn } from '@fm/ui';
import { api, ApiError, putToSignedUrl } from '@/lib/api';
import type { ProfileResponse } from '@/lib/types';

interface Summary {
  id: string;
  status: 'COLLECTING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  idDocumentType: IdDocumentType | null;
  files: Record<VerificationFile, boolean>;
  submittedAt: string | null;
  rejection: { reason: string; message: string; note: string | null } | null;
}

/** Suggest the ID people are most likely to have, by where they live. */
const defaultIdFor = (country: string): IdDocumentType =>
  country === 'IN' ? 'AADHAAR' : country === 'AE' ? 'EMIRATES_ID' : 'PASSPORT';

/**
 * The path from draft to live: consent, the candidate's selfie and ID, then submit.
 * Only the candidate can give consent or upload identity documents; the family can see progress and submit.
 */
export function VerificationCard({ data, reload }: { data: ProfileResponse; reload: () => void }) {
  const { profile, access } = data;
  const isCandidate = access.role === 'CANDIDATE';
  const canSubmit = access.permissions.EDIT_PROFILE === 'ALLOW';
  const [v, setV] = useState<Summary | null | undefined>(undefined);
  const [idType, setIdType] = useState<IdDocumentType>(defaultIdFor(profile.currentCountry));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api<Summary | Record<string, never>>(`/profiles/${profile.id}/verification`).then((r) => {
        const s = 'id' in r ? (r as Summary) : null;
        setV(s);
        if (s?.idDocumentType) setIdType(s.idDocumentType);
      }),
    [profile.id],
  );
  useEffect(() => {
    void load();
  }, [load, profile.status]);

  const fail = (e: unknown) =>
    setError(
      e instanceof ApiError ? e.friendly : e instanceof Error ? e.message : 'Something went wrong',
    );

  async function upload(file: VerificationFile, blob: File) {
    setBusy(file);
    setError(null);
    try {
      const { upload } = await api<{ upload: { url: string; headers: Record<string, string> } }>(
        `/profiles/${profile.id}/verification/uploads`,
        {
          method: 'POST',
          body: JSON.stringify({ file, contentType: blob.type, sizeBytes: blob.size }),
        },
      );
      await putToSignedUrl(upload, blob);
      setV(
        await api<Summary>(`/profiles/${profile.id}/verification/uploads/${file}/confirm`, {
          method: 'POST',
        }),
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function post(path: string, body?: object) {
    setBusy(path);
    setError(null);
    try {
      await api(`/profiles/${profile.id}/${path}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      await load();
      reload();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  if (profile.status === 'LIVE' || profile.status === 'HIDDEN') {
    return (
      <Banner tone="verified" icon={<BadgeCheck className="h-5 w-5" />} title="Verified">
        Our team checked {isCandidate ? 'your' : 'the candidate’s'} selfie and ID
        {profile.verifiedAt &&
          ` on ${new Date(profile.verifiedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`}
        . The profile shows a verified badge to matches.
      </Banner>
    );
  }
  if (profile.status === 'PENDING_VERIFICATION') {
    return (
      <Banner tone="gold" icon={<Clock className="h-5 w-5" />} title="In review">
        Our verification team is checking the selfie and ID. This usually takes less than a day. The
        profile goes live as soon as it is approved.
      </Banner>
    );
  }
  if (profile.status !== 'DRAFT' || v === undefined) return null;

  const consented = !!profile.candidateConsentAt;
  const files =
    v?.status === 'COLLECTING' ? v.files : { SELFIE: false, ID_FRONT: false, ID_BACK: false };
  const needsBack = idNeedsBack(idType);
  const ready = consented && files.SELFIE && files.ID_FRONT && (!needsBack || files.ID_BACK);

  return (
    <Card variant="feature">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">Get verified to go live</h2>
          <p className="text-sm text-ink-muted">
            Every profile is checked with a live selfie and a government ID. Documents are only seen
            by our verification team and are never shown to matches.
          </p>
        </div>
      </div>

      {v?.status === 'REJECTED' && v.rejection && (
        <div className="relative mt-5 flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm dark:border-brand-900 dark:bg-brand-950/40">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div>
            <div className="font-semibold text-brand-700 dark:text-brand-300">
              The last attempt was not approved
            </div>
            <p className="mt-0.5">{v.rejection.message}</p>
            {v.rejection.note && (
              <p className="mt-1 text-ink-muted">Note from our team: {v.rejection.note}</p>
            )}
          </div>
        </div>
      )}

      <ol className="relative mt-6 flex flex-col gap-3">
        <Step
          n={1}
          done={consented}
          title="Candidate’s consent"
          detail={
            consented
              ? 'Given'
              : isCandidate
                ? 'Agree to your profile being shown to matches'
                : 'Waiting for the candidate'
          }
        >
          {isCandidate && !consented && (
            <Button
              size="sm"
              loading={busy === 'consent'}
              onClick={() => post('consent')}
              icon={<Check className="h-4 w-4" />}
            >
              I consent
            </Button>
          )}
        </Step>

        <Step
          n={2}
          done={files.SELFIE}
          title="Live selfie"
          detail={
            files.SELFIE
              ? 'Uploaded'
              : isCandidate
                ? 'Face the camera in good light, without sunglasses'
                : 'The candidate takes this on their phone'
          }
        >
          {isCandidate && consented && (
            <FilePick
              label={files.SELFIE ? 'Retake' : 'Take selfie'}
              icon={<Camera className="h-4 w-4" />}
              capture="user"
              busy={busy === 'SELFIE'}
              onFile={(f) => upload('SELFIE', f)}
            />
          )}
        </Step>

        <Step
          n={3}
          done={files.ID_FRONT && (!needsBack || files.ID_BACK)}
          title="Government ID"
          detail={
            isCandidate
              ? 'Photograph it flat with all corners visible'
              : 'The candidate uploads this'
          }
        >
          {isCandidate && consented && (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
              <div className="w-full sm:w-56">
                <Field label="Document">
                  <Select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as IdDocumentType)}
                    options={ID_DOCUMENT_TYPES.map((t) => ({
                      value: t,
                      label: ID_DOCUMENT_LABELS[t],
                    }))}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilePick
                  label={
                    files.ID_FRONT
                      ? needsBack
                        ? 'Front ✓'
                        : 'Page ✓'
                      : needsBack
                        ? 'Front'
                        : 'Photo page'
                  }
                  icon={<IdCard className="h-4 w-4" />}
                  capture="environment"
                  done={files.ID_FRONT}
                  busy={busy === 'ID_FRONT'}
                  onFile={(f) => upload('ID_FRONT', f)}
                />
                {needsBack && (
                  <FilePick
                    label={files.ID_BACK ? 'Back ✓' : 'Back'}
                    icon={<IdCard className="h-4 w-4" />}
                    capture="environment"
                    done={files.ID_BACK}
                    busy={busy === 'ID_BACK'}
                    onFile={(f) => upload('ID_BACK', f)}
                  />
                )}
              </div>
            </div>
          )}
        </Step>
      </ol>

      {error && <p className="relative mt-4 text-sm font-medium text-brand-600">{error}</p>}

      <div className="relative mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-ink-faint">
          <Lock className="h-3.5 w-3.5" /> Encrypted, with location data removed from every image.
        </p>
        {canSubmit && (
          <Button
            disabled={!ready}
            loading={busy === 'submit'}
            onClick={() => post('submit', { idDocumentType: idType })}
            icon={<Send className="h-4 w-4" />}
          >
            Submit for verification
          </Button>
        )}
      </div>
    </Card>
  );
}

function Step({
  n,
  done,
  title,
  detail,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <motion.li
      layout
      className="flex flex-col gap-3 rounded-2xl bg-surface-sunken p-4 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-3">
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
            done
              ? 'bg-verified text-white'
              : 'border border-line-strong bg-surface-raised text-ink-muted',
          )}
        >
          {done ? <Check className="h-4 w-4" /> : n}
        </span>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-ink-muted">{detail}</div>
        </div>
      </div>
      {children}
    </motion.li>
  );
}

function FilePick({
  label,
  icon,
  capture,
  busy,
  done,
  onFile,
}: {
  label: string;
  icon: ReactNode;
  capture: 'user' | 'environment';
  busy?: boolean;
  done?: boolean;
  onFile: (f: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        size="sm"
        variant={done ? 'secondary' : 'primary'}
        loading={busy}
        onClick={() => input.current?.click()}
        icon={done ? <Upload className="h-4 w-4" /> : icon}
      >
        {label}
      </Button>
      <input
        ref={input}
        type="file"
        hidden
        accept={PHOTO_CONTENT_TYPES.join(',')}
        capture={capture}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
}

function Banner({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'verified' | 'gold';
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex gap-4 rounded-card border p-5',
        tone === 'verified'
          ? 'border-verified/30 bg-verified-soft text-[#05603a] dark:bg-verified/10 dark:text-verified'
          : 'border-gold-300/50 bg-gold-100 text-gold-600 dark:bg-gold-500/10 dark:text-gold-300',
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white',
          tone === 'verified' ? 'bg-verified' : 'bg-gold-gradient',
        )}
      >
        {icon}
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm opacity-90">{children}</p>
      </div>
    </div>
  );
}
