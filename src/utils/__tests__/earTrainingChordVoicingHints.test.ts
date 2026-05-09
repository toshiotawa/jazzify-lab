import { describe, expect, it } from 'vitest';
import { computeVoicingKeyboardHints } from '@/utils/earTrainingChordVoicingHints';

describe('computeVoicingKeyboardHints', () => {
  it('voicing が空 / null / undefined のとき空ヒントを返す', () => {
    expect(computeVoicingKeyboardHints(null, undefined)).toEqual({
      pendingMidis: [],
      completedMidis: [],
    });
    expect(computeVoicingKeyboardHints(undefined, new Set())).toEqual({
      pendingMidis: [],
      completedMidis: [],
    });
    expect(computeVoicingKeyboardHints([], new Set())).toEqual({
      pendingMidis: [],
      completedMidis: [],
    });
  });

  it('押下ピッチクラスが無いとき全ノートが pending', () => {
    const result = computeVoicingKeyboardHints(['G3', 'B3', 'D4'], undefined);
    expect(result.pendingMidis).toEqual([55, 59, 62]);
    expect(result.completedMidis).toEqual([]);
  });

  it('一致する PC が押下済みのとき該当ノートが completed になる', () => {
    const pressed = new Set<number>([7]);
    const result = computeVoicingKeyboardHints(['G3', 'B3', 'D4'], pressed);
    expect(result.completedMidis).toEqual([55]);
    expect(result.pendingMidis).toEqual([59, 62]);
  });

  it('別オクターブの同 PC を押下しても voicing 側の元オクターブのノートが completed', () => {
    const pressed = new Set<number>([2]);
    const result = computeVoicingKeyboardHints(['G3', 'D4'], pressed);
    expect(result.completedMidis).toEqual([62]);
    expect(result.pendingMidis).toEqual([55]);
  });

  it('voicing 内に同 MIDI が重複しても 1 つに集約される', () => {
    const result = computeVoicingKeyboardHints(['C4', 'C4', 'E4'], undefined);
    expect(result.pendingMidis).toEqual([60, 64]);
    expect(result.completedMidis).toEqual([]);
  });

  it('解釈不能な音名はスキップされ、解釈可能な音だけ返る', () => {
    const result = computeVoicingKeyboardHints(['??', 'C4'], undefined);
    expect(result.pendingMidis).toEqual([60]);
    expect(result.completedMidis).toEqual([]);
  });

  it('全構成音が押下済みなら全 completed', () => {
    const pressed = new Set<number>([0, 4, 7]);
    const result = computeVoicingKeyboardHints(['C4', 'E4', 'G4'], pressed);
    expect(result.pendingMidis).toEqual([]);
    expect(result.completedMidis).toEqual([60, 64, 67]);
  });
});
