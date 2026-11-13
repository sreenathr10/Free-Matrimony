import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { HealthController } from './health.controller';
import { ReferenceController } from './reference.controller';
import { ProfilesModule } from './profiles/profiles.module';
import { StorageModule } from './storage/storage.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, AuditModule, AuthModule, StorageModule, ProfilesModule, VerificationModule],
  controllers: [HealthController, ReferenceController],
})
export class AppModule {}
