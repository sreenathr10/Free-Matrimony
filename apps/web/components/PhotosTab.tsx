'use client';

import { Eye, EyeOff, ImagePlus, Lock, Star, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { MAX_PHOTOS, PHOTO_CONTENT_TYPES } from '@fm/shared';
import { Badge, Button, Card, EmptyState } from '@fm/ui';
import { api, ApiError } from '@/lib/api';
import type { Photo } from '@/lib/types';

export function PhotosTab({
  profileId,
  canEdit,
  onChange,
}: {
  profileId: string;
  canEdit: boolean;
  onChange: () => void;
}) {
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
        const { photoId, upload } = await api<{
          photoId: string;
          upload: { url: string; headers: Record<string, string> };
        }>(`/profiles/${profileId}/photos/uploads`, {
          method: 'POST',
          body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
        });
        const put = await fetch(upload.url, { method: 'PUT', headers: upload.headers, body: file });
        if (!put.ok) throw new Error('Upload failed');
        await api(`/profiles/${profileId}/photos/${photoId}/confirm`, { method: 'POST' });
      }
      await load();
      onChange();
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Upload failed',
      );
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
            Photos{' '}
            <span className="text-ink-muted">
              ({photos.length} of {MAX_PHOTOS})
            </span>
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Matches see a blurred version until you accept their interest. Location data is removed
            from every photo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBlurred((b) => !b)}
            icon={showBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          >
            {showBlurred ? 'Show clear' : 'Preview blurred'}
          </Button>
          {canEdit && (
            <Button
              size="sm"
              loading={busy}
              disabled={photos.length >= MAX_PHOTOS}
              onClick={() => input.current?.click()}
              icon={<ImagePlus className="h-4 w-4" />}
            >
              {busy ? 'Uploading' : 'Add photos'}
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept={PHOTO_CONTENT_TYPES.join(',')}
          onChange={(e) => upload(e.target.files)}
        />
      </Card>
      {error && <p className="text-sm text-brand-600">{error}</p>}

      {photos.length === 0 ? (
        <EmptyState
          icon={<ImagePlus className="h-6 w-6" />}
          title="No photos yet"
          body="Profiles with photos get far more interest. They stay blurred until you accept an interest."
          action={
            canEdit ? (
              <Button onClick={() => input.current?.click()} loading={busy}>
                Upload photos
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnimatePresence>
            {photos.map((p) => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative aspect-[3/4] overflow-hidden rounded-card border bg-line shadow-soft ${p.isPrimary ? 'border-brand-400 ring-2 ring-brand-400/40' : 'border-line'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={showBlurred ? p.blurredUrl : p.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {p.isPrimary && (
                  <div className="absolute left-3 top-3">
                    <Badge tone="gold" icon={<Star className="h-3 w-3 fill-current" />}>
                      Main photo
                    </Badge>
                  </div>
                )}
                {canEdit && (
                  <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    {!p.isPrimary && (
                      <Button
                        size="sm"
                        variant="inverse"
                        onClick={() => act(`${p.id}/primary`, 'POST')}
                        icon={<Star className="h-3.5 w-3.5" />}
                      >
                        Make main
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="inverse"
                      onClick={() => act(p.id, 'DELETE')}
                      aria-label="Remove photo"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {canEdit && photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="grid aspect-[3/4] place-items-center rounded-card border-2 border-dashed border-line-strong text-ink-muted transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600 dark:hover:bg-brand-950/30"
            >
              <span className="flex flex-col items-center gap-2 text-sm font-semibold">
                <ImagePlus className="h-6 w-6" /> Add photo
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
