USE colorectal_ai;
UPDATE admins SET password_hash = '\$2a\$10\$testhash' WHERE email = 'admin@test.com';