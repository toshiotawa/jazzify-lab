import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildSurvivalTutorialV4Manifest } from '../buildSurvivalTutorialV4Manifest';
import { SAMPLE_STAGE_V4_CONFIG } from '../sampleStageV4Config';
import {
  isSurvivalTutorialV4DemoScene,
  isSurvivalTutorialV4DialogueScene,
  isSurvivalTutorialV4PlayScene,
} from '../survivalTutorialV4Types';
import {
  survivalTutorialV4DemoSceneToV3,
  survivalTutorialV4DialogueSceneToV3,
  survivalTutorialV4PlaySceneToPhraseDefinition,
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
const playScene = manifest.scenes.find(isSurvivalTutorialV4PlayScene);

describe('survivalTutorialV4DialogueSceneToV3', () => {
  it('V4 dialogue を V3 dialogue_only(話者保持)に変換する', () => {
    if (!dialogueScene) throw new Error('dialogue scene missing');
    const v3 = survivalTutorialV4DialogueSceneToV3(dialogueScene);
    expect(v3.type).toBe('dialogue_only');
    expect(v3.lines[0].speaker).toBe('fai');
    expect(v3.lines[1].speaker).toBe('jajii');
    expect(v3.lines[0].ja).toContain('ようこそ');
  });
});

describe('survivalTutorialV4DemoSceneToV3', () => {
  it('塊を demo 和音イベント(voicing/voicing_staves)へ変換する', () => {
    if (!demoScene) throw new Error('demo scene missing');
    const v3 = survivalTutorialV4DemoSceneToV3(demoScene);
    expect(v3.type).toBe('demo_play');
    expect(v3.bpm).toBe(120);
    expect(v3.livePlayback).toBe(true);
    const first = v3.chords[0];
    expect(first.chordName).toBe('Dm7');
    expect(first.voicing).toEqual([53, 57, 60, 76]);
    expect(first.voicing_staves).not.toContain(3);
    // staff3(bass=38) は demo voicing に混入せず、bass フィールドへ分離される。
    expect(first.voicing).not.toContain(38);
    expect(first.bass).toEqual([38]);
    expect(v3.lines[0].startBeat).toBe(0);
  });
});

describe('survivalTutorialV4PlaySceneToPhraseDefinition', () => {
  it('判定対象塊のみをフレーズ和音へ変換する(休符塊は除外)', () => {
    if (!playScene) throw new Error('play scene missing');
    const def = survivalTutorialV4PlaySceneToPhraseDefinition(playScene);
    // measure5 の 4 塊のみ(measure6 の休符塊は除外)。
    expect(def.chords).toHaveLength(4);
    expect(def.chords.map((c) => c.chordName)).toEqual(['Dm7', '', 'G7', '']);
    expect(def.chords[0].notes[0].pitchMidi).toBe(74);
    expect(def.chords[0].notes[0].pitchClass).toBe(2);
    expect(def.chords[0].notes[0].staff).toBe(1);
    expect(def.keyFifths).toBe(0);
  });

  it('orderIndex は連番で振り直される', () => {
    if (!playScene) throw new Error('play scene missing');
    const def = survivalTutorialV4PlaySceneToPhraseDefinition(playScene);
    expect(def.chords.map((c) => c.orderIndex)).toEqual([0, 1, 2, 3]);
  });
});
