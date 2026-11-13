import type { AccessLevel, Permission } from '@fm/shared';

export interface Profile {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  religion: string;
  community: string | null;
  subCaste: string | null;
  casteNoBar: boolean;
  star: string | null;
  nativeDistrict: string | null;
  currentCountry: string;
  currentCity: string | null;
  heightCm: number | null;
  education: string | null;
  occupation: string | null;
  about: string | null;
  status: string;
  candidateConsentAt: string | null;
  verifiedAt: string | null;
}

export interface Access {
  memberId: string;
  relation: string;
  role: string;
  isFamilyAdmin: boolean;
  permissions: Record<Permission, AccessLevel>;
}

export interface ProfileResponse {
  profile: Profile;
  access: Access;
  completeness: { percent: number; nextSteps: { key: string; hint: string }[] };
}

export interface Member extends Access {
  name: string | null;
  status: string;
  invitedPhone?: string;
}

export interface Photo {
  id: string;
  isPrimary: boolean;
  url: string;
  blurredUrl: string;
}

export interface Suggestion {
  id: string;
  changes: Record<string, unknown>;
  status: string;
  suggestedBy: string | null;
  createdAt: string;
}
