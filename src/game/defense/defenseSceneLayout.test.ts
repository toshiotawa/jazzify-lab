import {
  DEFENSE_PLAYER_X_RATIO,
  DEFENSE_SPAWN_X_RATIO,
  defenseLogicalToScreenX,
} from '@/game/defense/defenseSceneLayout';
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

  it('is linear between player and spawn', () => {
    const width = 800;
    const midLogical = (DEFENSE_PLAYER_X + DEFENSE_SPAWN_X) / 2;
    const midScreen = defenseLogicalToScreenX(width, midLogical);
    const playerScreen = defenseLogicalToScreenX(width, DEFENSE_PLAYER_X);
    const spawnScreen = defenseLogicalToScreenX(width, DEFENSE_SPAWN_X);
    expect(midScreen).toBeCloseTo((playerScreen + spawnScreen) / 2);
  });
});
