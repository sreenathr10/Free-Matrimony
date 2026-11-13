import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { normalizeCommunityFields, type ReviewSuggestionInput, type UpdateProfileInput } from '@fm/shared';
import { AuditService } from '../audit/audit.service';
import { DB, type Database } from '../db/db.module';
import { editSuggestions, profiles, users } from '../db/schema';
import { AccessService } from '../profiles/access.service';

/** Relatives with SUGGEST access propose profile changes; someone with full edit access approves them. */
@Injectable()
export class SuggestionsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, profileId: string, changes: UpdateProfileInput) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE', 'SUGGEST');
    if (Object.keys(changes).length === 0) throw new BadRequestException('Suggest at least one change');
    if (changes.community !== undefined || changes.subCaste !== undefined) {
      const [p] = await this.db.select({ religion: profiles.religion }).from(profiles).where(eq(profiles.id, profileId));
      changes = normalizeCommunityFields(changes, changes.religion ?? p?.religion);
      if (changes.community !== undefined && changes.subCaste === undefined) changes.subCaste = null;
    }
    const [row] = await this.db
      .insert(editSuggestions)
      .values({ profileId, suggestedById: userId, changes })
      .returning();
    await this.audit.record('suggestion.created', { actorUserId: userId, profileId, metadata: { suggestionId: row.id } });
    return row;
  }

  async list(userId: string, profileId: string) {
    await this.access.membership(profileId, userId);
    return this.db
      .select({
        id: editSuggestions.id,
        changes: editSuggestions.changes,
        status: editSuggestions.status,
        note: editSuggestions.note,
        createdAt: editSuggestions.createdAt,
        suggestedBy: users.name,
      })
      .from(editSuggestions)
      .leftJoin(users, eq(users.id, editSuggestions.suggestedById))
      .where(eq(editSuggestions.profileId, profileId))
      .orderBy(desc(editSuggestions.createdAt));
  }

  async review(userId: string, profileId: string, suggestionId: string, input: ReviewSuggestionInput) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const [s] = await this.db
      .select()
      .from(editSuggestions)
      .where(and(eq(editSuggestions.id, suggestionId), eq(editSuggestions.profileId, profileId)));
    if (!s) throw new NotFoundException('Suggestion not found');
    if (s.status !== 'PENDING') throw new BadRequestException(`Suggestion already ${s.status.toLowerCase()}`);

    const approved = input.decision === 'APPROVE';
    await this.db.transaction(async (tx) => {
      if (approved) await tx.update(profiles).set(s.changes).where(eq(profiles.id, profileId));
      await tx
        .update(editSuggestions)
        .set({ status: approved ? 'APPROVED' : 'REJECTED', reviewedById: userId, reviewedAt: new Date(), note: input.note })
        .where(eq(editSuggestions.id, suggestionId));
    });
    await this.audit.record(approved ? 'suggestion.approved' : 'suggestion.rejected', {
      actorUserId: userId,
      profileId,
      metadata: { suggestionId, fields: Object.keys(s.changes) },
    });
    return { id: suggestionId, status: approved ? 'APPROVED' : 'REJECTED' };
  }
}
