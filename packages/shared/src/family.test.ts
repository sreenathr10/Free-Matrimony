import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROLE_FOR_RELATION,
  effectiveAccess,
  effectivePermissions,
  hasAccess,
  validateOverrides,
} from './family';

describe('family permissions', () => {
  it('gives the candidate full access, always', () => {
    const perms = effectivePermissions('CANDIDATE', { CHAT: 'DENY' });
    expect(Object.values(perms).every((l) => l === 'ALLOW')).toBe(true);
  });

  it('applies role defaults from the plan', () => {
    expect(effectiveAccess('PARENT', 'CHAT')).toBe('ALLOW');
    expect(effectiveAccess('PARENT', 'RESPOND_INTEREST')).toBe('APPROVAL');
    expect(effectiveAccess('SIBLING', 'SEND_INTEREST')).toBe('APPROVAL');
    expect(effectiveAccess('SIBLING', 'EDIT_PROFILE')).toBe('SUGGEST');
    expect(effectiveAccess('RELATIVE', 'SEND_INTEREST')).toBe('DENY');
  });

  it('lets the candidate adjust a member', () => {
    expect(effectiveAccess('SIBLING', 'CHAT', { CHAT: 'ALLOW' })).toBe('ALLOW');
    expect(effectiveAccess('PARENT', 'VIEW_CONTACTS', { VIEW_CONTACTS: 'DENY' })).toBe('DENY');
  });

  it('never grants privacy control to anyone but the candidate', () => {
    expect(effectiveAccess('PARENT', 'MANAGE_PRIVACY', { MANAGE_PRIVACY: 'ALLOW' })).toBe('DENY');
    expect(validateOverrides('PARENT', { MANAGE_PRIVACY: 'ALLOW' })).toHaveLength(1);
  });

  it('rejects changes to the candidate and misplaced SUGGEST', () => {
    expect(validateOverrides('CANDIDATE', { CHAT: 'DENY' })).toHaveLength(1);
    expect(validateOverrides('SIBLING', { CHAT: 'SUGGEST' })).toHaveLength(1);
    expect(validateOverrides('SIBLING', { CHAT: 'ALLOW', EDIT_PROFILE: 'ALLOW' })).toEqual([]);
  });

  it('compares access levels by strength', () => {
    expect(hasAccess('SIBLING', 'SEND_INTEREST', 'APPROVAL')).toBe(true);
    expect(hasAccess('SIBLING', 'SEND_INTEREST', 'ALLOW')).toBe(false);
    expect(hasAccess('PARENT', 'EDIT_PROFILE', 'ALLOW')).toBe(true);
  });

  it('maps relations to roles', () => {
    expect(DEFAULT_ROLE_FOR_RELATION.MOTHER).toBe('PARENT');
    expect(DEFAULT_ROLE_FOR_RELATION.SISTER).toBe('SIBLING');
    expect(DEFAULT_ROLE_FOR_RELATION.COUSIN).toBe('RELATIVE');
  });
});
