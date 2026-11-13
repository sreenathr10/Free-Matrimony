import { Card, StaffShell, StatTile } from '@fm/ui';

const nav = [
  { href: '/', label: 'Inbox' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/reports', label: 'Reports and disputes' },
  { href: '/members', label: 'Member lookup' },
  { href: '/replies', label: 'Saved replies' },
];

export default function SupportHome() {
  return (
    <StaffShell portal="Customer Service" nav={nav} active="/">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <p className="mt-1 text-ink-muted">Tickets, member reports and refund requests in one queue.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Open tickets" value="—" />
        <StatTile label="Reports to review" value="—" hint="Target: within 24 hours" />
        <StatTile label="Average first reply" value="—" />
      </div>
      <Card className="mt-6">
        <p className="text-sm text-ink-muted">The ticket queue and member 360 view are in the next milestone.</p>
      </Card>
    </StaffShell>
  );
}
