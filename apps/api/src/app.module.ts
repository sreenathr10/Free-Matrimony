import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { HealthController } from './health.controller';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, AuditModule, AuthModule, ProfilesModule],
  controllers: [HealthController],
})
export class AppModule {}
