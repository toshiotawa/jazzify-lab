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

  it('play シーンは content の phrase ブロックを参照し、休符塊を除外する', () => {
    const phraseScene = payload.scenes.find((s) => s.type === 'phrase_battle');
    if (!phraseScene || phraseScene.type !== 'phrase_battle') {
      throw new Error('phrase_battle missing');
    }
    const block = payload.content[phraseScene.contentRef];
    expect(block).toBeDefined();
    if (!block || !('phrases' in block)) throw new Error('phrase block missing');
    const chords = block.phrases[0].chords;
    // measure5 の 4 塊のみ(休符塊除外)。
    expect(chords).toHaveLength(4);
    expect(chords.map((c) => c.name)).toEqual(['Dm7', '', 'G7', '']);
    expect(chords[0].voicing).toEqual([74]);
    expect(chords[0].measure_number).toBe(5);
  });

  it('demo シーンは voicing を持ち、bass(staff3) を含まない', () => {
    const demo = payload.scenes.find((s) => s.type === 'demo_play');
    if (!demo || demo.type !== 'demo_play') throw new Error('demo_play missing');
    expect(demo.chords[0].voicing).toEqual([53, 57, 60, 76]);
    expect(demo.chords[0].voicing).not.toContain(38);
  });

  it('manifest の bgm を audioTracks.drum_loop に写す', () => {
    expect(payload.audioTracks?.drum_loop?.url).toBe('sample_bgm_loop.mp3');
  });
});
