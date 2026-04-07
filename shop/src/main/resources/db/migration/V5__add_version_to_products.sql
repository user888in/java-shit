ALTER TABLE products ADD COLUMN version BIGINT DEFAULT 0;
UPDATE products SET version = 0 WHERE version IS NULL;
ALTER TABLE products ALTER COLUMN version SET NOT NULL;ull;