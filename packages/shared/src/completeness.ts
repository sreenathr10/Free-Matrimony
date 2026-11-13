/** How complete a profile is, with the next most useful thing to add. Shared by the API and the apps. */

export interface CompletenessInput {
  profile: {
    about?: string | null;
    community?: string | null;
    star?: string | null;
    nativeDistrict?: string | null;
    currentCity?: string | null;
    heightCm?: number | null;
    education?: string | null;
    occupation?: string | null;
  };
  photoCount: number;
  hasPreferences: boolean;
}

const items: Array<{ key: string; weight: number; hint: string; done: (i: CompletenessInput) => boolean }> = [
  { key: 'photo', weight: 25, hint: 'Add at least one photo', done: (i) => i.photoCount >= 1 },
  { key: 'photos3', weight: 10, hint: 'Add three or more photos', done: (i) => i.photoCount >= 3 },
  { key: 'about', weight: 15, hint: 'Write a short introduction', done: (i) => (i.profile.about?.length ?? 0) >= 50 },
  { key: 'preferences', weight: 15, hint: 'Set partner preferences', done: (i) => i.hasPreferences },
  { key: 'education', weight: 8, hint: 'Add education', done: (i) => !!i.profile.education },
  { key: 'occupation', weight: 8, hint: 'Add occupation', done: (i) => !!i.profile.occupation },
  { key: 'community', weight: 5, hint: 'Add community', done: (i) => !!i.profile.community },
  { key: 'star', weight: 5, hint: 'Add star (nakshatra)', done: (i) => !!i.profile.star },
  { key: 'nativeDistrict', weight: 3, hint: 'Add native district', done: (i) => !!i.profile.nativeDistrict },
  { key: 'currentCity', weight: 3, hint: 'Add current city', done: (i) => !!i.profile.currentCity },
  { key: 'height', weight: 3, hint: 'Add height', done: (i) => !!i.profile.heightCm },
];

export function profileCompleteness(input: CompletenessInput) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  const done = items.filter((i) => i.done(input));
  const missing = items.filter((i) => !i.done(input)).sort((a, b) => b.weight - a.weight);
  return {
    percent: Math.round((done.reduce((s, i) => s + i.weight, 0) / total) * 100),
    nextSteps: missing.slice(0, 3).map((m) => ({ key: m.key, hint: m.hint })),
  };
}
