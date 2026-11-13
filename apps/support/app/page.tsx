import {
  BookText,
  Clock,
  Flag,
  Inbox,
  LifeBuoy,
  MessageCircleReply,
  Search,
  Ticket,
  UserSearch,
} from 'lucide-react';
import { Card, EmptyState, StaffShell, StatTile, cn } from '@fm/ui';

const nav = [
  { href: '/', label: 'Inbox', icon: <Inbox /> },
  { href: '/tickets', label: 'Tickets', icon: <Ticket /> },
  { href: '/reports', label: 'Reports and disputes', icon: <Flag /> },
  { href: '/members', label: 'Member lookup', icon: <UserSearch /> },
  { href: '/replies', label: 'Saved replies', icon: <BookText /> },
];

const filters = ['All', 'Unassigned', 'Mine', 'Reports', 'Refunds'];

export default function SupportHome() {
  return (
    <StaffShell portal="Customer Service" nav={nav} active="/" title="Inbox">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Open tickets" value="—" icon={<Ticket />} tone="brand" />
        <StatTile
          label="Reports to review"
          value="—"
          hint="Target: within 24 hours"
          icon={<Flag />}
          tone="gold"
        />
        <StatTile label="Average first reply" value="—" icon={<Clock />} tone="verified" />
      </div>
      <Card className="mt-6 p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          {filters.map((f, i) => (
            <button
              key={f}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                i === 0
                  ? 'bg-ink text-surface'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              {f}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              placeholder="Filter by name or phone"
              className="h-9 rounded-full border border-line bg-surface-sunken pl-9 pr-4 text-sm outline-none focus:border-brand-300"
            />
          </div>
        </div>
        <div className="p-6">
          <EmptyState
            icon={<LifeBuoy className="h-6 w-6" />}
            title="Inbox zero"
            body="Tickets, member reports and refund requests land here in one queue once the help centre goes live."
          />
        </div>
      </Card>
      <Card className="mt-6 flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-gradient text-white">
          <MessageCircleReply className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-muted">
          The ticket queue, member 360 view and saved replies arrive with the support milestone.
        </p>
      </Card>
    </StaffShell>
  );
}
