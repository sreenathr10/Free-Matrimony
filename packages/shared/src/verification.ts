import { z } from 'zod';
import { phoneSchema, STAFF_ROLES } from './auth';
import { PHOTO_CONTENT_TYPES, MAX_PHOTO_BYTES } from './preferences';

/** Government IDs we accept, by where members live. */
export const ID_DOCUMENT_TYPES = ['AADHAAR', 'PASSPORT', 'EMIRATES_ID', 'DRIVING_LICENCE', 'NATIONAL_ID'] as const;
export type IdDocumentType = (typeof ID_DOCUMENT_TYPES)[number];

export const ID_DOCUMENT_LABELS: Record<IdDocumentType, string> = {
  AADHAAR: 'Aadhaar card',
  PASSPORT: 'Passport',
  EMIRATES_ID: 'Emirates ID',
  DRIVING_LICENCE: 'Driving licence',
  NATIONAL_ID: 'Other national ID',
};

/** Passports have one page to photograph; other cards need front and back. */
export const idNeedsBack = (t: IdDocumentType) => t !== 'PASSPORT';

/** The files a candidate uploads for verification. */
export const VERIFICATION_FILES = ['SELFIE', 'ID_FRONT', 'ID_BACK'] as const;
export type VerificationFile = (typeof VERIFICATION_FILES)[number];

export const VERIFICATION_STATUSES = ['COLLECTING', 'IN_REVIEW', 'APPROVED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const verificationUploadSchema = z.object({
  file: z.enum(VERIFICATION_FILES),
  contentType: z.enum(PHOTO_CONTENT_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_PHOTO_BYTES, 'Files must be 10 MB or smaller'),
});
export type VerificationUploadInput = z.infer<typeof verificationUploadSchema>;

export const submitVerificationSchema = z.object({
  idDocumentType: z.enum(ID_DOCUMENT_TYPES),
});
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;

/** Results of the automatic checks, shown to the reviewer. */
export const CHECK_KEYS = ['LIVENESS', 'FACE_MATCH', 'ID_DOCUMENT', 'NAME_AND_AGE', 'PHOTO_AUTHENTICITY', 'DUPLICATE'] as const;
export type CheckKey = (typeof CHECK_KEYS)[number];
export type CheckResult = 'PASS' | 'REVIEW' | 'FAIL';
export interface CheckOutcome {
  key: CheckKey;
  result: CheckResult;
  /** 0 to 1 where the provider gives one. */
  score?: number;
  detail: string;
}

export const CHECK_LABELS: Record<CheckKey, string> = {
  LIVENESS: 'Selfie liveness',
  FACE_MATCH: 'Selfie matches profile photos',
  ID_DOCUMENT: 'Government ID',
  NAME_AND_AGE: 'Name and age match the ID',
  PHOTO_AUTHENTICITY: 'Real photos (not AI or stock)',
  DUPLICATE: 'No duplicate account',
};

/** Why a reviewer rejected a profile. Shown to the family with guidance on what to fix. */
export const REJECTION_REASONS = {
  SELFIE_UNCLEAR: 'The selfie is blurry, dark or does not show the full face. Take a new one in good light.',
  FACE_MISMATCH: 'The selfie does not match the profile photos. Use recent photos of the candidate.',
  ID_UNREADABLE: 'We could not read the ID. Photograph it flat, in good light, with all corners visible.',
  ID_MISMATCH: 'The name or date of birth on the ID does not match the profile.',
  PHOTOS_NOT_GENUINE: 'Some profile photos look edited, AI-generated or taken from elsewhere.',
  DUPLICATE_ACCOUNT: 'This person already has a profile with us.',
  UNDERAGE: 'The candidate must be at least 18 (21 for men in India) to marry.',
  OTHER: 'See the note from our verification team.',
} as const;
export type RejectionReason = keyof typeof REJECTION_REASONS;
export const REJECTION_REASON_KEYS = Object.keys(REJECTION_REASONS) as [RejectionReason, ...RejectionReason[]];

export const verificationDecisionSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('APPROVE'), note: z.string().trim().max(500).optional() }),
  z.object({
    decision: z.literal('REJECT'),
    reason: z.enum(REJECTION_REASON_KEYS),
    note: z.string().trim().max(500).optional(),
  }),
]);
export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;

export const verificationQueueQuerySchema = z.object({
  status: z.enum(VERIFICATION_STATUSES).default('IN_REVIEW'),
  flagged: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});
export type VerificationQueueQuery = z.infer<typeof verificationQueueQuerySchema>;

/** Admins add staff by phone; the person then logs in to the portal with an OTP. */
export const addStaffSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(1).max(100),
  role: z.enum(STAFF_ROLES),
});
export type AddStaffInput = z.infer<typeof addStaffSchema>;

export const STAFF_ROLE_LABELS: Record<(typeof STAFF_ROLES)[number], string> = {
  ADMIN: 'Admin',
  SUPPORT_AGENT: 'Support agent',
  VERIFIER: 'Verifier',
};
