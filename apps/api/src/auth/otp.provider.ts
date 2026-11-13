import { Injectable, Logger } from '@nestjs/common';

/** Sends a one-time code. Swap in an SMS/WhatsApp provider (e.g. MSG91, Twilio) for production. */
export abstract class OtpSender {
  abstract send(phone: string, code: string): Promise<void>;
}

@Injectable()
export class ConsoleOtpSender extends OtpSender {
  private readonly logger = new Logger('OTP');

  async send(phone: string, code: string) {
    this.logger.log(`OTP for ${phone}: ${code}`);
  }
}
