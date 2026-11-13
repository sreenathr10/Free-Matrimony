'use client';

import {
  BadgeCheck,
  BarChart3,
  ClipboardList,
  CreditCard,
  IndianRupee,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, Card, EmptyState, SectionTitle, StatTile, useStaff } from '@fm/ui';
import { Portal } from '@/components/Portal';

const roadmap = [
  { title: 'Member search and 360 view', milestone: 'M7' },
  { title: 'Plans, pricing and refunds', milestone: 'M6' },
  { title: 'Campaigns: push, email, WhatsApp', milestone: 'M7' },
];

interface VerificationStats {
  waiting: number;
  flagged: number;
  approvedToday: number;
  rejectedToday: number;
}

function Overview() {
  const { client } = useStaff();
  const [v, setV] = useState<VerificationStats | null>(null);
  useEffect(() => {
    client.api<VerificationStats>('/staff/verifications/stats').then(setV, () => undefined);
  }, [client]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Waiting for verification"
          value={v ? String(v.waiting) : '…'}
          hint={v ? `${v.flagged} flagged by checks` : undefined}
          icon={<ClipboardList />}
          tone="brand"
        />
        <StatTile
          label="Verified today"
          value={v ? String(v.approvedToday) : '…'}
          hint={v ? `${v.rejectedToday} rejected` : undefined}
          icon={<BadgeCheck />}
          tone="verified"
        />
        <StatTile
          label="Sign-ups today"
          value="—"
          hint="Arrives with analytics"
          icon={<UserPlus />}
          tone="gold"
        />
        <StatTile
          label="Revenue this month"
          value="—"
          hint="Arrives with payments (M6)"
          icon={<IndianRupee />}
          tone="neutral"
        />
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
    </>
  );
}

export default function AdminHome() {
  return (
    <Portal
      title="Overview"
      actions={
        <Badge tone="gold" icon={<CreditCard className="h-3 w-3" />}>
          Payments arrive in M6
        </Badge>
      }
    >
      <Overview />
    </Portal>
  );
}
