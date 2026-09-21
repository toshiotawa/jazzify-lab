import {
  barSeconds,
  barSecondsFromLoop,
  beatSeconds,
  nextSwitchTime,
  planDefenseSwitch,
  rebaseTransportStart,
  scheduleDeadlineSec,
} from '@/game/defense/defenseTransport';

describe('defenseTransport', () => {
  it('barSeconds at 120 BPM 4/4', () => {
    expect(barSeconds(120, 4)).toBeCloseTo(2);
  });

  it('beatSeconds at 160 BPM', () => {
    expect(beatSeconds(160, 1)).toBeCloseTo(0.375);
  });

  it('nextSwitchTime targets next bar head', () => {
    const transportStart = 10;
    const barSec = 2;
    expect(nextSwitchTime(11.2, transportStart, barSec, 0.1, 0.5)).toBeCloseTo(12);
  });

  it('nextSwitchTime keeps upcoming bar even inside old lead window', () => {
    const transportStart = 10;
    const barSec = 2;
    expect(nextSwitchTime(11.95, transportStart, barSec, 0.1, 0.5)).toBeCloseTo(12);
  });

  it('planDefenseSwitch immediate within one beat after cut', () => {
    const transportStart = 10;
    const barSec = 2;
    const beatSec = 0.5;
    const plan = planDefenseSwitch({
      now: 12.2,
      transportStart,
      cutIntervalSec: barSec,
      beatSec,
    });
    expect(plan.immediate).toBe(true);
    expect(plan.switchAt).toBeCloseTo(12.2);
  });

  it('planDefenseSwitch targets next cut after one beat overshoot at 160 BPM', () => {
    const transportStart = 0;
    const barSec = 1.5;
    const beatSec = 0.375;
    const plan = planDefenseSwitch({
      now: 0.5,
      transportStart,
      cutIntervalSec: barSec,
      beatSec,
    });
    expect(plan.immediate).toBe(false);
    expect(plan.switchAt).toBeCloseTo(1.5);
  });

  it('planDefenseSwitch targets sixteenth-note lead at 160 BPM', () => {
    const transportStart = 0;
    const barSec = 1.5;
    const beatSec = 0.375;
    const sixteenthBeforeCut = 1.5 - 0.09375;
    const plan = planDefenseSwitch({
      now: sixteenthBeforeCut,
      transportStart,
      cutIntervalSec: barSec,
      beatSec,
    });
    expect(plan.immediate).toBe(false);
    expect(plan.switchAt).toBeCloseTo(1.5);
  });

  it('barSecondsFromLoop uses the actual loop length', () => {
    expect(barSecondsFromLoop(0, 8, 4)).toBeCloseTo(2);
    expect(barSecondsFromLoop(8, 16, 4)).toBeCloseTo(2);
  });

  it('rebaseTransportStart keeps the current bar fraction', () => {
    expect(rebaseTransportStart(11.5, 10, 2, 4)).toBeCloseTo(8.5);
  });

  it('scheduleDeadlineSec includes base latency', () => {
    expect(scheduleDeadlineSec(0.02)).toBeCloseTo(0.12);
  });
});
