import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import sharp from 'sharp';
import { MAX_PHOTOS, type PhotoUploadRequest } from '@fm/shared';
import { AuditService } from '../audit/audit.service';
import { DB, type Database } from '../db/db.module';
import { profilePhotos, type ProfilePhoto } from '../db/schema';
import { AccessService } from '../profiles/access.service';
import { StorageService } from '../storage/storage.service';

const MIN_SIDE_PX = 300;
const DISPLAY_MAX_PX = 1600;

/** Re-encodes an upload: fixes orientation, strips all metadata (EXIF, GPS), and makes a blurred copy. */
export async function processPhoto(input: Buffer) {
  const image = sharp(input, { failOn: 'error' }).rotate();
  const meta = await image.metadata();
  const w = meta.autoOrient?.width ?? meta.width ?? 0;
  const h = meta.autoOrient?.height ?? meta.height ?? 0;
  if (Math.min(w, h) < MIN_SIDE_PX) throw new BadRequestException(`Photos must be at least ${MIN_SIDE_PX}px on each side`);

  const display = await image
    .clone()
    .resize({ width: DISPLAY_MAX_PX, height: DISPLAY_MAX_PX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  // Downscale hard, blur, then scale back up: no detail survives, so it can't be "unblurred".
  const tiny = await image.clone().resize({ width: 24 }).blur(2).toBuffer();
  const blurred = await sharp(tiny).resize({ width: 480 }).blur(12).webp({ quality: 60 }).toBuffer();

  return { display: display.data, width: display.info.width, height: display.info.height, blurred };
}

@Injectable()
export class PhotosService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  private key(profileId: string, photoId: string, name: string) {
    return `profiles/${profileId}/photos/${photoId}/${name}`;
  }

  async requestUpload(userId: string, profileId: string, input: PhotoUploadRequest) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const existing = await this.db
      .select({ id: profilePhotos.id })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, profileId), inArray(profilePhotos.status, ['READY', 'UPLOADING'])));
    if (existing.length >= MAX_PHOTOS) throw new BadRequestException(`A profile can have up to ${MAX_PHOTOS} photos`);

    const [photo] = await this.db
      .insert(profilePhotos)
      .values({ profileId, uploadedById: userId, uploadKey: 'pending', position: existing.length })
      .returning();
    const uploadKey = this.key(profileId, photo.id, 'original');
    await this.db.update(profilePhotos).set({ uploadKey }).where(eq(profilePhotos.id, photo.id));
    const upload = await this.storage.presignUpload(uploadKey, input.contentType, input.sizeBytes);
    return { photoId: photo.id, upload };
  }

  async confirm(userId: string, profileId: string, photoId: string) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const photo = await this.find(profileId, photoId);
    if (photo.status !== 'UPLOADING') throw new BadRequestException('Photo already processed');

    const original = await this.storage.get(photo.uploadKey);
    if (!original) throw new BadRequestException('Upload not found. Upload the file first.');

    let processed: Awaited<ReturnType<typeof processPhoto>>;
    try {
      processed = await processPhoto(original);
    } catch (e) {
      await this.db.update(profilePhotos).set({ status: 'REJECTED' }).where(eq(profilePhotos.id, photoId));
      await this.storage.delete(photo.uploadKey);
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('This file is not a supported image');
    }

    const displayKey = this.key(profileId, photoId, 'display.webp');
    const blurredKey = this.key(profileId, photoId, 'blurred.webp');
    await this.storage.put(displayKey, processed.display, 'image/webp');
    await this.storage.put(blurredKey, processed.blurred, 'image/webp');
    await this.storage.delete(photo.uploadKey); // the original may contain location data

    const [primary] = await this.db
      .select({ id: profilePhotos.id })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, profileId), eq(profilePhotos.isPrimary, true), eq(profilePhotos.status, 'READY')));

    const [updated] = await this.db
      .update(profilePhotos)
      .set({ status: 'READY', displayKey, blurredKey, width: processed.width, height: processed.height, isPrimary: !primary })
      .where(eq(profilePhotos.id, photoId))
      .returning();
    await this.audit.record('photo.added', { actorUserId: userId, profileId, metadata: { photoId } });
    return this.present(updated);
  }

  async list(userId: string, profileId: string) {
    await this.access.membership(profileId, userId);
    const rows = await this.db
      .select()
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, profileId), eq(profilePhotos.status, 'READY')))
      .orderBy(asc(profilePhotos.position));
    return Promise.all(rows.map((p) => this.present(p)));
  }

  async setPrimary(userId: string, profileId: string, photoId: string) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const photo = await this.find(profileId, photoId);
    if (photo.status !== 'READY') throw new BadRequestException('Photo is not ready');
    await this.db.transaction(async (tx) => {
      await tx.update(profilePhotos).set({ isPrimary: false }).where(eq(profilePhotos.profileId, profileId));
      await tx.update(profilePhotos).set({ isPrimary: true }).where(eq(profilePhotos.id, photoId));
    });
    await this.audit.record('photo.primary_set', { actorUserId: userId, profileId, metadata: { photoId } });
    return this.list(userId, profileId);
  }

  async reorder(userId: string, profileId: string, photoIds: string[]) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const ready = await this.db
      .select({ id: profilePhotos.id })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, profileId), eq(profilePhotos.status, 'READY')));
    const readyIds = new Set(ready.map((r) => r.id));
    if (photoIds.length !== readyIds.size || !photoIds.every((id) => readyIds.has(id))) {
      throw new BadRequestException('Send every photo id exactly once');
    }
    await this.db.transaction(async (tx) => {
      for (const [i, id] of photoIds.entries()) {
        await tx.update(profilePhotos).set({ position: i }).where(eq(profilePhotos.id, id));
      }
    });
    return this.list(userId, profileId);
  }

  async remove(userId: string, profileId: string, photoId: string) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const photo = await this.find(profileId, photoId);
    await this.db.update(profilePhotos).set({ status: 'DELETED', isPrimary: false }).where(eq(profilePhotos.id, photoId));
    await Promise.all(
      [photo.uploadKey, photo.displayKey, photo.blurredKey].filter(Boolean).map((k) => this.storage.delete(k!)),
    );
    if (photo.isPrimary) {
      const [next] = await this.db
        .select({ id: profilePhotos.id })
        .from(profilePhotos)
        .where(and(eq(profilePhotos.profileId, profileId), eq(profilePhotos.status, 'READY')))
        .orderBy(asc(profilePhotos.position))
        .limit(1);
      if (next) await this.db.update(profilePhotos).set({ isPrimary: true }).where(eq(profilePhotos.id, next.id));
    }
    await this.audit.record('photo.removed', { actorUserId: userId, profileId, metadata: { photoId } });
    return { removed: true };
  }

  async countReady(profileId: string) {
    const rows = await this.db
      .select({ id: profilePhotos.id })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, profileId), eq(profilePhotos.status, 'READY')));
    return rows.length;
  }

  private async find(profileId: string, photoId: string): Promise<ProfilePhoto> {
    const [photo] = await this.db
      .select()
      .from(profilePhotos)
      .where(and(eq(profilePhotos.id, photoId), eq(profilePhotos.profileId, profileId), ne(profilePhotos.status, 'DELETED')));
    if (!photo) throw new NotFoundException('Photo not found');
    return photo;
  }

  private async present(p: ProfilePhoto) {
    return {
      id: p.id,
      isPrimary: p.isPrimary,
      position: p.position,
      width: p.width,
      height: p.height,
      url: p.displayKey ? await this.storage.signedUrl(p.displayKey) : null,
      blurredUrl: p.blurredKey ? await this.storage.signedUrl(p.blurredKey) : null,
    };
  }
}
