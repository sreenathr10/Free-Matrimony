import { createClient } from '@fm/client';

export { ApiError, putToSignedUrl } from '@fm/client';

const client = createClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL, tokenKey: 'fm_token' });
export const api = client.api;
export const session = client.session;
