import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetAccessKeyCache, verifyAccessJwt } from '../server/accessJwt';

const TEAM = 'https://example.cloudflareaccess.com';
const AUD = 'aud-tag';
let keys: CryptoKeyPair;
let other: CryptoKeyPair;

const b64url = (bytes: Uint8Array | string) => {
  const bin = typeof bytes === 'string' ? bytes : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function sign(payload: object, key: CryptoKey = keys.privateKey, kid = 'k1') {
  const head = b64url(JSON.stringify({ alg: 'RS256', kid }));
  const body = b64url(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}

const certsFetch = (async () => {
  const jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
  return new Response(JSON.stringify({ keys: [{ ...jwk, kid: 'k1' }] }));
}) as unknown as typeof fetch;

const now = Date.UTC(2026, 10, 14);
const good = { aud: [AUD], iss: TEAM, exp: now / 1000 + 600, email: 'dallin@example.com' };

beforeAll(async () => {
  const params = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
  keys = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair;
  other = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair;
});
beforeEach(() => resetAccessKeyCache());

describe('verifyAccessJwt', () => {
  it('accepts a valid token', async () => {
    const r = await verifyAccessJwt(await sign(good), TEAM, AUD, certsFetch, now);
    expect(r).toEqual({ ok: true, email: 'dallin@example.com' });
  });

  it.each([
    ['missing', async () => null],
    ['wrong audience', async () => sign({ ...good, aud: ['other'] })],
    ['wrong issuer', async () => sign({ ...good, iss: 'https://evil.cloudflareaccess.com' })],
    ['expired', async () => sign({ ...good, exp: now / 1000 - 1 })],
    ['signed by another key', async () => sign(good, other.privateKey)],
    ['unknown key id', async () => sign(good, keys.privateKey, 'k2')],
    ['garbage', async () => 'a.b.c'],
  ])('rejects a %s token', async (_name, make) => {
    const r = await verifyAccessJwt(await make(), TEAM, AUD, certsFetch, now);
    expect(r.ok).toBe(false);
  });
});
