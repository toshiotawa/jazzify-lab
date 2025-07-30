import { describe, it, expect } from 'vitest';

describe('Fantasy モジュールのインポート', () => {
  it('FantasyGameEngineが正しくインポートできる', async () => {
    const module = await import('../FantasyGameEngine');
    expect(module).toBeDefined();
    expect(module.useFantasyGameEngine).toBeDefined();
    expect(module.ChordDefinition).toBeUndefined(); // interface なので undefined
    expect(module.MonsterState).toBeUndefined(); // interface なので undefined
  });

  it('FantasyMainが正しくインポートできる', async () => {
    const module = await import('../FantasyMain');
    expect(module).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it('FantasyStageSelectが正しくインポートできる', async () => {
    const module = await import('../FantasyStageSelect');
    expect(module).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it('FantasyPIXIRendererが正しくインポートできる', async () => {
    const module = await import('../FantasyPIXIRenderer');
    expect(module).toBeDefined();
    expect(module.FantasyPIXIRenderer).toBeDefined();
  });

  it('型定義が@/typesから正しくインポートできる', async () => {
    const types = await import('@/types');
    expect(types).toBeDefined();
    expect(types.FantasyStage).toBeUndefined(); // interface なので undefined
  });
});