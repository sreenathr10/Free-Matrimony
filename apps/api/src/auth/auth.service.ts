import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { DB, type Database } from '../db/db.module';
import { otpCodes, profileMembers, users } from '../db/schema';
import { OtpSender } from './otp.provider';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_WINDOW = 3;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;

const hash = (phone: string, code: string) =>
  createHash('sha256').update(`${phone}:${code}`).digest('hex');

export interface JwtPayload {
  sub: string;
  phone: string;
  staffRole: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly otp: OtpSender,
    private readonly config: ConfigService,
  ) {}

  private get devMode() {
    return this.config.get('OTP_DEV_MODE') === 'true';
  }

  async requestOtp(phone: string) {
    const recent = await this.db
      .select({ id: otpCodes.id })
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, new Date(Date.now() - REQUEST_WINDOW_MS))));
    if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException('Too many codes requested. Try again in a few minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.db.insert(otpCodes).values({
      phone,
      codeHash: hash(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    await this.otp.send(phone, code);
    return this.devMode ? { sent: true, devCode: code } : { sent: true };
  }

  async verifyOtp(phone: string, code: string, name?: string) {
    const [otp] = await this.db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otp || otp.attempts >= MAX_ATTEMPTS) throw new UnauthorizedException('Code expired. Request a new one.');

    const ok = timingSafeEqual(Buffer.from(otp.codeHash), Buffer.from(hash(phone, code)));
    if (!ok) {
      await this.db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
      throw new UnauthorizedException('Incorrect code');
    }
    await this.db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));

    let [user] = await this.db.select().from(users).where(eq(users.phone, phone));
    const isNew = !user;
    if (!user) {
      [user] = await this.db.insert(users).values({ phone, name }).returning();
    }
    if (user.isBlocked) throw new UnauthorizedException('This account is blocked');

    // Link any pending family invitations sent to this phone number.
    await this.db
      .update(profileMembers)
      .set({ userId: user.id })
      .where(and(eq(profileMembers.invitedPhone, phone), isNull(profileMembers.userId)));

    const payload: JwtPayload = { sub: user.id, phone: user.phone, staffRole: user.staffRole };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user.id, phone: user.phone, name: user.name, staffRole: user.staffRole },
      isNew,
    };
  }
}
