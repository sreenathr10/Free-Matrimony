import {
  BadgeCheck,
  Bot,
  CheckCircle2,
  ClipboardList,
  Copy,
  Fingerprint,
  History,
  IdCard,
  ImageOff,
  ListChecks,
  ScanFace,
  Sparkles,
} from 'lucide-react';
import { Card, EmptyState, SectionTitle, StaffShell, StatTile } from '@fm/ui';

const nav = [
  { href: '/', label: 'Queue', icon: <ListChecks /> },
  { href: '/flagged', label: 'AI flagged', icon: <Sparkles /> },
  { href: '/completed', label: 'Completed', icon: <CheckCircle2 /> },
  { href: '/audit', label: 'Audit trail', icon: <History /> },
];

const checks = [
  {
    label: 'Selfie liveness',
    body: 'A live selfie, matched to the profile photos',
    icon: <ScanFace className="h-5 w-5" />,
  },
  {
    label: 'Government ID',
    body: 'Aadhaar, passport or Emirates ID',
    icon: <IdCard className="h-5 w-5" />,
  },
  {
    label: 'Photo authenticity',
    body: 'No AI-generated or stock photos',
    icon: <ImageOff className="h-5 w-5" />,
  },
  {
    label: 'Duplicate account',
    body: 'Same face or ID on another profile',
    icon: <Copy className="h-5 w-5" />,
  },
];

export default function VerificationHome() {
  return (
    <StaffShell portal="Verification" nav={nav} active="/" title="Verification queue">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Waiting" value="—" icon={<ClipboardList />} tone="brand" />
        <StatTile label="Flagged by AI" value="—" icon={<Bot />} tone="gold" />
        <StatTile label="Approved today" value="—" icon={<BadgeCheck />} tone="verified" />
      </div>
      <Card className="mt-6">
        <SectionTitle
          title="Checks for every profile"
          description="Each profile passes all four before it goes live with a verified badge."
        />
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {checks.map((c, i) => (
            <li
              key={c.label}
              className="relative rounded-2xl border border-line bg-surface-sunken p-4"
            >
              <span className="absolute right-4 top-4 font-display text-2xl font-semibold text-ink-faint/50">
                {i + 1}
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
                {c.icon}
              </span>
              <div className="mt-3 font-semibold">{c.label}</div>
              <p className="mt-0.5 text-sm text-ink-muted">{c.body}</p>
            </li>
          ))}
        </ol>
      </Card>
      <div className="mt-6">
        <EmptyState
          icon={<Fingerprint className="h-6 w-6" />}
          title="The queue is empty"
          body="Profiles appear here once the candidate consents and submits. The review screen and KYC provider arrive in M3."
        />
      </div>
    </StaffShell>
  );
}
