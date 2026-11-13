'use client';

import { Portal } from '@/components/Portal';
import { QueueList } from '@/components/QueueList';

export default function FlaggedPage() {
  return (
    <Portal title="Flagged by checks">
      <p className="-mt-4 mb-6 text-ink-muted">
        Waiting profiles where an automatic check failed or needs a person to look.
      </p>
      <QueueList status="IN_REVIEW" flagged />
    </Portal>
  );
}
