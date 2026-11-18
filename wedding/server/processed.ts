import { setProcessed } from './db';
import { json, type Env } from './env';

/**
 * POST /admin/processed {id, processed}: check a household off in the admin
 * list. Runs after checkAdmin, so only signed-in admins reach it.
 */
export async function handleProcessed(request: Request, env: Env, now: () => Date = () => new Date()): Promise<Response> {
  // Only the admin page itself may post here (belt and braces on top of Access).
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Not allowed.' }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
  const { id, processed } = (body ?? {}) as { id?: unknown; processed?: unknown };
  if (typeof id !== 'string' || id.length === 0 || id.length > 64 || typeof processed !== 'boolean') {
    return json({ error: 'Bad request.' }, 400);
  }

  const processedAt = processed ? now().toISOString() : null;
  const found = await setProcessed(env.DB, id, processedAt);
  if (!found) return json({ error: 'That entry no longer exists. Reload the page.' }, 404);
  return json({ ok: true, processedAt });
}
