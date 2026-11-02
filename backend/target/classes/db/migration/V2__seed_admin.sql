-- ResolveIQ Migration V2: Seed Administrative Account
-- Admin accounts cannot be publicly registered.
-- Default credentials: shilgourab7@gmail.com

INSERT INTO users (id, full_name, email, password_hash, role, department, created_at)
VALUES (
    'usr-admin-01',
    'ResolveIQ Administrator',
    'shilgourab7@gmail.com',
    '$2a$10$mBqF8y3r3yPqZ2Y412eLce52F2p7bC5d5b7a7c9d9e1f3a5b7c9d1',
    'ADMIN',
    'System Administration',
    NOW()
)
ON CONFLICT (email) DO NOTHING;
