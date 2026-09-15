import {
  DEFENSE_FIREBALL_SPAWN_DELAY_SEC,
  DEFENSE_SKILL_POSE_FRAME_SEC,
  DEFENSE_SLASH_SEC,
} from '@/game/defense/defenseEnemyConfig';
import {
  DEFENSE_PLAYER_IDLE_URLS,
  DEFENSE_PLAYER_SKILL_POSE_URLS,
  DEFENSE_PLAYER_SLASH_URL,
  pickDefensePlayerPoseUrl,
  pickTrainingPlayerPoseUrl,
} from '@/game/defense/defensePlayerSprites';
import {
  createDefenseRuntime,
  DEFENSE_NO_SKILL_POSE,
  DEFENSE_NO_SLASH,
} from '@/game/defense/defenseTypes';
import { PLAYER_POSE_IMAGE_URLS } from '@/game/earTraining/canvas/earTrainingBattleBackground';

describe('pickDefensePlayerPoseUrl', () => {
  it('prefers skill pose over slash and guard', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    runtime.elapsedSec = 1;
    runtime.skillPoseStartSec = 0.8;
    runtime.slashAt = 0.9;
    runtime.guardPoseUntilSec = 2;

    expect(pickDefensePlayerPoseUrl(runtime)).toBe(DEFENSE_PLAYER_SKILL_POSE_URLS[2]);
  });

  it('shows slash pose during slash window', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    runtime.elapsedSec = 0.1;
    runtime.skillPoseStartSec = DEFENSE_NO_SKILL_POSE;
    runtime.slashAt = 0;
    runtime.guardPoseUntilSec = 1;

    expect(pickDefensePlayerPoseUrl(runtime)).toBe(DEFENSE_PLAYER_SLASH_URL);
  });

  it('shows guard pose after slash window ends', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    runtime.elapsedSec = DEFENSE_SLASH_SEC + 0.05;
    runtime.skillPoseStartSec = DEFENSE_NO_SKILL_POSE;
    runtime.slashAt = 0;
    runtime.guardPoseUntilSec = 1;

    expect(pickDefensePlayerPoseUrl(runtime)).toBe(PLAYER_POSE_IMAGE_URLS.guardD);
  });

  it('cycles idle frames in ping-pong order', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    runtime.skillPoseStartSec = DEFENSE_NO_SKILL_POSE;
    runtime.slashAt = DEFENSE_NO_SLASH;
    runtime.guardPoseUntilSec = 0;

    runtime.elapsedSec = 0;
    expect(pickDefensePlayerPoseUrl(runtime)).toBe(DEFENSE_PLAYER_IDLE_URLS[0]);

    runtime.elapsedSec = 0.28;
    expect(pickDefensePlayerPoseUrl(runtime)).toBe(DEFENSE_PLAYER_IDLE_URLS[1]);

    runtime.elapsedSec = 0.56;
    expect(pickDefensePlayerPoseUrl(runtime)).toBe(DEFENSE_PLAYER_IDLE_URLS[2]);

    runtime.elapsedSec = 0.84;
    expect(pickDefensePlayerPoseUrl(runtime)).toBe(DEFENSE_PLAYER_IDLE_URLS[1]);
  });

  it('maps skill frames at 80ms intervals', () => {
    const runtime = createDefenseRuntime(5, 120, 3, false, 'note');
    runtime.skillPoseStartSec = 1;
    runtime.slashAt = DEFENSE_NO_SLASH;
    runtime.guardPoseUntilSec = 0;

    runtime.elapsedSec = 1 + DEFENSE_SKILL_POSE_FRAME_SEC * 4;
    expect(pickDefensePlayerPoseUrl(runtime)).toBe(DEFENSE_PLAYER_SKILL_POSE_URLS[4]);
  });
});

describe('pickTrainingPlayerPoseUrl', () => {
  it('shows slash pose during slash window', () => {
    expect(pickTrainingPlayerPoseUrl(1.5, 1.74, 2.5)).toBe(DEFENSE_PLAYER_SLASH_URL);
  });

  it('shows guard pose after slash window ends', () => {
    expect(pickTrainingPlayerPoseUrl(DEFENSE_SLASH_SEC + 0.05, 0, 1)).toBe(
      PLAYER_POSE_IMAGE_URLS.guardD,
    );
  });

  it('cycles idle frames in ping-pong order', () => {
    expect(pickTrainingPlayerPoseUrl(0, 0, 0)).toBe(DEFENSE_PLAYER_IDLE_URLS[0]);
    expect(pickTrainingPlayerPoseUrl(0.28, 0, 0)).toBe(DEFENSE_PLAYER_IDLE_URLS[1]);
    expect(pickTrainingPlayerPoseUrl(0.56, 0, 0)).toBe(DEFENSE_PLAYER_IDLE_URLS[2]);
    expect(pickTrainingPlayerPoseUrl(0.84, 0, 0)).toBe(DEFENSE_PLAYER_IDLE_URLS[1]);
  });
});

describe('DEFENSE_FIREBALL_SPAWN_DELAY_SEC', () => {
  it('matches Frame5 timing at 80ms per frame', () => {
    expect(DEFENSE_FIREBALL_SPAWN_DELAY_SEC).toBeCloseTo(DEFENSE_SKILL_POSE_FRAME_SEC * 4);
  });
});
