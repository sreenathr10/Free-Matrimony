import { Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { MembersService } from './members.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, MembersService, AccessService],
  exports: [AccessService],
})
export class ProfilesModule {}
