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

