import { z } from 'zod';

export const RELIGIONS = ['HINDU', 'CHRISTIAN', 'MUSLIM', 'JAIN', 'SIKH', 'BUDDHIST', 'OTHER', 'NONE'] as const;

export const KERALA_DISTRICTS = [
  'THIRUVANANTHAPURAM',
  'KOLLAM',
  'PATHANAMTHITTA',
  'ALAPPUZHA',
  'KOTTAYAM',
  'IDUKKI',
  'ERNAKULAM',
  'THRISSUR',
  'PALAKKAD',
  'MALAPPURAM',
  'KOZHIKODE',
  'WAYANAD',
  'KANNUR',
  'KASARAGOD',
] as const;

/** The 27 nakshatras, used for porutham (horoscope) matching. */
export const STARS = [
  'ASWATHY', 'BHARANI', 'KARTHIKA', 'ROHINI', 'MAKAYIRAM', 'THIRUVATHIRA', 'PUNARTHAM',
  'POOYAM', 'AYILYAM', 'MAKAM', 'POORAM', 'UTHRAM', 'ATHAM', 'CHITHIRA', 'CHOTHI',
  'VISAKHAM', 'ANIZHAM', 'THRIKKETTA', 'MOOLAM', 'POORADAM', 'UTHRADAM', 'THIRUVONAM',
  'AVITTAM', 'CHATHAYAM', 'POORURUTTATHI', 'UTHRATTATHI', 'REVATHI',
] as const;

export const GENDERS = ['MALE', 'FEMALE'] as const;
export const MARITAL_STATUSES = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE'] as const;
export const PROFILE_STATUSES = ['DRAFT', 'PENDING_VERIFICATION', 'LIVE', 'HIDDEN', 'SUSPENDED'] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

const MIN_AGE = 18;

export const profileFieldsSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  gender: z.enum(GENDERS),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .refine((d) => {
      const dob = new Date(d);
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE);
      return !Number.isNaN(dob.getTime()) && dob <= cutoff;
    }, `Must be at least ${MIN_AGE} years old`),
  maritalStatus: z.enum(MARITAL_STATUSES).default('NEVER_MARRIED'),
  religion: z.enum(RELIGIONS),
  /** Caste, denomination or sect; see COMMUNITIES. Typed values outside the list are kept. */
  community: z.string().trim().max(80).optional(),
  subCaste: z.string().trim().max(80).nullable().optional(),
  /** The candidate is open to proposals from any caste. */
  casteNoBar: z.boolean().optional(),
  star: z.enum(STARS).optional(),
  nativeDistrict: z.enum(KERALA_DISTRICTS).optional(),
  currentCountry: z.string().length(2).toUpperCase().describe('ISO 3166-1 alpha-2'),
  currentCity: z.string().trim().max(80).optional(),
  heightCm: z.number().int().min(120).max(230).optional(),
  education: z.string().trim().max(120).optional(),
  occupation: z.string().trim().max(120).optional(),
  about: z.string().trim().max(2000).optional(),
});
export type ProfileFields = z.infer<typeof profileFieldsSchema>;

export const createProfileSchema = profileFieldsSchema.extend({
  /** Who is creating it, relative to the candidate. SELF means the candidate is creating their own. */
  createdAs: z.enum(['SELF', 'MOTHER', 'FATHER', 'BROTHER', 'SISTER', 'GUARDIAN']),
});
export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = profileFieldsSchema.partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
