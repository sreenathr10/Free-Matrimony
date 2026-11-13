import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';
import { LocalStorageController } from './local-storage.controller';
import { LocalStorageService, S3StorageService, StorageService } from './storage.service';

@Global()
@Module({
  controllers: [LocalStorageController],
  providers: [
    {
      provide: StorageService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get('STORAGE_DRIVER', 'local') === 's3'
          ? new S3StorageService(config.getOrThrow('S3_BUCKET'), {
              region: config.get('S3_REGION', 'ap-south-1'),
              endpoint: config.get('S3_ENDPOINT'),
            })
          : new LocalStorageService(
              config.get('STORAGE_DIR', path.resolve(process.cwd(), '.storage')),
              config.get('PUBLIC_API_URL', `http://localhost:${config.get('PORT', 4000)}`),
              config.getOrThrow('JWT_SECRET'),
            ),
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
