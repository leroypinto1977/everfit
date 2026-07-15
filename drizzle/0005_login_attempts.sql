CREATE TABLE IF NOT EXISTS "login_attempts" (
	"identifier" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
