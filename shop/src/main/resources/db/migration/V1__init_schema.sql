-- Users table
CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'ROLE_USER',
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url   VARCHAR(500)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255)   NOT NULL UNIQUE,
    price          NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER        NOT NULL DEFAULT 0,
    image_url      VARCHAR(500),
    category_id    BIGINT REFERENCES categories(id) ON DELETE SET NULL
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name  VARCHAR(255) NOT NULL,
    phone      VARCHAR(20)  NOT NULL,
    street     VARCHAR(500) NOT NULL,
    city       VARCHAR(100) NOT NULL,
    state      VARCHAR(100) NOT NULL,
    pincode    VARCHAR(20)  NOT NULL,
    landmark   VARCHAR(255),
    is_default BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id                        BIGSERIAL      PRIMARY KEY,
    user_id                   BIGINT         NOT NULL REFERENCES users(id),
    address_id                BIGINT         REFERENCES addresses(id) ON DELETE SET NULL,
    delivery_address_snapshot VARCHAR(500)   NOT NULL,
    total_price               NUMERIC(10, 2) NOT NULL,
    status                    VARCHAR(50)    NOT NULL DEFAULT 'PENDING',
    created_at                TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id                BIGSERIAL      PRIMARY KEY,
    order_id          BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id        BIGINT         NOT NULL,
    product_name      VARCHAR(255)   NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL,
    quantity          INTEGER        NOT NULL,
    subtotal          NUMERIC(10, 2) NOT NULL
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id         BIGSERIAL PRIMARY KEY,
    cart_id    BIGINT  NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT  NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL,
    UNIQUE (cart_id, product_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating     INTEGER   NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);