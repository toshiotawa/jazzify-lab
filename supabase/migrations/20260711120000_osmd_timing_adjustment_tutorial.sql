-- OSMD タイミング調整チュートリアル台本（MQ B1 Q1 と同一 MusicXML / MP3 / BPM / 小節）
BEGIN;

INSERT INTO public.ear_training_tutorial_scripts (id, title, title_en, script, is_active)
VALUES (
  'osmd-timing-adjustment-v1',
  'OSMDタイミング調整チュートリアル',
  'OSMD Timing Adjustment Tutorial',
  '{"version":1,"audioTracks":{"drum_loop":{"url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3","volume":0.5}},"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideLobby":true,"hideMidiToggle":true,"hidePhraseIntroQuota":true,"showExitButton":false,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":false},"content":{"osmd-timing-adjustment":{"stage":{"slug":"osmd-timing-adjustment","title":"OSMDタイミング調整","title_en":"OSMD Timing Adjustment","bpm":100,"key_fifths":0,"beats_per_measure":4,"beat_type":4,"loop_measures":25,"max_loops_per_phrase":1,"count_in_beats":0,"time_limit_sec":600,"player_hp":100,"enemy_hp":10000,"per_correct_note_damage":0,"good_completion_damage":0,"miss_damage":0,"fail_damage":0,"background_theme":"blue_club","mode":"chord_osmd","show_keyboard_hints_in_battle":false,"osmd_targets_from_score":true,"is_swing":true},"phrases":[{"order_index":0,"title":"Cブルース・タイミング調整","title_en":"C Blues timing adjustment","music_xml_url":"https://jazzify-cdn.com/sozai/1-1_count-in.musicxml","audio_url":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3","loop_duration_sec":60,"audio_duration_sec":60,"note_count":24,"key_fifths":0}]}},"scenes":[{"type":"chord_osmd","contentRef":"osmd-timing-adjustment","requiredLoops":1,"timedLines":[]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb,
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
