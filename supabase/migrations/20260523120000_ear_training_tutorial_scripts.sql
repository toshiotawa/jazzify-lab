-- ear_training_tutorial_scripts + lesson_songs + developer-full-v1 seed
BEGIN;

CREATE TABLE IF NOT EXISTS public.ear_training_tutorial_scripts (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_en text NOT NULL,
  script jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ear_training_tutorial_scripts IS '耳コピバトルチュートリアル台本 JSON';

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_ear_training_tutorial boolean NOT NULL DEFAULT false;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS ear_training_tutorial_script_id text NULL
  REFERENCES public.ear_training_tutorial_scripts (id) ON DELETE RESTRICT;

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_ear_training_tutorial_exclusive_check;
ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_ear_training_tutorial_exclusive_check
  CHECK (NOT (is_ear_training_tutorial AND is_ear_training));

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_survival_tutorial_ear_training_tutorial_exclusive_check;
ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_survival_tutorial_ear_training_tutorial_exclusive_check
  CHECK (NOT (is_survival_tutorial AND is_ear_training_tutorial));

COMMENT ON COLUMN public.lesson_songs.is_ear_training_tutorial IS '耳コピバトルチュートリアル課題（台本駆動・最後まで視聴でクリア）';
COMMENT ON COLUMN public.lesson_songs.ear_training_tutorial_script_id IS 'ear_training_tutorial_scripts.id';

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NOT NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NOT NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = true
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NOT NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = true
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NOT NULL
    )
  );

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script)
VALUES (
  'developer-full-v1',
  '耳コピチュートリアル（全分岐テスト）',
  'Ear training tutorial (full branch test)',
  '{
  "version": 1,
  "audioTracks": {
    "drum_loop": {
      "url": "https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3",
      "volume": 0.35
    }
  },
  "ui": {
    "hidePlayerHpBar": true,
    "hideSettingsButton": true,
    "hideBackButton": true,
    "hideLobby": true,
    "hideMidiToggle": true,
    "hidePhraseIntroQuota": true,
    "showExitButton": true,
    "playerInvincible": true,
    "disableEnemyAttacks": true,
    "keyboardHintsDefault": true
  },
  "content": {
    "quiz-pool": {
      "stage": {
        "slug": "tutorial-quiz-pool",
        "title": "チュートリアル・コードクイズ",
        "title_en": "Tutorial chord quiz",
        "bpm": 100,
        "key_fifths": 0,
        "beats_per_measure": 4,
        "beat_type": 4,
        "loop_measures": 2,
        "max_loops_per_phrase": 6,
        "count_in_beats": 0,
        "time_limit_sec": 180,
        "player_hp": 100,
        "enemy_hp": 10000,
        "miss_damage": 0,
        "fail_damage": 0,
        "background_theme": "blue_club",
        "mode": "chord_quiz",
        "quiz_duration_seconds": 300,
        "quiz_question_order": "random",
        "quiz_show_notation_in_battle": true,
        "quiz_required_correct_count": 99,
        "show_keyboard_hints_in_battle": true
      },
      "chord_quiz_items": [
        {
          "order_index": 0,
          "chord_name": "CM7",
          "voicing": [
            "C3",
            "E3",
            "G3",
            "B3"
          ],
          "voicing_staves": [
            2,
            2,
            2,
            2
          ]
        },
        {
          "order_index": 1,
          "chord_name": "Dm7",
          "voicing": [
            "D3",
            "F3",
            "A3",
            "C4"
          ],
          "voicing_staves": [
            2,
            2,
            2,
            1
          ]
        },
        {
          "order_index": 2,
          "chord_name": "G7",
          "voicing": [
            "G3",
            "B3",
            "D4",
            "F4"
          ],
          "voicing_staves": [
            2,
            2,
            1,
            1
          ]
        }
      ]
    },
    "self-paced-ii-vi": {
      "stage": {
        "slug": "tutorial-self-paced",
        "title": "チュートリアル・セルフペース",
        "title_en": "Tutorial self-paced",
        "bpm": 120,
        "key_fifths": 0,
        "beats_per_measure": 4,
        "beat_type": 4,
        "loop_measures": 4,
        "max_loops_per_phrase": 8,
        "count_in_beats": 0,
        "time_limit_sec": 300,
        "player_hp": 100,
        "enemy_hp": 10000,
        "per_correct_note_damage": 5,
        "good_completion_damage": 20,
        "miss_damage": 0,
        "fail_damage": 0,
        "background_theme": "blue_club",
        "mode": "chord_voicing",
        "chord_voicing_self_paced": true,
        "show_keyboard_hints_in_battle": true
      },
      "phrases": [
        {
          "order_index": 0,
          "title": "II-V-I",
          "loop_duration_sec": 8,
          "chords": [
            {
              "order_index": 0,
              "chord_name": "Dm7",
              "measure_number": 1,
              "beat_offset": 1,
              "duration_beats": 4,
              "start_time_sec": 0,
              "end_time_sec": 2,
              "voicing": [
                "D3",
                "F3",
                "A3",
                "C4"
              ],
              "voicing_staves": [
                2,
                2,
                2,
                1
              ]
            },
            {
              "order_index": 1,
              "chord_name": "G7",
              "measure_number": 2,
              "beat_offset": 1,
              "duration_beats": 4,
              "start_time_sec": 2,
              "end_time_sec": 4,
              "voicing": [
                "G3",
                "B3",
                "D4",
                "F4"
              ],
              "voicing_staves": [
                2,
                2,
                1,
                1
              ]
            },
            {
              "order_index": 2,
              "chord_name": "CM7",
              "measure_number": 3,
              "beat_offset": 1,
              "duration_beats": 4,
              "start_time_sec": 4,
              "end_time_sec": 8,
              "voicing": [
                "C3",
                "E3",
                "G3",
                "B3"
              ],
              "voicing_staves": [
                2,
                2,
                2,
                2
              ]
            }
          ]
        }
      ]
    },
    "osmd-lesson7": {
      "stage": {
        "slug": "tutorial-osmd-l7",
        "title": "チュートリアル・OSMD",
        "title_en": "Tutorial OSMD",
        "bpm": 120,
        "key_fifths": 0,
        "beats_per_measure": 4,
        "beat_type": 4,
        "loop_measures": 4,
        "max_loops_per_phrase": 4,
        "count_in_beats": 4,
        "time_limit_sec": 300,
        "player_hp": 100,
        "enemy_hp": 10000,
        "per_correct_note_damage": 10,
        "good_completion_damage": 30,
        "miss_damage": 0,
        "fail_damage": 0,
        "background_theme": "blue_club",
        "mode": "chord_osmd",
        "show_keyboard_hints_in_battle": true
      },
      "phrases": [
        {
          "order_index": 0,
          "title": "Finale 全音符",
          "music_xml_url": "https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-lesson7-whole.musicxml",
          "audio_url": "https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3",
          "loop_duration_sec": 8,
          "audio_duration_sec": 8,
          "note_count": 4,
          "chords": [
            {
              "order_index": 0,
              "chord_name": "Dm7",
              "measure_number": 1,
              "beat_offset": 1,
              "duration_beats": 4,
              "start_time_sec": 0,
              "end_time_sec": 2,
              "voicing": [
                "D4"
              ],
              "voicing_staves": [
                1
              ]
            },
            {
              "order_index": 1,
              "chord_name": "G7",
              "measure_number": 2,
              "beat_offset": 1,
              "duration_beats": 4,
              "start_time_sec": 2,
              "end_time_sec": 4,
              "voicing": [
                "G4"
              ],
              "voicing_staves": [
                1
              ]
            },
            {
              "order_index": 2,
              "chord_name": "CM7",
              "measure_number": 3,
              "beat_offset": 1,
              "duration_beats": 4,
              "start_time_sec": 4,
              "end_time_sec": 6,
              "voicing": [
                "C4"
              ],
              "voicing_staves": [
                1
              ]
            },
            {
              "order_index": 3,
              "chord_name": "A7",
              "measure_number": 4,
              "beat_offset": 1,
              "duration_beats": 4,
              "start_time_sec": 6,
              "end_time_sec": 8,
              "voicing": [
                "A4"
              ],
              "voicing_staves": [
                1
              ]
            }
          ]
        }
      ]
    }
  },
  "scenes": [
    {
      "type": "dialogue_only",
      "lines": [
        {
          "ja": "耳コピバトル・チュートリアルへようこそ。",
          "en": "Welcome to the ear training battle tutorial."
        },
        {
          "ja": "まずはセリフだけのシーンです。",
          "en": "This is a dialogue-only scene first."
        },
        {
          "ja": "ドラムループが流れています。",
          "en": "A drum loop is playing."
        }
      ],
      "lineIntervalSeconds": 4
    },
    {
      "type": "chord_quiz",
      "contentRef": "quiz-pool",
      "order": "progression",
      "questionCount": 2,
      "answerTimeoutSeconds": 8,
      "dialogue": {
        "onQuestion": {
          "ja": "順番に出題します。8秒以内に演奏！",
          "en": "Questions in order. Play within 8 seconds!"
        },
        "onCorrect": {
          "ja": "正解！",
          "en": "Correct!"
        },
        "onAutoAnswer": {
          "ja": "時間切れ…自動回答です。",
          "en": "Time up — auto answer."
        }
      }
    },
    {
      "type": "chord_quiz",
      "contentRef": "quiz-pool",
      "order": "random",
      "questionCount": 1,
      "answerTimeoutSeconds": 8,
      "dialogue": {
        "onQuestion": {
          "ja": "ランダム出題です。",
          "en": "Random question."
        },
        "onCorrect": {
          "ja": "ナイス！",
          "en": "Nice!"
        },
        "onAutoAnswer": {
          "ja": "自動回答で次へ。",
          "en": "Auto answer — moving on."
        }
      }
    },
    {
      "type": "chord_voicing_self_paced",
      "contentRef": "self-paced-ii-vi",
      "requiredSuccessfulLoops": 2,
      "dialogue": {
        "onSceneStart": {
          "ja": "セルフペース開始。II-V-I を演奏しよう。",
          "en": "Self-paced start. Play the II-V-I."
        },
        "onLoopSuccess": {
          "ja": "1 ループ成功！",
          "en": "One loop cleared!"
        },
        "timedLines": [
          {
            "afterLoopStartSeconds": 3,
            "text": {
              "ja": "途中セリフ：ドラムに合わせて。",
              "en": "Mid-loop tip: stay with the drums."
            }
          }
        ]
      }
    },
    {
      "type": "chord_osmd",
      "contentRef": "osmd-lesson7",
      "playMode": "demo",
      "requiredLoops": 2,
      "timedLines": [
        {
          "phase": "count_in",
          "loop": 0,
          "beat": 2,
          "text": {
            "ja": "デモ：カウントイン中のセリフ。",
            "en": "Demo: dialogue during count-in."
          }
        },
        {
          "at": {
            "loop": 0,
            "measure": 1,
            "beat": 1
          },
          "text": {
            "ja": "デモ：1 小節目。",
            "en": "Demo: measure 1."
          }
        },
        {
          "at": {
            "loop": 0,
            "measure": 3,
            "beat": 1
          },
          "text": {
            "ja": "デモ：3 小節目。",
            "en": "Demo: measure 3."
          }
        }
      ]
    },
    {
      "type": "chord_osmd",
      "contentRef": "osmd-lesson7",
      "playMode": "self",
      "requiredLoops": 1,
      "timedLines": [
        {
          "phase": "count_in",
          "loop": 0,
          "beat": 1,
          "text": {
            "ja": "セルフ：カウントイン。",
            "en": "Self: count-in."
          }
        },
        {
          "at": {
            "loop": 0,
            "measure": 2,
            "beat": 1
          },
          "text": {
            "ja": "セルフ：2 小節目で演奏。",
            "en": "Self: play at measure 2."
          }
        }
      ]
    },
    {
      "type": "dialogue_only",
      "lines": [
        {
          "ja": "お疲れさま。最後まで見るとクリアです。",
          "en": "Well done. Finish to clear the lesson."
        }
      ],
      "lineIntervalSeconds": 4
    },
    {
      "type": "finish"
    }
  ],
  "finish": {
    "showCta": true
  }
}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  '耳コピバトルチュートリアル（全分岐）',
  'Ear training battle tutorial (all branches)',
  'セリフのみ・コードクイズ・セルフペース・OSMD の全シーンを体験する開発用チュートリアルです。',
  'Developer tutorial covering dialogue, chord quiz, self-paced, and OSMD scenes.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons
   WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en;

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_ear_training_tutorial,
  ear_training_tutorial_script_id,
  clear_conditions,
  order_index,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-full-v1',
  '{"count": 1, "rank": "S"}'::jsonb,
  0,
  '耳コピバトルチュートリアル',
  'Ear training tutorial'
)
ON CONFLICT (id) DO UPDATE SET
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
