import { z } from 'zod';
import { ACCESS_LEVELS, PERMISSIONS, RELATIONS } from './family';
import { phoneSchema } from './auth';

const overridesSchema = z.record(z.enum(PERMISSIONS), z.enum(ACCESS_LEVELS));

export const inviteMemberSchema = z.object({
  phone: phoneSchema,
  /** SELF invites the candidate themself to a profile a relative created. */
  relation: z.enum(RELATIONS),
  overrides: overridesSchema.optional(),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberPermissionsSchema = z.object({ overrides: overridesSchema });
export type UpdateMemberPermissionsInput = z.infer<typeof updateMemberPermissionsSchema>;
