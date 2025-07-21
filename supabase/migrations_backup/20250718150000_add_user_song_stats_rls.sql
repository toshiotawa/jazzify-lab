-- RLSポリシーをuser_song_statsテーブルに設定
-- 統計データが表示されない問題を解決するため

-- RLSを有効化
ALTER TABLE public.user_song_stats ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーが自分の統計データを読み取れるポリシー
CREATE POLICY "Users can view their own song stats"
ON public.user_song_stats FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 認証されたユーザーが自分の統計データを挿入できるポリシー
CREATE POLICY "Users can insert their own song stats"
ON public.user_song_stats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 認証されたユーザーが自分の統計データを更新できるポリシー
CREATE POLICY "Users can update their own song stats"
ON public.user_song_stats FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 認証されたユーザーが自分の統計データを削除できるポリシー
CREATE POLICY "Users can delete their own song stats"
ON public.user_song_stats FOR DELETE
TO authenticated
USING (auth.uid() = user_id);