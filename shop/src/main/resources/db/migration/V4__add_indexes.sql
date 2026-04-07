CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);


-- Rules for writing indexes mostly
---- 1. for queries like these
--SELECT * FROM orders WHERE user_id = 3;
--SELECT * FROM products WHERE category_id = 5;
--SELECT * FROM reviews WHERE product_id = 10;
--
---- we put indexes
--CREATE INDEX idx_orders_user_id ON orders(user_id);
--CREATE INDEX idx_products_category_id ON products(category_id);
--CREATE INDEX idx_reviews_product_id ON reviews(product_id);

---- 2. order by
--SELECT * FROM orders ORDER BY created_at DESC;
--SELECT * FROM products ORDER BY price ASC;
--
--CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
--CREATE INDEX idx_products_price ON products(price);


--3. joins - foreign key
--order_items.order_id → orders.id
--cart_items.cart_id → carts.id
--
--CREATE INDEX idx_order_items_order_id ON order_items(order_id);
--CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- where not to use
-- 1. lots of updates and inserts on the table
-- 2. on small tables
-- 3. boolean columns