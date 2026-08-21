-- Owner-editable store configuration, previously env-only.
-- Sparse by design: a row exists only once someone edits that setting in the
-- admin panel. Reads fall back DB -> env -> hardcoded default, so an untouched
-- deployment behaves exactly as it did before this table existed.
CREATE TABLE IF NOT EXISTS "settings" (
  "key" text PRIMARY KEY,
  "value" text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" text
);
