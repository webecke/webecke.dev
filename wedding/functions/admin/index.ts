import { renderAdminPage } from '../../server/adminPage';
import { listInvites } from '../../server/db';
import type { Env } from '../../server/env';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const all = new URL(request.url).searchParams.get('all') === '1';
  const rows = await listInvites(env.DB, all);
  return new Response(renderAdminPage(rows, all), { headers: { 'content-type': 'text/html; charset=utf-8' } });
};
