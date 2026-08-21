-- HSN code moves from a store-wide env var onto the product it describes.
--
-- HSN classifies a commodity, not a shop: a store selling bands and apparel
-- needs two codes, and a single HSN_CODE for the whole catalogue quietly puts
-- the wrong one on half the invoices. Left NULL, so an untouched deployment
-- keeps falling back to the HSN_CODE environment variable.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hsn_code" text;
