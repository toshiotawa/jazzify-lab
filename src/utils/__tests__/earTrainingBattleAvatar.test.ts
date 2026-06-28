import type { EarTrainingStage } from '@/types';
import {
  resolveEarTrainingBattleEnemy,
} from '@/utils/earTrainingBattleAvatar';

const baseStage = {
  id: 'stage-1',
  slug: 'test',
  title: 'テストステージ',
  title_en: 'Test Stage',
  description: null,
  description_en: null,
  bpm: 120,
  beats_per_measure: 4,
  beat_type: 4,
  loop_measures: 4,
  max_loops_per_phrase: 4,
  count_in_beats: 4,
  time_limit_sec: 120,
  player_hp: 100,
  enemy_hp: 100,
  per_correct_note_damage: 1,
  good_completion_damage: 1,
  great_completion_damage: 1,
  perfect_completion_damage: 1,
  miss_damage: 1,
  fail_damage: 1,
  perfect_max_misses: 0,
  great_max_misses: 0,
  background_theme: 'default',
  is_active: true,
  is_demo: false,
  key_fifths: 0,
  osmd_targets_from_score: false,
  mode: 'chord_osmd',
  created_at: '',
  updated_at: '',
} satisfies EarTrainingStage;

describe('resolveEarTrainingBattleEnemy', () => {
  it('uses Japanese title for JA copy', () => {
    expect(resolveEarTrainingBattleEnemy(baseStage, false)).toEqual({
      id: 'stage-1',
      name: 'テストステージ',
    });
  });

  it('uses English title for EN copy', () => {
    expect(resolveEarTrainingBattleEnemy(baseStage, true)).toEqual({
      id: 'stage-1',
      name: 'Test Stage',
    });
  });
});
