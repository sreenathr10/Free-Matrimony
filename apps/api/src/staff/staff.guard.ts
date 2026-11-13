import { applyDecorators, CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import type { StaffRole } from '@fm/shared';
import { JwtGuard, type AuthedRequest } from '../auth/jwt.guard';
import { DB, type Database } from '../db/db.module';
import { users } from '../db/schema';

const STAFF_ROLES_KEY = 'staffRoles';

/**
 * Allows only staff with one of the given roles. Admins can always pass.
 * The role is read from the database on every request, so removing someone's role takes effect at once
 * (the role inside their token is not trusted).
 */
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DB) private readonly db: Database,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<StaffRole[]>(STAFF_ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) ?? [];
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const [user] = await this.db
      .select({ staffRole: users.staffRole, isBlocked: users.isBlocked })
      .from(users)
      .where(eq(users.id, req.user.sub));
    const role = user && !user.isBlocked ? user.staffRole : null;
    if (!role || (role !== 'ADMIN' && roles.length > 0 && !roles.includes(role))) {
      throw new ForbiddenException('Staff access required');
    }
    req.user = { ...req.user, staffRole: role };
    return true;
  }
}

/** Marks a controller or route as staff-only, optionally limited to some roles. */
export const StaffOnly = (...roles: StaffRole[]) =>
  applyDecorators(
    SetMetadata(STAFF_ROLES_KEY, roles),
    UseGuards(JwtGuard, StaffGuard),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'Not staff, or the wrong staff role' }),
  );
