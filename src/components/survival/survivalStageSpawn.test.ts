import { describe, expect, it } from 'vitest';
import { getStageSpawnConfig } from './SurvivalGameEngine';

describe('getStageSpawnConfig', () => {
  it('第一ブロック通常は出現数を抑制し 60 秒以降も急増しない', () => {
    expect(getStageSpawnConfig(10, true)).toEqual({ spawnRate: 2.0, spawnCount: 2 });
    expect(getStageSpawnConfig(70, true)).toEqual({ spawnRate: 2.0, spawnCount: 3 });
  });

  it('第二ブロック以降は従来どおり 60 秒以降に急増する', () => {
    expect(getStageSpawnConfig(10, false)).toEqual({ spawnRate: 1.0, spawnCount: 3 });
    expect(getStageSpawnConfig(70, false)).toEqual({ spawnRate: 0.5, spawnCount: 15 });
  });
});
