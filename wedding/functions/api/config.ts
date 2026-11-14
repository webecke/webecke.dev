import { json, type Env } from '../../server/env';

/** Public settings the page needs at runtime. */
export const onRequestGet: PagesFunction<Env> = ({ env }) =>
  json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? null }, 200, { 'cache-control': 'public, max-age=300' });
