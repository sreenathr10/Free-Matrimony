import sharp from 'sharp';
import type { CheckOutcome, IdDocumentType } from '@fm/shared';

export interface KycInput {
  selfie: Buffer;
  idFront: Buffer;
  idBack?: Buffer;
  idDocumentType: IdDocumentType;
  /** The profile's display photos, to match the selfie against. */
  profilePhotos: Buffer[];
  profile: { fullName: string; dateOfBirth: string; currentCountry: string };
}

export interface KycResult {
  provider: string;
  reference: string;
  checks: CheckOutcome[];
}

/**
 * Identity checks: selfie liveness, face match against the profile photos, government ID validity,
 * name and age against the ID, and photo authenticity (AI-generated or stock images).
 *
 * Production adapters wrap a KYC vendor: HyperVerge or IDfy for India, Onfido or Veriff for other countries.
 * The duplicate-account check is done by our own service, not the vendor.
 */
export abstract class KycProvider {
  abstract verify(input: KycInput): Promise<KycResult>;
}

async function readable(buf: Buffer | undefined, minSide: number) {
  if (!buf) return false;
  try {
    const m = await sharp(buf).metadata();
    return Math.min(m.width ?? 0, m.height ?? 0) >= minSide;
  } catch {
    return false;
  }
}

/**
 * Development stand-in for a KYC vendor. It cannot recognise faces or read IDs, so it only checks that the
 * images are usable and otherwise passes, saying so in each detail so no reviewer mistakes it for a real result.
 */
export class MockKycProvider extends KycProvider {
  async verify(input: KycInput): Promise<KycResult> {
    const mock = '(development mock: no real check was run)';
    const selfieOk = await readable(input.selfie, 300);
    const idOk = (await readable(input.idFront, 300)) && (input.idBack ? await readable(input.idBack, 300) : true);

    const checks: CheckOutcome[] = [
      selfieOk
        ? { key: 'LIVENESS', result: 'PASS', score: 0.97, detail: `Live person detected ${mock}` }
        : { key: 'LIVENESS', result: 'FAIL', detail: 'The selfie is too small or not a readable image' },
      input.profilePhotos.length === 0
        ? { key: 'FACE_MATCH', result: 'REVIEW', detail: 'The profile has no photos to compare the selfie with' }
        : { key: 'FACE_MATCH', result: 'PASS', score: 0.91, detail: `Matches ${input.profilePhotos.length} profile photo(s) ${mock}` },
      idOk
        ? { key: 'ID_DOCUMENT', result: 'PASS', score: 0.95, detail: `Document looks genuine ${mock}` }
        : { key: 'ID_DOCUMENT', result: 'FAIL', detail: 'The ID image is too small or not a readable image' },
      {
        key: 'NAME_AND_AGE',
        result: 'PASS',
        detail: `Compare with the profile: ${input.profile.fullName}, born ${input.profile.dateOfBirth} ${mock}`,
      },
      { key: 'PHOTO_AUTHENTICITY', result: 'PASS', score: 0.93, detail: `No signs of AI-generated or stock photos ${mock}` },
    ];
    return { provider: 'mock', reference: `mock_${Date.now().toString(36)}`, checks };
  }
}
