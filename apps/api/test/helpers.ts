import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import request from 'supertest';
import { runMigrations } from '../src/db/migrate';

export const DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://fm:fm@localhost:5432/free_matrimony_test';

/** Fresh database + app for one test file. */
export async function createTestApp() {
  process.env.DATABASE_URL = DATABASE_URL;
  process.env.JWT_SECRET = 'test-secret';
  process.env.OTP_DEV_MODE = 'true';
  process.env.STORAGE_DRIVER = 'local';
  process.env.STORAGE_DIR = mkdtempSync(path.join(tmpdir(), 'fm-storage-'));
  process.env.PUBLIC_API_URL = 'http://test.local';

  const pool = new Pool({ connectionString: DATABASE_URL });
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;');
  await pool.end();
  await runMigrations(DATABASE_URL);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppModule } = require('../src/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  app.setGlobalPrefix('v1');
  await app.init();

  const tokens: Record<string, string> = {};
  const api = () => request(app.getHttpServer());

  async function login(who: string, phone: string, name = who) {
    const req = await api().post('/v1/auth/otp/request').send({ phone }).expect(200);
    const res = await api().post('/v1/auth/otp/verify').send({ phone, code: req.body.devCode, name }).expect(200);
    tokens[who] = res.body.accessToken;
  }
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
  /** Turns an absolute signed URL from LocalStorageService into a path supertest can call. */
  const local = (url: string) => url.replace('http://test.local', '');

  return { app, api, login, as, local };
}

export const sampleProfile = {
  fullName: 'Anjali Nair',
  gender: 'FEMALE',
  dateOfBirth: '1997-04-12',
  religion: 'HINDU',
  community: 'Nair',
  currentCountry: 'AE',
  currentCity: 'Dubai',
};
