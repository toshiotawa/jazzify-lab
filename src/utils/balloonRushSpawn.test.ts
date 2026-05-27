import {
  BETWEEN_BALLOONS_MIN_PX,
  INITIAL_FAR_FROM_PLAYER_MIN_PX,
  INITIAL_NEAR_PLAYER_MAX_PX,
  INITIAL_NEAR_PLAYER_MIN_PX,
  MAP_MARGIN_PX,
  pickInitialFivePositions,
  pickRespawnPosition,
  hypotDist,
  RESPAWN_FROM_PLAYER_MIN_PX,
} from './balloonRushSpawn';
import { BALLOON_RUSH_MAP_CONFIG } from './balloonRushMap';

describe('balloonRushSpawn', () => {
  it('initial five satisfy distance invariants (many random trials)', () => {
    const player = {
      x: BALLOON_RUSH_MAP_CONFIG.width / 2,
      y: BALLOON_RUSH_MAP_CONFIG.height / 2,
    };
    for (let trial = 0; trial < 80; trial += 1) {
      const rng = Math.random;
      const positions = pickInitialFivePositions(player, MAP_MARGIN_PX, rng);
      expect(positions.length).toBe(5);
      const d = hypotDist(player, positions[0]);
      expect(d).toBeGreaterThanOrEqual(INITIAL_NEAR_PLAYER_MIN_PX - 1);
      expect(d).toBeLessThanOrEqual(INITIAL_NEAR_PLAYER_MAX_PX + 120);
      for (let i = 1; i < 5; i += 1) {
        expect(hypotDist(player, positions[i])).toBeGreaterThanOrEqual(INITIAL_FAR_FROM_PLAYER_MIN_PX - 1);
      }
      for (let i = 0; i < 5; i += 1) {
        for (let j = i + 1; j < 5; j += 1) {
          expect(hypotDist(positions[i], positions[j])).toBeGreaterThanOrEqual(BETWEEN_BALLOONS_MIN_PX - 1);
        }
      }
    }
  });

  it('pickRespawnPosition rejects crowded map or honors minimums', () => {
    const player = { x: 100, y: 100 };
    const existing = [
      { x: BALLOON_RUSH_MAP_CONFIG.width - 80, y: BALLOON_RUSH_MAP_CONFIG.height - 80 },
      { x: BALLOON_RUSH_MAP_CONFIG.width - 75, y: BALLOON_RUSH_MAP_CONFIG.height - 75 },
    ];
    const p = pickRespawnPosition(player, existing, MAP_MARGIN_PX, Math.random);
    if (p) {
      expect(hypotDist(player, p)).toBeGreaterThanOrEqual(RESPAWN_FROM_PLAYER_MIN_PX - 2);
      for (const o of existing) {
        expect(hypotDist(p, o)).toBeGreaterThanOrEqual(BETWEEN_BALLOONS_MIN_PX - 2);
      }
    }
  });
});
