import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from '../server/csv';
import type { InviteRow } from '../server/db';
import type { Env } from '../server/env';
import { handleInvite } from '../server/invite';
import { renderAdminPage } from '../server/adminPage';

function fakeDb() {
  const calls: unknown[][] = [];
  const db = {
    prepare: () => ({ bind: (...args: unknown[]) => ({ run: async () => { calls.push(args); return {}; } }) }),
  } as unknown as D1Database;
  return { db, calls };
}

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://wedding.webecke.dev/api/invite', {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const valid = { householdName: 'The Jensens', street1: '1 Main St', city: 'Lindon', state: 'UT', postalCode: '84042', turnstileToken: 'tok' };
const siteverify = (success: boolean) => (async () => new Response(JSON.stringify({ success }))) as unknown as typeof fetch;

describe('POST /api/invite', () => {
  it('saves a valid, verified request', async () => {
    const { db, calls } = fakeDb();
    const env: Env = { DB: db, TURNSTILE_SECRET_KEY: 'real-secret' };
    const res = await handleInvite(req(valid), env, { fetch: siteverify(true), id: () => 'id-1', now: () => new Date('2026-11-14T00:00:00Z') });
    expect(res.status).toBe(201);
    expect(calls).toHaveLength(1);
    expect(calls[0].slice(0, 4)).toEqual(['id-1', '2026-11-14T00:00:00.000Z', 'The Jensens', 'mail']);
    expect(calls[0][13]).toBe('addr:1mainst||84042');
  });

  it('rejects when Turnstile fails, without saving', async () => {
    const { db, calls } = fakeDb();
    const res = await handleInvite(req(valid), { DB: db, TURNSTILE_SECRET_KEY: 's' }, { fetch: siteverify(false) });
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it('returns field errors for invalid input', async () => {
    const { db } = fakeDb();
    const res = await handleInvite(req({ ...valid, postalCode: 'abc' }), { DB: db, TURNSTILE_SECRET_KEY: 's' }, { fetch: siteverify(true) });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { fields: object }).fields).toHaveProperty('postalCode');
  });

  it('quietly drops honeypot submissions', async () => {
    const { db, calls } = fakeDb();
    const res = await handleInvite(req({ ...valid, website: 'spam.example' }), { DB: db, TURNSTILE_SECRET_KEY: 's' }, { fetch: siteverify(true) });
    expect(res.status).toBe(201);
    expect(calls).toHaveLength(0);
  });

  it('refuses to accept anything when Turnstile is not configured', async () => {
    const { db } = fakeDb();
    expect((await handleInvite(req(valid), { DB: db })).status).toBe(503);
  });

  it('rejects malformed and oversized bodies', async () => {
    const { db } = fakeDb();
    const env = { DB: db, TURNSTILE_SECRET_KEY: 's' };
    expect((await handleInvite(req('{nope'), env)).status).toBe(400);
    expect((await handleInvite(req({ ...valid, note: 'x'.repeat(9000) }), env)).status).toBe(413);
  });
});

const row = (over: Partial<InviteRow> = {}): InviteRow => ({
  id: '1', created_at: '2026-11-14T00:00:00.000Z', household_name: 'The Jensens', delivery: 'mail', email: null,
  street1: '1 Main St', street2: null, city: 'Lindon', state: 'UT', postal_code: '84042', attending: 'utah',
  note: null, zip_warning: null, dedupe_key: 'k', ...over,
});

describe('CSV export', () => {
  it('quotes cells and neutralizes spreadsheet formulas', () => {
    expect(csvCell('a "b"')).toBe('"a ""b"""');
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell(null)).toBe('""');
  });

  it('writes a header and one line per row', () => {
    const lines = toCsv([row(), row({ household_name: 'Grandma' })]).trim().split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"The Jensens","1 Main St"');
  });
});

describe('admin page', () => {
  it('escapes guest-entered text', () => {
    const html = renderAdminPage([row({ household_name: '<script>alert(1)</script>' })], false);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

import { checkAdmin } from '../server/admin';

describe('admin lock', () => {
  const get = (url: string) => new Request(url);
  it('stays locked when Access is not configured', async () => {
    const res = await checkAdmin(get('https://wedding.webecke.dev/admin'), { DB: {} as D1Database });
    expect(res?.status).toBe(503);
  });
  it('ignores the dev bypass on real hostnames', async () => {
    const res = await checkAdmin(get('https://wedding-webecke-dev.pages.dev/admin'), { DB: {} as D1Database, ADMIN_DEV_BYPASS: 'true' });
    expect(res?.status).toBe(503);
  });
  it('allows the dev bypass on localhost', async () => {
    expect(await checkAdmin(get('http://localhost:8788/admin'), { DB: {} as D1Database, ADMIN_DEV_BYPASS: 'true' })).toBeNull();
  });
  it('rejects requests without an Access token', async () => {
    const env = { DB: {} as D1Database, ACCESS_TEAM_DOMAIN: 'https://x.cloudflareaccess.com', ACCESS_AUD: 'a' };
    const res = await checkAdmin(get('https://wedding.webecke.dev/admin'), env, (async () => new Response('{"keys":[]}')) as unknown as typeof fetch);
    expect(res?.status).toBe(403);
  });
});

describe('Mountain time', () => {
  it('shows winter times in MST and summer times in MDT', async () => {
    const { mountainFriendly, mountainSortable } = await import('../server/time');
    // 03:30 UTC on Nov 16 is 8:30 pm the evening before in Denver.
    expect(mountainFriendly('2026-11-16T03:30:00.000Z')).toBe('Nov 15, 2026, 8:30 PM MST');
    expect(mountainSortable('2026-11-16T03:30:00.000Z')).toBe('2026-11-15 20:30 MST');
    expect(mountainSortable('2026-07-04T18:05:00.000Z')).toBe('2026-07-04 12:05 MDT');
    expect(mountainSortable('not a date')).toBe('not a date');
  });
});
