import type {
  CheckOutcome,
  CheckResult,
  IdDocumentType,
  RejectionReason,
  VerificationStatus,
} from '@fm/shared';

export interface QueueItem {
  id: string;
  status: VerificationStatus;
  flagged: boolean;
  idDocumentType: IdDocumentType | null;
  submittedAt: string;
  decidedAt: string | null;
  rejectionReason: RejectionReason | null;
  reviewerName: string | null;
  issues: { key: CheckOutcome['key']; result: CheckResult }[];
  profile: {
    id: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    currentCountry: string;
    currentCity: string | null;
  };
}

export interface Stats {
  waiting: number;
  flagged: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface Detail {
  id: string;
  status: VerificationStatus;
  flagged: boolean;
  provider: string | null;
  providerRef: string | null;
  idDocumentType: IdDocumentType | null;
  checks: CheckOutcome[];
  submittedAt: string;
  decidedAt: string | null;
  rejectionReason: RejectionReason | null;
  reviewerNote: string | null;
  documents: {
    selfie: string | null;
    idFront: string | null;
    idBack: string | null;
    expiresInSeconds: number;
  };
  photos: { id: string; isPrimary: boolean; url: string }[];
  profile: {
    id: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    religion: string;
    community: string | null;
    maritalStatus: string;
    currentCountry: string;
    currentCity: string | null;
    nativeDistrict: string | null;
    occupation: string | null;
  };
  previous: {
    id: string;
    status: VerificationStatus;
    decidedAt: string | null;
    rejectionReason: RejectionReason | null;
  }[];
  history: { action: string; createdAt: string; actorName: string | null }[];
}

export function age(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  return (
    now.getFullYear() -
    d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
  );
}

/** "5 min ago", or "just now". */
export function ago(iso: string) {
  const s = since(iso);
  return s === 'just now' ? s : `${s} ago`;
}

/** How long since a time: "5 min", "3 h", or "just now". */
export function since(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} days`;
}
