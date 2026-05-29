import { describe, expect, it } from 'vitest';
import { applyJajiiGaugeSpecialAtWorld } from '@/components/survival/jajii/applyJajiiSpecialShockwave';
import { createBossBattleState } from '@/components/survival/boss/SurvivalBossEngine';
import type { SurvivalGameState } from '@/components/survival/SurvivalTypes';
import { COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_PRIMARY } from '@/utils/compositePhraseDamage';

const makePlayer = () => ({
  x: 400,
  y: 300,
  direction: 'right' as const,
  stats: {
    aAtk: 10,
    bAtk: 35,
    cAtk: 20,
    speed: 300,
    reloadMagic: 0,
    hp: 1000,
    maxHp: 1000,
    def: 0,
    time: 0,
    aBulletCount: 1,
    luck: 0,
  },
  skills: {
    aPenetration: false,
    bKnockbackBonus: 0,
    bRangeBonus: 0,
    bDeflect: false,
    multiHitLevel: 0,
    expBonusLevel: 0,
    haisuiNoJin: false,
    zekkouchou: false,
    alwaysHaisuiNoJin: false,
    alwaysZekkouchou: false,
    autoSelect: false,
  },
  magics: {
    buffer: 0,
    debuffer: 0,
    hint: 0,
    heal: 0,
    thunder: 0,
    reload: 0,
  },
  statusEffects: [],
  level: 1,
  exp: 0,
});

const makeDraft = (): SurvivalGameState => ({
  isPlaying: true,
  isPaused: false,
  isGameOver: false,
  isLevelingUp: false,
  wave: { number: 1, enemiesRemaining: 0, spawnRate: 1 },
  elapsedTime: 0,
  player: makePlayer(),
  enemies: [],
  projectiles: [],
  enemyProjectiles: [],
  codeSlots: {
    current: [
      { chord: null, correctNotes: [], isEnabled: true, isCompleted: false, timer: 0 },
      { chord: null, correctNotes: [], isEnabled: true, isCompleted: false, timer: 0 },
      { chord: null, correctNotes: [], isEnabled: false, isCompleted: false, timer: 0 },
      { chord: null, correctNotes: [], isEnabled: false, isCompleted: false, timer: 0 },
    ],
    next: [
      { chord: null, correctNotes: [], isEnabled: true, isCompleted: false, timer: 0 },
      { chord: null, correctNotes: [], isEnabled: true, isCompleted: false, timer: 0 },
      { chord: null, correctNotes: [], isEnabled: false, isCompleted: false, timer: 0 },
      { chord: null, correctNotes: [], isEnabled: false, isCompleted: false, timer: 0 },
    ],
  },
  damageTexts: [],
  items: [],
  comboCount: 10,
  comboGauge: 0,
  comboReady: false,
  lastComboHitAt: 0,
  aSlotCooldown: 0,
  enemiesDefeated: 0,
  pendingLevelUps: 0,
  levelUpOptions: [],
});

describe('applyJajiiGaugeSpecialAtWorld explicitMeleeDamage', () => {
  it('uses composite explicit damage for boss and minions instead of stat BAtk', () => {
    const draft = makeDraft();
    const bossBattle = createBossBattleState('B', 0);
    const jajiiX = draft.player.x;
    const jajiiY = draft.player.y;
    bossBattle.boss.x = jajiiX;
    bossBattle.boss.y = jajiiY;
    bossBattle.minions.push({
      id: 'minion_test',
      kind: 'bomber',
      x: jajiiX,
      y: jajiiY,
      hp: 35,
      maxHp: 35,
      speed: 100,
      fuseStartedAt: null,
      explodeAt: null,
      spawnedAt: 0,
    });
    const initialBossHp = bossBattle.boss.hp;

    applyJajiiGaugeSpecialAtWorld({
      draft,
      jajiiX,
      jajiiY,
      radiusMultiplier: 1,
      isBossStage: true,
      bossBattle,
      queueShockwave: () => {},
      explicitMeleeDamage: COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_PRIMARY,
    });

    expect(bossBattle.boss.hp).toBe(initialBossHp - COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_PRIMARY);
    expect(bossBattle.minions).toHaveLength(0);
    const bossDamageText = draft.damageTexts.find((t) => t.damage === COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_PRIMARY);
    expect(bossDamageText).toBeDefined();
  });

  it('falls back to stat-based damage when explicitMeleeDamage is omitted', () => {
    const draft = makeDraft();
    const bossBattle = createBossBattleState('B', 0);
    const jajiiX = draft.player.x;
    const jajiiY = draft.player.y;
    bossBattle.boss.x = jajiiX;
    bossBattle.boss.y = jajiiY;
    const initialBossHp = bossBattle.boss.hp;

    applyJajiiGaugeSpecialAtWorld({
      draft,
      jajiiX,
      jajiiY,
      radiusMultiplier: 1,
      isBossStage: true,
      bossBattle,
      queueShockwave: () => {},
    });

    const dealt = initialBossHp - bossBattle.boss.hp;
    expect(dealt).toBeGreaterThan(0);
    expect(dealt).not.toBe(COMPOSITE_PHRASE_FINISH_RANGE_DAMAGE_PRIMARY);
  });
});
