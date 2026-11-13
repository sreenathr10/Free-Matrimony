import { Module } from '@nestjs/common';
import { PhotosController } from '../photos/photos.controller';
import { PhotosService } from '../photos/photos.service';
import { PreferencesController } from '../preferences/preferences.controller';
import { PreferencesService } from '../preferences/preferences.service';
import { SuggestionsController } from '../suggestions/suggestions.controller';
import { SuggestionsService } from '../suggestions/suggestions.service';
import { AccessService } from './access.service';
import { MembersService } from './members.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  controllers: [ProfilesController, PhotosController, PreferencesController, SuggestionsController],
  providers: [ProfilesService, MembersService, AccessService, PhotosService, PreferencesService, SuggestionsService],
  exports: [AccessService],
})
export class ProfilesModule {}
