-- Training: left-hand and two-hand voicing chord progressions
BEGIN;

INSERT INTO public.training_categories (
  id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_free
) VALUES
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh_voicing_progression',
    '左手ヴォイシング・コード進行',
    'Left-Hand Voicing Progressions',
    'サバイバルで使う最適配置の左手ヴォイシングで、II-V-I・Blues・スタンダードのコード進行を演奏します。In C固定（移調楽器の影響なし）。',
    'Play II-V-I, blues, and standard progressions with optimal left-hand voicings from Survival mode. Concert pitch (unaffected by transposing instruments).',
    13,
    false
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-two_hand_voicing_progression'),
    'two_hand_voicing_progression',
    '両手ヴォイシング・コード進行',
    'Two-Hand Voicing Progressions',
    'Drop2 II-V-I の A-B-A / B-A-B フォームを全キーで練習します。基準キーを最低音域とし、正しい調号で移調します。',
    'Practice Drop2 II-V-I in A-B-A and B-A-B forms across all keys, transposed from the lowest reference key with correct key signatures.',
    14,
    false
  )
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  updated_at = now();

-- Minor II-V-I: parallel-major key_fifths → minor key_fifths; Gb/Cb unit → C# minor enharmonic
CREATE OR REPLACE FUNCTION public.training_minor_ii_v_i_progression()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH elems AS (
    SELECT elem, ord::integer AS ord
    FROM public.survival_stages AS ss
    CROSS JOIN LATERAL jsonb_array_elements(ss.chord_progression) WITH ORDINALITY AS t(elem, ord)
    WHERE ss.map_category = 'songs' AND ss.stage_number = 42
  ),
  mapped AS (
    SELECT
      ord,
      CASE
        WHEN ord BETWEEN 19 AND 21 THEN
          CASE ord
            WHEN 19 THEN elem || jsonb_build_object(
              'name', 'D#m7(b5)',
              'voicing_names', '["F#3","G#3","B3","D#4"]'::jsonb,
              'key_fifths', 4
            )
            WHEN 20 THEN elem || jsonb_build_object(
              'name', 'G#7(b9.b13)',
              'voicing_names', '["F#3","A#3","B3","D#4"]'::jsonb,
              'key_fifths', 4
            )
            WHEN 21 THEN elem || jsonb_build_object(
              'name', 'C#m6(9)',
              'voicing_names', '["E3","G#3","A3","C#4"]'::jsonb,
              'key_fifths', 4
            )
            ELSE elem
          END
        ELSE
          elem || jsonb_build_object(
            'key_fifths',
            CASE
              WHEN (elem->>'key_fifths')::integer = -5 THEN -5
              WHEN (elem->>'key_fifths')::integer - 3 >= -7 THEN (elem->>'key_fifths')::integer - 3
              ELSE (elem->>'key_fifths')::integer - 3
            END
          )
      END AS elem
    FROM elems
  )
  SELECT jsonb_agg(elem ORDER BY ord)
  FROM mapped;
$$;

INSERT INTO public.trainings (
  id, category_id, slug, title_ja, title_en, sort_order, kind,
  clef_mode, use_key_signature, play_root_on_correct, bgm_url, config, is_active
) VALUES
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-ii-v-i-all-key'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-ii-v-i-all-key',
    'II-V-I in All Key',
    'II-V-I in All Keys',
    1,
    'progression',
    'bass_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (
      SELECT jsonb_build_object(
        'progression', ss.chord_progression,
        'unit_size', 3,
        'shuffle_units', true
      )
      FROM public.survival_stages AS ss
      WHERE ss.map_category = 'songs' AND ss.stage_number = 4
    ),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-ii-v-alt-i-all-key'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-ii-v-alt-i-all-key',
    'II-V(alt)-I in All Key',
    'II-V(alt)-I in All Keys',
    2,
    'progression',
    'bass_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (
      SELECT jsonb_build_object(
        'progression', ss.chord_progression,
        'unit_size', 3,
        'shuffle_units', true
      )
      FROM public.survival_stages AS ss
      WHERE ss.map_category = 'songs' AND ss.stage_number = 34
    ),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-minor-ii-v-i-all-key'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-minor-ii-v-i-all-key',
    'Minor II-V-I in All Key',
    'Minor II-V-I in All Keys',
    3,
    'progression',
    'bass_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    jsonb_build_object(
      'progression', public.training_minor_ii_v_i_progression(),
      'unit_size', 3,
      'shuffle_units', true
    ),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-f-blues'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-f-blues',
    'F Blues',
    'F Blues',
    4,
    'progression',
    'bass_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (
      SELECT jsonb_build_object(
        'progression', ss.chord_progression,
        'shuffle_units', false
      )
      FROM public.survival_stages AS ss
      WHERE ss.map_category = 'songs' AND ss.stage_number = 6
    ),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-bb-blues'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-bb-blues',
    'Bb Blues',
    'Bb Blues',
    5,
    'progression',
    'bass_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (
      SELECT jsonb_build_object(
        'progression', ss.chord_progression,
        'shuffle_units', false
      )
      FROM public.survival_stages AS ss
      WHERE ss.map_category = 'songs' AND ss.stage_number = 7
    ),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-leaves'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-leaves', 'Leaves', 'Leaves', 6, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=10),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-moon'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-moon', 'Moon', 'Moon', 7, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=11),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-part-of-me'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-part-of-me', 'Part of Me', 'Part of Me', 8, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=12),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-my-eyes'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-my-eyes', 'My Eyes', 'My Eyes', 9, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=13),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-roses'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-roses', 'Roses', 'Roses', 10, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=14),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-wonder'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-wonder', 'Wonder', 'Wonder', 11, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=16),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-things'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-things', 'Things', 'Things', 12, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=17),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-together'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-together', 'Together', 'Together', 13, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=18),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-bea'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-bea', 'Bea', 'Bea', 14, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=19),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-love'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-love', 'Love', 'Love', 15, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=20),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-bossa'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-bossa', 'Bossa', 'Bossa', 16, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=21),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-sette'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-sette', 'Sette', 'Sette', 17, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=23),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-not-mine'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-not-mine', 'Not Mine', 'Not Mine', 18, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=24),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-bird'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-bird', 'Bird', 'Bird', 19, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=25),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-candy'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-candy', 'Candy', 'Candy', 20, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=26),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-rain-shine'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-rain-shine', 'Rain Shine', 'Rain Shine', 21, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=27),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-confirm'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-confirm', 'Confirm', 'Confirm', 22, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=28),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-lh-standard-donna'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-lh_voicing_progression'),
    'lh-standard-donna', 'Donna', 'Donna', 23, 'progression', 'bass_concert', true, true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    (SELECT jsonb_build_object('progression', ss.chord_progression, 'shuffle_units', false) FROM public.survival_stages ss WHERE ss.map_category='songs' AND ss.stage_number=29),
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-two-hand-ii-v-i-aba'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-two_hand_voicing_progression'),
    'two-hand-ii-v-i-aba',
    'II-V-I in All Key(A-B-A Form)',
    'II-V-I in All Keys (A-B-A Form)',
    1,
    'progression',
    'grand_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{
      "reference_key": "F",
      "voicing_form": "aba",
      "shuffle_units": true,
      "staves": [2, 1, 1, 1],
      "reference_chords": [
        {"name": "Gm7(9)", "notes": ["F3", "Bb3", "D4", "A4"]},
        {"name": "C7(9.13)", "notes": ["E3", "Bb3", "D4", "A4"]},
        {"name": "FM7(9)", "notes": ["E3", "A3", "C4", "G4"]}
      ]
    }'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-two-hand-ii-v-i-bab'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-two_hand_voicing_progression'),
    'two-hand-ii-v-i-bab',
    'II-V-I in All Key(B-A-B Form)',
    'II-V-I in All Keys (B-A-B Form)',
    2,
    'progression',
    'grand_concert',
    true,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{
      "reference_key": "Bb",
      "voicing_form": "bab",
      "shuffle_units": true,
      "staves": [2, 1, 1, 1],
      "reference_chords": [
        {"name": "Cm7(9)", "notes": ["Eb3", "Bb3", "D4", "G4"]},
        {"name": "F7(9.13)", "notes": ["Eb3", "A3", "D4", "G4"]},
        {"name": "BbM7(9)", "notes": ["D3", "A3", "C4", "F4"]}
      ]
    }'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  clef_mode = EXCLUDED.clef_mode,
  use_key_signature = EXCLUDED.use_key_signature,
  play_root_on_correct = EXCLUDED.play_root_on_correct,
  bgm_url = EXCLUDED.bgm_url,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.training_goal_sets (
  id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_active,
  target_instrument, target_level
) VALUES
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-lh_voicing_progression'),
    'goal-lh_voicing_progression',
    '左手ヴォイシング・コード進行をマスターしよう',
    'Master left-hand voicing progressions',
    'サバイバルで使う最適配置の左手ヴォイシングで、II-V-I・Blues・スタンダードのコード進行を演奏します。In C固定（移調楽器の影響なし）。',
    'Play II-V-I, blues, and standard progressions with optimal left-hand voicings from Survival mode. Concert pitch (unaffected by transposing instruments).',
    13,
    true,
    'piano',
    'advanced'
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-two_hand_voicing_progression'),
    'goal-two_hand_voicing_progression',
    '両手ヴォイシング・コード進行をマスターしよう',
    'Master two-hand voicing progressions',
    'Drop2 II-V-I の A-B-A / B-A-B フォームを全キーで練習します。基準キーを最低音域とし、正しい調号で移調します。',
    'Practice Drop2 II-V-I in A-B-A and B-A-B forms across all keys, transposed from the lowest reference key with correct key signatures.',
    14,
    true,
    'piano',
    'advanced'
  )
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  target_instrument = EXCLUDED.target_instrument,
  target_level = EXCLUDED.target_level,
  updated_at = now();

INSERT INTO public.training_goal_set_items (goal_set_id, training_id, target_rank, sort_order)
SELECT
  gs.id,
  t.id,
  'C',
  t.sort_order
FROM public.training_goal_sets AS gs
JOIN public.trainings AS t ON t.category_id = (
  SELECT tc.id FROM public.training_categories AS tc
  WHERE tc.slug = replace(gs.slug, 'goal-', '')
)
WHERE gs.slug IN ('goal-lh_voicing_progression', 'goal-two_hand_voicing_progression')
  AND t.is_active IS NOT FALSE
ON CONFLICT (goal_set_id, training_id) DO UPDATE SET
  target_rank = EXCLUDED.target_rank,
  sort_order = EXCLUDED.sort_order;

DROP FUNCTION public.training_minor_ii_v_i_progression();

COMMIT;
