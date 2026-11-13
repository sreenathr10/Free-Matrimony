import {
  BadgeCheck,
  BarChart3,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  ShieldAlert,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import { Badge, Card, EmptyState, SectionTitle, StaffShell, StatTile } from '@fm/ui';

const nav = [
  { href: '/', label: 'Overview', icon: <LayoutDashboard /> },
  { href: '/members', label: 'Members', icon: <Users /> },
  { href: '/moderation', label: 'Moderation', icon: <ShieldAlert /> },
  { href: '/plans', label: 'Plans and pricing', icon: <CreditCard /> },
  { href: '/staff', label: 'Staff and roles', icon: <UsersRound /> },
  { href: '/campaigns', label: 'Campaigns', icon: <Megaphone /> },
];

const roadmap = [
  { title: 'Staff sign-in and roles', milestone: 'M3' },
  { title: 'Member search and 360 view', milestone: 'M7' },
  { title: 'Plans, pricing and refunds', milestone: 'M6' },
  { title: 'Campaigns: push, email, WhatsApp', milestone: 'M7' },
];

export default function AdminHome() {
  return (
    <StaffShell
      portal="Admin"
      nav={nav}
      active="/"
      title="Overview"
      actions={<Badge tone="gold">Live data arrives with analytics</Badge>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Sign-ups today" value="—" icon={<UserPlus />} tone="brand" />
        <StatTile label="Verified profiles" value="—" icon={<BadgeCheck />} tone="verified" />
        <StatTile label="Paid members" value="—" icon={<CreditCard />} tone="gold" />
        <StatTile label="Revenue this month" value="—" icon={<IndianRupee />} tone="neutral" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle
            title="Growth"
            description="Sign-ups, verifications and conversions by day"
          />
          <div className="mt-6">
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="No data yet"
              body="Charts fill in once members start signing up and the analytics service is connected."
            />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Coming to this portal" />
          <ul className="mt-4 flex flex-col gap-2">
            {roadmap.map((r) => (
              <li
                key={r.title}
                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3 text-sm"
              >
                <span className="font-medium">{r.title}</span>
                <Badge>{r.milestone}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </StaffShell>
  );
}
