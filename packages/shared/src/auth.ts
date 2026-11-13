import { z } from 'zod';

/** E.164 phone number, e.g. +919876543210 or +971501234567. */
export const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use international format, e.g. +919876543210');

export const requestOtpSchema = z.object({ phone: phoneSchema });
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/),
  name: z.string().trim().min(1).max(100).optional(),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const STAFF_ROLES = ['ADMIN', 'SUPPORT_AGENT', 'VERIFIER'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
