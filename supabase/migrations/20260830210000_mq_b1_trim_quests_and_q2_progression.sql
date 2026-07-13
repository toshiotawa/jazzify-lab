-- MQ Block1: 1-2 / 2-2 / 2-3 削除、2-1 を6問プログレッション化、1-1 締めセリフ調整、関連クリア消去
BEGIN;

-- ---------------------------------------------------------------------------
-- クリアデータ消去（削除課題 + 内容変更した 2-1 + クエスト2完了）
-- ---------------------------------------------------------------------------
DELETE FROM public.user_lesson_requirements_progress
WHERE lesson_song_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-1-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-2-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-3-lsong')
);

UPDATE public.user_lesson_progress
SET
  completed = false,
  completion_date = NULL,
  updated_at = now()
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson')
  AND completed = true;

-- ---------------------------------------------------------------------------
-- 1-2 / 2-2 / 2-3 課題削除
-- ---------------------------------------------------------------------------
DELETE FROM public.lesson_songs
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-2-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-2-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-3-lsong')
);

-- ---------------------------------------------------------------------------
-- クエスト説明文
-- ---------------------------------------------------------------------------
UPDATE public.lessons
SET
  description = 'Cブルース入門。ドとソだけで聴いて返す。',
  description_en = 'C blues intro. Hear and answer with Do and Sol.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson');

UPDATE public.lessons
SET
  description = 'C7/F7/G7の2音コードを覚える。',
  description_en = 'Learn two-note C7/F7/G7 chords.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson');

-- ---------------------------------------------------------------------------
-- 1-1 締めセリフ: アドリブ誘導 → 2音コードへ
-- ---------------------------------------------------------------------------
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{scenes,6,lines}',
    $lines$[
      {"speaker":"partner","ja":"よし。ドとソで返事ができたのう。","en":"Good. You answered with Do and Sol."},
      {"speaker":"player","ja":"タイミング調整のおかげだね！ちょっと音で会話してる感じがした！","en":"The timing adjustment really helped — it felt like talking with sound!"},
      {"speaker":"partner","ja":"次は、コードの響きを覚える番じゃ。","en":"Next, we learn chord colors."},
      {"speaker":"player","ja":"コードって、たくさんの音？","en":"Chords — lots of notes?"},
      {"speaker":"partner","ja":"いや、まずは2音だけでよい。C7、F7、G7じゃ。","en":"No — two notes are enough. C7, F7, and G7."},
      {"speaker":"player","ja":"次は、2音コードに挑戦しよう。","en":"Next up: two-note chords."}
    ]$lines$::jsonb
  ),
  updated_at = now()
WHERE id = 'osmd-timing-adjustment-v1';

-- ---------------------------------------------------------------------------
-- 2-1: random 3問 → progression 6問（残り問題数セリフあり）
-- ---------------------------------------------------------------------------
UPDATE public.survival_tutorial_scripts
SET
  script = $script${
    "version": 3,
    "audioTracks": {
      "drum_loop": {
        "url": "https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3",
        "volume": 0.5
      }
    },
    "ui": {
      "hideBackButton": true,
      "hideMidiToggle": true,
      "showExitButton": true,
      "hidePlayerHpBar": true,
      "playerInvincible": true,
      "hideSettingsButton": true,
      "disableEnemyAttacks": true,
      "keyboardHintsDefault": true
    },
    "finish": { "showCta": true },
    "scenes": [
      {
        "type": "dialogue_only",
        "lines": [
          {"en": "Ad-lib needs a harmonic foundation.", "ja": "アドリブには、土台となる響きがある。", "speaker": "jajii"},
          {"en": "You mean chords?", "ja": "それがコード？", "speaker": "fai"},
          {"en": "Aye. Today we use C7, F7, and G7.", "ja": "そうじゃ。今日はC7、F7、G7を使う。", "speaker": "jajii"},
          {"en": "Do I play every note?", "ja": "全部の音を弾くの？", "speaker": "fai"},
          {"en": "No — two notes are enough. They still show the chord color.", "ja": "いや、まずは2音だけでよい。2音でもコードの性格は出る。", "speaker": "jajii"},
          {"en": "So we build the sound with fewer notes.", "ja": "少ない音で、響きを作るんだな。", "speaker": "fai"},
          {"en": "Let's learn the two-note C7, F7, and G7 shapes.", "ja": "C7、F7、G7の2音コードを覚えよう。", "speaker": "fai"}
        ],
        "lineIntervalSeconds": 4
      },
      {
        "type": "progression_battle",
        "dialogue": {
          "intro": {
            "en": "Learn the two-note C7, F7, and G7 shapes.",
            "ja": "C7、F7、G7の2音を覚えるのじゃ。"
          },
          "onReveal": {
            "en": "Play this sound!",
            "ja": "この響きを演奏！"
          },
          "onCorrectRemaining": {
            "en": "OK, {{remaining}} left.",
            "ja": "OK、あと{{remaining}}問。"
          }
        },
        "loopCount": 6,
        "contentRef": "mq-b1-q2-prog",
        "introDelaySeconds": 3
      },
      {
        "type": "dialogue_only",
        "lines": [
          {"en": "Good. You can hear the chord colors now.", "ja": "よし。コードの響きが見えてきたのう。", "speaker": "jajii"},
          {"en": "Two notes still feel pretty jazzy.", "ja": "2音だけでも、けっこう雰囲気出るね。", "speaker": "fai"},
          {"en": "Next, watch the C blues chord flow from start to finish.", "ja": "次は、Cブルースの流れを通して見るのじゃ。", "speaker": "jajii"},
          {"en": "On to the C blues chord progression.", "ja": "Cブルースのコード進行に進もう。", "speaker": "fai"}
        ],
        "lineIntervalSeconds": 4
      },
      { "type": "finish" }
    ],
    "content": {
      "mq-b1-q2-prog": {
        "stage": {
          "name": "2音コード",
          "nameEn": "Two-note chords",
          "stageType": "progression",
          "lessonOnly": true,
          "mapCategory": "lesson",
          "chordDisplayName": "C7 / F7 / G7",
          "chordDisplayNameEn": "C7 / F7 / G7"
        },
        "chordProgression": [
          {"name": "C7", "voicing": [64, 70], "keyFifths": 0, "voicingNames": ["E4", "B♭4"], "voicing_staves": [1, 1]},
          {"name": "F7", "voicing": [63, 69], "keyFifths": 0, "voicingNames": ["E♭4", "A4"], "voicing_staves": [1, 1]},
          {"name": "G7", "voicing": [65, 71], "keyFifths": 0, "voicingNames": ["F4", "B4"], "voicing_staves": [1, 1]},
          {"name": "C7", "voicing": [64, 70], "keyFifths": 0, "voicingNames": ["E4", "B♭4"], "voicing_staves": [1, 1]},
          {"name": "F7", "voicing": [63, 69], "keyFifths": 0, "voicingNames": ["E♭4", "A4"], "voicing_staves": [1, 1]},
          {"name": "G7", "voicing": [65, 71], "keyFifths": 0, "voicingNames": ["F4", "B4"], "voicing_staves": [1, 1]}
        ]
      }
    },
    "scenarioOverrides": {
      "hideStaff": false,
      "hideStaffOnBSlotCompletion": false
    }
  }$script$::jsonb,
  updated_at = now()
WHERE id = 'mq-b1-q2-survival-v1';

COMMIT;
