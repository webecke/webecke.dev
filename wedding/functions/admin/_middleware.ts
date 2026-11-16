import { checkAdmin } from '../../server/admin';
import type { Env } from '../../server/env';

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const denied = await checkAdmin(request, env);
  if (denied) return denied;
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('cache-control', 'no-store');
  out.headers.set('x-robots-tag', 'noindex');
  return out;
};
