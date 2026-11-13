import { Pool } from 'pg';
import sharp from 'sharp';
import { createTestApp, DATABASE_URL, sampleProfile } from './helpers';

const image = (w: number, h: number, r = 200) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r, g: 120, b: 90 } } })
    .jpeg()
    .withExif({ IFD0: { ImageDescription: 'gps and secrets' } })
    .toBuffer();

describe('M3 verification and staff (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let profileId: string;
  let verificationId: string;
  const db = new Pool({ connectionString: DATABASE_URL });
  const makeStaff = (phone: string, role: string) => db.query('update users set staff_role = $1 where phone = $2', [role, phone]);

  async function uploadDoc(who: string, pid: string, file: string, body: Buffer) {
    const req = await t
      .api()
      .post(`/v1/profiles/${pid}/verification/uploads`)
      .set(t.as(who))
      .send({ file, contentType: 'image/jpeg', sizeBytes: body.length })
      .expect(201);
    await t.api().put(t.local(req.body.upload.url)).set('Content-Type', 'image/jpeg').send(body).expect(200);
    return t.api().post(`/v1/profiles/${pid}/verification/uploads/${file}/confirm`).set(t.as(who));
  }

  /** A profile created by a mother, joined and consented to by the candidate. */
  async function consentedProfile(prefix: string, extra: Record<string, unknown> = {}) {
    await t.login(`${prefix}mother`, `+9198200${prefix.length}0001`);
    const p = await t
      .api()
      .post('/v1/profiles')
      .set(t.as(`${prefix}mother`))
      .send({ ...sampleProfile, createdAs: 'MOTHER', ...extra })
      .expect(201);
    const phone = `+9715200${prefix.length}0002`;
    await t.api().post(`/v1/profiles/${p.body.id}/members`).set(t.as(`${prefix}mother`)).send({ phone, relation: 'SELF' }).expect(201);
    await t.login(`${prefix}candidate`, phone);
    await t.api().post(`/v1/profiles/${p.body.id}/members/accept`).set(t.as(`${prefix}candidate`)).expect(201);
    await t.api().post(`/v1/profiles/${p.body.id}/consent`).set(t.as(`${prefix}candidate`)).expect(201);
    return p.body.id as string;
  }

  beforeAll(async () => {
    t = await createTestApp();
    profileId = await consentedProfile('a');
    await t.login('verifier', '+919830000001', 'Vera');
    await t.login('agent', '+919830000002', 'Sam');
    await t.login('admin', '+919830000003', 'Ada');
    await t.login('stranger', '+447730000004');
    await makeStaff('+919830000001', 'VERIFIER');
    await makeStaff('+919830000002', 'SUPPORT_AGENT');
    await makeStaff('+919830000003', 'ADMIN');
  });

  afterAll(async () => {
    await db.end();
    await t.app.close();
  });

  it('lets only the candidate upload identity documents', async () => {
    await t
      .api()
      .post(`/v1/profiles/${profileId}/verification/uploads`)
      .set(t.as('amother'))
      .send({ file: 'SELFIE', contentType: 'image/jpeg', sizeBytes: 1000 })
      .expect(403);
    await t.api().get(`/v1/profiles/${profileId}/verification`).set(t.as('stranger')).expect(404);
    const none = await t.api().get(`/v1/profiles/${profileId}/verification`).set(t.as('amother')).expect(200);
    expect(none.body).toEqual({});
  });

  it('rejects images that are too small', async () => {
    const res = await uploadDoc('acandidate', profileId, 'SELFIE', await image(200, 200));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 400px/);
  });

  it('collects a selfie and ID, and says what is still missing', async () => {
    expect((await uploadDoc('acandidate', profileId, 'SELFIE', await image(800, 1000))).status).toBe(201);
    const front = await uploadDoc('acandidate', profileId, 'ID_FRONT', await image(1200, 800, 10));
    expect(front.status).toBe(201);
    expect(front.body.files).toEqual({ SELFIE: true, ID_FRONT: true, ID_BACK: false });

    const missing = await t
      .api()
      .post(`/v1/profiles/${profileId}/submit`)
      .set(t.as('amother'))
      .send({ idDocumentType: 'EMIRATES_ID' })
      .expect(400);
    expect(missing.body.message).toMatch(/back of the ID/);

    await uploadDoc('acandidate', profileId, 'ID_BACK', await image(1200, 800, 20));
  });

  it('runs the checks on submit and puts the profile in the queue', async () => {
    const res = await t
      .api()
      .post(`/v1/profiles/${profileId}/submit`)
      .set(t.as('amother'))
      .send({ idDocumentType: 'EMIRATES_ID' })
      .expect(201);
    expect(res.body.status).toBe('IN_REVIEW');
    expect(res.body).not.toHaveProperty('checks'); // families never see check details
    verificationId = res.body.id;

    const profile = await t.api().get(`/v1/profiles/${profileId}`).set(t.as('amother')).expect(200);
    expect(profile.body.profile.status).toBe('PENDING_VERIFICATION');

    // Nothing more can be uploaded while in review.
    await t
      .api()
      .post(`/v1/profiles/${profileId}/verification/uploads`)
      .set(t.as('acandidate'))
      .send({ file: 'SELFIE', contentType: 'image/jpeg', sizeBytes: 1000 })
      .expect(400);
  });

  it('keeps the queue to verifiers and admins, checking the role on every request', async () => {
    await t.api().get('/v1/staff/verifications').set(t.as('stranger')).expect(403);
    await t.api().get('/v1/staff/verifications').set(t.as('agent')).expect(403);
    await t.api().get('/v1/staff/verifications').set(t.as('admin')).expect(200);

    const queue = await t.api().get('/v1/staff/verifications').set(t.as('verifier')).expect(200);
    expect(queue.body).toHaveLength(1);
    expect(queue.body[0].profile.fullName).toBe('Anjali Nair');
    // No profile photos, so the face match needs a person to look.
    expect(queue.body[0].flagged).toBe(true);
    expect(queue.body[0].issues).toEqual([{ key: 'FACE_MATCH', result: 'REVIEW' }]);

    const stats = await t.api().get('/v1/staff/verifications/stats').set(t.as('verifier')).expect(200);
    expect(stats.body).toEqual({ waiting: 1, flagged: 1, approvedToday: 0, rejectedToday: 0 });
  });

  it('shows the reviewer the documents through short-lived links, without metadata, and audits the view', async () => {
    const res = await t.api().get(`/v1/staff/verifications/${verificationId}`).set(t.as('verifier')).expect(200);
    expect(res.body.checks.map((c: { key: string }) => c.key)).toEqual([
      'LIVENESS',
      'FACE_MATCH',
      'ID_DOCUMENT',
      'NAME_AND_AGE',
      'PHOTO_AUTHENTICITY',
      'DUPLICATE',
    ]);
    expect(res.body.documents.expiresInSeconds).toBe(300);
    const selfie = await t.api().get(t.local(res.body.documents.selfie)).expect(200);
    expect((await sharp(selfie.body).metadata()).exif).toBeUndefined();
    expect(res.body.documents.idBack).toBeTruthy();

    const { rows } = await db.query(`select count(*)::int as n from audit_log where action = 'verification.documents_viewed'`);
    expect(rows[0].n).toBe(1);
  });

  it('rejects with a reason the family can act on, then accepts a fresh attempt', async () => {
    await t
      .api()
      .post(`/v1/staff/verifications/${verificationId}/decision`)
      .set(t.as('verifier'))
      .send({ decision: 'REJECT' })
      .expect(400); // a reason is required
    await t
      .api()
      .post(`/v1/staff/verifications/${verificationId}/decision`)
      .set(t.as('verifier'))
      .send({ decision: 'REJECT', reason: 'SELFIE_UNCLEAR', note: 'Too dark' })
      .expect(201);

    const seen = await t.api().get(`/v1/profiles/${profileId}/verification`).set(t.as('amother')).expect(200);
    expect(seen.body.status).toBe('REJECTED');
    expect(seen.body.rejection).toMatchObject({ reason: 'SELFIE_UNCLEAR', note: 'Too dark' });
    expect(seen.body.rejection.message).toMatch(/good light/);
    const profile = await t.api().get(`/v1/profiles/${profileId}`).set(t.as('amother')).expect(200);
    expect(profile.body.profile.status).toBe('DRAFT');

    // A new attempt starts empty.
    const again = await uploadDoc('acandidate', profileId, 'SELFIE', await image(900, 1100, 120));
    expect(again.status).toBe(201);
    expect(again.body.status).toBe('COLLECTING');
    expect(again.body.files).toEqual({ SELFIE: true, ID_FRONT: false, ID_BACK: false });
    await uploadDoc('acandidate', profileId, 'ID_FRONT', await image(1200, 800, 30));
    const res = await t
      .api()
      .post(`/v1/profiles/${profileId}/submit`)
      .set(t.as('acandidate'))
      .send({ idDocumentType: 'PASSPORT' })
      .expect(201);
    verificationId = res.body.id;
  });

  it('flags the same ID image reused on another profile', async () => {
    const other = await consentedProfile('bb', { fullName: 'Someone Else' });
    await uploadDoc('bbcandidate', other, 'SELFIE', await image(800, 1000, 77));
    await uploadDoc('bbcandidate', other, 'ID_FRONT', await image(1200, 800, 30)); // same bytes as above
    const sub = await t.api().post(`/v1/profiles/${other}/submit`).set(t.as('bbcandidate')).send({ idDocumentType: 'PASSPORT' }).expect(201);
    const detail = await t.api().get(`/v1/staff/verifications/${sub.body.id}`).set(t.as('verifier')).expect(200);
    expect(detail.body.checks.find((c: { key: string }) => c.key === 'DUPLICATE')).toMatchObject({ result: 'FAIL' });

    const flagged = await t.api().get('/v1/staff/verifications?flagged=true').set(t.as('verifier')).expect(200);
    expect(flagged.body.map((r: { id: string }) => r.id)).toContain(sub.body.id);
  });

  it('approves: the profile goes live with a verified date, and cannot be decided twice', async () => {
    const res = await t
      .api()
      .post(`/v1/staff/verifications/${verificationId}/decision`)
      .set(t.as('verifier'))
      .send({ decision: 'APPROVE' })
      .expect(201);
    expect(res.body).toMatchObject({ status: 'APPROVED', profileStatus: 'LIVE' });
    const profile = await t.api().get(`/v1/profiles/${profileId}`).set(t.as('amother')).expect(200);
    expect(profile.body.profile.status).toBe('LIVE');
    expect(profile.body.profile.verifiedAt).toBeTruthy();

    await t
      .api()
      .post(`/v1/staff/verifications/${verificationId}/decision`)
      .set(t.as('admin'))
      .send({ decision: 'REJECT', reason: 'OTHER' })
      .expect(400);

    const done = await t.api().get('/v1/staff/verifications?status=APPROVED').set(t.as('verifier')).expect(200);
    expect(done.body[0].reviewerName).toBe('Vera');
    const { rows } = await db.query(
      `select action from audit_log where profile_id = $1 and action like 'verification.%' order by created_at`,
      [profileId],
    );
    expect(rows.map((r) => r.action)).toEqual(
      expect.arrayContaining(['verification.file_added', 'verification.documents_viewed', 'verification.rejected', 'verification.approved']),
    );
  });

  it('lets admins manage staff, and removing a role takes effect at once', async () => {
    await t.api().get('/v1/staff/members').set(t.as('verifier')).expect(403);
    const added = await t
      .api()
      .post('/v1/staff/members')
      .set(t.as('admin'))
      .send({ phone: '+919830000009', name: 'New Verifier', role: 'VERIFIER' })
      .expect(201);
    expect(added.body.role).toBe('VERIFIER');

    await t.login('newbie', '+919830000009');
    const me = await t.api().get('/v1/staff/me').set(t.as('newbie')).expect(200);
    expect(me.body.role).toBe('VERIFIER');
    await t.api().get('/v1/staff/verifications').set(t.as('newbie')).expect(200);

    const list = await t.api().get('/v1/staff/members').set(t.as('admin')).expect(200);
    expect(list.body.map((m: { name: string }) => m.name)).toEqual(['Ada', 'New Verifier', 'Sam', 'Vera']);

    await t.api().delete(`/v1/staff/members/${added.body.id}`).set(t.as('admin')).expect(200);
    // Same token, but the role is gone.
    await t.api().get('/v1/staff/verifications').set(t.as('newbie')).expect(403);
    await t.api().get('/v1/staff/me').set(t.as('newbie')).expect(403);

    const self = list.body.find((m: { name: string }) => m.name === 'Ada').id;
    await t.api().delete(`/v1/staff/members/${self}`).set(t.as('admin')).expect(400);
  });
});
