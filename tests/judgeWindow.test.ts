import { inWindow } from '@/utils/judgeWindow';

describe('judgeWindow', () => {
  test('±200ms 以内は true', () => {
    expect(inWindow(1000, 1000)).toBe(true); // ぴったり
    expect(inWindow(1000, 1200)).toBe(true); // +200
    expect(inWindow(1000, 800)).toBe(true); // -200
    expect(inWindow(1000, 1199)).toBe(true); // +199
    expect(inWindow(1000, 801)).toBe(true); // -199
  });

  test('±201ms 外は false', () => {
    expect(inWindow(1000, 1201)).toBe(false); // +201
    expect(inWindow(1000, 799)).toBe(false); // -201
  });

  test('カスタム幅', () => {
    expect(inWindow(1000, 1100, 100)).toBe(true);
    expect(inWindow(1000, 1101, 100)).toBe(false);
  });
});