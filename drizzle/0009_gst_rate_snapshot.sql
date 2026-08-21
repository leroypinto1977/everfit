-- Snapshot the GST rate onto each order at the moment it is paid.
--
-- The rate used to be read live from GST_RATE for every calculation, including
-- invoices printed months later. That was safe only while changing it required
-- a redeploy. Now that it is owner-editable, a live read would silently restate
-- every invoice already issued to a customer, and every past revenue report.
-- unit_cost is snapshotted at sale for the same reason.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "gst_rate" numeric(6,4);

-- Backfill everything that has already reached payment. 18% is the only rate
-- this store has ever charged, so a constant is correct here; if you have
-- historical orders at a different rate, correct them before going live:
--   UPDATE orders SET gst_rate = 0.1200 WHERE paid_at < '2026-01-01';
--
-- Orders that have not been paid are left NULL on purpose: they will snapshot
-- whatever rate is in force when they are actually paid.
UPDATE "orders" SET "gst_rate" = 0.1800 WHERE "gst_rate" IS NULL AND "paid_at" IS NOT NULL;
