import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PartnerPreferences } from '@fm/shared';
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
    const values = { ...prefs, updatedById: userId };
    const [row] = await this.db
      .insert(partnerPreferences)
      .values({ profileId, ...values })
      .onConflictDoUpdate({ target: partnerPreferences.profileId, set: values })
      .returning();
    await this.audit.record('preferences.updated', { actorUserId: userId, profileId });
    return row;
  }
}
