import { describe, expect, it } from 'vitest';
import { profileCompleteness } from './completeness';
import { partnerPreferencesSchema } from './preferences';

describe('profileCompleteness', () => {
  it('starts low and points to photos first', () => {
    const r = profileCompleteness({ profile: {}, photoCount: 0, hasPreferences: false });
    expect(r.percent).toBe(0);
    expect(r.nextSteps[0].key).toBe('photo');
  });

  it('reaches 100 when everything is filled', () => {
    const r = profileCompleteness({
      profile: {
        about: 'x'.repeat(60), community: 'Nair', star: 'ROHINI', nativeDistrict: 'THRISSUR',
        currentCity: 'Dubai', heightCm: 165, education: 'B.Arch', occupation: 'Architect',
      },
      photoCount: 4,
      hasPreferences: true,
    });
    expect(r).toEqual({ percent: 100, nextSteps: [] });
  });
});

describe('partnerPreferencesSchema', () => {
  it('fills defaults and rejects inverted ranges', () => {
    expect(partnerPreferencesSchema.parse({}).ageMin).toBe(21);
    expect(partnerPreferencesSchema.safeParse({ ageMin: 35, ageMax: 25 }).success).toBe(false);
    expect(partnerPreferencesSchema.safeParse({ countries: ['ae', 'in'] }).data?.countries).toEqual(['AE', 'IN']);
  });
});
