/**
 * Verifies the Cloudflare Access token on /admin requests.
 *
 * Access already blocks strangers at the edge for wedding.webecke.dev/admin,
 * but the project's *.pages.dev URLs are not behind that policy. Checking the
 * signed token here means the guest list stays private on every URL.
 */
interface Jwk extends JsonWebKey { kid: string }
interface JwtHeader { alg: string; kid: string }
interface JwtPayload { aud: string | string[]; iss: string; exp: number; nbf?: number; email?: string }

let cachedKeys: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null;
const KEY_TTL_MS = 60 * 60 * 1000;

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const decodeJson = <T>(s: string): T => JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as T;

async function getKeys(teamDomain: string, fetchImpl: typeof fetch, force = false): Promise<Jwk[]> {
  if (!force && cachedKeys && cachedKeys.teamDomain === teamDomain && Date.now() - cachedKeys.fetchedAt < KEY_TTL_MS) {
    return cachedKeys.keys;
  }
  const res = await fetchImpl(`${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Could not load Access certs (${res.status})`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  cachedKeys = { teamDomain, keys, fetchedAt: Date.now() };
  return keys;
}

export function resetAccessKeyCache(): void {
  cachedKeys = null;
}

export type AccessResult = { ok: true; email: string | null } | { ok: false; reason: string };

export async function verifyAccessJwt(
  token: string | null,
  teamDomain: string,
  audience: string,
  fetchImpl: typeof fetch = fetch,
  now: number = Date.now(),
): Promise<AccessResult> {
  if (!token) return { ok: false, reason: 'missing token' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed token' };
  const [h, p, sig] = parts;
  let header: JwtHeader;
  let payload: JwtPayload;
  try {
    header = decodeJson<JwtHeader>(h);
    payload = decodeJson<JwtPayload>(p);
  } catch {
    return { ok: false, reason: 'malformed token' };
  }
  if (header.alg !== 'RS256') return { ok: false, reason: 'unexpected algorithm' };

  let keys = await getKeys(teamDomain, fetchImpl);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await getKeys(teamDomain, fetchImpl, true); // keys rotate; refetch once
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) return { ok: false, reason: 'unknown signing key' };

  const key = await crypto.subtle.importKey(
    'jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`),
  );
  if (!valid) return { ok: false, reason: 'bad signature' };

  const seconds = Math.floor(now / 1000);
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(audience)) return { ok: false, reason: 'wrong audience' };
  if (payload.iss !== teamDomain) return { ok: false, reason: 'wrong issuer' };
  if (typeof payload.exp !== 'number' || payload.exp < seconds) return { ok: false, reason: 'expired' };
  if (typeof payload.nbf === 'number' && payload.nbf > seconds + 60) return { ok: false, reason: 'not yet valid' };
  return { ok: true, email: payload.email ?? null };
}

/** The Access token from the header Access adds, or from its cookie. */
export function accessTokenFrom(request: Request): string | null {
  const header = request.headers.get('cf-access-jwt-assertion');
  if (header) return header;
  const cookie = request.headers.get('cookie') ?? '';
  const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie);
  return m ? m[1] : null;
}
