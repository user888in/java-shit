INSERT INTO users (name, email, password, role, created_at)
SELECT 'Admin', 'admin@shop.com',
       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
       'ROLE_ADMIN', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@shop.com'
);