-- Seed the catalog from the values that previously lived in src/lib/product.ts,
-- then backfill orders/customers/events from the legacy JSONB table (if any).

INSERT INTO "products" ("slug", "name", "description", "active")
VALUES ('infinity-band', 'EVHERFIT Infinity Band', 'Weighted resistance band, sold as a pair.', true)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "product_variants" ("product_id", "key", "sku", "label", "weight", "blurb", "price", "mrp", "popular", "sort")
SELECT p."id", v.key, v.sku, v.label, v.weight, v.blurb, v.price, v.mrp, v.popular, v.sort
FROM "products" p,
	(VALUES
		('0.5', 'EVH-IB-05', 'Tone', '0.5 kg × 2', 'Daily walks, pilates, barre', 149900, 249900, false, 0),
		('1',   'EVH-IB-10', 'Strength', '1 kg × 2', 'Yoga flows, HIIT, power walks', 199900, 329900, true, 1),
		('2',   'EVH-IB-20', 'Power', '2 kg × 2', 'Strength training, conditioning', 249900, 399900, false, 2)
	) AS v(key, sku, label, weight, blurb, price, mrp, popular, sort)
WHERE p."slug" = 'infinity-band'
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders_legacy') THEN

	-- 1. customers, deduped on the last 10 phone digits; latest order wins the details
	INSERT INTO "customers" ("phone", "name", "email", "address", "city", "state", "pincode", "created_at")
	SELECT DISTINCT ON (right(regexp_replace(data->'customer'->>'phone', '\D', '', 'g'), 10))
		right(regexp_replace(data->'customer'->>'phone', '\D', '', 'g'), 10),
		data->'customer'->>'name',
		data->'customer'->>'email',
		coalesce(data->'customer'->>'address', ''),
		coalesce(data->'customer'->>'city', ''),
		coalesce(data->'customer'->>'state', ''),
		coalesce(data->'customer'->>'pincode', ''),
		min((data->>'createdAt')::timestamptz) OVER (PARTITION BY right(regexp_replace(data->'customer'->>'phone', '\D', '', 'g'), 10))
	FROM "orders_legacy"
	WHERE length(regexp_replace(data->'customer'->>'phone', '\D', '', 'g')) >= 10
	ORDER BY right(regexp_replace(data->'customer'->>'phone', '\D', '', 'g'), 10), (data->>'createdAt')::timestamptz DESC
	ON CONFLICT ("phone") DO NOTHING;

	-- 2. orders, with the variant key recovered from the item display string
	INSERT INTO "orders" ("id", "customer_id", "status", "amount", "currency", "item", "variant_key", "payment_id", "tracking",
		"name", "email", "phone", "address", "city", "state", "pincode", "created_at", "paid_at")
	SELECT
		data->>'id',
		c."id",
		data->>'status',
		(data->>'amount')::integer,
		coalesce(data->>'currency', 'INR'),
		data->>'item',
		CASE
			WHEN data->>'item' LIKE '%0.5 kg%' THEN '0.5'
			WHEN data->>'item' LIKE '%1 kg%' THEN '1'
			WHEN data->>'item' LIKE '%2 kg%' THEN '2'
		END,
		data->>'paymentId',
		data->>'tracking',
		data->'customer'->>'name',
		data->'customer'->>'email',
		data->'customer'->>'phone',
		coalesce(data->'customer'->>'address', ''),
		coalesce(data->'customer'->>'city', ''),
		coalesce(data->'customer'->>'state', ''),
		coalesce(data->'customer'->>'pincode', ''),
		(data->>'createdAt')::timestamptz,
		(data->>'paidAt')::timestamptz
	FROM "orders_legacy"
	LEFT JOIN "customers" c
		ON c."phone" = right(regexp_replace(data->'customer'->>'phone', '\D', '', 'g'), 10)
	ON CONFLICT ("id") DO NOTHING;

	-- 3. invoice numbers for orders that reached payment, oldest first
	UPDATE "orders" o SET "invoice_no" = seq.n
	FROM (
		SELECT "id", nextval('invoice_seq')::integer AS n
		FROM "orders"
		WHERE "status" IN ('paid', 'shipped', 'delivered', 'refunded') AND "invoice_no" IS NULL
		ORDER BY "paid_at" NULLS LAST, "created_at"
	) seq
	WHERE o."id" = seq."id";

	-- 4. minimal audit trail from the timestamps the legacy records carried
	INSERT INTO "order_events" ("order_id", "type", "actor", "created_at")
	SELECT "id", 'created', 'customer', "created_at" FROM "orders";
	INSERT INTO "order_events" ("order_id", "type", "actor", "created_at")
	SELECT "id", 'paid', 'system', coalesce("paid_at", "created_at") FROM "orders"
	WHERE "paid_at" IS NOT NULL OR "status" IN ('paid', 'shipped', 'delivered');

END IF;
END $$;
