import { Card, StaffShell, StatTile } from '@fm/ui';

const nav = [
  { href: '/', label: 'Overview' },
  { href: '/members', label: 'Members' },
  { href: '/moderation', label: 'Moderation' },
  { href: '/plans', label: 'Plans and pricing' },
  { href: '/staff', label: 'Staff and roles' },
  { href: '/campaigns', label: 'Campaigns' },
];

export default function AdminHome() {
  return (
    <StaffShell portal="Admin" nav={nav} active="/">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 text-ink-muted">Live numbers arrive once the analytics service is connected.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Sign-ups today" value="—" />
        <StatTile label="Verified profiles" value="—" />
        <StatTile label="Paid members" value="—" />
        <StatTile label="Revenue this month" value="—" />
      </div>
      <Card className="mt-6">
        <h2 className="font-semibold">Next up</h2>
        <p className="mt-1 text-sm text-ink-muted">Staff login, member search and plan management are in the next milestone.</p>
      </Card>
    </StaffShell>
  );
}
