-- サバイバル本番: 第一ブロック末尾ボス戦のタイムドセリフ（Basic / Songs / Phrases 共通台本／map_category で行分割）
BEGIN;

CREATE TABLE IF NOT EXISTS public.survival_block_boss_intro_scripts (
  map_category text PRIMARY KEY
    CHECK (map_category IN ('basic', 'songs', 'phrases')),
  title text NOT NULL,
  title_en text NOT NULL,
  script jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.survival_block_boss_intro_scripts IS '降下マップ ブロック1 最終（ボス）のゲーム中タイムドセリフ（script: lineDurationSeconds + lines[], Web/iOS と survival_stage_intro_scripts 同スキーマ）';

ALTER TABLE public.survival_block_boss_intro_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS survival_block_boss_intro_scripts_select_all ON public.survival_block_boss_intro_scripts;

CREATE POLICY survival_block_boss_intro_scripts_select_all ON public.survival_block_boss_intro_scripts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS survival_block_boss_intro_scripts_insert_admin ON public.survival_block_boss_intro_scripts;

CREATE POLICY survival_block_boss_intro_scripts_insert_admin ON public.survival_block_boss_intro_scripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_block_boss_intro_scripts_update_admin ON public.survival_block_boss_intro_scripts;

CREATE POLICY survival_block_boss_intro_scripts_update_admin ON public.survival_block_boss_intro_scripts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_block_boss_intro_scripts_delete_admin ON public.survival_block_boss_intro_scripts;

CREATE POLICY survival_block_boss_intro_scripts_delete_admin ON public.survival_block_boss_intro_scripts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

CREATE OR REPLACE FUNCTION public.set_survival_block_boss_intro_scripts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_block_boss_intro_scripts_updated_at ON public.survival_block_boss_intro_scripts;
CREATE TRIGGER trg_survival_block_boss_intro_scripts_updated_at
  BEFORE UPDATE ON public.survival_block_boss_intro_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_survival_block_boss_intro_scripts_updated_at();

GRANT SELECT ON public.survival_block_boss_intro_scripts TO anon, authenticated;

INSERT INTO public.survival_block_boss_intro_scripts (map_category, title, title_en, script) VALUES
(
  'basic',
  'ブロック1ボスタイムドセリフ',
  'Block 1 boss timed dialogue',
  $boss_intro$
{
  "lineDurationSeconds": 3,
  "lines": [
    { "atSeconds": 2, "text": { "ja": "ボス戦だよ！", "en": "It's boss time!" } },
    {
      "atSeconds": 6,
      "text": {
        "ja": "ボスの予備動作をきちんと見て、避けながら弾こう！",
        "en": "Watch the boss telegraphs closely — dodge and keep playing your chords!"
      }
    },
    {
      "atSeconds": 10,
      "text": {
        "ja": "難しかったら前のステージに戻って復習しよう。",
        "en": "If it's rough, jump back earlier and rehearse."
      }
    },
    {
      "atSeconds": 14,
      "text": {
        "ja": "MIDIキーボードでのプレイがおすすめ",
        "en": "We recommend playing with a MIDI keyboard."
      }
    }
  ]
}
$boss_intro$::jsonb
),
(
  'songs',
  'ブロック1ボスタイムドセリフ',
  'Block 1 boss timed dialogue',
  $boss_intro$
{
  "lineDurationSeconds": 3,
  "lines": [
    { "atSeconds": 2, "text": { "ja": "ボス戦だよ！", "en": "It's boss time!" } },
    {
      "atSeconds": 6,
      "text": {
        "ja": "ボスの予備動作をきちんと見て、避けながら弾こう！",
        "en": "Watch the boss telegraphs closely — dodge and keep playing your chords!"
      }
    },
    {
      "atSeconds": 10,
      "text": {
        "ja": "難しかったら前のステージに戻って復習しよう。",
        "en": "If it's rough, jump back earlier and rehearse."
      }
    },
    {
      "atSeconds": 14,
      "text": {
        "ja": "MIDIキーボードでのプレイがおすすめ",
        "en": "We recommend playing with a MIDI keyboard."
      }
    }
  ]
}
$boss_intro$::jsonb
),
(
  'phrases',
  'ブロック1ボスタイムドセリフ',
  'Block 1 boss timed dialogue',
  $boss_intro$
{
  "lineDurationSeconds": 3,
  "lines": [
    { "atSeconds": 2, "text": { "ja": "ボス戦だよ！", "en": "It's boss time!" } },
    {
      "atSeconds": 6,
      "text": {
        "ja": "ボスの予備動作をきちんと見て、避けながら弾こう！",
        "en": "Watch the boss telegraphs closely — dodge and keep playing your chords!"
      }
    },
    {
      "atSeconds": 10,
      "text": {
        "ja": "難しかったら前のステージに戻って復習しよう。",
        "en": "If it's rough, jump back earlier and rehearse."
      }
    },
    {
      "atSeconds": 14,
      "text": {
        "ja": "MIDIキーボードでのプレイがおすすめ",
        "en": "We recommend playing with a MIDI keyboard."
      }
    }
  ]
}
$boss_intro$::jsonb
)
ON CONFLICT (map_category) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

COMMIT;
