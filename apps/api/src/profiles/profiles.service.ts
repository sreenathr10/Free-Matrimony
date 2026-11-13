import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import {
  DEFAULT_ROLE_FOR_RELATION,
  profileCompleteness,
  type CreateProfileInput,
  type UpdateProfileInput,
} from '@fm/shared';
import { AuditService } from '../audit/audit.service';
import { DB, type Database } from '../db/db.module';
import { families, partnerPreferences, profileMembers, profilePhotos, profiles } from '../db/schema';
import { AccessService } from './access.service';

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, input: CreateProfileInput) {
    const { createdAs, ...fields } = input;
    const isSelf = createdAs === 'SELF';

    const profile = await this.db.transaction(async (tx) => {
      const [family] = await tx
        .insert(families)
        .values({ name: `${fields.fullName.split(' ')[0]}'s family`, createdById: userId })
        .returning();
      const [profile] = await tx
        .insert(profiles)
        .values({ ...fields, familyId: family.id, createdById: userId, candidateUserId: isSelf ? userId : null })
        .returning();
      await tx.insert(profileMembers).values({
        profileId: profile.id,
        userId,
        relation: createdAs,
        role: DEFAULT_ROLE_FOR_RELATION[createdAs],
        isFamilyAdmin: true,
        status: 'ACTIVE',
      });
      return profile;
    });

    await this.audit.record('profile.created', { actorUserId: userId, profileId: profile.id, metadata: { createdAs } });
    return profile;
  }

  async listMine(userId: string) {
    const memberships = await this.db
      .select()
      .from(profileMembers)
      .where(and(eq(profileMembers.userId, userId), inArray(profileMembers.status, ['ACTIVE', 'INVITED'])));
    if (memberships.length === 0) return [];
    const rows = await this.db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, memberships.map((m) => m.profileId)));
    return memberships.map((m) => ({
      profile: rows.find((p) => p.id === m.profileId),
      invitationPending: m.status === 'INVITED',
      access: this.access.describe(m),
    }));
  }

  async get(userId: string, profileId: string) {
    const member = await this.access.membership(profileId, userId);
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.id, profileId));
    const photos = await this.db
      .select({ id: profilePhotos.id })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.profileId, profileId), eq(profilePhotos.status, 'READY')));
    const [prefs] = await this.db
      .select({ id: partnerPreferences.profileId })
      .from(partnerPreferences)
      .where(eq(partnerPreferences.profileId, profileId));
    return {
      profile,
      access: this.access.describe(member),
      completeness: profileCompleteness({ profile, photoCount: photos.length, hasPreferences: !!prefs }),
    };
  }

  async update(userId: string, profileId: string, input: UpdateProfileInput) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const [profile] = await this.db.update(profiles).set(input).where(eq(profiles.id, profileId)).returning();
    await this.audit.record('profile.updated', {
      actorUserId: userId,
      profileId,
      metadata: { fields: Object.keys(input) },
    });
    return profile;
  }

  /** The candidate personally agrees to the profile being shown. Required before it can go live. */
  async consent(userId: string, profileId: string) {
    await this.access.requireCandidate(profileId, userId);
    const [profile] = await this.db
      .update(profiles)
      .set({ candidateConsentAt: new Date(), candidateUserId: userId })
      .where(eq(profiles.id, profileId))
      .returning();
    await this.audit.record('profile.consent_given', { actorUserId: userId, profileId });
    return profile;
  }

  /** Sends the profile to the verification team. */
  async submitForVerification(userId: string, profileId: string) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const [current] = await this.db.select().from(profiles).where(eq(profiles.id, profileId));
    if (!current.candidateConsentAt) {
      throw new BadRequestException('The candidate must give consent before the profile is submitted');
    }
    if (current.status !== 'DRAFT') throw new BadRequestException(`Profile is already ${current.status}`);
    const [profile] = await this.db
      .update(profiles)
      .set({ status: 'PENDING_VERIFICATION' })
      .where(eq(profiles.id, profileId))
      .returning();
    await this.audit.record('profile.submitted', { actorUserId: userId, profileId });
    return profile;
  }

  /** Hide or show a live profile. Candidate only. */
  async setHidden(userId: string, profileId: string, hidden: boolean) {
    await this.access.require(profileId, userId, 'MANAGE_PRIVACY');
    const [current] = await this.db.select().from(profiles).where(eq(profiles.id, profileId));
    const allowedFrom = hidden ? ['LIVE'] : ['HIDDEN'];
    if (!allowedFrom.includes(current.status)) {
      throw new BadRequestException(`Cannot ${hidden ? 'hide' : 'show'} a profile that is ${current.status}`);
    }
    const [profile] = await this.db
      .update(profiles)
      .set({ status: hidden ? 'HIDDEN' : 'LIVE' })
      .where(eq(profiles.id, profileId))
      .returning();
    await this.audit.record(hidden ? 'profile.hidden' : 'profile.shown', { actorUserId: userId, profileId });
    return profile;
  }
}
