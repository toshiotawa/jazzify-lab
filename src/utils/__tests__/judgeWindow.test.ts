import { inWindow, getTimingError, getJudgment } from '../judgeWindow';

describe('judgeWindow', () => {
  describe('inWindow', () => {
    test('±200ms以内はtrue', () => {
      expect(inWindow(1000, 1000)).toBe(true); // ぴったり
      expect(inWindow(1000, 1200)).toBe(true); // +200
      expect(inWindow(1000, 800)).toBe(true);  // -200
      expect(inWindow(1000, 1199)).toBe(true); // +199
      expect(inWindow(1000, 801)).toBe(true);  // -199
    });

    test('±201ms外はfalse', () => {
      expect(inWindow(1000, 1201)).toBe(false); // +201
      expect(inWindow(1000, 799)).toBe(false);  // -201
      expect(inWindow(1500, 1000)).toBe(false); // +500
      expect(inWindow(500, 1000)).toBe(false);  // -500
    });

    test('カスタム幅', () => {
      expect(inWindow(1000, 1100, 100)).toBe(true);  // 100ms幅でOK
      expect(inWindow(1000, 1101, 100)).toBe(false); // 100ms幅でNG
      expect(inWindow(1000, 950, 50)).toBe(true);    // 50ms幅でOK
      expect(inWindow(1000, 949, 50)).toBe(false);   // 50ms幅でNG
    });
  });

  describe('getTimingError', () => {
    test('タイミング誤差の計算', () => {
      expect(getTimingError(1000, 1000)).toBe(0);    // ぴったり
      expect(getTimingError(1100, 1000)).toBe(100);  // 100ms遅い
      expect(getTimingError(900, 1000)).toBe(-100);  // 100ms早い
    });
  });

  describe('getJudgment', () => {
    test('perfect判定（±50ms以内）', () => {
      expect(getJudgment(1000, 1000)).toBe('perfect'); // ぴったり
      expect(getJudgment(1050, 1000)).toBe('perfect'); // +50ms
      expect(getJudgment(950, 1000)).toBe('perfect');  // -50ms
    });

    test('early判定（-200ms～-50ms）', () => {
      expect(getJudgment(949, 1000)).toBe('early');  // -51ms
      expect(getJudgment(800, 1000)).toBe('early');  // -200ms
    });

    test('late判定（+50ms～+200ms）', () => {
      expect(getJudgment(1051, 1000)).toBe('late'); // +51ms
      expect(getJudgment(1200, 1000)).toBe('late'); // +200ms
    });

    test('miss判定（±200ms外）', () => {
      expect(getJudgment(799, 1000)).toBe('miss');  // -201ms
      expect(getJudgment(1201, 1000)).toBe('miss'); // +201ms
      expect(getJudgment(500, 1000)).toBe('miss');  // -500ms
      expect(getJudgment(1500, 1000)).toBe('miss'); // +500ms
    });
  });
});