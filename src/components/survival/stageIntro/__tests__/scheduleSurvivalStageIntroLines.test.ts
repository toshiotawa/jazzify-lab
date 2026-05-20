import { scheduleSurvivalStageIntroLines } from '../scheduleSurvivalStageIntroLines';
import type { SurvivalStageIntroScript } from '../survivalStageIntroScriptTypes';

describe('scheduleSurvivalStageIntroLines', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const script: SurvivalStageIntroScript = {
    lineDurationSeconds: 3,
    lines: [{ atSeconds: 1, text: { ja: 'あ', en: 'A' } }],
  };

  it('shows localized line then clears after duration', () => {
    const lines: string[] = [];
    scheduleSurvivalStageIntroLines({
      script,
      isEnglishCopy: true,
      setLine: (t) => {
        lines.push(t);
      },
    });

    jest.advanceTimersByTime(999);
    expect(lines).toEqual([]);

    jest.advanceTimersByTime(1);
    expect(lines).toContain('A');

    jest.advanceTimersByTime(3000);
    expect(lines[lines.length - 1]).toBe('');
  });

  it('does not clear newer line when previous hide timer fires', () => {
    const scriptOverlap: SurvivalStageIntroScript = {
      lineDurationSeconds: 3,
      lines: [
        { atSeconds: 0, text: { ja: '先', en: 'first' } },
        { atSeconds: 1, text: { ja: '後', en: 'second' } },
      ],
    };
    let last = '';
    scheduleSurvivalStageIntroLines({
      script: scriptOverlap,
      isEnglishCopy: true,
      setLine: (t) => {
        last = t;
      },
    });

    jest.advanceTimersByTime(0);
    expect(last).toBe('first');

    jest.advanceTimersByTime(1000);
    expect(last).toBe('second');

    jest.advanceTimersByTime(2000);
    expect(last).toBe('second');

    jest.advanceTimersByTime(1000);
    expect(last).toBe('');
  });

  it('cancel stops pending lines and clears', () => {
    const scriptLate: SurvivalStageIntroScript = {
      lineDurationSeconds: 3,
      lines: [
        { atSeconds: 10, text: { ja: '遅', en: 'late' } },
      ],
    };
    const lines: string[] = [];
    const handle = scheduleSurvivalStageIntroLines({
      script: scriptLate,
      isEnglishCopy: false,
      setLine: (t) => lines.push(t),
    });
    jest.advanceTimersByTime(2000);
    handle.cancel();
    jest.advanceTimersByTime(99999);
    expect(lines).not.toContain('遅');
    expect(lines[lines.length - 1]).toBe('');
  });
});
