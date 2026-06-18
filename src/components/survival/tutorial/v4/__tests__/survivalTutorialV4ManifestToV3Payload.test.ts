import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { isSurvivalTutorialScriptPayloadV3 } from '../../survivalTutorialV3ScriptTypes';
import { buildSurvivalTutorialV4Manifest } from '../buildSurvivalTutorialV4Manifest';
import { SAMPLE_STAGE_V4_CONFIG } from '../sampleStageV4Config';
import { survivalTutorialV4ManifestToV3Payload } from '../survivalTutorialV4ManifestToV3Payload';

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE_XML = readFileSync(
  resolve(here, '../__fixtures__/sampleStageV4.musicxml'),
  'utf8',
);

const manifest = buildSurvivalTutorialV4Manifest({
  musicXml: SAMPLE_XML,
  config: SAMPLE_STAGE_V4_CONFIG,
});
const payload = survivalTutorialV4ManifestToV3Payload(manifest);

describe('survivalTutorialV4ManifestToV3Payload', () => {
  it('妥当な V3 ペイロードを生成する', () => {
    expect(isSurvivalTutorialScriptPayloadV3(payload)).toBe(true);
    expect(payload.version).toBe(3);
  });

  it('3 シーン種別を dialogue_only/demo_play/phrase_battle へ写像し finish を付ける', () => {
    expect(payload.scenes.map((s) => s.type)).toEqual([
      'dialogue_only',
      'demo_play',
      'phrase_battle',
      'finish',
    ]);
  });

  it('play シーンは playAlong で塊を逐次進行し、休符塊も含めて保持する', () => {
    const phraseScene = payload.scenes.find((s) => s.type === 'phrase_battle');
    if (!phraseScene || phraseScene.type !== 'phrase_battle') {
      throw new Error('phrase_battle missing');
    }
    expect(phraseScene.playAlong).toBe(true);
    expect(phraseScene.requiredLoops).toBe(1);

    const block = payload.content[phraseScene.contentRef];
    expect(block).toBeDefined();
    if (!block || !('phrases' in block)) throw new Error('phrase block missing');
    const chords = block.phrases[0].chords;

    // 非休符塊（measure5 の 4 塊）+ 休符塊（会話のみ小節）。
    const voiced = chords.filter((c) => c.voicing.length > 0);
    expect(voiced.map((c) => c.name)).toEqual(['Dm7', '', 'G7', '']);
    expect(voiced[0].voicing).toEqual([74]);
    expect(voiced[0].measure_number).toBe(5);

    const rests = chords.filter((c) => c.voicing.length === 0);
    expect(rests.length).toBeGreaterThanOrEqual(1);
  });

  it('play シーンは staff3 bass を塊へ引き渡す', () => {
    const phraseScene = payload.scenes.find((s) => s.type === 'phrase_battle');
    if (!phraseScene || phraseScene.type !== 'phrase_battle') {
      throw new Error('phrase_battle missing');
    }
    const block = payload.content[phraseScene.contentRef];
    if (!block || !('phrases' in block)) throw new Error('phrase block missing');
    const chords = block.phrases[0].chords;
    expect(chords.some((c) => (c.bass?.length ?? 0) > 0)).toBe(true);
  });

  it('demo シーンは voicing を持ち、bass(staff3) は voicing に混ぜず別フィールドで保持', () => {
    const demo = payload.scenes.find((s) => s.type === 'demo_play');
    if (!demo || demo.type !== 'demo_play') throw new Error('demo_play missing');
    expect(demo.chords[0].voicing).toEqual([53, 57, 60, 76]);
    expect(demo.chords[0].voicing).not.toContain(38);
    expect(demo.livePlayback).toBe(true);
    expect((demo.chords[0].bass?.length ?? 0)).toBeGreaterThan(0);
  });

  it('manifest の bgm を audioTracks.drum_loop に写す', () => {
    expect(payload.audioTracks?.drum_loop?.url).toBe('sample_bgm_loop.mp3');
  });

  it('シーンごとの bgm URL/resetOnEnter を V3 へ写す', () => {
    const runtimeScenes = payload.scenes.filter((scene) => scene.type !== 'finish');
    expect(runtimeScenes.map((scene) => scene.bgm)).toEqual([
      { url: 'sample_bgm_loop.mp3', resetOnEnter: false },
      { url: 'sample_bgm_loop.mp3', resetOnEnter: true },
      { url: 'sample_bgm_loop.mp3', resetOnEnter: false },
    ]);
  });
});
