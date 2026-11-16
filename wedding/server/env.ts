export interface Env {
  DB: D1Database;
  /** Public Turnstile key; served to the page by /api/config. */
  TURNSTILE_SITE_KEY?: string;
  /** Secret Turnstile key (set as an encrypted secret in Pages). */
  TURNSTILE_SECRET_KEY?: string;
  /** e.g. https://webecke.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN?: string;
  /** The Access application's "Application Audience (AUD) Tag". */
  ACCESS_AUD?: string;
  /** Local development only: skip Access on localhost. */
  ADMIN_DEV_BYPASS?: string;
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}
