import { describe, expect, it } from 'vitest';

import { CODE_RUN_DRUM_LOOP_BGM_URL } from '@/utils/codeRunBgm';
import {
  CHORD_RUN_INTERMEDIATE_BGM_OVERRIDE,
  CHORD_RUN_INTERMEDIATE_QUESTS,
  buildChordRunIntermediateDbProgression,
  resolveChordRunIntermediateRunMapId,
} from '@/utils/chordRunIntermediateProgressions';
import { analyzeSurvivalChordProgression } from '@/utils/survivalProgressionVoicings';

describe('chordRunIntermediateProgressions', () => {
  it('中級 BGM はテストコースコードランと同じ Drums160 ループ', () => {
    expect(CHORD_RUN_INTERMEDIATE_BGM_OVERRIDE.bgmUrl).toBe(CODE_RUN_DRUM_LOOP_BGM_URL);
  });

  it('36 クエスト定義が stage 140〜175 を連続でカバーする', () => {
    expect(CHORD_RUN_INTERMEDIATE_QUESTS).toHaveLength(36);
    const stageNumbers = CHORD_RUN_INTERMEDIATE_QUESTS.map((q) => q.stageNumber);
    expect(stageNumbers[0]).toBe(140);
    expect(stageNumbers[35]).toBe(175);
    expect(new Set(stageNumbers).size).toBe(36);
  });

  it('全進行が survivalProgressionVoicings でパースできる', () => {
    for (const quest of CHORD_RUN_INTERMEDIATE_QUESTS) {
      const input = quest.chordNames.join(' ');
      const result = analyzeSurvivalChordProgression(input);
      expect(result.progression, quest.lessonKey).toHaveLength(quest.chordNames.length);
      expect(result.progression.map((e) => e.name), quest.lessonKey).toEqual([...quest.chordNames]);
      for (const entry of result.progression) {
        expect(entry.voicing.length, `${quest.lessonKey}:${entry.name}`).toBe(4);
      }
    }
  });

  it('DB 用 progression JSON に voicing / key_fifths を付与できる', () => {
    for (const quest of CHORD_RUN_INTERMEDIATE_QUESTS) {
      const rows = buildChordRunIntermediateDbProgression(quest.chordNames);
      expect(rows, quest.lessonKey).toHaveLength(quest.chordNames.length);
      for (const row of rows) {
        expect(row.voicing.length).toBe(4);
        expect(typeof row.key_fifths).toBe('number');
      }
    }
  });

  it('マップ ID は 140 起点で 5〜10 を循環する', () => {
    expect(resolveChordRunIntermediateRunMapId(140)).toBe('snow_run_01');
    expect(resolveChordRunIntermediateRunMapId(145)).toBe('dev_run_10');
    expect(resolveChordRunIntermediateRunMapId(146)).toBe('snow_run_01');
  });
});
