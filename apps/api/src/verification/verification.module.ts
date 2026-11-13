import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KycProvider, MockKycProvider } from '../kyc/kyc.provider';
import { ProfilesModule } from '../profiles/profiles.module';
import { StaffController } from '../staff/staff.controller';
import { StaffGuard } from '../staff/staff.guard';
import { StaffService } from '../staff/staff.service';
import { StaffVerificationController, VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [ProfilesModule],
  controllers: [VerificationController, StaffVerificationController, StaffController],
  providers: [
    VerificationService,
    StaffService,
    StaffGuard,
    {
      provide: KycProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const driver = config.get('KYC_PROVIDER', 'mock');
        if (driver === 'mock') return new MockKycProvider();
        // Vendor adapters (HyperVerge, IDfy, Onfido, Veriff) plug in here once contracts are signed.
        throw new Error(`Unknown KYC_PROVIDER "${driver}"`);
      },
    },
  ],
})
export class VerificationModule {}
