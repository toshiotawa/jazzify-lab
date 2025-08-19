-- ギルドメンバーのストリーク管理テーブル
CREATE TABLE IF NOT EXISTS public.guild_member_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
    
    -- ストリーク情報
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    last_contribution_date DATE,
    streak_level INTEGER NOT NULL DEFAULT 0, -- 0-6のレベル
    streak_started_date DATE,
    
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- ユニーク制約（1人のユーザーは1つのギルドに対して1つのストリークデータ）
    UNIQUE(user_id, guild_id)
);

-- インデックス
CREATE INDEX idx_guild_member_streaks_guild_id ON public.guild_member_streaks(guild_id);
CREATE INDEX idx_guild_member_streaks_user_id ON public.guild_member_streaks(user_id);
CREATE INDEX idx_guild_member_streaks_last_contribution ON public.guild_member_streaks(last_contribution_date);

-- RLSポリシー
ALTER TABLE public.guild_member_streaks ENABLE ROW LEVEL SECURITY;

-- 自分のストリークデータは読み取り可能
CREATE POLICY "Users can read their own streak data"
    ON public.guild_member_streaks FOR SELECT
    USING (auth.uid() = user_id);

-- 同じギルドのメンバーのストリークデータは読み取り可能
CREATE POLICY "Guild members can read guild streak data"
    ON public.guild_member_streaks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.guild_members
            WHERE guild_members.guild_id = guild_member_streaks.guild_id
            AND guild_members.user_id = auth.uid()
        )
    );

-- システムがストリークデータを更新可能（RPC経由）
CREATE POLICY "System can manage streak data"
    ON public.guild_member_streaks FOR ALL
    USING (auth.role() = 'service_role');

-- ストリーク更新関数
CREATE OR REPLACE FUNCTION public.update_guild_member_streak(
    p_user_id UUID,
    p_guild_id UUID,
    p_contributed BOOLEAN DEFAULT TRUE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak_data RECORD;
    v_today DATE;
    v_yesterday DATE;
    v_new_streak_days INTEGER;
    v_new_level INTEGER;
    v_level_changed BOOLEAN DEFAULT FALSE;
BEGIN
    v_today := CURRENT_DATE;
    v_yesterday := v_today - INTERVAL '1 day';
    
    -- 既存のストリークデータを取得
    SELECT * INTO v_streak_data
    FROM public.guild_member_streaks
    WHERE user_id = p_user_id AND guild_id = p_guild_id
    FOR UPDATE;
    
    -- データが存在しない場合は作成
    IF v_streak_data.id IS NULL THEN
        INSERT INTO public.guild_member_streaks (
            user_id, guild_id, current_streak_days, streak_level,
            last_contribution_date, streak_started_date
        )
        VALUES (
            p_user_id, p_guild_id, 
            CASE WHEN p_contributed THEN 1 ELSE 0 END,
            CASE WHEN p_contributed THEN 0 ELSE 0 END,
            CASE WHEN p_contributed THEN v_today ELSE NULL END,
            CASE WHEN p_contributed THEN v_today ELSE NULL END
        )
        RETURNING * INTO v_streak_data;
        
        RETURN jsonb_build_object(
            'current_streak_days', v_streak_data.current_streak_days,
            'streak_level', v_streak_data.streak_level,
            'level_changed', FALSE,
            'contributed_today', p_contributed
        );
    END IF;
    
    -- 既に今日貢献済みの場合は何もしない
    IF v_streak_data.last_contribution_date = v_today THEN
        RETURN jsonb_build_object(
            'current_streak_days', v_streak_data.current_streak_days,
            'streak_level', v_streak_data.streak_level,
            'level_changed', FALSE,
            'contributed_today', TRUE
        );
    END IF;
    
    -- ストリーク計算
    IF p_contributed THEN
        -- 貢献した場合
        IF v_streak_data.last_contribution_date = v_yesterday THEN
            -- ストリーク継続
            v_new_streak_days := v_streak_data.current_streak_days + 1;
        ELSE
            -- ストリークリセット（新規開始）
            v_new_streak_days := 1;
        END IF;
        
        -- レベル計算（5日ごとに1レベル上昇、最大レベル6）
        v_new_level := LEAST(FLOOR(v_new_streak_days / 5), 6);
        v_level_changed := (v_new_level != v_streak_data.streak_level);
        
        -- 更新
        UPDATE public.guild_member_streaks
        SET 
            current_streak_days = v_new_streak_days,
            streak_level = v_new_level,
            last_contribution_date = v_today,
            longest_streak_days = GREATEST(longest_streak_days, v_new_streak_days),
            streak_started_date = CASE 
                WHEN v_new_streak_days = 1 THEN v_today 
                ELSE streak_started_date 
            END,
            updated_at = now()
        WHERE id = v_streak_data.id;
        
    ELSE
        -- 貢献しなかった場合（1日以上経過している場合のみレベルダウン）
        IF v_streak_data.last_contribution_date < v_yesterday THEN
            -- レベルを1下げる（最小0）
            v_new_level := GREATEST(v_streak_data.streak_level - 1, 0);
            v_level_changed := (v_new_level != v_streak_data.streak_level);
            
            -- ストリークはリセット
            UPDATE public.guild_member_streaks
            SET 
                current_streak_days = 0,
                streak_level = v_new_level,
                streak_started_date = NULL,
                updated_at = now()
            WHERE id = v_streak_data.id;
            
            v_new_streak_days := 0;
        ELSE
            -- まだ期限内
            v_new_streak_days := v_streak_data.current_streak_days;
            v_new_level := v_streak_data.streak_level;
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'current_streak_days', v_new_streak_days,
        'streak_level', v_new_level,
        'level_changed', v_level_changed,
        'contributed_today', p_contributed
    );
END;
$$;

-- 日次ストリークチェック関数（クーロンジョブ用）
CREATE OR REPLACE FUNCTION public.check_daily_guild_streaks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member RECORD;
    v_today DATE;
    v_yesterday DATE;
BEGIN
    v_today := CURRENT_DATE;
    v_yesterday := v_today - INTERVAL '1 day';
    
    -- チャレンジギルドのメンバー全員をチェック
    FOR v_member IN
        SELECT gm.user_id, gm.guild_id
        FROM public.guild_members gm
        JOIN public.guilds g ON g.id = gm.guild_id
        WHERE g.guild_type = 'challenge'
    LOOP
        -- 今日XPを獲得したかチェック
        IF EXISTS (
            SELECT 1 FROM public.xp_history
            WHERE user_id = v_member.user_id
            AND DATE(created_at) = v_today
            AND gained_xp > 0
        ) THEN
            -- 貢献あり
            PERFORM public.update_guild_member_streak(v_member.user_id, v_member.guild_id, TRUE);
        ELSE
            -- 貢献なし（昨日が最後の貢献日だった場合のみレベルダウン）
            IF EXISTS (
                SELECT 1 FROM public.guild_member_streaks
                WHERE user_id = v_member.user_id
                AND guild_id = v_member.guild_id
                AND last_contribution_date = v_yesterday
            ) THEN
                PERFORM public.update_guild_member_streak(v_member.user_id, v_member.guild_id, FALSE);
            END IF;
        END IF;
    END LOOP;
END;
$$;