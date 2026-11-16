import { accessTokenFrom, verifyAccessJwt } from './accessJwt';
import type { Env } from './env';

/** Lets a request into /admin only with a valid Cloudflare Access token. */
export async function checkAdmin(request: Request, env: Env, fetchImpl: typeof fetch = fetch): Promise<Response | null> {
  const host = new URL(request.url).hostname;
  if (env.ADMIN_DEV_BYPASS === 'true' && (host === 'localhost' || host === '127.0.0.1')) return null;

  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    return new Response('Admin is locked until Cloudflare Access is configured.', { status: 503 });
  }
  const result = await verifyAccessJwt(accessTokenFrom(request), env.ACCESS_TEAM_DOMAIN.replace(/\/$/, ''), env.ACCESS_AUD, fetchImpl);
  if (!result.ok) return new Response('Not allowed.', { status: 403 });
  return null;
}
