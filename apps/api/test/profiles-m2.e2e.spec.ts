import sharp from 'sharp';
import { buildOpenApi } from '../src/common/openapi';
import { createTestApp, sampleProfile } from './helpers';

const jpeg = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 120, b: 90 } } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'secret-owner', ImageDescription: 'home address' } })
    .toBuffer();

describe('Profiles: preferences, suggestions, photos (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let profileId: string;

  beforeAll(async () => {
    t = await createTestApp();
    await t.login('mother', '+919811111101');
    const p = await t.api().post('/v1/profiles').set(t.as('mother')).send({ ...sampleProfile, createdAs: 'MOTHER' }).expect(201);
    profileId = p.body.id;

    for (const [who, phone, relation] of [
      ['sister', '+919811111102', 'SISTER'],
      ['uncle', '+919811111103', 'UNCLE'],
    ]) {
      await t.api().post(`/v1/profiles/${profileId}/members`).set(t.as('mother')).send({ phone, relation }).expect(201);
      await t.login(who, phone);
      await t.api().post(`/v1/profiles/${profileId}/members/accept`).set(t.as(who)).expect(201);
    }
    await t.login('stranger', '+447711111104');
  });

  afterAll(() => t?.app.close());

  describe('partner preferences', () => {
    it('starts empty and can be set by a parent', async () => {
      const empty = await t.api().get(`/v1/profiles/${profileId}/preferences`).set(t.as('mother')).expect(200);
      expect(empty.body).toEqual({});
      const res = await t
        .api()
        .put(`/v1/profiles/${profileId}/preferences`)
        .set(t.as('mother'))
        .send({ ageMin: 27, ageMax: 33, religions: ['HINDU'], countries: ['ae', 'in'], requirePorutham: true })
        .expect(200);
      expect(res.body).toMatchObject({ ageMin: 27, ageMax: 33, countries: ['AE', 'IN'], requirePorutham: true });
    });

    it('rejects inverted ranges and non-editors', async () => {
      await t.api().put(`/v1/profiles/${profileId}/preferences`).set(t.as('mother')).send({ ageMin: 40, ageMax: 30 }).expect(400);
      await t.api().put(`/v1/profiles/${profileId}/preferences`).set(t.as('sister')).send({}).expect(403);
      await t.api().get(`/v1/profiles/${profileId}/preferences`).set(t.as('stranger')).expect(404);
    });
  });

  describe('edit suggestions', () => {
    let suggestionId: string;

    it('lets a sister suggest a change but not an uncle', async () => {
      const res = await t
        .api()
        .post(`/v1/profiles/${profileId}/suggestions`)
        .set(t.as('sister'))
        .send({ occupation: 'Senior Architect', about: 'Loves travel and Carnatic music.' })
        .expect(201);
      suggestionId = res.body.id;
      expect(res.body.status).toBe('PENDING');
      await t.api().post(`/v1/profiles/${profileId}/suggestions`).set(t.as('uncle')).send({ occupation: 'x' }).expect(403);
      await t.api().post(`/v1/profiles/${profileId}/suggestions`).set(t.as('sister')).send({}).expect(400);
    });

    it('lets only an editor approve it, which applies the change', async () => {
      await t
        .api()
        .post(`/v1/profiles/${profileId}/suggestions/${suggestionId}/review`)
        .set(t.as('sister'))
        .send({ decision: 'APPROVE' })
        .expect(403);
      await t
        .api()
        .post(`/v1/profiles/${profileId}/suggestions/${suggestionId}/review`)
        .set(t.as('mother'))
        .send({ decision: 'APPROVE' })
        .expect(201);
      const p = await t.api().get(`/v1/profiles/${profileId}`).set(t.as('mother')).expect(200);
      expect(p.body.profile.occupation).toBe('Senior Architect');

      const list = await t.api().get(`/v1/profiles/${profileId}/suggestions`).set(t.as('sister')).expect(200);
      expect(list.body[0]).toMatchObject({ status: 'APPROVED', suggestedBy: 'sister' });

      await t
        .api()
        .post(`/v1/profiles/${profileId}/suggestions/${suggestionId}/review`)
        .set(t.as('mother'))
        .send({ decision: 'REJECT' })
        .expect(400);
    });
  });

  describe('photos', () => {
    const ids: string[] = [];

    async function upload(file: Buffer, who = 'mother') {
      const req = await t
        .api()
        .post(`/v1/profiles/${profileId}/photos/uploads`)
        .set(t.as(who))
        .send({ contentType: 'image/jpeg', sizeBytes: file.length })
        .expect(201);
      await t.api().put(t.local(req.body.upload.url)).set('Content-Type', 'image/jpeg').send(file).expect(200);
      return t.api().post(`/v1/profiles/${profileId}/photos/${req.body.photoId}/confirm`).set(t.as(who));
    }

    it('processes an upload into display and blurred copies, without metadata', async () => {
      const res = await upload(await jpeg(1200, 1600));
      expect(res.status).toBe(201);
      ids.push(res.body.id);
      expect(res.body).toMatchObject({ isPrimary: true, width: 1200, height: 1600 });

      const display = await t.api().get(t.local(res.body.url)).buffer(true).expect(200);
      const meta = await sharp(display.body).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();

      const blurred = await t.api().get(t.local(res.body.blurredUrl)).buffer(true).expect(200);
      expect((await sharp(blurred.body).metadata()).width).toBe(480);
    });

    it('rejects tampered or expired links', async () => {
      const list = await t.api().get(`/v1/profiles/${profileId}/photos`).set(t.as('sister')).expect(200);
      const url = t.local(list.body[0].url);
      await t.api().get(url.replace(/sig=[0-9a-f]+/, 'sig=' + '0'.repeat(64))).expect(403);
      await t.api().get(url.replace(/key=[^&]+/, 'key=profiles%2Fother')).expect(403);
    });

    it('rejects images that are too small and files that are not images', async () => {
      const small = await upload(await jpeg(200, 200));
      expect(small.status).toBe(400);
      expect(small.body.message).toMatch(/at least 300px/);
      const junk = await upload(Buffer.from('definitely not a jpeg'));
      expect(junk.status).toBe(400);
    });

    it('supports primary, reorder and delete', async () => {
      ids.push((await upload(await jpeg(800, 800))).body.id);
      ids.push((await upload(await jpeg(900, 1200))).body.id);

      let list = await t.api().post(`/v1/profiles/${profileId}/photos/${ids[2]}/primary`).set(t.as('mother')).expect(201);
      expect(list.body.find((p: { isPrimary: boolean }) => p.isPrimary).id).toBe(ids[2]);

      list = await t
        .api()
        .put(`/v1/profiles/${profileId}/photos/order`)
        .set(t.as('mother'))
        .send({ photoIds: [ids[2], ids[0], ids[1]] })
        .expect(200);
      expect(list.body.map((p: { id: string }) => p.id)).toEqual([ids[2], ids[0], ids[1]]);
      await t.api().put(`/v1/profiles/${profileId}/photos/order`).set(t.as('mother')).send({ photoIds: [ids[0]] }).expect(400);

      await t.api().delete(`/v1/profiles/${profileId}/photos/${ids[2]}`).set(t.as('mother')).expect(200);
      list = await t.api().get(`/v1/profiles/${profileId}/photos`).set(t.as('mother')).expect(200);
      expect(list.body).toHaveLength(2);
      expect(list.body[0]).toMatchObject({ id: ids[0], isPrimary: true });
    });

    it('limits who can upload and see photos', async () => {
      await t
        .api()
        .post(`/v1/profiles/${profileId}/photos/uploads`)
        .set(t.as('sister'))
        .send({ contentType: 'image/jpeg', sizeBytes: 1000 })
        .expect(403);
      await t.api().get(`/v1/profiles/${profileId}/photos`).set(t.as('stranger')).expect(404);
      await t
        .api()
        .post(`/v1/profiles/${profileId}/photos/uploads`)
        .set(t.as('mother'))
        .send({ contentType: 'image/gif', sizeBytes: 1000 })
        .expect(400);
      await t
        .api()
        .post(`/v1/profiles/${profileId}/photos/uploads`)
        .set(t.as('mother'))
        .send({ contentType: 'image/jpeg', sizeBytes: 11 * 1024 * 1024 })
        .expect(400);
    });

    it('caps a profile at 8 photos', async () => {
      // 2 ready photos exist; 6 more upload slots are allowed.
      for (let i = 0; i < 6; i++) {
        await t
          .api()
          .post(`/v1/profiles/${profileId}/photos/uploads`)
          .set(t.as('mother'))
          .send({ contentType: 'image/jpeg', sizeBytes: 1000 })
          .expect(201);
      }
      const res = await t
        .api()
        .post(`/v1/profiles/${profileId}/photos/uploads`)
        .set(t.as('mother'))
        .send({ contentType: 'image/jpeg', sizeBytes: 1000 })
        .expect(400);
      expect(res.body.message).toMatch(/up to 8/);
    });
  });

  it('reports profile completeness with next steps', async () => {
    const res = await t.api().get(`/v1/profiles/${profileId}`).set(t.as('mother')).expect(200);
    expect(res.body.completeness.percent).toBeGreaterThan(50);
    expect(res.body.completeness.nextSteps.map((s: { key: string }) => s.key)).not.toContain('photo');
    expect(res.body.completeness.nextSteps.map((s: { key: string }) => s.key)).not.toContain('preferences');
  });

  it('documents every route in the OpenAPI spec, with request bodies from the Zod schemas', () => {
    const doc = buildOpenApi(t.app);
    expect(Object.keys(doc.paths)).toEqual(expect.arrayContaining(['/v1/profiles', '/v1/profiles/{id}/photos/uploads', '/v1/profiles/{id}/preferences']));
    const body = doc.paths['/v1/profiles']!.post!.requestBody as { content: Record<string, { schema: { required: string[] } }> };
    expect(body.content['application/json'].schema.required).toEqual(expect.arrayContaining(['fullName', 'createdAs']));
  });
});
