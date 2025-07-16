-- Add category field to challenges table
ALTER TABLE challenges 
ADD COLUMN category TEXT NOT NULL DEFAULT 'song_clear' CHECK (category IN ('diary', 'song_clear'));

-- Add song_clear_count field to challenges table
ALTER TABLE challenges 
ADD COLUMN song_clear_count INTEGER;

-- Update existing challenges to have song_clear category
UPDATE challenges SET category = 'song_clear' WHERE category IS NULL;

-- Make category field required after setting defaults
ALTER TABLE challenges ALTER COLUMN category SET NOT NULL; 