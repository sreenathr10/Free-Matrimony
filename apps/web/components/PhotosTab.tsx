'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_PHOTOS, PHOTO_CONTENT_TYPES } from '@fm/shared';
import { Badge, Button, Card } from '@fm/ui';
import { api, ApiError } from '@/lib/api';
import type { Photo } from '@/lib/types';

export function PhotosTab({ profileId, canEdit, onChange }: { profileId: string; canEdit: boolean; onChange: () => void }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBlurred, setShowBlurred] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = () => api<Photo[]>(`/profiles/${profileId}/photos`).then(setPhotos);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const { photoId, upload } = await api<{ photoId: string; upload: { url: string; headers: Record<string, string> } }>(
          `/profiles/${profileId}/photos/uploads`,
          { method: 'POST', body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }) },
        );
        const put = await fetch(upload.url, { method: 'PUT', headers: upload.headers, body: file });
        if (!put.ok) throw new Error('Upload failed');
        await api(`/profiles/${profileId}/photos/${photoId}/confirm`, { method: 'POST' });
      }
      await load();
      onChange();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function act(path: string, method: string) {
    await api(`/profiles/${profileId}/photos/${path}`, { method });
    await load();
    onChange();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">
            Photos <span className="text-ink-muted">({photos.length} of {MAX_PHOTOS})</span>
          </h2>
          <p className="text-sm text-ink-muted">
            Matches see a blurred version until you accept their interest. Location data is removed from every photo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowBlurred((b) => !b)}>
            {showBlurred ? 'Show clear' : 'Preview blurred'}
          </Button>
          {canEdit && (
            <Button size="sm" disabled={busy || photos.length >= MAX_PHOTOS} onClick={() => input.current?.click()}>
              {busy ? 'Uploading…' : 'Add photos'}
            </Button>
          )}
        </div>
        <input ref={input} type="file" hidden multiple accept={PHOTO_CONTENT_TYPES.join(',')} onChange={(e) => upload(e.target.files)} />
      </Card>
      {error && <p className="text-sm text-brand-600">{error}</p>}

      {photos.length === 0 ? (
        <Card className="py-12 text-center text-ink-muted">No photos yet. Profiles with photos get far more interest.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={showBlurred ? p.blurredUrl : p.url} alt="" className="h-full w-full object-cover" />
              {p.isPrimary && (
                <div className="absolute left-2 top-2">
                  <Badge tone="brand">Main photo</Badge>
                </div>
              )}
              {canEdit && (
                <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {!p.isPrimary && (
                    <Button size="sm" variant="secondary" onClick={() => act(`${p.id}/primary`, 'POST')}>
                      Make main
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => act(p.id, 'DELETE')}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
