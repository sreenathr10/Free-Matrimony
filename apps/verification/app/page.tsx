'use client';

import { Portal } from '@/components/Portal';
import { QueueList } from '@/components/QueueList';

export default function QueuePage() {
  return (
    <Portal title="Verification queue">
      <QueueList status="IN_REVIEW" showStats />
    </Portal>
  );
}
