'use client';

import { BadgeCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Tabs } from '@fm/ui';
import { Portal } from '@/components/Portal';
import { QueueList } from '@/components/QueueList';

const tabs = [
  { id: 'APPROVED', label: 'Approved', icon: <BadgeCheck className="h-4 w-4" /> },
  { id: 'REJECTED', label: 'Rejected', icon: <XCircle className="h-4 w-4" /> },
] as const;

export default function CompletedPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('APPROVED');
  return (
    <Portal title="Completed">
      <div className="mb-6 max-w-xs">
        <Tabs tabs={tabs} active={tab} onChange={setTab} id="completed" />
      </div>
      <QueueList key={tab} status={tab} />
    </Portal>
  );
}
