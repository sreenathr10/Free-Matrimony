import { Badge, Card, StaffShell, StatTile } from '@fm/ui';

const nav = [
  { href: '/', label: 'Queue' },
  { href: '/flagged', label: 'AI flagged' },
  { href: '/completed', label: 'Completed' },
  { href: '/audit', label: 'Audit trail' },
];

const checks = ['Selfie liveness', 'Government ID', 'Photo authenticity', 'Duplicate account'];

export default function VerificationHome() {
  return (
    <StaffShell portal="Verification" nav={nav} active="/">
      <h1 className="text-2xl font-semibold">Verification queue</h1>
      <p className="mt-1 text-ink-muted">Profiles submitted with the candidate’s consent, waiting for checks.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Waiting" value="—" />
        <StatTile label="Flagged by AI" value="—" />
        <StatTile label="Approved today" value="—" />
      </div>
      <Card className="mt-6">
        <h2 className="font-semibold">Checks per profile</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {checks.map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-muted">The review screen and KYC provider hookup are in the next milestone.</p>
      </Card>
    </StaffShell>
  );
}
