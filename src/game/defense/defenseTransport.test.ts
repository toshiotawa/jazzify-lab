import { barSeconds, barSecondsFromLoop, nextSwitchTime, rebaseTransportStart, scheduleDeadlineSec } from '@/game/defense/defenseTransport';

describe('defenseTransport', () => {
  it('barSeconds at 120 BPM 4/4', () => {
    expect(barSeconds(120, 4)).toBeCloseTo(2);
  });

  it('nextSwitchTime targets next bar head', () => {
    const transportStart = 10;
    const barSec = 2;
    expect(nextSwitchTime(11.2, transportStart, barSec, 0.1)).toBeCloseTo(12);
  });

  it('nextSwitchTime skips bar when deadline would be missed', () => {
    const transportStart = 10;
    const barSec = 2;
    expect(nextSwitchTime(11.95, transportStart, barSec, 0.1)).toBeCloseTo(14);
  });

  it('barSecondsFromLoop uses the actual loop length', () => {
    expect(barSecondsFromLoop(0, 8, 4)).toBeCloseTo(2);
    expect(barSecondsFromLoop(8, 16, 4)).toBeCloseTo(2);
  });

  it('rebaseTransportStart keeps the current bar fraction', () => {
    // 0.25 of a 2s bar elapsed; new bar is 4s → 1s into the new bar.
    expect(rebaseTransportStart(11.5, 10, 2, 4)).toBeCloseTo(8.5);
  });

  it('scheduleDeadlineSec includes base latency', () => {
    expect(scheduleDeadlineSec(0.02)).toBeCloseTo(0.12);
  });
});
