import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiZodBody } from '../common/openapi';
import { partnerPreferencesSchema, type PartnerPreferences } from '@fm/shared';
import type { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodPipe } from '../common/zod.pipe';
import { PreferencesService } from './preferences.service';

@ApiTags('Partner preferences')
@Controller('profiles/:id/preferences')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class PreferencesController {
  constructor(private readonly prefs: PreferencesService) {}

  @Get()
  get(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.prefs.get(u.sub, id);
  }

  @Put()
  @ApiZodBody(partnerPreferencesSchema)
  set(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(partnerPreferencesSchema)) body: PartnerPreferences,
  ) {
    return this.prefs.set(u.sub, id, body);
  }
}
