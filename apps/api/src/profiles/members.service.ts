import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import {
  DEFAULT_ROLE_FOR_RELATION,
  validateOverrides,
  type InviteMemberInput,
  type PermissionOverrides,
} from '@fm/shared';
import { AuditService } from '../audit/audit.service';
import { DB, type Database } from '../db/db.module';
import { profileMembers, profiles, users } from '../db/schema';
import { AccessService } from './access.service';

@Injectable()
export class MembersService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string, profileId: string) {
    await this.access.membership(profileId, userId);
    const rows = await this.db
      .select({ member: profileMembers, name: users.name })
      .from(profileMembers)
      .leftJoin(users, eq(users.id, profileMembers.userId))
      .where(and(eq(profileMembers.profileId, profileId), ne(profileMembers.status, 'REMOVED')));
    return rows.map(({ member, name }) => ({
      ...this.access.describe(member),
      name,
      status: member.status,
      invitedPhone: member.status === 'INVITED' ? member.invitedPhone : undefined,
    }));
  }

  async invite(userId: string, profileId: string, input: InviteMemberInput) {
    const inviter = await this.access.require(profileId, userId, 'MANAGE_FAMILY');
    const role = DEFAULT_ROLE_FOR_RELATION[input.relation];
    const overrides: PermissionOverrides = input.overrides ?? {};

    if (Object.keys(overrides).length > 0) {
      if (inviter.role !== 'CANDIDATE') throw new ForbiddenException('Only the candidate can customise access');
      const problems = validateOverrides(role, overrides);
      if (problems.length) throw new BadRequestException({ message: 'Invalid access settings', problems });
    }

    const existing = await this.db
      .select({ member: profileMembers, phone: users.phone })
      .from(profileMembers)
      .leftJoin(users, eq(users.id, profileMembers.userId))
      .where(and(eq(profileMembers.profileId, profileId), ne(profileMembers.status, 'REMOVED')));

    if (existing.some((e) => e.member.invitedPhone === input.phone || e.phone === input.phone)) {
      throw new ConflictException('This person is already in the family for this profile');
    }
    if (role === 'CANDIDATE' && existing.some((e) => e.member.role === 'CANDIDATE')) {
      throw new ConflictException('This profile already has a candidate');
    }

    const [invitee] = await this.db.select().from(users).where(eq(users.phone, input.phone));
    const [member] = await this.db
      .insert(profileMembers)
      .values({
        profileId,
        userId: invitee?.id ?? null,
        invitedPhone: input.phone,
        relation: input.relation,
        role,
        overrides,
        status: 'INVITED',
        invitedById: userId,
      })
      .returning();

    // TODO: send the invitation by SMS / WhatsApp with a deep link to the app.
    await this.audit.record('member.invited', {
      actorUserId: userId,
      profileId,
      metadata: { memberId: member.id, relation: input.relation, role },
    });
    return { ...this.access.describe(member), status: member.status };
  }

  async accept(userId: string, profileId: string) {
    const [member] = await this.db
      .select()
      .from(profileMembers)
      .where(
        and(
          eq(profileMembers.profileId, profileId),
          eq(profileMembers.userId, userId),
          eq(profileMembers.status, 'INVITED'),
        ),
      );
    if (!member) throw new NotFoundException('No pending invitation for this profile');

    const [updated] = await this.db
      .update(profileMembers)
      .set({ status: 'ACTIVE' })
      .where(eq(profileMembers.id, member.id))
      .returning();
    if (member.role === 'CANDIDATE') {
      await this.db.update(profiles).set({ candidateUserId: userId }).where(eq(profiles.id, profileId));
    }
    await this.audit.record('member.joined', { actorUserId: userId, profileId, metadata: { memberId: member.id } });
    return this.access.describe(updated);
  }

  /** The candidate adjusts what one relative can do. */
  async updatePermissions(userId: string, profileId: string, memberId: string, overrides: PermissionOverrides) {
    await this.access.requireCandidate(profileId, userId);
    const target = await this.findMember(profileId, memberId);
    const problems = validateOverrides(target.role, overrides);
    if (problems.length) throw new BadRequestException({ message: 'Invalid access settings', problems });

    const [updated] = await this.db
      .update(profileMembers)
      .set({ overrides })
      .where(eq(profileMembers.id, memberId))
      .returning();
    await this.audit.record('member.permissions_changed', {
      actorUserId: userId,
      profileId,
      metadata: { memberId, overrides },
    });
    return this.access.describe(updated);
  }

  async remove(userId: string, profileId: string, memberId: string) {
    const actor = await this.access.require(profileId, userId, 'MANAGE_FAMILY');
    const target = await this.findMember(profileId, memberId);
    if (target.role === 'CANDIDATE') throw new ForbiddenException('The candidate cannot be removed');
    if (actor.role !== 'CANDIDATE' && !actor.isFamilyAdmin) {
      throw new ForbiddenException('Only the candidate or the family admin can remove members');
    }
    await this.db.update(profileMembers).set({ status: 'REMOVED' }).where(eq(profileMembers.id, memberId));
    await this.audit.record('member.removed', { actorUserId: userId, profileId, metadata: { memberId } });
    return { removed: true };
  }

  private async findMember(profileId: string, memberId: string) {
    const [m] = await this.db
      .select()
      .from(profileMembers)
      .where(
        and(
          eq(profileMembers.id, memberId),
          eq(profileMembers.profileId, profileId),
          ne(profileMembers.status, 'REMOVED'),
        ),
      );
    if (!m) throw new NotFoundException('Member not found');
    return m;
  }
}
