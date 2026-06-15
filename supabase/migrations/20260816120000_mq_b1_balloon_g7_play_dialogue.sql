-- MQ B1 2-3「G7を追加しよう」風船ラッシュ: プレイ中セリフ
BEGIN;

INSERT INTO public.balloon_rush_play_dialogues (stage_id, title, title_en, script, is_active)
SELECT
  id,
  'MQ B1: G7を追加',
  'MQ B1: Add G7',
  '{
    "lineDurationSeconds": 6,
    "lines": [
      {
        "atSeconds": 2,
        "speaker": "jajii",
        "text": {
          "ja": "今日はG7も加わる。C7、F7、G7の3つじゃ。",
          "en": "G7 joins the mix today—C7, F7, and G7."
        }
      },
      {
        "atSeconds": 8,
        "speaker": "fai",
        "text": {
          "ja": "譜面を読んで、風船を割ろう！",
          "en": "Read the staff and pop the balloons!"
        }
      },
      {
        "atSeconds": 14,
        "speaker": "jajii",
        "text": {
          "ja": "2分以内に15個。G7の響きも見分けるのじゃ。",
          "en": "Fifteen in two minutes. Tell G7 apart too."
        }
      }
    ]
  }'::jsonb,
  true
FROM public.balloon_rush_stages
WHERE slug = 'mq-b1-balloon-c7f7g7'
ON CONFLICT (stage_id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
