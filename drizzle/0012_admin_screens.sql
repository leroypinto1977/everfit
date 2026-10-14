-- Per-user access to admin screens. An owner sees every screen whatever this
-- holds; a staff member sees only the screens listed here, which the owner
-- ticks in Settings → Team. Keys are defined in apps/admin/src/lib/screens.ts.
--
-- Existing staff keep what they could open before this column existed.
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "screens" text[] NOT NULL DEFAULT '{}';

UPDATE "admin_users"
SET "screens" = ARRAY['dashboard', 'orders', 'customers', 'one-to-one', 'products']
WHERE "role" = 'staff' AND "screens" = '{}';
