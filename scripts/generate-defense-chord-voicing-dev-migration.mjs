#!/usr/bin/env node
/**
 * Generates supabase/migrations/20261021130000_defense_chord_voicing_dev_lessons.sql
 */
import { writeFileSync } from 'node:fs';
import { parseVoicingNoteName } from '../src/utils/voicingMusicXml.ts';
import { buildKeyProgression, TENSION_RESOLVE_PROGRESSION_TEMPLATES } from '../src/game/training/tensionResolveVoicings.ts';
import { ABA_VOICINGS_BY_KEY } from '../src/utils/twoHandVoicingIntermediateCourse.ts';

const NS = 'a0000000-0000-4000-8000-000000000001';
const DRUM = 'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3';

const uuid = (name) => `uuid_generate_v5('${NS}'::uuid, '${name}')`;

const noteSql = (midi, pc, name, staff, step, staffLabel = null) => {
  const label = staffLabel ? `'${staffLabel.replace(/'/g, "''")}'` : 'NULL';
  return `(${midi}, ${pc}, '${name.replace(/'/g, "''")}', ${staff}, ${step}, ${label})`;
};

const buildAbaThreeMeasure = () => {
  const aba = ABA_VOICINGS_BY_KEY.F;
  const chords = [
    { name: aba.ii.displayName, notes: aba.ii.notes, measure: 1 },
    { name: aba.v.displayName, notes: aba.v.notes, measure: 2 },
    { name: aba.i.displayName, notes: aba.i.notes, measure: 3 },
  ];
  return chords.map((c, ci) => ({
    slug: `chord-${ci}`,
    chordName: c.name,
    measure: c.measure,
    notes: c.notes.map((n, ni) => {
      const m = parseVoicingNoteName(n);
      const pc = ((m.midi % 12) + 12) % 12;
      const staff = m.midi < 60 ? 2 : 1;
      return noteSql(m.midi, pc, n, staff, 0);
    }),
  }));
};

const buildTensionThreeMeasure = () => {
  const progression = buildKeyProgression(TENSION_RESOLVE_PROGRESSION_TEMPLATES.iiV_i, 'F');
  return progression.map((chord, ci) => {
    const slots = chord.voicingSlots ?? [];
    const notes = [];
    slots.forEach((slot, step) => {
      const label = step === 0 ? chord.name : null;
      slot.forEach((n) => {
        const m = parseVoicingNoteName(n);
        const pc = ((m.midi % 12) + 12) % 12;
        const staff = m.midi < 60 ? 2 : 1;
        notes.push(noteSql(m.midi, pc, n, staff, step, label));
      });
    });
    return {
      slug: `chord-${ci}`,
      chordName: chord.name,
      measure: ci + 1,
      notes,
    };
  });
};

const buildOneBarTwoVoicings = () => {
  const aba = ABA_VOICINGS_BY_KEY.F;
  const pairs = [aba.ii, aba.v];
  const notes = [];
  pairs.forEach((c, step) => {
    c.notes.forEach((n) => {
      const m = parseVoicingNoteName(n);
      const pc = ((m.midi % 12) + 12) % 12;
      const staff = m.midi < 60 ? 2 : 1;
      notes.push(noteSql(m.midi, pc, n, staff, step, c.displayName));
    });
  });
  return [{
    slug: 'chord-0',
    chordName: `${pairs[0].displayName} | ${pairs[1].displayName}`,
    measure: 1,
    notes,
  }];
};

const STAGES = [
  {
    slug: 'defense-dev-cv-iivi-order',
    stageNumber: 913,
    title: 'ディフェンス CV II-V-I（オーダー）',
    titleEn: 'Defense CV II-V-I (order)',
    voicingKeyMode: 'order',
    template: buildAbaThreeMeasure(),
    loopEnd: 3,
  },
  {
    slug: 'defense-dev-cv-iivi-random',
    stageNumber: 914,
    title: 'ディフェンス CV II-V-I（ランダム）',
    titleEn: 'Defense CV II-V-I (random)',
    voicingKeyMode: 'random',
    template: buildAbaThreeMeasure(),
    loopEnd: 3,
  },
  {
    slug: 'defense-dev-cv-tension-order',
    stageNumber: 915,
    title: 'ディフェンス CV テンションリゾルブ（オーダー）',
    titleEn: 'Defense CV tension resolve (order)',
    voicingKeyMode: 'order',
    template: buildTensionThreeMeasure(),
    loopEnd: 3,
  },
  {
    slug: 'defense-dev-cv-tension-random',
    stageNumber: 916,
    title: 'ディフェンス CV テンションリゾルブ（ランダム）',
    titleEn: 'Defense CV tension resolve (random)',
    voicingKeyMode: 'random',
    template: buildTensionThreeMeasure(),
    loopEnd: 3,
  },
  {
    slug: 'defense-dev-cv-1bar-order',
    stageNumber: 917,
    title: 'ディフェンス CV 1小節 Dm7+G7（オーダー）',
    titleEn: 'Defense CV 1-bar Dm7+G7 (order)',
    voicingKeyMode: 'order',
    template: buildOneBarTwoVoicings(),
    loopEnd: 1,
  },
  {
    slug: 'defense-dev-cv-1bar-random',
    stageNumber: 918,
    title: 'ディフェンス CV 1小節 Dm7+G7（ランダム）',
    titleEn: 'Defense CV 1-bar Dm7+G7 (random)',
    voicingKeyMode: 'random',
    template: buildOneBarTwoVoicings(),
    loopEnd: 1,
  },
];

const renderStage = (stage) => {
  const stageId = uuid(stage.slug);
  const phraseId = uuid(`${stage.slug}-phrase-0`);
  const lessonId = uuid(`${stage.slug}-lesson`);
  const lsongId = uuid(`${stage.slug}-lsong`);

  const chordInserts = stage.template.map((chord, ci) => {
    const chordId = uuid(`${stage.slug}-${chord.slug}`);
    return {
      chordId,
      sql: `  (${chordId}, ${phraseId}, ${ci}, '${chord.chordName.replace(/'/g, "''")}', ${chord.measure})`,
      notes: chord.notes.map((n) => `  (${chordId}, ${chord.notes.indexOf(n)}, ${n.slice(1, -1)})`),
    };
  });

  const noteRows = stage.template.flatMap((chord, ci) => {
    const chordId = uuid(`${stage.slug}-${chord.slug}`);
    return chord.notes.map((n, ni) => {
      const inner = n.slice(1, -1);
      return `  (${chordId}, ${ni}, ${inner})`;
    });
  });

  return `-- ${stage.title}
INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars, progression_bars,
  audio_registration_mode, audio_url, staff_layout, attack_trigger, key_fifths,
  required_completion_count, difficulty_level, survive_seconds, player_hp,
  production_staff_hint_mode, production_keyboard_hint_mode,
  play_style, voicing_key_mode, voicing_lowest_key, voicing_start_key,
  voicing_min_lowest_note, play_root_on_chord_change,
  is_active, sort_order
) VALUES (
  ${stageId},
  '${stage.slug}',
  ${stage.stageNumber},
  '${stage.title.replace(/'/g, "''")}',
  '${stage.titleEn.replace(/'/g, "''")}',
  100, 4, 1, NULL,
  'single_source', '${DRUM}', 'grand', 'measure', -1,
  1, 3, 120, 20, 'always', 'always',
  'chord_voicing', '${stage.voicingKeyMode}', 'F', 'F', 'F3', true,
  true, ${stage.stageNumber}
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  stage_number = EXCLUDED.stage_number,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  progression_bars = EXCLUDED.progression_bars,
  audio_registration_mode = EXCLUDED.audio_registration_mode,
  audio_url = EXCLUDED.audio_url,
  staff_layout = EXCLUDED.staff_layout,
  play_style = EXCLUDED.play_style,
  voicing_key_mode = EXCLUDED.voicing_key_mode,
  voicing_lowest_key = EXCLUDED.voicing_lowest_key,
  voicing_start_key = EXCLUDED.voicing_start_key,
  voicing_min_lowest_note = EXCLUDED.voicing_min_lowest_note,
  play_root_on_chord_change = EXCLUDED.play_root_on_chord_change;

DELETE FROM public.defense_phrases WHERE stage_id = ${stageId};

INSERT INTO public.defense_phrases (
  id, stage_id, order_index, title, audio_url, loop_start_measure, loop_end_measure, key_fifths, required_completion_count
) VALUES (
  ${phraseId}, ${stageId}, 0, 'Template', NULL, 1, ${stage.loopEnd}, -1, NULL
);

DELETE FROM public.defense_phrase_chords WHERE phrase_id = ${phraseId};

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
VALUES
${chordInserts.map((c) => c.sql).join(',\n')};

INSERT INTO public.defense_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index, staff_chord_name
) VALUES
${noteRows.join(',\n')};

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links, assignment_description
) VALUES (
  ${lessonId},
  ${uuid('course-developer-test')},
  '${stage.title.replace(/'/g, "''")}',
  '${stage.titleEn.replace(/'/g, "''")}',
  'コードヴォイシング方式のディフェンス開発テスト。全12キー移調・音源ループ継続・進行HUD/速度非表示。',
  'Defense chord-voicing dev test: 12-key transposition, continuous loop, no progression HUD or speed control.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = ${uuid('course-developer-test')}),
  1, 'テスト', 'Test', '["lesson"]'::jsonb, NULL
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson, is_defense,
  defense_stage_id, title, title_en
) VALUES (
  ${lsongId}, ${lessonId}, NULL, 0, true, '{"count": 1, "rank": "S"}'::jsonb,
  false, false, false, false, false, false, false, true,
  ${stageId}, '${stage.title.replace(/'/g, "''")}', '${stage.titleEn.replace(/'/g, "''")}'
)
ON CONFLICT (id) DO UPDATE SET
  defense_stage_id = EXCLUDED.defense_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;
`;
};

const sql = `-- 開発者テストコース: フレーズディフェンス コードヴォイシング方式（6課題）
-- Generated by scripts/generate-defense-chord-voicing-dev-migration.mjs
BEGIN;

${STAGES.map(renderStage).join('\n\n')}

COMMIT;
`;

const outPath = new URL('../supabase/migrations/20261021130000_defense_chord_voicing_dev_lessons.sql', import.meta.url);
writeFileSync(outPath, sql);
console.log(`Wrote ${outPath.pathname}`);
