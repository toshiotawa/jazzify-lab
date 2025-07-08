-- Seed data for Jazz Learning Game development

-- Insert sample user profiles for testing
-- Note: These will only work if corresponding auth.users exist

-- Master admin user (for testing admin features)
INSERT INTO public.profiles (
  id, 
  email, 
  display_name, 
  member_rank, 
  total_exp
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Sample UUID
  'admin@jazz-game.com',
  'Master Admin',
  'master',
  50000
) ON CONFLICT (id) DO NOTHING;

-- Sample regular users for testing
INSERT INTO public.profiles (
  id, 
  email, 
  display_name, 
  member_rank, 
  total_exp
) VALUES 
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'player1@jazz-game.com',
    'Jazz Beginner',
    'bronze',
    150
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'player2@jazz-game.com',
    'Piano Enthusiast',
    'silver',
    1250
  ),
  (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'player3@jazz-game.com',
    'Guitar Master',
    'gold',
    3500
  )
ON CONFLICT (id) DO NOTHING;

-- Note: In a real environment, these users would need to be created
-- through Supabase Auth first, then the trigger would automatically
-- create their profiles. This seed data is for development/testing only.