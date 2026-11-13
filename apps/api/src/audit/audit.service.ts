import { Inject, Injectable } from '@nestjs/common';
import { DB, type Database } from '../db/db.module';
import { auditLog } from '../db/schema';

@Injectable()
export class AuditService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async record(
    action: string,
    opts: { actorUserId?: string; profileId?: string; metadata?: Record<string, unknown> } = {},
  ) {
    await this.db.insert(auditLog).values({
      action,
      actorUserId: opts.actorUserId,
      profileId: opts.profileId,
      metadata: opts.metadata ?? {},
    });
  }
}
