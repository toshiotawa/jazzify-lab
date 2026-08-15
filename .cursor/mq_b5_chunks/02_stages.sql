DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage'),
  'mq-b5-6-1-2-osmd',
  'Fブルース入門（2音）',
  'F blues intro (2 notes)',
  'Fブルースでコール＆レスポンス。',
  'Call and response on the F blues.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 38,
  1, 0, 0, 0,
  9, 14, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-1-2-stage'),
  0,
  'Fブルース入門（2音）',
  'F blues intro (2 notes)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-1-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-1-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage'),
  'mq-b5-6-2-6-osmd',
  '2音・頭拍パターン',
  'Two-note head-beat pattern',
  'F7〜C7の2音コードを頭拍で。',
  'Two-note chords on beat one.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 56,
  1, 0, 0, 0,
  6, 9, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage'),
  0,
  '2音・頭拍パターン',
  'Two-note head-beat pattern',
  'https://jazzify-cdn.com/sozai/mq-b5-6-2-6.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-karaoke.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage'),
  'mq-b5-6-3-6-osmd',
  '3音・頭拍パターン',
  'Three-note head-beat pattern',
  '3音ヴォイシングで頭拍を支える。',
  'Support beat one with three-note voicings.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 84,
  1, 0, 0, 0,
  4, 6, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-3-6-stage'),
  0,
  '3音・頭拍パターン',
  'Three-note head-beat pattern',
  'https://jazzify-cdn.com/sozai/mq-b5-6-3-6.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-karaoke.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage'),
  'mq-b5-6-4-2-osmd',
  'パターン2（3音・頭拍）',
  'Pattern 2 (3-note head beat)',
  '6-3-6 と同じ譜面・音源。',
  'Same score and audio as 6-3-6.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 84,
  1, 0, 0, 0,
  4, 6, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-2-stage'),
  0,
  'パターン2（3音・頭拍）',
  'Pattern 2 (3-note head beat)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-3-6.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-karaoke.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage'),
  'mq-b5-6-4-3-osmd',
  'パターン3',
  'Pattern 3',
  '4つのリズムパターンの3つ目。',
  'Third of four rhythm patterns.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 147,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage'),
  0,
  'パターン3',
  'Pattern 3',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-3.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-3.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage'),
  'mq-b5-6-4-4-osmd',
  'パターン4',
  'Pattern 4',
  '4つのリズムパターンの4つ目。',
  'Fourth of four rhythm patterns.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 144,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-4-stage'),
  0,
  'パターン4',
  'Pattern 4',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-4.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-4.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage'),
  'mq-b5-6-4-5-osmd',
  'パターン5',
  'Pattern 5',
  '4つのリズムパターンの5つ目。',
  'Fifth rhythm pattern.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 148,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-5-stage'),
  0,
  'パターン5',
  'Pattern 5',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-5.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-5.mp3?v=202608121000',
  60.048,
  60.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage'),
  'mq-b5-6-4-6-osmd',
  'パターン6（まとめ）',
  'Pattern 6 (summary)',
  '4パターンのまとめ（クリア必須ではない）。',
  'Summary of four patterns (optional clear).',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 185,
  1, 0, 0, 0,
  2, 3, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage'),
  0,
  'パターン6（まとめ）',
  'Pattern 6 (summary)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-6-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-4-3.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage'),
  'mq-b5-6-5-2-osmd',
  'アドリブ2（2音）',
  'Ad-lib 2 (2 notes)',
  '2音コードでアドリブに挑戦。',
  'Ad-lib with two-note voicings.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 43,
  1, 0, 0, 0,
  8, 12, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-2-stage'),
  0,
  'アドリブ2（2音）',
  'Ad-lib 2 (2 notes)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage'),
  'mq-b5-6-5-3-osmd',
  'アドリブ3（2音）',
  'Ad-lib 3 (2 notes)',
  '聴いて返すアドリブ。',
  'Listen-and-answer ad-lib.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 43,
  1, 0, 0, 0,
  8, 12, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-3-stage'),
  0,
  'アドリブ3（2音）',
  'Ad-lib 3 (2 notes)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-3-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-3.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage'),
  'mq-b5-6-5-4-osmd',
  'アドリブ4（まとめ）',
  'Ad-lib 4 (summary)',
  'F・Ab・Bb / C・Eb・F の組み合わせ。',
  'Combine F Ab Bb and C Eb F.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 64,
  1, 0, 0, 0,
  5, 8, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-5-4-stage'),
  0,
  'アドリブ4（まとめ）',
  'Ad-lib 4 (summary)',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-4-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-5-4.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage'),
  'mq-b5-6-6-2-osmd',
  'ペンタトニック実戦',
  'Pentatonic in action',
  '80BPMスウィングでペンタトニック。',
  'Pentatonic at 80 BPM swing.',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 64,
  1, 0, 0, 0,
  5, 8, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-6-2-stage'),
  0,
  'ペンタトニック実戦',
  'Pentatonic in action',
  'https://jazzify-cdn.com/sozai/mq-b5-6-6-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-6-2.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage'),
  'mq-b5-6-7-2-osmd',
  'ブルーノート・スケール',
  'Blue-note scale',
  'ブルーノートを使ったフレーズ。',
  'Phrases using blue notes.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 76,
  1, 0, 0, 0,
  4, 6, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-2-stage'),
  0,
  'ブルーノート・スケール',
  'Blue-note scale',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2-guide-voice4-cue.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage'),
  'mq-b5-6-7-3-precision',
  'ブルーノート・精密',
  'Blue notes · Precision',
  '7-2 の精密モード。',
  'Precision version of 7-2.',
  100, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-7-3-stage'),
  0,
  'ブルーノート・精密',
  'Blue notes · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-7-2.mp3?v=202608121000',
  60,
  60,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage'),
  'mq-b5-6-8-2-precision',
  'フレーズ1・精密',
  'Phrase 1 · Precision',
  '精密モード（クリア必須ではない）。',
  'Precision mode (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-2-stage'),
  0,
  'フレーズ1・精密',
  'Phrase 1 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-2-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-2.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage'),
  'mq-b5-6-8-3-precision',
  'フレーズ2・精密',
  'Phrase 2 · Precision',
  '精密モード（クリア必須ではない）。',
  'Precision mode (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-3-stage'),
  0,
  'フレーズ2・精密',
  'Phrase 2 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-3-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-3.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage'),
  'mq-b5-6-8-4-precision',
  'フレーズ3・精密',
  'Phrase 3 · Precision',
  '精密モード（クリア必須ではない）。',
  'Precision mode (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-8-4-stage'),
  0,
  'フレーズ3・精密',
  'Phrase 3 · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-4-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-8-4.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);

DELETE FROM public.ear_training_phrases WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage'),
  'mq-b5-6-10-2-precision',
  'Fブルース総仕上げ・精密',
  'F blues finale · Precision',
  '章の総仕上げ（クリア必須ではない）。',
  'Chapter finale (optional clear).',
  80, -1, 4, 4, 25, 2,
  0, 600, 100, 1,
  0, 0, 0, 0,
  0, 0, 4, 8,
  'blue_club', true, false, 'chord_precision',
  false, true, true,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-10-2-stage'),
  0,
  'Fブルース総仕上げ・精密',
  'F blues finale · Precision',
  'https://jazzify-cdn.com/sozai/mq-b5-6-10-2-precision.musicxml?v=202608121000',
  'https://jazzify-cdn.com/sozai/mq-b5-6-10-2.mp3?v=202608121000',
  75.048,
  75.048,
  0,
  -1
);


INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, run_map_id, run_time_limit_sec, run_dialogue_script
) VALUES (
  'lesson', 1301, 'random', 'code_run',
  'MQ Ch6: Fブルース コードラン（2音）', 'MQ Ch6: F blues Code Run (2v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'always', 'always', 'tutorial_3', 120, '{"lines":[{"atSeconds":2,"speaker":"fai","text":"Fブルースのコードを弾きながら進む！","textEn":"Play F blues chords and run!"},{"atSeconds":8,"speaker":"jajii","text":"2音でも形を覚えれば、自然にヴォイシングが身につく。","textEn":"Two-note shapes build voicing naturally."},{"atSeconds":16,"speaker":"jajii","text":"右端の旗まで進むんじゃ。","textEn":"Head for the flag on the right."}]}'::jsonb
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1302, 'random', 'survival',
  'MQ Ch6: Fブルース サバイバル（2音）', 'MQ Ch6: F blues Survival (2v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, run_map_id, run_time_limit_sec, run_dialogue_script
) VALUES (
  'lesson', 1311, 'random', 'code_run',
  'MQ Ch6: Fブルース コードラン（3音）', 'MQ Ch6: F blues Code Run (3v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'always', 'always', 'tutorial_3', 120, '{"lines":[{"atSeconds":2,"speaker":"fai","text":"Fブルースのコードを弾きながら進む！","textEn":"Play F blues chords and run!"},{"atSeconds":8,"speaker":"jajii","text":"2音でも形を覚えれば、自然にヴォイシングが身につく。","textEn":"Two-note shapes build voicing naturally."},{"atSeconds":16,"speaker":"jajii","text":"右端の旗まで進むんじゃ。","textEn":"Head for the flag on the right."}]}'::jsonb
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'lesson', 1312, 'random', 'survival',
  'MQ Ch6: Fブルース サバイバル（3音）', 'MQ Ch6: F blues Survival (3v)', 'easy',
  '7', 'F7 / Bb7 / D7 / Gm7 / C7', 'F7 / Bb7 / D7 / Gm7 / C7',
  NULL, NULL, NULL,
  'mq-b5-ch6', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();


INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-balloon-2v'),
  'mq-b5-balloon-2v',
  'MQ Ch6: Fブルース 風船（2音）',
  'MQ Ch6: F blues balloon (2v)',
  'F7/Bb7/D7/Gm7/C7をランダム出題。90秒以内に20個。',
  'Random F7/Bb7/D7/Gm7/C7. Pop 20 balloons within 90 seconds.',
  'random', '7', NULL,
  '["F7","Bb7","D7","Gm7","C7"]'::jsonb,
  NULL,
  90, 20, 10, 5, 3,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', -1, true, true,
  'fade_15s', 'fade_15s', false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  allowed_chords = EXCLUDED.allowed_chords,
  bgm_url = EXCLUDED.bgm_url,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-balloon-3v'),
  'mq-b5-balloon-3v',
  'MQ Ch6: Fブルース 風船（3音）',
  'MQ Ch6: F blues balloon (3v)',
  'F7/Bb7/D7/Gm7/C7をランダム出題。90秒以内に20個。',
  'Random F7/Bb7/D7/Gm7/C7. Pop 20 balloons within 90 seconds.',
  'random', '7', NULL,
  '["F7","Bb7","D7","Gm7","C7"]'::jsonb,
  NULL,
  90, 20, 10, 5, 3,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', -1, true, true,
  'fade_15s', 'fade_15s', false
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  allowed_chords = EXCLUDED.allowed_chords,
  bgm_url = EXCLUDED.bgm_url,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();


DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  'mq-b5-quiz-2v',
  'MQ Ch6: Fブルース クイズ（2音）',
  'MQ Ch6: F blues quiz (2v)',
  '40秒以内に20問正解。Fブルースの2音ヴォイシング。',
  'Answer 20 questions within 40 seconds using 2-note F blues voicings.',
  100, -1, 4, 4, 5, 6,
  0, 40, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  40, 'random', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  0, 1, 1, 4,
  'F7',
  ARRAY['Eb3', 'A3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  1, 2, 1, 4,
  'Bb7',
  ARRAY['D3', 'Ab3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  2, 3, 1, 4,
  'D7',
  ARRAY['Gb3', 'C4']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  3, 4, 1, 4,
  'Gm7',
  ARRAY['F3', 'Bb3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-2v-stage'),
  4, 5, 1, 4,
  'C7',
  ARRAY['E3', 'Bb3']::text[],
  ARRAY[2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  'mq-b5-quiz-3v',
  'MQ Ch6: Fブルース クイズ（3音）',
  'MQ Ch6: F blues quiz (3v)',
  '40秒以内に20問正解。Fブルースの3音ヴォイシング。',
  'Answer 20 questions within 40 seconds using 3-note F blues voicings.',
  100, -1, 4, 4, 5, 6,
  0, 40, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  40, 'random', true, false, 20, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  0, 1, 1, 4,
  'F7',
  ARRAY['Eb3', 'A3', 'D4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  1, 2, 1, 4,
  'Bb7',
  ARRAY['D3', 'Ab3', 'C4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  2, 3, 1, 4,
  'D7',
  ARRAY['Gb3', 'C4', 'Eb4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  3, 4, 1, 4,
  'Gm7',
  ARRAY['F3', 'Bb3', 'D4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-item-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-quiz-3v-stage'),
  4, 5, 1, 4,
  'C7',
  ARRAY['E3', 'Bb3', 'D4']::text[],
  ARRAY[2, 2, 2]::smallint[],
  -1
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();


DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 501 AND 505
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 501 AND 505
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 501 AND 505;


INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 501, 'progression',
  'MQ Ch6 フレーズ I', 'MQ Ch6 Phrase I', 'easy',
  '', 'F7', 'F7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 502, 'progression',
  'MQ Ch6 フレーズ II', 'MQ Ch6 Phrase II', 'easy',
  '', 'Bb7', 'Bb7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 503, 'progression',
  'MQ Ch6 フレーズ III', 'MQ Ch6 Phrase III', 'easy',
  '', 'F7', 'F7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 504, 'progression',
  'MQ Ch6 フレーズ IV', 'MQ Ch6 Phrase IV', 'easy',
  '', 'Gm7', 'Gm7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'phrases', 505, 'progression',
  'MQ Ch6 フレーズ V', 'MQ Ch6 Phrase V', 'easy',
  '', 'C7', 'C7',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 501,
  'MQ Ch6 Phrase I',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-1-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 502,
  'MQ Ch6 Phrase II',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-2-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 503,
  'MQ Ch6 Phrase III',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-3-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 504,
  'MQ Ch6 Phrase IV',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-4-loop.mp3?v=202608121000',
  -1
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases', 505,
  'MQ Ch6 Phrase V',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-5-loop.mp3?v=202608121000',
  -1
);
DO $$
DECLARE
  v_phrase_501 uuid;
  v_phrase_502 uuid;
  v_phrase_503 uuid;
  v_phrase_504 uuid;
  v_phrase_505 uuid;
  v_chord_501 uuid;
  v_chord_502 uuid;
  v_chord_503 uuid;
  v_chord_504 uuid;
  v_chord_505 uuid;
BEGIN
  SELECT id INTO v_phrase_501 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 501;
  SELECT id INTO v_phrase_502 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 502;
  SELECT id INTO v_phrase_503 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 503;
  SELECT id INTO v_phrase_504 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 504;
  SELECT id INTO v_phrase_505 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 505;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_501, 0, 'F7', 1)
  RETURNING id INTO v_chord_501;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_501, 0, 71, 11, 'B4', 2, 0),
    (v_chord_501, 1, 72, 0, 'C5', 2, 1),
    (v_chord_501, 2, 77, 5, 'F5', 2, 2),
    (v_chord_501, 3, 75, 3, 'Eb5', 2, 3),
    (v_chord_501, 4, 72, 0, 'C5', 2, 4),
    (v_chord_501, 5, 71, 11, 'B4', 2, 5),
    (v_chord_501, 6, 70, 10, 'Bb4', 2, 6),
    (v_chord_501, 7, 68, 8, 'Ab4', 2, 7),
    (v_chord_501, 8, 65, 5, 'F4', 2, 8);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_502, 0, 'Bb7', 1)
  RETURNING id INTO v_chord_502;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_502, 0, 68, 8, 'Ab4', 2, 0),
    (v_chord_502, 1, 74, 2, 'D5', 2, 0),
    (v_chord_502, 2, 70, 10, 'Bb4', 2, 1),
    (v_chord_502, 3, 68, 8, 'Ab4', 2, 2),
    (v_chord_502, 4, 65, 5, 'F4', 2, 3),
    (v_chord_502, 5, 68, 8, 'Ab4', 2, 4),
    (v_chord_502, 6, 74, 2, 'D5', 2, 4);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_503, 0, 'F7', 1)
  RETURNING id INTO v_chord_503;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_503, 0, 65, 5, 'F4', 2, 0),
    (v_chord_503, 1, 70, 10, 'Bb4', 2, 1),
    (v_chord_503, 2, 74, 2, 'D5', 2, 1),
    (v_chord_503, 3, 71, 11, 'B4', 2, 2),
    (v_chord_503, 4, 70, 10, 'Bb4', 2, 3),
    (v_chord_503, 5, 74, 2, 'D5', 2, 3);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_504, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_504;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_504, 0, 72, 0, 'C5', 2, 0),
    (v_chord_504, 1, 77, 5, 'F5', 2, 1),
    (v_chord_504, 2, 75, 3, 'Eb5', 2, 2),
    (v_chord_504, 3, 72, 0, 'C5', 2, 3),
    (v_chord_504, 4, 71, 11, 'B4', 2, 4),
    (v_chord_504, 5, 70, 10, 'Bb4', 2, 5),
    (v_chord_504, 6, 68, 8, 'Ab4', 2, 6),
    (v_chord_504, 7, 65, 5, 'F4', 2, 7);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_505, 0, 'C7', 1)
  RETURNING id INTO v_chord_505;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index) VALUES
    (v_chord_505, 0, 71, 11, 'B4', 2, 0),
    (v_chord_505, 1, 72, 0, 'C5', 2, 1),
    (v_chord_505, 2, 71, 11, 'B4', 2, 2),
    (v_chord_505, 3, 70, 10, 'Bb4', 2, 3),
    (v_chord_505, 4, 68, 8, 'Ab4', 2, 4),
    (v_chord_505, 5, 65, 5, 'F4', 2, 5);
END $$;