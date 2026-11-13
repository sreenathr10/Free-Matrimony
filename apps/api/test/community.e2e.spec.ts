import { createTestApp, sampleProfile } from './helpers';

describe('Religion, caste and sub-caste', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    t = await createTestApp();
    await t.login('anjali', '+971500000101');
    await t.login('aunt', '+971500000102');
  });
  afterAll(() => t.app.close());

  it('serves the community lists publicly', async () => {
    const res = await t.api().get('/v1/reference/communities').expect(200);
    const hindu = res.body.religions.HINDU;
    expect(hindu.label).toBe('Caste');
    const nair = hindu.communities.find((c: { name: string }) => c.name === 'Nair');
    expect(nair.subs).toContain('Menon');
    expect(res.body.religions.CHRISTIAN.label).toBe('Denomination');
    expect(res.body.religions.CHRISTIAN.communities.map((c: { name: string }) => c.name)).toContain(
      'Syro-Malabar Catholic',
    );
    expect(res.body.religions.NONE.communities).toEqual([]);
    expect(res.headers['cache-control']).toContain('max-age');
  });

  it('stores canonical names, keeps unknown ones, and clears the sub-caste when the caste changes', async () => {
    const created = await t
      .api()
      .post('/v1/profiles')
      .set(t.as('anjali'))
      .send({
        ...sampleProfile,
        community: '  nayar ',
        subCaste: 'menon',
        casteNoBar: true,
        createdAs: 'SELF',
      })
      .expect(201);
    expect(created.body.community).toBe('Nair');
    expect(created.body.subCaste).toBe('Menon');
    expect(created.body.casteNoBar).toBe(true);
    const id = created.body.id;

    const custom = await t
      .api()
      .patch(`/v1/profiles/${id}`)
      .set(t.as('anjali'))
      .send({ community: 'Kalavara Nair' })
      .expect(200);
    expect(custom.body.community).toBe('Kalavara Nair');
    expect(custom.body.subCaste).toBeNull();

    const christian = await t
      .api()
      .patch(`/v1/profiles/${id}`)
      .set(t.as('anjali'))
      .send({ religion: 'CHRISTIAN', community: 'syro malabar', subCaste: 'knanaya catholic' })
      .expect(200);
    expect(christian.body.community).toBe('Syro-Malabar Catholic');
    expect(christian.body.subCaste).toBe('Knanaya Catholic');

    const prefs = await t
      .api()
      .put(`/v1/profiles/${id}/preferences`)
      .set(t.as('anjali'))
      .send({
        ageMin: 25,
        ageMax: 32,
        religions: ['HINDU'],
        communities: ['nayar', 'Nair', 'ezhava'],
      })
      .expect(200);
    expect(prefs.body.communities).toEqual(['Nair', 'Ezhava']);
  });

  it('rejects an over-long sub-caste', async () => {
    await t
      .api()
      .post('/v1/profiles')
      .set(t.as('aunt'))
      .send({ ...sampleProfile, subCaste: 'x'.repeat(81), createdAs: 'SELF' })
      .expect(400);
  });
});
