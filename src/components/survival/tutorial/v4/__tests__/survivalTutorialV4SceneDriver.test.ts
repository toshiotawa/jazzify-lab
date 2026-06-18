import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildSurvivalTutorialV4Manifest } from '../buildSurvivalTutorialV4Manifest';
import { SAMPLE_STAGE_V4_CONFIG } from '../sampleStageV4Config';
import type { SurvivalTutorialV4Scene } from '../survivalTutorialV4Types';
import {
  advanceSurvivalTutorialV4Scene,
  currentSurvivalTutorialV4Scene,
  initialSurvivalTutorialV4Cursor,
  isLastSurvivalTutorialV4Scene,
  nextSurvivalTutorialV4BgmUrl,
  resolveSurvivalTutorialV4BgmAction,
} from '../survivalTutorialV4SceneDriver';

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE_XML = readFileSync(
  resolve(here, '../__fixtures__/sampleStageV4.musicxml'),
  'utf8',
);
const manifest = buildSurvivalTutorialV4Manifest({
  musicXml: SAMPLE_XML,
  config: SAMPLE_STAGE_V4_CONFIG,
});

const withBgm = (
  scene: SurvivalTutorialV4Scene,
  bgm: { url?: string; resetOnEnter: boolean },
): SurvivalTutorialV4Scene => ({ ...scene, bgm });

describe('シーン進行', () => {
  it('initial → 末尾まで進み done になる', () => {
    let cursor = initialSurvivalTutorialV4Cursor();
    expect(cursor.index).toBe(0);
    expect(isLastSurvivalTutorialV4Scene(cursor, manifest)).toBe(false);

    const total = manifest.scenes.length;
    for (let i = 0; i < total - 1; i += 1) {
      const r = advanceSurvivalTutorialV4Scene(cursor, manifest);
      expect(r.done).toBe(false);
      cursor = r.cursor;
    }
    expect(isLastSurvivalTutorialV4Scene(cursor, manifest)).toBe(true);
    const last = advanceSurvivalTutorialV4Scene(cursor, manifest);
    expect(last.done).toBe(true);
    expect(last.cursor.index).toBe(total - 1);
  });

  it('currentScene はインデックスのシーンを返す', () => {
    const cursor = initialSurvivalTutorialV4Cursor();
    expect(currentSurvivalTutorialV4Scene(cursor, manifest)?.sceneType).toBe('dialogue');
  });
});

describe('resolveSurvivalTutorialV4BgmAction', () => {
  const base = manifest.scenes[0];

  it('URL 無しは stop', () => {
    const scene = withBgm(base, { resetOnEnter: false });
    expect(resolveSurvivalTutorialV4BgmAction(scene, 'a.mp3').kind).toBe('stop');
  });

  it('同一 URL かつ resetOnEnter=false は keep(位置維持)', () => {
    const scene = withBgm(base, { url: 'a.mp3', resetOnEnter: false });
    expect(resolveSurvivalTutorialV4BgmAction(scene, 'a.mp3').kind).toBe('keep');
  });

  it('異なる URL は restart', () => {
    const scene = withBgm(base, { url: 'b.mp3', resetOnEnter: false });
    const action = resolveSurvivalTutorialV4BgmAction(scene, 'a.mp3');
    expect(action).toEqual({ kind: 'restart', url: 'b.mp3' });
  });

  it('resetOnEnter=true は同一 URL でも restart', () => {
    const scene = withBgm(base, { url: 'a.mp3', resetOnEnter: true });
    expect(resolveSurvivalTutorialV4BgmAction(scene, 'a.mp3').kind).toBe('restart');
  });

  it('現在 URL が無い(null)なら restart', () => {
    const scene = withBgm(base, { url: 'a.mp3', resetOnEnter: false });
    expect(resolveSurvivalTutorialV4BgmAction(scene, null).kind).toBe('restart');
  });
});

describe('nextSurvivalTutorialV4BgmUrl', () => {
  it('keep は現状維持、restart は新URL、stop は null', () => {
    expect(nextSurvivalTutorialV4BgmUrl({ kind: 'keep' }, 'a.mp3')).toBe('a.mp3');
    expect(nextSurvivalTutorialV4BgmUrl({ kind: 'restart', url: 'b.mp3' }, 'a.mp3')).toBe('b.mp3');
    expect(nextSurvivalTutorialV4BgmUrl({ kind: 'stop' }, 'a.mp3')).toBe(null);
  });
});
