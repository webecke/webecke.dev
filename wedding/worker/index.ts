/**
 * The Worker behind wedding.webecke.dev. Static files (the page, images,
 * calendar files) are served straight from `dist/` by Cloudflare; only
 * /api/* and /admin* reach this code (see `run_worker_first` in wrangler.toml).
 */
import { checkAdmin } from '../server/admin';
import { renderAdminPage } from '../server/adminPage';
import { toCsv } from '../server/csv';
import { listInvites } from '../server/db';
import { json, type Env } from '../server/env';
import { handleInvite } from '../server/invite';
import { handleProcessed } from '../server/processed';

/** Headers the static files get from public/_headers; Worker responses need them added here. */
function withSiteHeaders(res: Response, extra: Record<string, string> = {}): Response {
  const out = new Response(res.body, res);
  out.headers.set('x-robots-tag', 'noindex');
  out.headers.set('x-content-type-options', 'nosniff');
  out.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  for (const [k, v] of Object.entries(extra)) out.headers.set(k, v);
  return out;
}

const methodNotAllowed = (allow: string) => json({ error: 'Method not allowed' }, 405, { allow });

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/api/invite') {
    return request.method === 'POST' ? handleInvite(request, env) : methodNotAllowed('POST');
  }
  if (path === '/api/config') {
    if (request.method !== 'GET') return methodNotAllowed('GET');
    return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null }, 200, { 'cache-control': 'public, max-age=300' });
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    const denied = await checkAdmin(request, env);
    if (denied) return denied;
    if (path === '/admin/processed') {
      return request.method === 'POST' ? handleProcessed(request, env) : methodNotAllowed('POST');
    }
    if (request.method !== 'GET') return methodNotAllowed('GET');
    const all = url.searchParams.get('all') === '1';
    if (path === '/admin') {
      const rows = await listInvites(env.DB, all);
      return new Response(renderAdminPage(rows, all), { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    if (path === '/admin/export') {
      const rows = await listInvites(env.DB, all);
      const date = new Date().toISOString().slice(0, 10);
      return new Response(toCsv(rows), {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="wedding-invites-${date}${all ? '-all' : ''}.csv"`,
        },
      });
    }
  }

  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request, env): Promise<Response> {
    const res = await route(request, env);
    const isAdmin = new URL(request.url).pathname.startsWith('/admin');
    return withSiteHeaders(res, isAdmin ? { 'cache-control': 'no-store' } : {});
  },
} satisfies ExportedHandler<Env>;
