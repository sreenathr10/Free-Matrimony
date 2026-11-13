import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, ilike, inArray, ne, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {
  REJECTION_REASONS,
  idNeedsBack,
  type CheckOutcome,
  type SubmitVerificationInput,
  type VerificationDecisionInput,
  type VerificationFile,
  type VerificationQueueQuery,
  type VerificationUploadInput,
} from '@fm/shared';
import { AuditService } from '../audit/audit.service';
import { DB, type Database } from '../db/db.module';
import { auditLog, profilePhotos, profiles, users, verifications, type Verification } from '../db/schema';
import { KycProvider } from '../kyc/kyc.provider';
import { AccessService } from '../profiles/access.service';
import { StorageService } from '../storage/storage.service';

const KEY_COLUMN = { SELFIE: 'selfieKey', ID_FRONT: 'idFrontKey', ID_BACK: 'idBackKey' } as const;
const MIN_SIDE_PX = 400;
/** Signed links to identity documents expire quickly. */
const DOCUMENT_URL_TTL_SECONDS = 300;

/** Re-encodes an identity image: fixes orientation and strips all metadata. */
async function processDocument(input: Buffer) {
  try {
    const image = sharp(input, { failOn: 'error' }).rotate();
    const meta = await image.metadata();
    const w = meta.autoOrient?.width ?? meta.width ?? 0;
    const h = meta.autoOrient?.height ?? meta.height ?? 0;
    if (Math.min(w, h) < MIN_SIDE_PX) {
      throw new BadRequestException(`Photos must be at least ${MIN_SIDE_PX}px on each side. Use your camera, not a screenshot.`);
    }
    return await image.resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  } catch (e) {
    if (e instanceof BadRequestException) throw e;
    throw new BadRequestException('This file is not a supported image');
  }
}

@Injectable()
export class VerificationService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly kyc: KycProvider,
  ) {}

  private async latest(profileId: string) {
    const [v] = await this.db
      .select()
      .from(verifications)
      .where(eq(verifications.profileId, profileId))
      .orderBy(desc(verifications.createdAt))
      .limit(1);
    return v as Verification | undefined;
  }

  /** What the family sees: progress and, after a rejection, what to fix. Never the check details. */
  private summary(v: Verification | undefined) {
    if (!v) return null;
    return {
      id: v.id,
      status: v.status,
      idDocumentType: v.idDocumentType,
      files: { SELFIE: !!v.selfieKey, ID_FRONT: !!v.idFrontKey, ID_BACK: !!v.idBackKey },
      submittedAt: v.submittedAt,
      decidedAt: v.decidedAt,
      rejection:
        v.status === 'REJECTED' && v.rejectionReason
          ? { reason: v.rejectionReason, message: REJECTION_REASONS[v.rejectionReason], note: v.reviewerNote }
          : null,
    };
  }

  async get(userId: string, profileId: string) {
    await this.access.membership(profileId, userId);
    return this.summary(await this.latest(profileId));
  }

  /** The verification currently collecting files, starting a new one after a rejection. */
  private async collecting(profileId: string) {
    const current = await this.latest(profileId);
    if (current?.status === 'COLLECTING') return current;
    if (current?.status === 'IN_REVIEW') throw new BadRequestException('Verification is already in review');
    if (current?.status === 'APPROVED') throw new BadRequestException('This profile is already verified');
    const [created] = await this.db.insert(verifications).values({ profileId }).returning();
    return created;
  }

  private key(profileId: string, verificationId: string, file: VerificationFile, suffix: string) {
    return `kyc/${profileId}/${verificationId}/${file.toLowerCase()}-${suffix}`;
  }

  /** Step 1: a signed upload URL for the selfie or one side of the ID. Only the candidate can do this. */
  async requestUpload(userId: string, profileId: string, input: VerificationUploadInput) {
    await this.access.requireCandidate(profileId, userId);
    const v = await this.collecting(profileId);
    const upload = await this.storage.presignUpload(this.key(profileId, v.id, input.file, 'upload'), input.contentType, input.sizeBytes);
    return { verificationId: v.id, upload };
  }

  /** Step 2: process the uploaded file and attach it to the verification. */
  async confirmUpload(userId: string, profileId: string, file: VerificationFile) {
    await this.access.requireCandidate(profileId, userId);
    const v = await this.collecting(profileId);
    const uploadKey = this.key(profileId, v.id, file, 'upload');
    const raw = await this.storage.get(uploadKey);
    if (!raw) throw new BadRequestException('Upload not found. Upload the file first.');
    let processed: Buffer;
    try {
      processed = await processDocument(raw);
    } finally {
      await this.storage.delete(uploadKey);
    }
    const key = this.key(profileId, v.id, file, `${Date.now()}.jpg`);
    await this.storage.put(key, processed, 'image/jpeg');
    const previous = v[KEY_COLUMN[file]];
    if (previous) await this.storage.delete(previous);

    const [updated] = await this.db
      .update(verifications)
      .set({
        [KEY_COLUMN[file]]: key,
        fileHashes: { ...v.fileHashes, [file]: createHash('sha256').update(raw).digest('hex') },
      })
      .where(eq(verifications.id, v.id))
      .returning();
    await this.audit.record('verification.file_added', { actorUserId: userId, profileId, metadata: { file } });
    return this.summary(updated);
  }

  /** Sends the profile to the verification team, after running the automatic checks. */
  async submit(userId: string, profileId: string, input: SubmitVerificationInput) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!profile.candidateConsentAt) {
      throw new BadRequestException('The candidate must give consent before the profile is submitted');
    }
    if (profile.status !== 'DRAFT') throw new BadRequestException(`Profile is already ${profile.status}`);
    const v = await this.latest(profileId);
    const missing = [
      !v?.selfieKey && 'a selfie',
      !v?.idFrontKey && 'the front of the ID',
      idNeedsBack(input.idDocumentType) && !v?.idBackKey && 'the back of the ID',
    ].filter(Boolean);
    if (!v || v.status !== 'COLLECTING' || missing.length) {
      throw new BadRequestException(`The candidate still needs to upload ${missing.join(' and ') || 'their documents'}`);
    }

    const photoRows = await this.db
      .select({ key: profilePhotos.displayKey })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, profileId), eq(profilePhotos.status, 'READY')));
    const load = async (key: string | null) => (key ? ((await this.storage.get(key)) ?? undefined) : undefined);
    const [selfie, idFront, idBack, ...photos] = await Promise.all([
      load(v.selfieKey),
      load(v.idFrontKey),
      idNeedsBack(input.idDocumentType) ? load(v.idBackKey) : Promise.resolve(undefined),
      ...photoRows.map((p) => load(p.key)),
    ]);
    if (!selfie || !idFront) throw new BadRequestException('Uploaded files are missing. Upload them again.');

    const result = await this.kyc.verify({
      selfie,
      idFront,
      idBack,
      idDocumentType: input.idDocumentType,
      profilePhotos: photos.filter((p): p is Buffer => !!p),
      profile: { fullName: profile.fullName, dateOfBirth: profile.dateOfBirth, currentCountry: profile.currentCountry },
    });
    const checks = [...result.checks, await this.duplicateCheck(v, profile)];
    const flagged = checks.some((c) => c.result !== 'PASS');

    await this.db.transaction(async (tx) => {
      await tx
        .update(verifications)
        .set({
          status: 'IN_REVIEW',
          idDocumentType: input.idDocumentType,
          idBackKey: idNeedsBack(input.idDocumentType) ? v.idBackKey : null,
          provider: result.provider,
          providerRef: result.reference,
          checks,
          flagged,
          submittedById: userId,
          submittedAt: new Date(),
        })
        .where(eq(verifications.id, v.id));
      await tx.update(profiles).set({ status: 'PENDING_VERIFICATION' }).where(eq(profiles.id, profileId));
    });
    await this.audit.record('profile.submitted', {
      actorUserId: userId,
      profileId,
      metadata: { verificationId: v.id, flagged, provider: result.provider },
    });
    return this.summary(await this.latest(profileId));
  }

  /** Same document files on another profile, or the same person (name, date of birth, gender) listed twice. */
  private async duplicateCheck(v: Verification, profile: typeof profiles.$inferSelect): Promise<CheckOutcome> {
    const hashes = Object.values(v.fileHashes).filter(Boolean) as string[];
    // Compare against every file hash stored on other profiles' verifications.
    const fileMatches = hashes.length
      ? await this.db.execute<{ profile_id: string }>(sql`
          select distinct v.profile_id from verifications v, jsonb_each_text(v.file_hashes) f
          where v.profile_id <> ${profile.id} and f.value in (${sql.join(hashes.map((h) => sql`${h}`), sql`, `)})`)
      : { rows: [] };
    const samePerson = await this.db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          ne(profiles.id, profile.id),
          ilike(profiles.fullName, profile.fullName),
          eq(profiles.dateOfBirth, profile.dateOfBirth),
          eq(profiles.gender, profile.gender),
          inArray(profiles.status, ['PENDING_VERIFICATION', 'LIVE', 'HIDDEN', 'SUSPENDED']),
        ),
      )
      .limit(5);
    if (fileMatches.rows.length) {
      return {
        key: 'DUPLICATE',
        result: 'FAIL',
        detail: `The same selfie or ID image was used on ${fileMatches.rows.length} other profile(s)`,
      };
    }
    if (samePerson.length) {
      return {
        key: 'DUPLICATE',
        result: 'REVIEW',
        detail: `${samePerson.length} other profile(s) have the same name, date of birth and gender`,
      };
    }
    return { key: 'DUPLICATE', result: 'PASS', detail: 'No other profile uses these documents or details' };
  }

  // ---- Staff ----

  async queue(query: VerificationQueueQuery) {
    const where = and(
      eq(verifications.status, query.status),
      query.flagged === undefined ? undefined : eq(verifications.flagged, query.flagged),
    );
    const rows = await this.db
      .select({
        id: verifications.id,
        status: verifications.status,
        flagged: verifications.flagged,
        checks: verifications.checks,
        idDocumentType: verifications.idDocumentType,
        submittedAt: verifications.submittedAt,
        decidedAt: verifications.decidedAt,
        rejectionReason: verifications.rejectionReason,
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
          gender: profiles.gender,
          dateOfBirth: profiles.dateOfBirth,
          currentCountry: profiles.currentCountry,
          currentCity: profiles.currentCity,
        },
        reviewerName: users.name,
      })
      .from(verifications)
      .innerJoin(profiles, eq(profiles.id, verifications.profileId))
      .leftJoin(users, eq(users.id, verifications.reviewerId))
      .where(where)
      // Oldest first while waiting; newest first once decided.
      .orderBy(query.status === 'IN_REVIEW' ? asc(verifications.submittedAt) : desc(verifications.decidedAt))
      .limit(200);
    return rows.map(({ checks, ...r }) => ({
      ...r,
      issues: checks.filter((c) => c.result !== 'PASS').map((c) => ({ key: c.key, result: c.result })),
    }));
  }

  async stats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [[waiting], [flagged], decided] = await Promise.all([
      this.db.select({ n: count() }).from(verifications).where(eq(verifications.status, 'IN_REVIEW')),
      this.db
        .select({ n: count() })
        .from(verifications)
        .where(and(eq(verifications.status, 'IN_REVIEW'), eq(verifications.flagged, true))),
      this.db
        .select({ status: verifications.status, n: count() })
        .from(verifications)
        .where(gte(verifications.decidedAt, startOfDay))
        .groupBy(verifications.status),
    ]);
    const today = (s: string) => decided.find((d) => d.status === s)?.n ?? 0;
    return { waiting: waiting.n, flagged: flagged.n, approvedToday: today('APPROVED'), rejectedToday: today('REJECTED') };
  }

  /** Everything a reviewer needs, with short-lived links to the documents. Viewing is audited. */
  async detail(staffUserId: string, id: string) {
    const [v] = await this.db.select().from(verifications).where(eq(verifications.id, id));
    if (!v) throw new NotFoundException('Verification not found');
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.id, v.profileId));
    const photos = await this.db
      .select({ id: profilePhotos.id, key: profilePhotos.displayKey, isPrimary: profilePhotos.isPrimary })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, v.profileId), eq(profilePhotos.status, 'READY')))
      .orderBy(asc(profilePhotos.position));
    const url = (key: string | null) => (key ? this.storage.signedUrl(key, DOCUMENT_URL_TTL_SECONDS) : null);
    const [selfieUrl, idFrontUrl, idBackUrl, ...photoUrls] = await Promise.all([
      url(v.selfieKey),
      url(v.idFrontKey),
      url(v.idBackKey),
      ...photos.map((p) => url(p.key)),
    ]);
    const history = await this.db
      .select({ action: auditLog.action, createdAt: auditLog.createdAt, actorName: users.name, metadata: auditLog.metadata })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorUserId))
      .where(eq(auditLog.profileId, v.profileId))
      .orderBy(desc(auditLog.createdAt))
      .limit(50);
    const previous = await this.db
      .select({ id: verifications.id, status: verifications.status, decidedAt: verifications.decidedAt, rejectionReason: verifications.rejectionReason })
      .from(verifications)
      .where(and(eq(verifications.profileId, v.profileId), ne(verifications.id, v.id)))
      .orderBy(desc(verifications.createdAt));

    await this.audit.record('verification.documents_viewed', {
      actorUserId: staffUserId,
      profileId: v.profileId,
      metadata: { verificationId: v.id },
    });

    return {
      id: v.id,
      status: v.status,
      flagged: v.flagged,
      provider: v.provider,
      providerRef: v.providerRef,
      idDocumentType: v.idDocumentType,
      checks: v.checks,
      submittedAt: v.submittedAt,
      decidedAt: v.decidedAt,
      rejectionReason: v.rejectionReason,
      reviewerNote: v.reviewerNote,
      documents: { selfie: selfieUrl, idFront: idFrontUrl, idBack: idBackUrl, expiresInSeconds: DOCUMENT_URL_TTL_SECONDS },
      photos: photos.map((p, i) => ({ id: p.id, isPrimary: p.isPrimary, url: photoUrls[i] })),
      profile,
      previous,
      history,
    };
  }

  async decide(staffUserId: string, id: string, input: VerificationDecisionInput) {
    const [v] = await this.db.select().from(verifications).where(eq(verifications.id, id));
    if (!v) throw new NotFoundException('Verification not found');
    if (v.status !== 'IN_REVIEW') throw new BadRequestException(`This verification is already ${v.status.toLowerCase()}`);
    const approve = input.decision === 'APPROVE';
    const now = new Date();

    await this.db.transaction(async (tx) => {
      // Guard against two reviewers deciding at once: only one update can still see IN_REVIEW.
      const done = await tx
        .update(verifications)
        .set({
          status: approve ? 'APPROVED' : 'REJECTED',
          reviewerId: staffUserId,
          decidedAt: now,
          rejectionReason: approve ? null : input.reason,
          reviewerNote: input.note ?? null,
        })
        .where(and(eq(verifications.id, id), eq(verifications.status, 'IN_REVIEW')))
        .returning({ id: verifications.id });
      if (!done.length) throw new BadRequestException('Someone else has just decided this verification');
      await tx
        .update(profiles)
        .set(approve ? { status: 'LIVE', verifiedAt: now } : { status: 'DRAFT' })
        .where(eq(profiles.id, v.profileId));
    });

    await this.audit.record(approve ? 'verification.approved' : 'verification.rejected', {
      actorUserId: staffUserId,
      profileId: v.profileId,
      metadata: { verificationId: id, ...(approve ? {} : { reason: input.reason }) },
    });
    // Member notification (push, email, WhatsApp) arrives with the notifications service in M5.
    return { id, status: approve ? 'APPROVED' : 'REJECTED', profileStatus: approve ? 'LIVE' : 'DRAFT' };
  }
}
