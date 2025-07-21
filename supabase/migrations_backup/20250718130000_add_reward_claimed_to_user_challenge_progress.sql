-- Add reward_claimed column to user_challenge_progress table
-- This separates mission completion from reward claiming
ALTER TABLE public.user_challenge_progress 
ADD COLUMN reward_claimed boolean NOT NULL DEFAULT false;

-- Update existing completed records to also have reward_claimed set to true
-- This preserves existing reward states
UPDATE public.user_challenge_progress 
SET reward_claimed = true 
WHERE completed = true;

-- Add comment to explain the column
COMMENT ON COLUMN public.user_challenge_progress.reward_claimed IS 'Whether the user has claimed the reward for this mission (separate from completion)';