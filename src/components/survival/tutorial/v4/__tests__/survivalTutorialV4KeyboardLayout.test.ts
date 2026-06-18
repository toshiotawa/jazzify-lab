import { describe, expect, it } from 'vitest';

import {
  buildSurvivalTutorialV4KeyboardLayout,
  isWhiteKey,
  resolveSurvivalTutorialV4KeyboardRange,
} from '../survivalTutorialV4KeyboardLayout';

describe('isWhiteKey', () => {
  it('白鍵/黒鍵を正しく判定する', () => {
    expect(isWhiteKey(60)).toBe(true); // C
    expect(isWhiteKey(61)).toBe(false); // C#
    expect(isWhiteKey(71)).toBe(true); // B
    expect(isWhiteKey(70)).toBe(false); // Bb
  });
});

describe('buildSurvivalTutorialV4KeyboardLayout', () => {
  it('C3..C5 で白鍵15・黒鍵10', () => {
    const layout = buildSurvivalTutorialV4KeyboardLayout(48, 72);
    expect(layout.whiteCount).toBe(15);
    expect(layout.whites).toHaveLength(15);
    expect(layout.blacks).toHaveLength(10);
  });

  it('白鍵インデックスは連番で先頭白鍵から始まる', () => {
    const layout = buildSurvivalTutorialV4KeyboardLayout(48, 72);
    expect(layout.whites[0]).toEqual({ midi: 48, whiteIndex: 0 });
    expect(layout.whites[1]).toEqual({ midi: 50, whiteIndex: 1 });
  });

  it('黒鍵は左隣の白鍵インデックスを持つ', () => {
    const layout = buildSurvivalTutorialV4KeyboardLayout(48, 72);
    // 49(C#3) の左隣は 48(C3, index0)
    expect(layout.blacks[0]).toEqual({ midi: 49, leftWhiteIndex: 0 });
    // 51(D#3) の左隣は 50(D3, index1)
    expect(layout.blacks[1]).toEqual({ midi: 51, leftWhiteIndex: 1 });
  });
});

describe('resolveSurvivalTutorialV4KeyboardRange', () => {
  it('空配列はデフォルト C2..C6', () => {
    expect(resolveSurvivalTutorialV4KeyboardRange([])).toEqual({ startMidi: 36, endMidi: 84 });
  });

  it('両端を C に丸める', () => {
    // 38(D2)..74(D5) → start 36(C2), end 84(C6)
    expect(resolveSurvivalTutorialV4KeyboardRange([38, 74])).toEqual({
      startMidi: 36,
      endMidi: 84,
    });
  });

  it('狭い範囲は最低2オクターブ確保', () => {
    // 60(C4)..64(E4) → start 60, span<24 → end 84
    const range = resolveSurvivalTutorialV4KeyboardRange([60, 64]);
    expect(range.startMidi).toBe(60);
    expect(range.endMidi - range.startMidi).toBeGreaterThanOrEqual(24);
  });
});
