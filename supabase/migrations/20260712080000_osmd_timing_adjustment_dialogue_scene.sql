-- OSMD タイミング調整チュートリアル: 会話シーン追加 + finish CTA を不要に（1回操作で完了）
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    jsonb_set(
      script,
      '{scenes}',
      '[
        {
          "type": "chord_osmd",
          "contentRef": "osmd-timing-adjustment",
          "timedLines": [],
          "requiredLoops": 1
        },
        {
          "type": "dialogue_only",
          "lineIntervalSeconds": 4,
          "lines": [
            {
              "speaker": "partner",
              "ja": "タイミングの調整、できたかのう。",
              "en": "Looks like you have the timing dialed in."
            },
            {
              "speaker": "player",
              "ja": "うん、ずれる感じが減った！",
              "en": "Yeah — it feels less off now!"
            },
            {
              "speaker": "partner",
              "ja": "よし。これで本番でも合わせやすくなるぞ。",
              "en": "Good. That will help you lock in during real stages."
            }
          ]
        },
        { "type": "finish" }
      ]'::jsonb,
      true
    ),
    '{finish}',
    '{"showCta": false}'::jsonb,
    true
  ),
  updated_at = now()
WHERE id = 'osmd-timing-adjustment-v1';
