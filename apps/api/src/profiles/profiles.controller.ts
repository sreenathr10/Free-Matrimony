import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiZodBody } from '../common/openapi';
import { z } from 'zod';
import {
  createProfileSchema,
  inviteMemberSchema,
  updateMemberPermissionsSchema,
  updateProfileSchema,
  type CreateProfileInput,
  type InviteMemberInput,
  type UpdateMemberPermissionsInput,
  type UpdateProfileInput,
} from '@fm/shared';
import type { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodPipe } from '../common/zod.pipe';
import { MembersService } from './members.service';
import { ProfilesService } from './profiles.service';

const visibilitySchema = z.object({ hidden: z.boolean() });

@ApiTags('Profiles and family')
@Controller('profiles')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ProfilesController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly members: MembersService,
  ) {}

  @Post()
  @ApiZodBody(createProfileSchema)
  create(@CurrentUser() user: JwtPayload, @Body(new ZodPipe(createProfileSchema)) body: CreateProfileInput) {
    return this.profiles.create(user.sub, body);
  }

  @Get('mine')
  mine(@CurrentUser() user: JwtPayload) {
    return this.profiles.listMine(user.sub);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.profiles.get(user.sub, id);
  }

  @Patch(':id')
  @ApiZodBody(updateProfileSchema)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.profiles.update(user.sub, id, body);
  }

  @Post(':id/consent')
  consent(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.profiles.consent(user.sub, id);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.profiles.submitForVerification(user.sub, id);
  }

  @Post(':id/visibility')
  @ApiZodBody(visibilitySchema)
  visibility(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(visibilitySchema)) body: z.infer<typeof visibilitySchema>,
  ) {
    return this.profiles.setHidden(user.sub, id, body.hidden);
  }

  @Get(':id/members')
  listMembers(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.members.list(user.sub, id);
  }

  @Post(':id/members')
  @ApiZodBody(inviteMemberSchema)
  invite(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(inviteMemberSchema)) body: InviteMemberInput,
  ) {
    return this.members.invite(user.sub, id, body);
  }

  @Post(':id/members/accept')
  accept(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.members.accept(user.sub, id);
  }

  @Patch(':id/members/:memberId/permissions')
  @ApiZodBody(updateMemberPermissionsSchema)
  updatePermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body(new ZodPipe(updateMemberPermissionsSchema)) body: UpdateMemberPermissionsInput,
  ) {
    return this.members.updatePermissions(user.sub, id, memberId, body.overrides);
  }

  @Delete(':id/members/:memberId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.members.remove(user.sub, id, memberId);
  }
}
