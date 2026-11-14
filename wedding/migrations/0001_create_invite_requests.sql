-- One row per form submission. Resubmissions are kept on purpose (that's how
-- guests fix typos); the admin view keeps the newest row per dedupe_key.
CREATE TABLE invite_requests (
  id             TEXT PRIMARY KEY,
  created_at     TEXT NOT NULL,
  household_name TEXT NOT NULL,
  delivery       TEXT NOT NULL CHECK (delivery IN ('mail', 'email', 'both')),
  email          TEXT,
  street1        TEXT,
  street2        TEXT,
  city           TEXT,
  state          TEXT,
  postal_code    TEXT,
  attending      TEXT CHECK (attending IS NULL OR attending IN ('utah', 'missouri', 'both', 'unsure')),
  note           TEXT,
  zip_warning    TEXT,
  dedupe_key     TEXT NOT NULL
);

CREATE INDEX idx_invite_requests_dedupe ON invite_requests (dedupe_key, created_at);
