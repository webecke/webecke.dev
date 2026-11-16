import { validateInvite } from '../shared/validate';
import { insertInvite } from './db';
import { json, type Env } from './env';
import { verifyTurnstile } from './turnstile';

const MAX_BODY_BYTES = 8 * 1024;

export interface InviteDeps {
  fetch?: typeof fetch;
  now?: () => Date;
  id?: () => string;
}

/** POST /api/invite: validate, check Turnstile, save one row. */
export async function handleInvite(request: Request, env: Env, deps: InviteDeps = {}): Promise<Response> {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not set; refusing submissions.');
    return json({ error: 'The form isn’t set up yet. Please try again later.' }, 503);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'That submission is too large.' }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Something went wrong sending the form. Please try again.' }, 400);
  }

  // Hidden field real people never see; bots fill it. Pretend it worked.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true }, 201);

  const result = validateInvite(body);
  if (!result.ok) return json({ error: 'Please fix the highlighted fields.', fields: result.errors }, 400);

  const human = await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    typeof body.turnstileToken === 'string' ? body.turnstileToken : '',
    request.headers.get('cf-connecting-ip'),
    deps.fetch,
  );
  if (!human) return json({ error: 'We couldn’t confirm you’re not a robot. Please try again.', retryTurnstile: true }, 403);

  const now = (deps.now ?? (() => new Date()))();
  const id = (deps.id ?? (() => crypto.randomUUID()))();
  await insertInvite(env.DB, result.value, result.warnings.postalCode ?? null, id, now.toISOString());
  return json({ ok: true }, 201);
}
