ALTER TABLE "product_variants" ADD COLUMN "cost" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "unit_cost" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fee" integer DEFAULT 0 NOT NULL;
