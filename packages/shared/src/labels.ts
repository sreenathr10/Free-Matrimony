/** Human-readable labels for enum values, shared by the apps. */
export function humanize(value: string): string {
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: humanize(v) }));

export const PERMISSION_LABELS: Record<string, string> = {
  BROWSE_MATCHES: 'Browse matches',
  SHORTLIST: 'Shortlist and notes',
  SEND_INTEREST: 'Send interests',
  RESPOND_INTEREST: 'Accept or decline interests',
  CHAT: 'Chat and call matches',
  VIEW_CONTACTS: 'See contact details',
  EDIT_PROFILE: 'Edit the profile',
  MANAGE_SUBSCRIPTION: 'Manage the subscription',
  MANAGE_FAMILY: 'Invite or remove family',
  MANAGE_PRIVACY: 'Privacy settings',
};

export const ACCESS_LABELS: Record<string, string> = {
  ALLOW: 'Yes',
  APPROVAL: 'With approval',
  SUGGEST: 'Suggest only',
  DENY: 'No',
};

export const COUNTRIES = [
  ['IN', 'India'], ['AE', 'United Arab Emirates'], ['SA', 'Saudi Arabia'], ['QA', 'Qatar'], ['KW', 'Kuwait'],
  ['OM', 'Oman'], ['BH', 'Bahrain'], ['GB', 'United Kingdom'], ['US', 'United States'], ['CA', 'Canada'],
  ['AU', 'Australia'], ['NZ', 'New Zealand'], ['IE', 'Ireland'], ['DE', 'Germany'], ['SG', 'Singapore'],
  ['MY', 'Malaysia'],
] as const;
export const COUNTRY_OPTIONS = COUNTRIES.map(([value, label]) => ({ value, label }));
export const countryName = (code: string) => COUNTRIES.find(([c]) => c === code)?.[1] ?? code;
