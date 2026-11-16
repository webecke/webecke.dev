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

/** Newest submission per household (or every submission when `all` is true). */
export async function listInvites(db: D1Database, all = false): Promise<InviteRow[]> {
  const sql = all
    ? 'SELECT * FROM invite_requests ORDER BY created_at DESC'
    : `SELECT * FROM (
         SELECT *, ROW_NUMBER() OVER (PARTITION BY dedupe_key ORDER BY created_at DESC) AS rn
         FROM invite_requests
       ) WHERE rn = 1 ORDER BY household_name COLLATE NOCASE`;
  const { results } = await db.prepare(sql).all<InviteRow>();
  return results;
}
