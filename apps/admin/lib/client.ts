import { createClient } from '@fm/client';

/** API client for this portal. Its sign-in is separate from the member website and the other portals. */
export const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  tokenKey: 'fm_staff_admin',
});
