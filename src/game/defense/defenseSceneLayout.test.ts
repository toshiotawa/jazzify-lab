import {
  DEFENSE_PLAYER_X_RATIO,
  DEFENSE_SPAWN_X_RATIO,
  defenseLogicalToScreenX,
  getDefenseEnemyLayout,
} from '@/game/defense/defenseSceneLayout';
import { DEFENSE_ENEMY_CONFIG } from '@/game/defense/defenseEnemyConfig';
import {
  DEFENSE_PLAYER_X,
  DEFENSE_SPAWN_X,
} from '@/game/defense/defenseTypes';

describe('defenseSceneLayout', () => {
  it('maps player logical X to player screen ratio', () => {
    const width = 1000;
    expect(defenseLogicalToScreenX(width, DEFENSE_PLAYER_X)).toBeCloseTo(width * DEFENSE_PLAYER_X_RATIO);
  });

  it('maps spawn logical X to spawn screen ratio', () => {
    const width = 1000;
    expect(defenseLogicalToScreenX(width, DEFENSE_SPAWN_X)).toBeCloseTo(width * DEFENSE_SPAWN_X_RATIO);
  });

  it.each([0.4, 0.525, 1, 1.5])('preserves the leading edge, foot and hit center at scale %s', scale => {
    for (const type of ['goblin', 'skeleton', 'wolf', 'golem', 'dragon'] as const) {
      const config = DEFENSE_ENEMY_CONFIG[type];
      const oldHeight = config.spriteHeight * scale;
      const oldWidth = oldHeight * config.aspectRatio;
      const layout = getDefenseEnemyLayout(type, scale);
      expect(layout.centerDx - 0.44 * layout.width).toBeCloseTo(-0.44 * oldWidth);
      expect(layout.footDy - layout.height / 28).toBeCloseTo(-oldHeight / 28);
      expect(-oldHeight / 2 + layout.centerDy).toBeCloseTo(layout.footDy - layout.height / 2);
      expect(layout.height).toBeCloseTo(getDefenseEnemyLayout(type, 0.5).height);
    }
    const slime = getDefenseEnemyLayout('slime', scale);
    expect(slime.height).toBe(40 * scale);
    expect(slime.centerDx).toBe(0);
    expect(slime.centerDy).toBe(0);
  });

  it('is linear between player and spawn', () => {
    const width = 800;
    const midLogical = (DEFENSE_PLAYER_X + DEFENSE_SPAWN_X) / 2;
    const midScreen = defenseLogicalToScreenX(width, midLogical);
    const playerScreen = defenseLogicalToScreenX(width, DEFENSE_PLAYER_X);
    const spawnScreen = defenseLogicalToScreenX(width, DEFENSE_SPAWN_X);
    expect(midScreen).toBeCloseTo((playerScreen + spawnScreen) / 2);
  });
});
