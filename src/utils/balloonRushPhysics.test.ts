import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import {
  applyBalloonMeleeHits,
  createBalloonRushPhysicsState,
  tickBalloonRushPhysics,
} from '@/utils/balloonRushPhysics';
import { BALLOON_RUSH_MAP_CONFIG } from '@/utils/balloonRushMap';
import type { PlayerState } from '@/components/survival/SurvivalTypes';

const stageStub: BalloonRushResolvedStage = {
  id: 'test',
  slug: 'test',
  title: 'Test',
  titleEn: 'Test',
  stageType: 'random',
  chordSuffix: 'major',
  rootPattern: null,
  allowedChords: ['Dm7'],
  chordProgression: null,
  timeLimitSec: 90,
  popQuota: 20,
  balloonLifetimeSec: 10,
  maxConcurrent: 5,
  respawnDelaySec: 5,
  bgmUrl: null,
  keyFifths: 0,
};

const playerStub = (x: number, y: number): PlayerState => ({
  x,
  y,
  direction: 'right',
  stats: {
    aAtk: 50,
    bAtk: 50,
    cAtk: 20,
    speed: 6,
    reloadMagic: 0,
    hp: 9999,
    maxHp: 9999,
    def: 10,
    time: 5,
    aBulletCount: 5,
    luck: 0,
  },
  skills: {
    bRangeBonus: 0,
    bKnockbackBonus: 0,
    multiHitLevel: 0,
    bufferLevel: 0,
    debufferLevel: 0,
    zekkouchou: false,
    haisui: false,
  },
  magics: { thunder: 0, ice: 0, fire: 0, heal: 0 },
  statusEffects: [],
  level: 1,
  exp: 0,
  expToNextLevel: 100,
});

describe('balloonRushPhysics', () => {
  it('initial spawn centers around player position', () => {
    const center = {
      x: BALLOON_RUSH_MAP_CONFIG.width / 2,
      y: BALLOON_RUSH_MAP_CONFIG.height / 2,
    };
    const physics = createBalloonRushPhysicsState(center, stageStub, () => 0.5);
    const live = physics.balloons.filter(b => !b.popped);
    expect(live.length).toBe(5);
    for (const b of live) {
      expect(b.x).toBeGreaterThan(0);
      expect(b.x).toBeLessThan(BALLOON_RUSH_MAP_CONFIG.width);
      expect(b.y).toBeGreaterThan(0);
      expect(b.y).toBeLessThan(BALLOON_RUSH_MAP_CONFIG.height);
    }
  });

  it('melee hit increments popped and schedules respawn without effects', () => {
    const balloon = {
      id: 'solo',
      x: 200,
      y: 150,
      spawnedAtSec: 0,
      lifetimeSec: 10,
      popped: false,
    };
    let physics = createBalloonRushPhysicsState(
      { x: BALLOON_RUSH_MAP_CONFIG.width / 2, y: BALLOON_RUSH_MAP_CONFIG.height / 2 },
      stageStub,
      () => 0.5,
    );
    physics = { ...physics, balloons: [balloon] };

    const player = playerStub(160, 150);
    physics = applyBalloonMeleeHits(physics, player, 0, stageStub, 1000);
    expect(physics.popped).toBe(1);
    expect(physics.respawnDue.length).toBe(1);
    expect(physics.respawnDue[0]).toBe(stageStub.respawnDelaySec);
    expect(physics.balloons[0]?.popped).toBe(true);
  });

  it('does not auto-pop balloons when lifetime expires', () => {
    const center = {
      x: BALLOON_RUSH_MAP_CONFIG.width / 2,
      y: BALLOON_RUSH_MAP_CONFIG.height / 2,
    };
    const physics = createBalloonRushPhysicsState(center, stageStub, () => 0.5);
    const player = playerStub(center.x, center.y);
    const elapsed = stageStub.balloonLifetimeSec + 0.01;
    const ticked = tickBalloonRushPhysics(
      physics,
      player,
      elapsed,
      stageStub,
      5000,
      0.016,
      () => 0.5,
    );
    expect(ticked.physics.popped).toBe(0);
    expect(ticked.physics.balloons.every(b => !b.popped)).toBe(true);
    expect(ticked.physics.respawnDue.length).toBe(0);
  });
});
