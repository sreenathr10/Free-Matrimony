/**
 * Family accounts and access.
 *
 * Every candidate profile belongs to a family. Each person with access to a
 * profile (the candidate themself, a parent, a sibling, another relative) has
 * their own login and a role on that profile. The role gives default
 * permissions; the candidate can adjust them per person, within limits.
 */

export const FAMILY_ROLES = ['CANDIDATE', 'PARENT', 'SIBLING', 'RELATIVE'] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

/** How the person is related to the candidate. Shown to matches ("Sent by Mother"). */
export const RELATIONS = [
  'SELF',
  'MOTHER',
  'FATHER',
  'BROTHER',
  'SISTER',
  'GUARDIAN',
  'UNCLE',
  'AUNT',
  'COUSIN',
  'GRANDPARENT',
  'OTHER',
] as const;
export type Relation = (typeof RELATIONS)[number];

/** The role a relation gets by default when invited. */
export const DEFAULT_ROLE_FOR_RELATION: Record<Relation, FamilyRole> = {
  SELF: 'CANDIDATE',
  MOTHER: 'PARENT',
  FATHER: 'PARENT',
  GUARDIAN: 'PARENT',
  BROTHER: 'SIBLING',
  SISTER: 'SIBLING',
  UNCLE: 'RELATIVE',
  AUNT: 'RELATIVE',
  COUSIN: 'RELATIVE',
  GRANDPARENT: 'RELATIVE',
  OTHER: 'RELATIVE',
};

export const PERMISSIONS = [
  'BROWSE_MATCHES',
  'SHORTLIST',
  'SEND_INTEREST',
  'RESPOND_INTEREST',
  'CHAT',
  'VIEW_CONTACTS',
  'EDIT_PROFILE',
  'MANAGE_SUBSCRIPTION',
  'MANAGE_FAMILY',
  'MANAGE_PRIVACY',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * ALLOW: can do it directly.
 * APPROVAL: can start it, but the candidate must approve before it takes effect.
 * SUGGEST: can propose a change (edit suggestions only).
 * DENY: cannot do it.
 */
export const ACCESS_LEVELS = ['DENY', 'SUGGEST', 'APPROVAL', 'ALLOW'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const DEFAULT_PERMISSIONS: Record<FamilyRole, Record<Permission, AccessLevel>> = {
  CANDIDATE: {
    BROWSE_MATCHES: 'ALLOW',
    SHORTLIST: 'ALLOW',
    SEND_INTEREST: 'ALLOW',
    RESPOND_INTEREST: 'ALLOW',
    CHAT: 'ALLOW',
    VIEW_CONTACTS: 'ALLOW',
    EDIT_PROFILE: 'ALLOW',
    MANAGE_SUBSCRIPTION: 'ALLOW',
    MANAGE_FAMILY: 'ALLOW',
    MANAGE_PRIVACY: 'ALLOW',
  },
  PARENT: {
    BROWSE_MATCHES: 'ALLOW',
    SHORTLIST: 'ALLOW',
    SEND_INTEREST: 'ALLOW',
    RESPOND_INTEREST: 'APPROVAL',
    CHAT: 'ALLOW',
    VIEW_CONTACTS: 'ALLOW',
    EDIT_PROFILE: 'ALLOW',
    MANAGE_SUBSCRIPTION: 'ALLOW',
    MANAGE_FAMILY: 'ALLOW',
    MANAGE_PRIVACY: 'DENY',
  },
  SIBLING: {
    BROWSE_MATCHES: 'ALLOW',
    SHORTLIST: 'ALLOW',
    SEND_INTEREST: 'APPROVAL',
    RESPOND_INTEREST: 'DENY',
    CHAT: 'DENY',
    VIEW_CONTACTS: 'DENY',
    EDIT_PROFILE: 'SUGGEST',
    MANAGE_SUBSCRIPTION: 'DENY',
    MANAGE_FAMILY: 'DENY',
    MANAGE_PRIVACY: 'DENY',
  },
  RELATIVE: {
    BROWSE_MATCHES: 'ALLOW',
    SHORTLIST: 'ALLOW',
    SEND_INTEREST: 'DENY',
    RESPOND_INTEREST: 'DENY',
    CHAT: 'DENY',
    VIEW_CONTACTS: 'DENY',
    EDIT_PROFILE: 'DENY',
    MANAGE_SUBSCRIPTION: 'DENY',
    MANAGE_FAMILY: 'DENY',
    MANAGE_PRIVACY: 'DENY',
  },
};

/** Permissions only the candidate can ever hold. Overrides cannot grant them to anyone else. */
export const CANDIDATE_ONLY_PERMISSIONS: readonly Permission[] = ['MANAGE_PRIVACY'];

export type PermissionOverrides = Partial<Record<Permission, AccessLevel>>;

const rank = (level: AccessLevel) => ACCESS_LEVELS.indexOf(level);

/** The access a family member has for one permission, after the candidate's overrides. */
export function effectiveAccess(
  role: FamilyRole,
  permission: Permission,
  overrides: PermissionOverrides = {},
): AccessLevel {
  if (role === 'CANDIDATE') return 'ALLOW';
  if (CANDIDATE_ONLY_PERMISSIONS.includes(permission)) return 'DENY';
  return overrides[permission] ?? DEFAULT_PERMISSIONS[role][permission];
}

/** All permissions for a member, resolved. */
export function effectivePermissions(
  role: FamilyRole,
  overrides: PermissionOverrides = {},
): Record<Permission, AccessLevel> {
  return Object.fromEntries(
    PERMISSIONS.map((p) => [p, effectiveAccess(role, p, overrides)]),
  ) as Record<Permission, AccessLevel>;
}

/** True when the member's access meets the level required. */
export function hasAccess(
  role: FamilyRole,
  permission: Permission,
  required: AccessLevel,
  overrides: PermissionOverrides = {},
): boolean {
  return rank(effectiveAccess(role, permission, overrides)) >= rank(required);
}

/**
 * Checks a proposed override set. Returns the list of problems (empty when valid).
 * Nobody but the candidate can be given candidate-only permissions, and the
 * candidate's own access cannot be changed.
 */
export function validateOverrides(role: FamilyRole, overrides: PermissionOverrides): string[] {
  const problems: string[] = [];
  if (role === 'CANDIDATE') {
    if (Object.keys(overrides).length > 0) problems.push("The candidate's own access cannot be changed");
    return problems;
  }
  for (const [perm, level] of Object.entries(overrides) as [Permission, AccessLevel][]) {
    if (!PERMISSIONS.includes(perm)) problems.push(`Unknown permission ${perm}`);
    else if (CANDIDATE_ONLY_PERMISSIONS.includes(perm) && level !== 'DENY')
      problems.push(`${perm} can only be held by the candidate`);
    else if (level === 'SUGGEST' && perm !== 'EDIT_PROFILE')
      problems.push(`SUGGEST only applies to EDIT_PROFILE`);
  }
  return problems;
}
