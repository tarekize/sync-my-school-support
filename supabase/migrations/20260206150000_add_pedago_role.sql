-- Add pedago to app_role enum
ALTER TYPE app_role ADD VALUE 'pedago';

-- Create test pedago user
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'pedago@test.com', crypt('Pedago123!', gen_salt('bf')), now(), now(), now())
  RETURNING id INTO user_id;

  -- Insert into profiles
  INSERT INTO profiles (id, email, first_name, last_name, is_active, created_at, updated_at)
  VALUES (user_id, 'pedago@test.com', 'Pédago', 'Test', true, now(), now());

  -- Insert into user_roles
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (user_id, 'pedago', now());
END $$;
