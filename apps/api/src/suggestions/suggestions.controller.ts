import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  reviewSuggestionSchema,
  updateProfileSchema,
  type ReviewSuggestionInput,
  type UpdateProfileInput,
} from '@fm/shared';
import type { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodPipe } from '../common/zod.pipe';
import { SuggestionsService } from './suggestions.service';

@Controller('profiles/:id/suggestions')
@UseGuards(JwtGuard)
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.suggestions.list(u.sub, id);
  }

  @Post()
  create(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.suggestions.create(u.sub, id, body);
  }

  @Post(':suggestionId/review')
  review(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
    @Body(new ZodPipe(reviewSuggestionSchema)) body: ReviewSuggestionInput,
  ) {
    return this.suggestions.review(u.sub, id, suggestionId, body);
  }
}
