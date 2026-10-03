-- Applications from the landing sites (1-to-1.evherfit.com), written by the
-- storefront's public /api/leads so the team sees every lead in the admin panel
-- even when the visitor never presses Send on the WhatsApp message.
--
-- "ref" is generated in the browser and quoted in that WhatsApp message; UNIQUE
-- makes a repeated submit of the same application a no-op instead of a
-- duplicate row. "answers" keeps the whole form as [{label, value}] so a new
-- question on the form needs no migration.
--
-- "status" / "summary" are the follow-up the team records in the admin panel's
-- 1-to-1 screen: where the lead stands, and how the call concluded.
CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ref" text NOT NULL UNIQUE,
  "source" text NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text NOT NULL,
  "answers" jsonb NOT NULL,
  "status" text NOT NULL DEFAULT 'new',
  "summary" text,
  "updated_at" timestamptz,
  "updated_by" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" ("created_at" DESC);
