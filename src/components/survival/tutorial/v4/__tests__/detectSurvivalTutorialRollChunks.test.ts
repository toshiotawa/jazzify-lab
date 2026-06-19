import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildSurvivalTutorialV4Manifest } from '../buildSurvivalTutorialV4Manifest';
import {
  detectVoicingRollSequences,
  groupNotesByOnset,
  isRollStepTransition,
} from '../detectSurvivalTutorialRollChunks';
import { parseSurvivalTutorialV4MusicXml } from '../parseSurvivalTutorialV4MusicXml';
import { isSurvivalTutorialV4DemoScene } from '../survivalTutorialV4Types';

const here = dirname(fileURLToPath(import.meta.url));
const ROLL_XML = readFileSync(
  resolve(here, '../__fixtures__/sampleStageV4Roll.musicxml'),
  'utf8',
);

const GRAND_STAFF_ROLL_XML = readFileSync(
  resolve(here, '../__fixtures__/sampleStageV4RollGrandStaff.musicxml'),
  'utf8',
);

const ROLL_CONFIG = {
  id: 'roll-test',
  scenes: [
    { id: 'S1', sceneType: 'dialogue' as const },
    { id: 'S2', sceneType: 'demo' as const },
    { id: 'S3', sceneType: 'play' as const },
  ],
};

describe('parseSurvivalTutorialV4MusicXml tie fields', () => {
  it('タイ継続音に isTiedContinuation を付与する', () => {
    const score = parseSurvivalTutorialV4MusicXml(ROLL_XML);
    const staff2 = score.notes.filter((note) => note.staff === 2);
    const dSecond = staff2.find(
      (note) => note.midi === 50 && note.startBeat > staff2[0].startBeat,
    );
    expect(dSecond?.isTiedContinuation).toBe(true);
    const fNew = staff2.find((note) => note.midi === 53 && !note.isTiedContinuation);
    expect(fNew).toBeDefined();
  });
});

describe('detectSurvivalTutorialRollChunks', () => {
  it('staff2 のタイ列から 4 step ロールを検出する', () => {
    const score = parseSurvivalTutorialV4MusicXml(ROLL_XML);
    const voicingGroups = groupNotesByOnset(
      score.notes.filter((note) => note.staff === 1 || note.staff === 2),
    );
    const harmonyStartBeatFor = (): number => 4;
    const sequences = detectVoicingRollSequences(voicingGroups, harmonyStartBeatFor);
    expect(sequences).toHaveLength(1);
    expect(sequences[0]?.endGroupIndex - sequences[0].startGroupIndex + 1).toBe(4);
  });

  it('1|2段にまたがるタイ和音を 4 step ロールとして検出する', () => {
    const score = parseSurvivalTutorialV4MusicXml(GRAND_STAFF_ROLL_XML);
    const voicingGroups = groupNotesByOnset(
      score.notes.filter((note) => note.staff === 1 || note.staff === 2),
    );
    const harmonyStartBeatFor = (): number => 4;
    const sequences = detectVoicingRollSequences(voicingGroups, harmonyStartBeatFor);
    expect(sequences).toHaveLength(1);
    expect(sequences[0]?.endGroupIndex - sequences[0].startGroupIndex + 1).toBe(4);

    const manifest = buildSurvivalTutorialV4Manifest({
      musicXml: GRAND_STAFF_ROLL_XML,
      config: ROLL_CONFIG,
    });
    const demo = manifest.scenes.find((scene) => scene.sceneType === 'demo');
    if (!isSurvivalTutorialV4DemoScene(demo)) {
      throw new Error('demo scene missing');
    }
    const rollChunk = demo.chords.find((chunk) => chunk.rollSteps && chunk.rollSteps.length > 0);
    expect(rollChunk?.rollSteps?.[3]?.newVoicing).toEqual([74]);
    expect(rollChunk?.rollSteps?.[3]?.voicing).toEqual([50, 53, 57, 74]);
    expect(rollChunk?.rollSteps?.[3]?.voicing_staves).toEqual([2, 2, 2, 1]);
    expect(rollChunk?.noteStaves).toEqual([2, 2, 2, 1]);
  });

  it('同時和音のみではロールにならない', () => {
    const score = parseSurvivalTutorialV4MusicXml(
      readFileSync(resolve(here, '../__fixtures__/sampleStageV4.musicxml'), 'utf8'),
    );
    const staff2Groups = groupNotesByOnset(score.notes.filter((note) => note.staff === 2));
    const harmonyStartBeatFor = (beat: number): number => {
      const h = score.harmonies.filter((item) => item.startBeat <= beat);
      return h[h.length - 1]?.startBeat ?? 0;
    };
    for (let i = 0; i < staff2Groups.length - 1; i += 1) {
      const prev = staff2Groups[i];
      const next = staff2Groups[i + 1];
      if (!prev || !next) continue;
      expect(isRollStepTransition(prev, next, harmonyStartBeatFor)).toBe(false);
    }
  });

  it('manifest demo に rollSteps を含む 1 塊を生成する', () => {
    const manifest = buildSurvivalTutorialV4Manifest({
      musicXml: ROLL_XML,
      config: ROLL_CONFIG,
    });
    const demo = manifest.scenes.find((scene) => scene.sceneType === 'demo');
    if (!isSurvivalTutorialV4DemoScene(demo)) {
      throw new Error('demo scene missing');
    }
    const rollChunk = demo.chords.find((chunk) => chunk.rollSteps && chunk.rollSteps.length > 0);
    expect(rollChunk).toBeDefined();
    expect(rollChunk?.chordName).toContain('Dm7');
    expect(rollChunk?.rollSteps).toHaveLength(4);
    expect(rollChunk?.rollSteps?.[0]?.newVoicing).toEqual([50]);
    expect(rollChunk?.rollSteps?.[1]?.newVoicing).toEqual([53]);
    expect(rollChunk?.rollSteps?.[3]?.voicing).toEqual([50, 53, 57, 60]);
    expect(rollChunk?.notes).toEqual([50, 53, 57, 60]);
    expect(rollChunk?.bass).toEqual([38]);
  });
});
