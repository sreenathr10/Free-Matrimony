import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, isNotNull } from 'drizzle-orm';
import type { AddStaffInput } from '@fm/shared';
import { AuditService } from '../audit/audit.service';
import { DB, type Database } from '../db/db.module';
import { users } from '../db/schema';

const staffColumns = { id: users.id, phone: users.phone, name: users.name, role: users.staffRole, createdAt: users.createdAt };

@Injectable()
export class StaffService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  async me(userId: string) {
    const [me] = await this.db.select(staffColumns).from(users).where(eq(users.id, userId));
    return me;
  }

  list() {
    return this.db.select(staffColumns).from(users).where(isNotNull(users.staffRole)).orderBy(asc(users.name));
  }

  /** Gives a person a staff role, creating their account if they have never logged in. */
  async add(actorUserId: string, input: AddStaffInput) {
    const [existing] = await this.db.select().from(users).where(eq(users.phone, input.phone));
    const [user] = existing
      ? await this.db
          .update(users)
          .set({ staffRole: input.role, name: existing.name ?? input.name })
          .where(eq(users.id, existing.id))
          .returning(staffColumns)
      : await this.db.insert(users).values({ phone: input.phone, name: input.name, staffRole: input.role }).returning(staffColumns);
    await this.audit.record('staff.role_granted', { actorUserId, metadata: { userId: user.id, role: input.role } });
    return user;
  }

  async remove(actorUserId: string, userId: string) {
    if (actorUserId === userId) throw new BadRequestException('You cannot remove your own staff access');
    const [user] = await this.db
      .update(users)
      .set({ staffRole: null })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    if (!user) throw new NotFoundException('Staff member not found');
    await this.audit.record('staff.role_removed', { actorUserId, metadata: { userId } });
    return { removed: true };
  }
}
