import { z } from 'zod';
import { ACCESS_LEVELS, PERMISSIONS, RELATIONS, type Permission } from './family';
import { phoneSchema } from './auth';

const level = z.enum(ACCESS_LEVELS).optional();
/** Only the permissions being changed from the role's defaults. */
const overridesSchema = z
  .object(Object.fromEntries(PERMISSIONS.map((p) => [p, level])) as Record<Permission, typeof level>)
  .strict();

export const inviteMemberSchema = z.object({
  phone: phoneSchema,
  /** SELF invites the candidate themself to a profile a relative created. */
  relation: z.enum(RELATIONS),
  overrides: overridesSchema.optional(),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberPermissionsSchema = z.object({ overrides: overridesSchema });
export type UpdateMemberPermissionsInput = z.infer<typeof updateMemberPermissionsSchema>;
