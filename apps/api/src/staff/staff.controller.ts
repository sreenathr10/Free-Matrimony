import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { addStaffSchema, type AddStaffInput } from '@fm/shared';
import type { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiZodBody } from '../common/openapi';
import { ZodPipe } from '../common/zod.pipe';
import { StaffOnly } from './staff.guard';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  /** The logged-in staff member. Portals call this after login to check access. */
  @Get('me')
  @StaffOnly()
  me(@CurrentUser() u: JwtPayload) {
    return this.staff.me(u.sub);
  }

  @Get('members')
  @StaffOnly('ADMIN')
  list() {
    return this.staff.list();
  }

  @Post('members')
  @StaffOnly('ADMIN')
  @ApiZodBody(addStaffSchema)
  add(@CurrentUser() u: JwtPayload, @Body(new ZodPipe(addStaffSchema)) body: AddStaffInput) {
    return this.staff.add(u.sub, body);
  }

  @Delete('members/:userId')
  @StaffOnly('ADMIN')
  remove(@CurrentUser() u: JwtPayload, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.staff.remove(u.sub, userId);
  }
}
