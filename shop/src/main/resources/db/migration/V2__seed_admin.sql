INSERT INTO users (name, email, password, role, created_at)
SELECT 'Admin', 'admin@shop.com',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
       'ROLE_ADMIN', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@shop.com'
);