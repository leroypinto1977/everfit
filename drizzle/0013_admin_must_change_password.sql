-- An account whose password an owner chose — a new team member, or one whose
-- password an owner reset in Settings → Team — must pick its own before the
-- panel opens. Existing accounts already chose theirs, so they start at false.
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean NOT NULL DEFAULT false;
