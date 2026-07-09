import {
  burstOsuCircle,
  createOsuCirclePool,
  resyncOsuCircleTimings,
  spawnOsuCircle,
} from '@/game/earTraining/canvas/earTrainingBattleOsuCirclePool';
import { resolveOsuApproachCirclePerfTiming } from '@/game/earTraining/canvas/earTrainingBattleOsuCircleTiming';

describe('resolveOsuApproachCirclePerfTiming', () => {
  it('calibration 済み judged と phrase 時刻から perf 基準タイミングを算出する', () => {
    const timing = resolveOsuApproachCirclePerfTiming(2.04, 1.54, 0.6, 1000);
    expect(timing.judgedMs).toBe(1500);
    expect(timing.approachStartMs).toBe(900);
  });
});

describe('burstOsuCircle', () => {
  it('正解時にスロットを即座に非アクティブ化し位置を返す', () => {
    const pool = createOsuCirclePool();
    spawnOsuCircle(pool, {
      commandId: 3,
      approachStartMs: 1000,
      judgedMs: 1500,
      centerX: 180,
      targetY: 320,
    });
    const position = burstOsuCircle(pool, 3);
    expect(position).toEqual({ centerX: 180, targetY: 320, colorIndex: 0 });
    expect(pool[0].active).toBe(false);
    expect(burstOsuCircle(pool, 3)).toBeNull();
  });
});

describe('resyncOsuCircleTimings', () => {
  it('表示中スロットの judged / approach を更新する', () => {
    const pool = createOsuCirclePool();
    spawnOsuCircle(pool, {
      commandId: 7,
      approachStartMs: 1000,
      judgedMs: 1600,
      centerX: 100,
      targetY: 200,
    });
    const resynced = resyncOsuCircleTimings(pool, [{
      commandId: 7,
      approachStartMs: 1100,
      judgedMs: 1700,
    }]);
    expect(resynced).toBe(1);
    expect(pool[0].approachStartMs).toBe(1100);
    expect(pool[0].judgedMs).toBe(1700);
  });
});
