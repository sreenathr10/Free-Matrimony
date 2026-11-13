import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, Put, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MAX_PHOTO_BYTES } from '@fm/shared';
import { LocalStorageService, StorageService } from './storage.service';

/** Serves signed upload/download URLs for LocalStorageService. Returns 404 when S3 is in use. */
@Controller('local-storage')
export class LocalStorageController {
  constructor(private readonly storage: StorageService) {}

  private local(method: string, key: string, exp: string, sig: string) {
    if (!(this.storage instanceof LocalStorageService)) throw new NotFoundException();
    if (!this.storage.verify(method, key, Number(exp), sig)) throw new ForbiddenException('Invalid or expired link');
    return this.storage;
  }

  @Put()
  async upload(@Query('key') key: string, @Query('exp') exp: string, @Query('sig') sig: string, @Req() req: Request) {
    const storage = this.local('PUT', key, exp, sig);
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_PHOTO_BYTES) throw new BadRequestException('File too large');
      chunks.push(chunk as Buffer);
    }
    await storage.put(key, Buffer.concat(chunks));
    return { ok: true };
  }

  @Get()
  async download(@Query('key') key: string, @Query('exp') exp: string, @Query('sig') sig: string, @Res() res: Response) {
    const storage = this.local('GET', key, exp, sig);
    const body = await storage.get(key);
    if (!body) throw new NotFoundException();
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.type(key.endsWith('.webp') ? 'image/webp' : 'application/octet-stream').send(body);
  }
}
