import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiZodBody } from '../common/openapi';
import { z } from 'zod';
import { photoUploadRequestSchema, type PhotoUploadRequest } from '@fm/shared';
import type { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodPipe } from '../common/zod.pipe';
import { PhotosService } from './photos.service';

const reorderSchema = z.object({ photoIds: z.array(z.string().uuid()).min(1) });

@ApiTags('Photos')
@Controller('profiles/:id/photos')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.photos.list(u.sub, id);
  }

  /** Step 1: get a signed URL, then PUT the file there. */
  @Post('uploads')
  @ApiZodBody(photoUploadRequestSchema)
  requestUpload(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(photoUploadRequestSchema)) body: PhotoUploadRequest,
  ) {
    return this.photos.requestUpload(u.sub, id, body);
  }

  /** Step 2: after the upload, process it (strip metadata, resize, blur). */
  @Post(':photoId/confirm')
  confirm(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Param('photoId', ParseUUIDPipe) photoId: string) {
    return this.photos.confirm(u.sub, id, photoId);
  }

  @Post(':photoId/primary')
  primary(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Param('photoId', ParseUUIDPipe) photoId: string) {
    return this.photos.setPrimary(u.sub, id, photoId);
  }

  @Put('order')
  @ApiZodBody(reorderSchema)
  reorder(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(reorderSchema)) body: z.infer<typeof reorderSchema>,
  ) {
    return this.photos.reorder(u.sub, id, body.photoIds);
  }

  @Delete(':photoId')
  remove(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Param('photoId', ParseUUIDPipe) photoId: string) {
    return this.photos.remove(u.sub, id, photoId);
  }
}
