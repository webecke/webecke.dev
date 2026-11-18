import { dedupeKey, type CleanInvite } from '../shared/validate';

export interface InviteRow {
  id: string;
  created_at: string;
  household_name: string;
  delivery: string;
  email: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  attending: string | null;
  note: string | null;
  zip_warning: string | null;
  dedupe_key: string;
  /** When it was checked off in /admin (UTC), or null. */
  processed_at: string | null;
}

export async function insertInvite(
  db: D1Database, v: CleanInvite, zipWarning: string | null, id: string, createdAt: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO invite_requests
        (id, created_at, household_name, delivery, email, street1, street2, city, state, postal_code, attending, note, zip_warning, dedupe_key)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
    )
    .bind(id, createdAt, v.householdName, v.delivery, v.email, v.street1, v.street2, v.city, v.state,
      v.postalCode, v.attending, v.note, zipWarning, dedupeKey(v))
    .run();
}

/**
 * Newest submission per household, households still to process first, then
 * processed ones; newest first within each group. With `all`, every
 * submission in plain newest-first order (the history view).
 */
export async function listInvites(db: D1Database, all = false): Promise<InviteRow[]> {
  const sql = all
    ? 'SELECT * FROM invite_requests ORDER BY created_at DESC, id DESC'
    : `SELECT * FROM (
         SELECT *, ROW_NUMBER() OVER (PARTITION BY dedupe_key ORDER BY created_at DESC, id DESC) AS rn
         FROM invite_requests
       ) WHERE rn = 1 ORDER BY (processed_at IS NOT NULL), created_at DESC, id DESC`;
  const { results } = await db.prepare(sql).all<InviteRow>();
  return results;
}

/** Check a submission off (or un-check it). Returns false when no row has that id. */
export async function setProcessed(db: D1Database, id: string, processedAt: string | null): Promise<boolean> {
  const res = await db.prepare('UPDATE invite_requests SET processed_at = ?1 WHERE id = ?2').bind(processedAt, id).run();
  return (res.meta?.changes ?? 0) > 0;
}
