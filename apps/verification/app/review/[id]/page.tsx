'use client';

import { use } from 'react';
import { Portal } from '@/components/Portal';
import { Review } from '@/components/Review';

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Portal>
      <Review id={id} />
    </Portal>
  );
}
