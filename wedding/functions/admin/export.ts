import { toCsv } from '../../server/csv';
import { listInvites } from '../../server/db';
import type { Env } from '../../server/env';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const all = new URL(request.url).searchParams.get('all') === '1';
  const rows = await listInvites(env.DB, all);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="wedding-invites-${date}${all ? '-all' : ''}.csv"`,
    },
  });
};
