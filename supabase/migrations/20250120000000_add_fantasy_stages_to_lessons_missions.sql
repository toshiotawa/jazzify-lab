-- Add fantasy stage support to lessons and missions

-- Add fantasy_stage_id and clear_days to lesson_songs
ALTER TABLE public.lesson_songs 
ADD COLUMN IF NOT EXISTS fantasy_stage_id UUID REFERENCES public.fantasy_stages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS clear_days INTEGER DEFAULT 1 CHECK (clear_days >= 1);

-- Add fantasy_stage_id and clear_days to challenge_tracks
ALTER TABLE public.challenge_tracks 
ADD COLUMN IF NOT EXISTS fantasy_stage_id UUID REFERENCES public.fantasy_stages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS clear_days INTEGER DEFAULT 1 CHECK (clear_days >= 1);

-- Create lesson fantasy stage clears table
CREATE TABLE IF NOT EXISTS public.lesson_fantasy_clears (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_song_id UUID NOT NULL REFERENCES public.lesson_songs(id) ON DELETE CASCADE,
    fantasy_stage_id UUID NOT NULL REFERENCES public.fantasy_stages(id) ON DELETE CASCADE,
    clear_type TEXT NOT NULL CHECK (clear_type IN ('clear', 'gameover')),
    remaining_hp INTEGER NOT NULL,
    clear_time FLOAT NOT NULL,
    cleared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_lesson_fantasy_clear_per_day UNIQUE (user_id, lesson_song_id, fantasy_stage_id, DATE(cleared_at))
);

-- Create mission fantasy stage clears table
CREATE TABLE IF NOT EXISTS public.mission_fantasy_clears (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    fantasy_stage_id UUID NOT NULL REFERENCES public.fantasy_stages(id) ON DELETE CASCADE,
    clear_type TEXT NOT NULL CHECK (clear_type IN ('clear', 'gameover')),
    remaining_hp INTEGER NOT NULL,
    clear_time FLOAT NOT NULL,
    cleared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_mission_fantasy_clear_per_day UNIQUE (user_id, challenge_id, fantasy_stage_id, DATE(cleared_at))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lesson_fantasy_clears_user_id ON public.lesson_fantasy_clears(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_fantasy_clears_lesson_song_id ON public.lesson_fantasy_clears(lesson_song_id);
CREATE INDEX IF NOT EXISTS idx_lesson_fantasy_clears_fantasy_stage_id ON public.lesson_fantasy_clears(fantasy_stage_id);
CREATE INDEX IF NOT EXISTS idx_lesson_fantasy_clears_cleared_at ON public.lesson_fantasy_clears(cleared_at);

CREATE INDEX IF NOT EXISTS idx_mission_fantasy_clears_user_id ON public.mission_fantasy_clears(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_fantasy_clears_challenge_id ON public.mission_fantasy_clears(challenge_id);
CREATE INDEX IF NOT EXISTS idx_mission_fantasy_clears_fantasy_stage_id ON public.mission_fantasy_clears(fantasy_stage_id);
CREATE INDEX IF NOT EXISTS idx_mission_fantasy_clears_cleared_at ON public.mission_fantasy_clears(cleared_at);

-- Enable RLS
ALTER TABLE public.lesson_fantasy_clears ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_fantasy_clears ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_fantasy_clears
CREATE POLICY "lesson_fantasy_clears_read_own" ON public.lesson_fantasy_clears
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "lesson_fantasy_clears_insert_own" ON public.lesson_fantasy_clears
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for mission_fantasy_clears
CREATE POLICY "mission_fantasy_clears_read_own" ON public.mission_fantasy_clears
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mission_fantasy_clears_insert_own" ON public.mission_fantasy_clears
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add comments
COMMENT ON COLUMN public.lesson_songs.fantasy_stage_id IS 'ファンタジーモードのステージID（nullの場合は通常の楽曲）';
COMMENT ON COLUMN public.lesson_songs.clear_days IS 'クリアに必要な日数（ファンタジーステージの場合のみ使用）';

COMMENT ON COLUMN public.challenge_tracks.fantasy_stage_id IS 'ファンタジーモードのステージID（nullの場合は通常の楽曲）';
COMMENT ON COLUMN public.challenge_tracks.clear_days IS 'クリアに必要な日数（ファンタジーステージの場合のみ使用）';

COMMENT ON TABLE public.lesson_fantasy_clears IS 'レッスンのファンタジーステージクリア記録';
COMMENT ON TABLE public.mission_fantasy_clears IS 'ミッションのファンタジーステージクリア記録';