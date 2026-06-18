import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  resolveBlockBossMaxHp,
  resolveBlockKillQuota,
  resolveBlockPlayerMaxHp,
} from './survivalBlockBalance';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import * as stageDefs from '@/components/survival/SurvivalStageDefinitions';
import {
  PHRASES_STAGE_PLAYER_MAX_HP,
  STAGE_FIRST_BLOCK_BOSS_MAX_HP,
  STAGE_KILL_QUOTA,
  STAGE_PLAYER_MAX_HP,
} from '@/components/survival/SurvivalStageDefinitions';
import { BOSS_MAX_HP } from '@/components/survival/boss/SurvivalBossTypes';
import {
  DEFAULT_SURVIVAL_MAP_CATEGORY,
  type SurvivalMapCategory,
} from '@/components/survival/SurvivalTypes';

vi.mock('@/components/survival/descent/descentBlocks', () => ({
  getBlockForStage: (stageNumber: number, category: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY) => {
    if (category !== 'basic') return undefined;
    if (stageNumber <= 103) return { blockIndex: 0 };
    if (stageNumber === 104) return { blockIndex: 0 };
    if (stageNumber <= 109) return { blockIndex: 1 };
    return undefined;
  },
}));

vi.mock('@/components/survival/SurvivalStageDefinitions', async (importOriginal) => {
  const actual = await importOriginal<typeof stageDefs>();
  return {
    ...actual,
    isBlockLastStage: (stageNumber: number, category: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY) =>
      category === 'basic' && (stageNumber === 104 || stageNumber === 109),
  };
});

const stubStage = (
  partial: Partial<StageDefinition>,
): StageDefinition => ({
  stageNumber: 999,
  name: '',
  nameEn: '',
  difficulty: 'easy',
  stageType: 'random',
  playMode: 'survival',
  chordSuffix: '',
  chordDisplayName: '',
  chordDisplayNameEn: '',
  rootPattern: null,
  rootPatternName: '',
  rootPatternNameEn: '',
  allowedChords: [],
  blockKey: 'major',
  mapCategory: 'basic',
  grandStaffMode: false,
  ...partial,
});

describe('survivalBlockBalance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fallback player HP: phrases vs basic', () => {
    expect(resolveBlockPlayerMaxHp(stubStage({ mapCategory: 'basic', blockKey: 'major' }))).toBe(
      STAGE_PLAYER_MAX_HP,
    );
    expect(resolveBlockPlayerMaxHp(stubStage({ mapCategory: 'phrases', blockKey: 'foo' }))).toBe(
      PHRASES_STAGE_PLAYER_MAX_HP,
    );
  });

  it('survivalStageDbBalanceFor overrides player max HP', () => {
    vi.spyOn(stageDefs, 'survivalStageDbBalanceFor').mockReturnValue({ playerMaxHp: 1234 });
    expect(resolveBlockPlayerMaxHp(stubStage({ mapCategory: 'basic', blockKey: 'major' }))).toBe(1234);
  });

  it('fallback kill quota: first-block regular vs other', () => {
    expect(
      resolveBlockKillQuota(stubStage({ stageNumber: 101, mapCategory: 'basic', blockKey: 'major' })),
    ).toBe(10);
    expect(
      resolveBlockKillQuota(stubStage({ stageNumber: 105, mapCategory: 'basic', blockKey: 'M7' })),
    ).toBe(STAGE_KILL_QUOTA);
    expect(
      resolveBlockKillQuota(stubStage({ stageNumber: 104, mapCategory: 'basic', blockKey: 'major' })),
    ).toBe(STAGE_KILL_QUOTA);
  });

  it('survivalStageDbBalanceFor overrides kill quota', () => {
    vi.spyOn(stageDefs, 'survivalStageDbBalanceFor').mockReturnValue({ killQuota: 77 });
    expect(
      resolveBlockKillQuota(stubStage({ stageNumber: 101, mapCategory: 'basic', blockKey: 'major' })),
    ).toBe(77);
  });

  it('fallback boss HP: first block vs normal vs phrases', () => {
    expect(
      resolveBlockBossMaxHp(stubStage({ stageNumber: 104, mapCategory: 'basic', blockKey: 'major' })),
    ).toBe(STAGE_FIRST_BLOCK_BOSS_MAX_HP);
    expect(
      resolveBlockBossMaxHp(stubStage({ stageNumber: 109, mapCategory: 'basic', blockKey: 'M7' })),
    ).toBe(BOSS_MAX_HP);
    expect(
      resolveBlockBossMaxHp(stubStage({ stageNumber: 109, mapCategory: 'phrases', blockKey: 'x' })),
    ).toBe(BOSS_MAX_HP * 5);
  });

  it('survivalStageDbBalanceFor overrides boss max HP', () => {
    vi.spyOn(stageDefs, 'survivalStageDbBalanceFor').mockReturnValue({ bossMaxHp: 88888 });
    expect(
      resolveBlockBossMaxHp(stubStage({ stageNumber: 104, mapCategory: 'basic', blockKey: 'major' })),
    ).toBe(88888);
  });
});
