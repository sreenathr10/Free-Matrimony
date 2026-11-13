import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { normalizeCommunity, type PartnerPreferences } from '@fm/shared';
import { AuditService } from '../audit/audit.service';
import { DB, type Database } from '../db/db.module';
import { partnerPreferences } from '../db/schema';
import { AccessService } from '../profiles/access.service';

@Injectable()
export class PreferencesService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async get(userId: string, profileId: string) {
    await this.access.membership(profileId, userId);
    const [row] = await this.db.select().from(partnerPreferences).where(eq(partnerPreferences.profileId, profileId));
    return row ?? null;
  }

  async set(userId: string, profileId: string, prefs: PartnerPreferences) {
    await this.access.require(profileId, userId, 'EDIT_PROFILE');
    const religion = prefs.religions.length === 1 ? prefs.religions[0] : undefined;
    const communities = [...new Set(prefs.communities.map((c) => normalizeCommunity(c, religion)))];
    const values = { ...prefs, communities, updatedById: userId };
    const [row] = await this.db
      .insert(partnerPreferences)
      .values({ profileId, ...values })
      .onConflictDoUpdate({ target: partnerPreferences.profileId, set: values })
      .returning();
    await this.audit.record('preferences.updated', { actorUserId: userId, profileId });
    return row;
  }
}
