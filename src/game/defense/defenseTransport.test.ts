import { barSeconds, nextSwitchTime, scheduleDeadlineSec } from '@/game/defense/defenseTransport';

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

  it('scheduleDeadlineSec includes base latency', () => {
    expect(scheduleDeadlineSec(0.02)).toBeCloseTo(0.12);
  });
});
