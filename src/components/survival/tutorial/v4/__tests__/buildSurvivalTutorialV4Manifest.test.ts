import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildSurvivalTutorialV4Manifest } from '../buildSurvivalTutorialV4Manifest';
import { parseSurvivalTutorialV4MusicXml } from '../parseSurvivalTutorialV4MusicXml';
import { SAMPLE_STAGE_V4_CONFIG } from '../sampleStageV4Config';
import {
  isSurvivalTutorialV4DemoScene,
  isSurvivalTutorialV4DialogueScene,
  isSurvivalTutorialV4Manifest,
  isSurvivalTutorialV4PlayScene,
} from '../survivalTutorialV4Types';

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE_XML = readFileSync(
  resolve(here, '../__fixtures__/sampleStageV4.musicxml'),
  'utf8',
);

const buildSample = () =>
  buildSurvivalTutorialV4Manifest({ musicXml: SAMPLE_XML, config: SAMPLE_STAGE_V4_CONFIG });

describe('parseSurvivalTutorialV4MusicXml', () => {
  it('リハーサルマーク・調号・BPM を抽出する', () => {
    const score = parseSurvivalTutorialV4MusicXml(SAMPLE_XML);
    expect(score.rehearsals.map((r) => r.mark)).toEqual(['S1', 'S2', 'S3']);
    expect(score.keyFifths).toBe(0);
    expect(score.bpm).toBe(160);
    expect(score.measureCount).toBe(6);
  });

  it('Verse 番号ごとに歌詞を読む', () => {
    const score = parseSurvivalTutorialV4MusicXml(SAMPLE_XML);
    const verses = new Set(score.lyrics.map((l) => l.verse));
    expect(verses.has(1)).toBe(true);
    expect(verses.has(2)).toBe(true);
  });

  it('3段目(staff=3)の音符を保持する', () => {
    const score = parseSurvivalTutorialV4MusicXml(SAMPLE_XML);
    const staff3 = score.notes.filter((n) => n.staff === 3);
    expect(staff3.length).toBeGreaterThan(0);
  });
});

describe('buildSurvivalTutorialV4Manifest', () => {
  it('version 4 / 3 シーンを生成する', () => {
    const manifest = buildSample();
    expect(isSurvivalTutorialV4Manifest(manifest)).toBe(true);
    expect(manifest.version).toBe(4);
    expect(manifest.scenes.map((s) => s.sceneType)).toEqual(['dialogue', 'demo', 'play']);
  });

  it('リハーサルマークでシーン境界を決める', () => {
    const [s1, s2, s3] = buildSample().scenes;
    expect(s1.start).toEqual({ measure: 1, beat: 1 });
    expect(s1.end).toEqual({ measure: 3, beat: 1 });
    expect(s2.start).toEqual({ measure: 3, beat: 1 });
    expect(s2.end).toEqual({ measure: 5, beat: 1 });
    expect(s3.start).toEqual({ measure: 5, beat: 1 });
  });

  it('dialogue は Verse1→fai / Verse2→jajii で話者を切り替える', () => {
    const scene = buildSample().scenes[0];
    if (!isSurvivalTutorialV4DialogueScene(scene)) throw new Error('expected dialogue');
    expect(scene.lines[0].speaker).toBe('fai');
    expect(scene.lines[0].ja).toContain('ようこそ');
    expect(scene.lines[1].speaker).toBe('jajii');
    expect(scene.lines.every((l) => l.en === '')).toBe(true);
  });

  it('demo は staff1/2 を notes、staff3 を bass(再生のみ)へ振り分ける', () => {
    const scene = buildSample().scenes[1];
    if (!isSurvivalTutorialV4DemoScene(scene)) throw new Error('expected demo');
    expect(scene.bgm.resetOnEnter).toBe(true);
    const first = scene.chords[0];
    expect(first.chordName).toBe('Dm7');
    expect(first.notes).toEqual([53, 57, 60, 76]);
    expect(first.noteStaves).not.toContain(3);
    expect(first.bass).toEqual([38]);
    // staff3 のベースは notes に混入しない。
    for (const chunk of scene.chords) {
      expect(chunk.notes).not.toContain(38);
    }
  });

  it('play は onset 単位で塊化し、コード名は harmony 先頭塊のみに付く', () => {
    const scene = buildSample().scenes[2];
    if (!isSurvivalTutorialV4PlayScene(scene)) throw new Error('expected play');
    const measure5 = scene.questions.filter((q) => q.measureNumber === 5);
    expect(measure5).toHaveLength(4);
    expect(measure5.map((q) => q.chordName)).toEqual(['Dm7', '', 'G7', '']);
    // ベースは出題拍(harmony 先頭)にのみ付く。
    expect(measure5[0].bass).toEqual([38]);
    expect(measure5[1].bass).toEqual([]);
    expect(measure5[2].bass).toEqual([43]);
    expect(measure5[3].bass).toEqual([]);
  });

  it('休符小節は空塊(空の五線譜)として生成する', () => {
    const scene = buildSample().scenes[2];
    if (!isSurvivalTutorialV4PlayScene(scene)) throw new Error('expected play');
    const rest = scene.questions.find((q) => q.measureNumber === 6);
    expect(rest).toBeDefined();
    expect(rest?.notes).toEqual([]);
    expect(rest?.bass).toEqual([]);
  });

  it('measure/beat から MIDI 秒(一定テンポ)を算出する', () => {
    const s1 = buildSample().scenes[0];
    // 160BPM: 8 四分拍 = 3 秒。
    expect(s1.midi.endSec).toBeCloseTo(3, 6);
    expect(s1.midi.startSec).toBeCloseTo(0, 6);
  });
});
