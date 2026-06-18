import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildSurvivalTutorialV4Manifest } from '../buildSurvivalTutorialV4Manifest';
import { SAMPLE_STAGE_V4_CONFIG } from '../sampleStageV4Config';
import {
  buildSurvivalTutorialV4PlaySteps,
  resolvePlayLineIndexAtBeat,
} from '../survivalTutorialV4PlayDialogue';
import {
  isSurvivalTutorialV4PlayScene,
  type SurvivalTutorialV4PlayScene,
} from '../survivalTutorialV4Types';

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE_XML = readFileSync(
  resolve(here, '../__fixtures__/sampleStageV4.musicxml'),
  'utf8',
);
const manifest = buildSurvivalTutorialV4Manifest({
  musicXml: SAMPLE_XML,
  config: SAMPLE_STAGE_V4_CONFIG,
});
const playScene = manifest.scenes.find(isSurvivalTutorialV4PlayScene);

describe('buildSurvivalTutorialV4PlaySteps', () => {
  it('サンプルは note ステップ4つ(末尾の空小節は除外)', () => {
    expect(playScene).toBeDefined();
    if (!playScene) return;
    const steps = buildSurvivalTutorialV4PlaySteps(playScene);
    expect(steps).toHaveLength(4);
    expect(steps.every((s) => s.kind === 'note')).toBe(true);
    expect(steps.map((s) => (s.kind === 'note' ? s.judgeIndex : -1))).toEqual([0, 1, 2, 3]);
  });

  it('セリフ付きの休符小節は dialogue ステップ化し、note と交互に並ぶ', () => {
    expect(playScene).toBeDefined();
    if (!playScene) return;
    const scene: SurvivalTutorialV4PlayScene = {
      ...playScene,
      questions: [
        { startBeat: 0, durationBeats: 4, measureNumber: 1, chordName: '', notes: [], bass: [] },
        {
          startBeat: 4,
          durationBeats: 1,
          measureNumber: 2,
          chordName: 'C',
          notes: [60],
          bass: [36],
        },
      ],
      lines: [{ ja: '会話', en: '', startBeat: 0 }],
    };
    const steps = buildSurvivalTutorialV4PlaySteps(scene);
    expect(steps).toHaveLength(2);
    expect(steps[0].kind).toBe('dialogue');
    expect(steps[1].kind).toBe('note');
  });

  it('セリフ無しの休符小節はステップ化しない', () => {
    expect(playScene).toBeDefined();
    if (!playScene) return;
    const scene: SurvivalTutorialV4PlayScene = {
      ...playScene,
      questions: [
        { startBeat: 0, durationBeats: 4, measureNumber: 1, chordName: '', notes: [], bass: [] },
      ],
      lines: [],
    };
    expect(buildSurvivalTutorialV4PlaySteps(scene)).toHaveLength(0);
  });
});

describe('resolvePlayLineIndexAtBeat', () => {
  const lines = [
    { ja: 'a', en: '', startBeat: 0 },
    { ja: 'b', en: '', startBeat: 2 },
  ];

  it('進行拍に応じて最新のセリフ index を返す', () => {
    expect(resolvePlayLineIndexAtBeat(lines, 0)).toBe(0);
    expect(resolvePlayLineIndexAtBeat(lines, 1)).toBe(0);
    expect(resolvePlayLineIndexAtBeat(lines, 2)).toBe(1);
    expect(resolvePlayLineIndexAtBeat(lines, 3)).toBe(1);
  });

  it('先頭セリフより前は null / 空配列は null', () => {
    expect(resolvePlayLineIndexAtBeat([{ ja: 'x', en: '', startBeat: 4 }], 0)).toBeNull();
    expect(resolvePlayLineIndexAtBeat([], 0)).toBeNull();
  });
});
