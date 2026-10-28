-- Each 1-to-1 lead is rated hot / warm / cold from its answers when it arrives
-- (packages/core/src/lib/lead-score.ts). "temperature" starts as that rating and
-- the team may change it after the call; "score" and "score_reasons" keep what
-- the answers earned. Null on leads that don't answer the readiness questions.
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "temperature" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "score" integer;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "score_reasons" jsonb;
