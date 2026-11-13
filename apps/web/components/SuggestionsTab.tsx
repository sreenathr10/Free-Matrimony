'use client';

import { useEffect, useState } from 'react';
import { humanize } from '@fm/shared';
import { Badge, Button, Card } from '@fm/ui';
import { api } from '@/lib/api';
import type { Suggestion } from '@/lib/types';

export function SuggestionsTab({ profileId, canReview, onChange }: { profileId: string; canReview: boolean; onChange: () => void }) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const load = () => api<Suggestion[]>(`/profiles/${profileId}/suggestions`).then(setItems);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function review(id: string, decision: 'APPROVE' | 'REJECT') {
    await api(`/profiles/${profileId}/suggestions/${id}/review`, { method: 'POST', body: JSON.stringify({ decision }) });
    await load();
    onChange();
  }

  if (items.length === 0) return <Card className="py-12 text-center text-ink-muted">No suggested changes yet.</Card>;

  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => (
        <Card key={s.id}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-ink-muted">
              From <span className="font-medium text-ink">{s.suggestedBy ?? 'a family member'}</span> ·{' '}
              {new Date(s.createdAt).toLocaleDateString()}
            </div>
            <Badge tone={s.status === 'APPROVED' ? 'verified' : s.status === 'PENDING' ? 'warning' : 'neutral'}>{humanize(s.status)}</Badge>
          </div>
          <dl className="mt-3 flex flex-col gap-1 text-sm">
            {Object.entries(s.changes).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-ink-muted">{humanize(k.replace(/([A-Z])/g, '_$1'))}:</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
          {canReview && s.status === 'PENDING' && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => review(s.id, 'APPROVE')}>Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => review(s.id, 'REJECT')}>Decline</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
