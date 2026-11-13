import { z } from 'zod';
import { KERALA_DISTRICTS, MARITAL_STATUSES, RELIGIONS, STARS } from './profile';

const country = z.string().length(2).toUpperCase();

/** What the candidate is looking for. Empty lists mean "no preference". */
export const partnerPreferencesSchema = z
  .object({
    ageMin: z.number().int().min(18).max(80).default(21),
    ageMax: z.number().int().min(18).max(80).default(40),
    heightMinCm: z.number().int().min(120).max(230).optional(),
    heightMaxCm: z.number().int().min(120).max(230).optional(),
    religions: z.array(z.enum(RELIGIONS)).max(RELIGIONS.length).default([]),
    communities: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
    stars: z.array(z.enum(STARS)).max(STARS.length).default([]),
    maritalStatuses: z.array(z.enum(MARITAL_STATUSES)).default([]),
    nativeDistricts: z.array(z.enum(KERALA_DISTRICTS)).default([]),
    countries: z.array(country).max(50).default([]),
    educationNotes: z.string().trim().max(300).optional(),
    /** Whether a horoscope (porutham) match is required. */
    requirePorutham: z.boolean().default(false),
  })
  .refine((p) => p.ageMin <= p.ageMax, { message: 'Minimum age must not exceed maximum', path: ['ageMin'] })
  .refine((p) => !p.heightMinCm || !p.heightMaxCm || p.heightMinCm <= p.heightMaxCm, {
    message: 'Minimum height must not exceed maximum',
    path: ['heightMinCm'],
  });
export type PartnerPreferences = z.infer<typeof partnerPreferencesSchema>;

export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export const photoUploadRequestSchema = z.object({
  contentType: z.enum(PHOTO_CONTENT_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_PHOTO_BYTES, 'Photos must be 10 MB or smaller'),
});
export type PhotoUploadRequest = z.infer<typeof photoUploadRequestSchema>;

export const reviewSuggestionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().trim().max(300).optional(),
});
export type ReviewSuggestionInput = z.infer<typeof reviewSuggestionSchema>;

