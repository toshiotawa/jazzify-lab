-- Add reward_claimed column to user_challenge_progress table if it doesn't exist
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_challenge_progress' 
        AND column_name = 'reward_claimed'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.user_challenge_progress 
        ADD COLUMN reward_claimed boolean NOT NULL DEFAULT false;
        
        -- Update existing completed records to also have reward_claimed set to true
        UPDATE public.user_challenge_progress 
        SET reward_claimed = true 
        WHERE completed = true;
        
        -- Add comment to explain the column
        COMMENT ON COLUMN public.user_challenge_progress.reward_claimed IS 'Whether the user has claimed the reward for this mission (separate from completion)';
        
        RAISE NOTICE 'reward_claimed column added successfully';
    ELSE
        RAISE NOTICE 'reward_claimed column already exists';
    END IF;
END $$; 