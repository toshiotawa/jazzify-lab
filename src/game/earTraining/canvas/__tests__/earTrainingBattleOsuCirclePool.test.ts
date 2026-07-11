import {
  burstOsuCircle,
  createOsuCirclePool,
  resyncOsuCircleTimings,
  spawnOsuCircle,
} from '@/game/earTraining/canvas/earTrainingBattleOsuCirclePool';
import { resolveOsuApproachCirclePhraseTiming } from '@/game/earTraining/canvas/earTrainingBattleOsuCircleTiming';

describe('resolveOsuApproachCirclePhraseTiming', () => {
  it('calibration 済み judged と approach lead から phrase 基準タイミングを算出する', () => {
    const timing = resolveOsuApproachCirclePhraseTiming(2.04, 0.6);
    expect(timing.judgedPhraseSec).toBe(2.04);
    expect(timing.approachStartPhraseSec).toBeCloseTo(1.44, 5);
  });
});

describe('burstOsuCircle', () => {
  it('正解時にスロットを即座に非アクティブ化し位置を返す', () => {
    const pool = createOsuCirclePool();
    spawnOsuCircle(pool, {
      commandId: 3,
      approachStartPhraseSec: 1.0,
      judgedPhraseSec: 1.5,
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
      approachStartPhraseSec: 1.0,
      judgedPhraseSec: 1.6,
      centerX: 100,
      targetY: 200,
    });
    const resynced = resyncOsuCircleTimings(pool, [{
      commandId: 7,
      approachStartPhraseSec: 1.1,
      judgedPhraseSec: 1.7,
    }]);
    expect(resynced).toBe(1);
    expect(pool[0].approachStartPhraseSec).toBe(1.1);
    expect(pool[0].judgedPhraseSec).toBe(1.7);
  });
});
