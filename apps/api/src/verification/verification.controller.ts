import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  submitVerificationSchema,
  VERIFICATION_FILES,
  VERIFICATION_STATUSES,
  verificationDecisionSchema,
  verificationQueueQuerySchema,
  verificationUploadSchema,
  type SubmitVerificationInput,
  type VerificationDecisionInput,
  type VerificationFile,
  type VerificationQueueQuery,
  type VerificationUploadInput,
} from '@fm/shared';
import type { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ApiZodBody } from '../common/openapi';
import { ZodPipe } from '../common/zod.pipe';
import { StaffOnly } from '../staff/staff.guard';
import { VerificationService } from './verification.service';

const fileParam = new ZodPipe(z.enum(VERIFICATION_FILES));

/** Member side: the candidate uploads a selfie and ID, and the family submits the profile. */
@ApiTags('Verification')
@Controller('profiles/:id')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  /** Progress of the latest verification, or null if none started. */
  @Get('verification')
  get(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.verification.get(u.sub, id);
  }

  /** Step 1 (candidate only): a signed URL to PUT the selfie or one side of the ID to. */
  @Post('verification/uploads')
  @ApiZodBody(verificationUploadSchema)
  requestUpload(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(verificationUploadSchema)) body: VerificationUploadInput,
  ) {
    return this.verification.requestUpload(u.sub, id, body);
  }

  /** Step 2 (candidate only): process the uploaded file. */
  @Post('verification/uploads/:file/confirm')
  @ApiParam({ name: 'file', enum: VERIFICATION_FILES })
  confirm(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Param('file', fileParam) file: VerificationFile) {
    return this.verification.confirmUpload(u.sub, id, file);
  }

  /** Step 3: run the automatic checks and send the profile to the verification team. */
  @Post('submit')
  @ApiZodBody(submitVerificationSchema)
  submit(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(submitVerificationSchema)) body: SubmitVerificationInput,
  ) {
    return this.verification.submit(u.sub, id, body);
  }
}

/** Staff side: the verification team's queue and decisions. */
@ApiTags('Staff: verification')
@Controller('staff/verifications')
@StaffOnly('VERIFIER')
export class StaffVerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: VERIFICATION_STATUSES, required: false })
  @ApiQuery({ name: 'flagged', enum: ['true', 'false'], required: false })
  queue(@Query(new ZodPipe(verificationQueueQuerySchema)) query: VerificationQueueQuery) {
    return this.verification.queue(query);
  }

  @Get('stats')
  stats() {
    return this.verification.stats();
  }

  @Get(':verificationId')
  detail(@CurrentUser() u: JwtPayload, @Param('verificationId', ParseUUIDPipe) id: string) {
    return this.verification.detail(u.sub, id);
  }

  @Post(':verificationId/decision')
  @ApiZodBody(verificationDecisionSchema)
  decide(
    @CurrentUser() u: JwtPayload,
    @Param('verificationId', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(verificationDecisionSchema)) body: VerificationDecisionInput,
  ) {
    return this.verification.decide(u.sub, id, body);
  }
}
