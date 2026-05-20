-- サバイバル本番: ステージ1 タイムドセリフ（Basic / Songs / Phrases）
BEGIN;

CREATE TABLE IF NOT EXISTS public.survival_stage_intro_scripts (
  map_category text PRIMARY KEY
    CHECK (map_category IN ('basic', 'songs', 'phrases')),
  title text NOT NULL,
  title_en text NOT NULL,
  script jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.survival_stage_intro_scripts IS 'サバイバル降下マップ ステージ1 のゲーム中タイムドセリフ（script: lineDurationSeconds + lines[]）';

ALTER TABLE public.survival_stage_intro_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS survival_stage_intro_scripts_select_all ON public.survival_stage_intro_scripts;

CREATE POLICY survival_stage_intro_scripts_select_all ON public.survival_stage_intro_scripts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS survival_stage_intro_scripts_insert_admin ON public.survival_stage_intro_scripts;

CREATE POLICY survival_stage_intro_scripts_insert_admin ON public.survival_stage_intro_scripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_stage_intro_scripts_update_admin ON public.survival_stage_intro_scripts;

CREATE POLICY survival_stage_intro_scripts_update_admin ON public.survival_stage_intro_scripts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_stage_intro_scripts_delete_admin ON public.survival_stage_intro_scripts;

CREATE POLICY survival_stage_intro_scripts_delete_admin ON public.survival_stage_intro_scripts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

CREATE OR REPLACE FUNCTION public.set_survival_stage_intro_scripts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_stage_intro_scripts_updated_at ON public.survival_stage_intro_scripts;
CREATE TRIGGER trg_survival_stage_intro_scripts_updated_at
  BEFORE UPDATE ON public.survival_stage_intro_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_survival_stage_intro_scripts_updated_at();

GRANT SELECT ON public.survival_stage_intro_scripts TO anon, authenticated;

INSERT INTO public.survival_stage_intro_scripts (map_category, title, title_en, script) VALUES
(
  'basic',
  'ステージ1イントロ（Basic）',
  'Stage 1 intro (Basic)',
  $sj_basic$
{
    "lineDurationSeconds": 3,
    "lines": [
      { "atSeconds": 2, "text": { "ja": "また会ったね、ファイだよ。", "en": "Hey again — it's Fai." } },
      { "atSeconds": 6, "text": { "ja": "ここは Basic コース。コードの種類ごとに基礎を鍛える場所だよ。", "en": "This is the Basic course — train fundamentals chord by chord." } },
      { "atSeconds": 10, "text": { "ja": "ブロックごとの最終ステージにボスがいるよ。", "en": "Each block ends with a boss stage." } },
      { "atSeconds": 14, "text": { "ja": "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。", "en": "Switch between HINT practice and performance mode. Clears are saved in performance mode only." } },
      { "atSeconds": 18, "text": { "ja": "バーチャルスティックで移動しよう。", "en": "Move with the virtual stick." } },
      { "atSeconds": 22, "text": { "ja": "光っている鍵盤の色を演奏しよう。", "en": "Play the highlighted key colors on the keyboard." } },
      { "atSeconds": 26, "text": { "ja": "正解したら緑色になるよ。（正解したら次の音へ）", "en": "Correct notes turn green. (Then you move to the next note.)" } },
      { "atSeconds": 30, "text": { "ja": "5秒以内に正解し続けるとコンボゲージが溜まるよ。", "en": "Keep answering within 5 seconds to build the combo gauge." } },
      { "atSeconds": 34, "text": { "ja": "コンボゲージがMAXになるとゲージ技が発動するよ。", "en": "When the combo gauge maxes out, your gauge skill triggers." } },
      { "atSeconds": 38, "text": { "ja": "90秒間生き残ったらクリアだ。", "en": "Survive for 90 seconds to clear." } },
      { "atSeconds": 42, "text": { "ja": "全ステージ制覇目指して頑張ろう。", "en": "Let's aim to conquer every stage!" } }
    ]
  }
$sj_basic$::jsonb
),
(
  'songs',
  'ステージ1イントロ（Songs）',
  'Stage 1 intro (Songs)',
  $sj_songs$
{
    "lineDurationSeconds": 3,
    "lines": [
      { "atSeconds": 2, "text": { "ja": "また会ったね、ファイだよ。", "en": "Hey again — it's Fai." } },
      { "atSeconds": 6, "text": { "ja": "ここは Songs コース。ジャズスタンダードのコード進行を演奏する場所だよ。", "en": "This is the Songs course — play jazz standard progressions." } },
      { "atSeconds": 10, "text": { "ja": "ブロックごとの最終ステージにボスがいるよ。", "en": "Each block ends with a boss stage." } },
      { "atSeconds": 14, "text": { "ja": "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。", "en": "Switch between HINT practice and performance mode. Clears are saved in performance mode only." } },
      { "atSeconds": 18, "text": { "ja": "バーチャルスティックで移動しよう。", "en": "Move with the virtual stick." } },
      { "atSeconds": 22, "text": { "ja": "光っている鍵盤の色を演奏しよう。", "en": "Play the highlighted key colors on the keyboard." } },
      { "atSeconds": 26, "text": { "ja": "正解したら緑色になるよ。（正解したら次の音へ）", "en": "Correct notes turn green. (Then you move to the next note.)" } },
      { "atSeconds": 30, "text": { "ja": "5秒以内に正解し続けるとコンボゲージが溜まるよ。", "en": "Keep answering within 5 seconds to build the combo gauge." } },
      { "atSeconds": 34, "text": { "ja": "コンボゲージがMAXになるとゲージ技が発動するよ。", "en": "When the combo gauge maxes out, your gauge skill triggers." } },
      { "atSeconds": 38, "text": { "ja": "90秒間生き残ったらクリアだ。", "en": "Survive for 90 seconds to clear." } },
      { "atSeconds": 42, "text": { "ja": "全ステージ制覇目指して頑張ろう。", "en": "Let's aim to conquer every stage!" } }
    ]
  }
$sj_songs$::jsonb
),
(
  'phrases',
  'ステージ1イントロ（Phrases）',
  'Stage 1 intro (Phrases)',
  $sj_phr$
{
    "lineDurationSeconds": 3,
    "lines": [
      { "atSeconds": 2, "text": { "ja": "また会ったね、ファイだよ。", "en": "Hey again — it's Fai." } },
      { "atSeconds": 6, "text": { "ja": "ここは Phrases コース。小節ごとにコードを演奏するフレーズモードだよ。", "en": "This is the Phrases course — chord-by-measure phrase battles." } },
      { "atSeconds": 10, "text": { "ja": "ブロックごとの最終ステージにボスがいるよ。", "en": "Each block ends with a boss stage." } },
      { "atSeconds": 14, "text": { "ja": "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。", "en": "Switch between HINT practice and performance mode. Clears are saved in performance mode only." } },
      { "atSeconds": 18, "text": { "ja": "バーチャルスティックで移動しよう。", "en": "Move with the virtual stick." } },
      { "atSeconds": 22, "text": { "ja": "光っている鍵盤の色を演奏しよう。", "en": "Play the highlighted key colors on the keyboard." } },
      { "atSeconds": 26, "text": { "ja": "小節が弾けると強い攻撃が発動するよ。", "en": "Clear a measure to unleash a strong attack." } },
      { "atSeconds": 30, "text": { "ja": "90秒間生き残ったらクリアだ。", "en": "Survive for 90 seconds to clear." } },
      { "atSeconds": 34, "text": { "ja": "全ステージ制覇目指して頑張ろう。", "en": "Let's aim to conquer every stage!" } }
    ]
  }
$sj_phr$::jsonb
)
ON CONFLICT (map_category) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

COMMIT;
