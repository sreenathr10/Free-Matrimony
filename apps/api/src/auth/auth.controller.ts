import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiZodBody } from '../common/openapi';
import {
  requestOtpSchema,
  verifyOtpSchema,
  type RequestOtpInput,
  type VerifyOtpInput,
} from '@fm/shared';
import { ZodPipe } from '../common/zod.pipe';
import { AuthService, type JwtPayload } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtGuard } from './jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  @HttpCode(200)
  @ApiZodBody(requestOtpSchema)
  request(@Body(new ZodPipe(requestOtpSchema)) body: RequestOtpInput) {
    return this.auth.requestOtp(body.phone);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @ApiZodBody(verifyOtpSchema)
  verify(@Body(new ZodPipe(verifyOtpSchema)) body: VerifyOtpInput) {
    return this.auth.verifyOtp(body.phone, body.code, body.name);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
