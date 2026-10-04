USE colorectal_ai;
INSERT INTO admins (name, email, password_hash, created_at) VALUES ('Admin', 'admin@test.com', '$2a$10$testhash', NOW());