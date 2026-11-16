const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Cloudflare's published test secret that always passes. Only used in local
 * development (.dev.vars); answering it locally avoids a network round trip.
 */
export const ALWAYS_PASS_TEST_SECRET = '1x0000000000000000000000000000000AA';

/** Ask Cloudflare whether the Turnstile token from the browser is genuine. */
export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  // Local development only: the test secret always passes, even when the
  // widget itself couldn't load (e.g. offline or behind a proxy).
  if (secret === ALWAYS_PASS_TEST_SECRET) return true;
  if (!token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteIp) body.append('remoteip', remoteIp);
  try {
    const res = await fetchImpl(VERIFY_URL, { method: 'POST', body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
