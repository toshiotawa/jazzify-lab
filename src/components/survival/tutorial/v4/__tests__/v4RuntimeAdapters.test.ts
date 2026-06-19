import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildSurvivalTutorialV4Manifest } from '../buildSurvivalTutorialV4Manifest';
import { SAMPLE_STAGE_V4_CONFIG } from '../sampleStageV4Config';
import {
  isSurvivalTutorialV4DemoScene,
  isSurvivalTutorialV4DialogueScene,
} from '../survivalTutorialV4Types';
import {
  survivalTutorialV4DemoSceneToV3,
  survivalTutorialV4DialogueSceneToV3,
} from '../v4RuntimeAdapters';

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE_XML = readFileSync(
  resolve(here, '../__fixtures__/sampleStageV4.musicxml'),
  'utf8',
);

const manifest = buildSurvivalTutorialV4Manifest({
  musicXml: SAMPLE_XML,
  config: SAMPLE_STAGE_V4_CONFIG,
});

const dialogueScene = manifest.scenes.find(isSurvivalTutorialV4DialogueScene);
const demoScene = manifest.scenes.find(isSurvivalTutorialV4DemoScene);

describe('survivalTutorialV4DialogueSceneToV3', () => {
  it('V4 dialogue を V3 dialogue_only(話者保持)に変換する', () => {
    if (!dialogueScene) throw new Error('dialogue scene missing');
    const v3 = survivalTutorialV4DialogueSceneToV3(dialogueScene);
    expect(v3.type).toBe('dialogue_only');
    expect(v3.lines[0].speaker).toBe('fai');
    expect(v3.lines[1].speaker).toBe('jajii');
    expect(v3.lines[0].ja).toContain('ようこそ');
    expect(v3.bgm).toEqual(dialogueScene.bgm);
  });
});

describe('survivalTutorialV4DemoSceneToV3', () => {
  it('塊を demo 和音イベント(voicing/voicing_staves)へ変換する', () => {
    if (!demoScene) throw new Error('demo scene missing');
    const v3 = survivalTutorialV4DemoSceneToV3(demoScene);
    expect(v3.type).toBe('demo_play');
    expect(v3.bpm).toBe(160);
    expect(v3.endHoldBeats).toBe(0);
    expect(v3.livePlayback).toBe(true);
    expect(v3.bgm).toEqual(demoScene.bgm);
    const first = v3.chords[0];
    expect(first.chordName).toBe('Dm7');
    expect(first.voicing).toEqual([53, 57, 60, 76]);
    expect(first.voicing_staves).not.toContain(3);
    // staff3(bass=38) は demo voicing に混入せず、bass フィールドへ分離される。
    expect(first.voicing).not.toContain(38);
    expect(first.bass).toEqual([38]);
    expect(v3.lines[0].startBeat).toBe(0);
  });

  it('rollSteps を V3 demo 和音イベントへ写像する', () => {
    const rollXml = readFileSync(
      resolve(here, '../__fixtures__/sampleStageV4Roll.musicxml'),
      'utf8',
    );
    const rollManifest = buildSurvivalTutorialV4Manifest({
      musicXml: rollXml,
      config: {
        id: 'roll-test',
        scenes: [
          { id: 'S1', sceneType: 'dialogue' },
          { id: 'S2', sceneType: 'demo' },
          { id: 'S3', sceneType: 'play' },
        ],
      },
    });
    const rollDemo = rollManifest.scenes.find(isSurvivalTutorialV4DemoScene);
    if (!rollDemo) throw new Error('demo scene missing');
    const v3 = survivalTutorialV4DemoSceneToV3(rollDemo);
    const rollChord = v3.chords.find((chord) => chord.rollSteps && chord.rollSteps.length > 0);
    expect(rollChord?.rollSteps).toHaveLength(4);
    expect(rollChord?.rollSteps?.[0]?.newVoicing).toEqual([50]);
  });
});
