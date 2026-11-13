import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  effectiveAccess,
  effectivePermissions,
  hasAccess,
  type AccessLevel,
  type Permission,
} from '@fm/shared';
import { DB, type Database } from '../db/db.module';
import { profileMembers, type ProfileMember } from '../db/schema';

/** Resolves what a logged-in user may do on a candidate profile. */
@Injectable()
export class AccessService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async membership(profileId: string, userId: string): Promise<ProfileMember> {
    const [member] = await this.db
      .select()
      .from(profileMembers)
      .where(
        and(
          eq(profileMembers.profileId, profileId),
          eq(profileMembers.userId, userId),
          eq(profileMembers.status, 'ACTIVE'),
        ),
      );
    // Same answer whether the profile is missing or the user has no access, so ids can't be probed.
    if (!member) throw new NotFoundException('Profile not found');
    return member;
  }

  async require(
    profileId: string,
    userId: string,
    permission: Permission,
    level: AccessLevel = 'ALLOW',
  ): Promise<ProfileMember> {
    const member = await this.membership(profileId, userId);
    if (!hasAccess(member.role, permission, level, member.overrides)) {
      const actual = effectiveAccess(member.role, permission, member.overrides);
      throw new ForbiddenException({
        message: `Your access does not allow ${permission}`,
        permission,
        access: actual,
      });
    }
    return member;
  }

  async requireCandidate(profileId: string, userId: string): Promise<ProfileMember> {
    const member = await this.membership(profileId, userId);
    if (member.role !== 'CANDIDATE') throw new ForbiddenException('Only the candidate can do this');
    return member;
  }

  describe(member: ProfileMember) {
    return {
      memberId: member.id,
      relation: member.relation,
      role: member.role,
      isFamilyAdmin: member.isFamilyAdmin,
      permissions: effectivePermissions(member.role, member.overrides),
    };
  }
}
