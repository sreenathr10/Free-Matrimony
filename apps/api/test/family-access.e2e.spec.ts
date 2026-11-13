import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { runMigrations } from '../src/db/migrate';

const DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://fm:fm@localhost:5432/free_matrimony_test';

process.env.DATABASE_URL = DATABASE_URL;
process.env.JWT_SECRET = 'test-secret';
process.env.OTP_DEV_MODE = 'true';

// Imported after env is set so config picks it up.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AppModule } = require('../src/app.module');

const PHONES = {
  mother: '+919800000001',
  candidate: '+971500000002',
  sister: '+919800000003',
  uncle: '+919800000004',
  stranger: '+447700000005',
};

describe('Family accounts and access (e2e)', () => {
  let app: INestApplication;
  const tokens: Record<string, string> = {};
  let profileId: string;
  const memberIds: Record<string, string> = {};

  const api = () => request(app.getHttpServer());
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });

  async function login(who: keyof typeof PHONES, name: string) {
    const phone = PHONES[who];
    const req = await api().post('/v1/auth/otp/request').send({ phone }).expect(200);
    const res = await api()
      .post('/v1/auth/otp/verify')
      .send({ phone, code: req.body.devCode, name })
      .expect(200);
    tokens[who] = res.body.accessToken;
  }

  beforeAll(async () => {
    const pool = new Pool({ connectionString: DATABASE_URL });
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;');
    await pool.end();
    await runMigrations(DATABASE_URL);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects a wrong OTP', async () => {
    await api().post('/v1/auth/otp/request').send({ phone: PHONES.stranger }).expect(200);
    await api().post('/v1/auth/otp/verify').send({ phone: PHONES.stranger, code: '000000' }).expect(401);
  });

  it('rejects a badly formatted phone number', async () => {
    const res = await api().post('/v1/auth/otp/request').send({ phone: '98765' }).expect(400);
    expect(res.body.issues[0].path).toBe('phone');
  });

  it('lets a mother create a profile for her daughter', async () => {
    await login('mother', 'Lakshmi');
    const res = await api()
      .post('/v1/profiles')
      .set(as('mother'))
      .send({
        createdAs: 'MOTHER',
        fullName: 'Anjali Nair',
        gender: 'FEMALE',
        dateOfBirth: '1997-04-12',
        religion: 'HINDU',
        community: 'Nair',
        star: 'ROHINI',
        nativeDistrict: 'THRISSUR',
        currentCountry: 'ae',
        currentCity: 'Dubai',
        occupation: 'Architect',
      })
      .expect(201);
    profileId = res.body.id;
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.currentCountry).toBe('AE');

    const mine = await api().get('/v1/profiles/mine').set(as('mother')).expect(200);
    expect(mine.body[0].access.role).toBe('PARENT');
    expect(mine.body[0].access.isFamilyAdmin).toBe(true);
    expect(mine.body[0].access.permissions.MANAGE_PRIVACY).toBe('DENY');
  });

  it('refuses under-18 profiles', async () => {
    const res = await api()
      .post('/v1/profiles')
      .set(as('mother'))
      .send({ createdAs: 'MOTHER', fullName: 'Too Young', gender: 'FEMALE', dateOfBirth: '2015-01-01', religion: 'HINDU', currentCountry: 'IN' })
      .expect(400);
    expect(res.body.issues[0].path).toBe('dateOfBirth');
  });

  it('lets the mother invite the candidate, a sister and an uncle', async () => {
    for (const [who, relation] of [['candidate', 'SELF'], ['sister', 'SISTER'], ['uncle', 'UNCLE']] as const) {
      const res = await api()
        .post(`/v1/profiles/${profileId}/members`)
        .set(as('mother'))
        .send({ phone: PHONES[who], relation })
        .expect(201);
      memberIds[who] = res.body.memberId;
    }
    await api()
      .post(`/v1/profiles/${profileId}/members`)
      .set(as('mother'))
      .send({ phone: PHONES.sister, relation: 'SISTER' })
      .expect(409);
  });

  it('only lets the candidate customise access, even at invite time', async () => {
    await api()
      .post(`/v1/profiles/${profileId}/members`)
      .set(as('mother'))
      .send({ phone: '+919800000099', relation: 'BROTHER', overrides: { CHAT: 'ALLOW' } })
      .expect(403);
  });

  it('will not submit the profile without the candidate’s consent', async () => {
    const res = await api()
      .post(`/v1/profiles/${profileId}/submit`)
      .set(as('mother'))
      .send({ idDocumentType: 'PASSPORT' })
      .expect(400);
    expect(res.body.message).toMatch(/consent/);
  });

  it('lets the candidate join and consent; submitting then waits for their selfie and ID', async () => {
    await login('candidate', 'Anjali');
    const mine = await api().get('/v1/profiles/mine').set(as('candidate')).expect(200);
    expect(mine.body[0].invitationPending).toBe(true);

    // Not yet a member until accepted.
    await api().get(`/v1/profiles/${profileId}`).set(as('candidate')).expect(404);
    await api().post(`/v1/profiles/${profileId}/members/accept`).set(as('candidate')).expect(201);

    // A parent cannot consent on the candidate's behalf.
    await api().post(`/v1/profiles/${profileId}/consent`).set(as('mother')).expect(403);
    await api().post(`/v1/profiles/${profileId}/consent`).set(as('candidate')).expect(201);

    // Consent alone is not enough: the candidate's own selfie and ID come next (see verification.e2e.spec.ts).
    const res = await api()
      .post(`/v1/profiles/${profileId}/submit`)
      .set(as('mother'))
      .send({ idDocumentType: 'PASSPORT' })
      .expect(400);
    expect(res.body.message).toMatch(/selfie/);
  });

  it('gives a sister browse access but only edit suggestions', async () => {
    await login('sister', 'Divya');
    await api().post(`/v1/profiles/${profileId}/members/accept`).set(as('sister')).expect(201);
    const members = await api().get(`/v1/profiles/${profileId}/members`).set(as('sister')).expect(200);
    expect(members.body).toHaveLength(4);

    const res = await api()
      .patch(`/v1/profiles/${profileId}`)
      .set(as('sister'))
      .send({ occupation: 'Senior Architect' })
      .expect(403);
    expect(res.body.access).toBe('SUGGEST');
  });

  it('lets only the candidate change a relative’s access', async () => {
    await api()
      .patch(`/v1/profiles/${profileId}/members/${memberIds.sister}/permissions`)
      .set(as('mother'))
      .send({ overrides: { EDIT_PROFILE: 'ALLOW' } })
      .expect(403);

    const res = await api()
      .patch(`/v1/profiles/${profileId}/members/${memberIds.sister}/permissions`)
      .set(as('candidate'))
      .send({ overrides: { EDIT_PROFILE: 'ALLOW' } })
      .expect(200);
    expect(res.body.permissions.EDIT_PROFILE).toBe('ALLOW');

    await api()
      .patch(`/v1/profiles/${profileId}`)
      .set(as('sister'))
      .send({ occupation: 'Senior Architect' })
      .expect(200);
  });

  it('never gives privacy control to a relative', async () => {
    const mother = (await api().get(`/v1/profiles/${profileId}/members`).set(as('candidate'))).body.find(
      (m: { relation: string }) => m.relation === 'MOTHER',
    );
    await api()
      .patch(`/v1/profiles/${profileId}/members/${mother.memberId}/permissions`)
      .set(as('candidate'))
      .send({ overrides: { MANAGE_PRIVACY: 'ALLOW' } })
      .expect(400);
    await api().post(`/v1/profiles/${profileId}/visibility`).set(as('mother')).send({ hidden: true }).expect(403);
  });

  it('protects the candidate from removal, but lets them remove relatives', async () => {
    await api().delete(`/v1/profiles/${profileId}/members/${memberIds.candidate}`).set(as('mother')).expect(403);
    await api().delete(`/v1/profiles/${profileId}/members/${memberIds.uncle}`).set(as('candidate')).expect(200);
    const members = await api().get(`/v1/profiles/${profileId}/members`).set(as('candidate')).expect(200);
    expect(members.body).toHaveLength(3);
  });

  it('hides the profile from people outside the family', async () => {
    await login('stranger', 'Someone');
    await api().get(`/v1/profiles/${profileId}`).set(as('stranger')).expect(404);
    await api().get(`/v1/profiles/${profileId}`).expect(401);
  });

  it('records an audit trail', async () => {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const { rows } = await pool.query('SELECT action FROM audit_log WHERE profile_id = $1 ORDER BY created_at', [profileId]);
    await pool.end();
    const actions = rows.map((r) => r.action);
    expect(actions).toEqual(
      expect.arrayContaining(['profile.created', 'member.invited', 'profile.consent_given', 'member.permissions_changed', 'member.removed']),
    );
  });
});
