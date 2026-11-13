'use client';

import { ArrowRight, Check, MessageSquareText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { humanize } from '@fm/shared';
import { Avatar, Badge, Button, Card, EmptyState } from '@fm/ui';
import { api } from '@/lib/api';
import type { Suggestion } from '@/lib/types';

export function SuggestionsTab({
  profileId,
  canReview,
  onChange,
}: {
  profileId: string;
  canReview: boolean;
  onChange: () => void;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const load = () => api<Suggestion[]>(`/profiles/${profileId}/suggestions`).then(setItems);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function review(id: string, decision: 'APPROVE' | 'REJECT') {
    await api(`/profiles/${profileId}/suggestions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
    await load();
    onChange();
  }

  if (items.length === 0)
    return (
      <EmptyState
        icon={<MessageSquareText className="h-6 w-6" />}
        title="No suggestions yet"
        body="When a relative with suggest access proposes a change, it shows up here for review."
      />
    );

  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => (
        <Card key={s.id}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <Avatar name={s.suggestedBy ?? 'Family'} size={36} />
              <span>
                From{' '}
                <span className="font-medium text-ink">{s.suggestedBy ?? 'a family member'}</span> ·{' '}
                {new Date(s.createdAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <Badge
              tone={
                s.status === 'APPROVED'
                  ? 'verified'
                  : s.status === 'PENDING'
                    ? 'warning'
                    : 'neutral'
              }
            >
              {humanize(s.status)}
            </Badge>
          </div>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            {Object.entries(s.changes).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center gap-3 rounded-xl bg-surface-sunken px-4 py-2.5"
              >
                <dt className="w-36 shrink-0 text-ink-muted">
                  {humanize(k.replace(/([A-Z])/g, '_$1'))}
                </dt>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                <dd className="font-medium">{String(v)}</dd>
              </div>
            ))}
          </dl>
          {canReview && s.status === 'PENDING' && (
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => review(s.id, 'APPROVE')}
                icon={<Check className="h-4 w-4" />}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => review(s.id, 'REJECT')}
                icon={<X className="h-4 w-4" />}
              >
                Decline
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
