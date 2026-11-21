import { defenseEnemyDancePose } from '@/game/defense/defenseEnemyDance';
describe('enemy stationary dance', () => {
  it('lifts between beats and returns to neutral', () => {
    expect(defenseEnemyDancePose(0, 0, 120).lift).toBeCloseTo(0);
    expect(defenseEnemyDancePose(0.25, 0, 120).lift).toBeGreaterThan(0);
  });
  it('staggered slots dance differently', () => {
    expect(defenseEnemyDancePose(0.25, 0, 120)).not.toEqual(defenseEnemyDancePose(0.25, 1, 120));
  });
});
