import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface PresignedUpload {
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

/** Object storage for photos and documents. S3 (or any S3-compatible store) in production, local disk in development. */
export abstract class StorageService {
  abstract presignUpload(key: string, contentType: string, sizeBytes: number, ttlSeconds?: number): Promise<PresignedUpload>;
  abstract signedUrl(key: string, ttlSeconds?: number): Promise<string>;
  abstract get(key: string): Promise<Buffer | null>;
  abstract put(key: string, body: Buffer, contentType: string): Promise<void>;
  abstract delete(key: string): Promise<void>;
}

export class S3StorageService extends StorageService {
  private readonly s3: S3Client;

  constructor(
    private readonly bucket: string,
    opts: { region: string; endpoint?: string },
  ) {
    super();
    this.s3 = new S3Client({ region: opts.region, endpoint: opts.endpoint, forcePathStyle: !!opts.endpoint });
  }

  async presignUpload(key: string, contentType: string, sizeBytes: number, ttlSeconds = 600) {
    const url = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType, ContentLength: sizeBytes }),
      { expiresIn: ttlSeconds },
    );
    return {
      url,
      method: 'PUT' as const,
      headers: { 'Content-Type': contentType },
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };
  }

  signedUrl(key: string, ttlSeconds = 3600) {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: ttlSeconds });
  }

  async get(key: string) {
    try {
      const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return Buffer.from(await res.Body!.transformToByteArray());
    } catch (e) {
      if ((e as { name?: string }).name === 'NoSuchKey') return null;
      throw e;
    }
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

/**
 * Development storage on local disk. Upload and download URLs point back at the API
 * (LocalStorageController) and are signed with an HMAC so they behave like presigned S3 URLs.
 */
export class LocalStorageService extends StorageService {
  constructor(
    private readonly dir: string,
    private readonly publicApiUrl: string,
    private readonly secret: string,
  ) {
    super();
  }

  sign(method: string, key: string, exp: number) {
    return createHmac('sha256', this.secret).update(`${method}:${key}:${exp}`).digest('hex');
  }

  verify(method: string, key: string, exp: number, sig: string) {
    if (!Number.isFinite(exp) || exp < Date.now()) return false;
    const expected = Buffer.from(this.sign(method, key, exp));
    const given = Buffer.from(sig ?? '');
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  private url(method: string, key: string, ttlSeconds: number) {
    const exp = Date.now() + ttlSeconds * 1000;
    const q = new URLSearchParams({ key, exp: String(exp), sig: this.sign(method, key, exp) });
    return { url: `${this.publicApiUrl}/v1/local-storage?${q}`, exp };
  }

  private file(key: string) {
    const full = path.resolve(this.dir, key);
    if (!full.startsWith(path.resolve(this.dir) + path.sep)) throw new Error('Invalid key');
    return full;
  }

  async presignUpload(key: string, contentType: string, _sizeBytes: number, ttlSeconds = 600) {
    const { url, exp } = this.url('PUT', key, ttlSeconds);
    return { url, method: 'PUT' as const, headers: { 'Content-Type': contentType }, expiresAt: new Date(exp).toISOString() };
  }

  async signedUrl(key: string, ttlSeconds = 3600) {
    return this.url('GET', key, ttlSeconds).url;
  }

  async get(key: string) {
    try {
      return await readFile(this.file(key));
    } catch {
      return null;
    }
  }

  async put(key: string, body: Buffer) {
    const f = this.file(key);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, body);
  }

  async delete(key: string) {
    await rm(this.file(key), { force: true });
  }
}
