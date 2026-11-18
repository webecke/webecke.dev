-- When someone checked this submission off in /admin (UTC ISO time), or NULL.
-- Stored per submission: a household that resends the form shows up unchecked
-- again, so a corrected address doesn't slip by.
ALTER TABLE invite_requests ADD COLUMN processed_at TEXT;
