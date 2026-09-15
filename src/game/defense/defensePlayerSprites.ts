/**
 * Defense mode player sprite URLs and pose selection (pure, allocation-free).
 */
import { PLAYER_POSE_IMAGE_URLS } from '@/game/earTraining/canvas/earTrainingBattleBackground';
import {
  DEFENSE_SKILL_POSE_FRAME_COUNT,
  DEFENSE_SKILL_POSE_FRAME_SEC,
  DEFENSE_SLASH_SEC,
} from '@/game/defense/defenseEnemyConfig';
import type { DefenseRuntime } from '@/game/defense/defenseTypes';
import {
  DEFENSE_NO_SKILL_POSE,
  DEFENSE_NO_SLASH,
} from '@/game/defense/defenseTypes';

export const DEFENSE_PLAYER_IDLE_URLS = [
  '/defense/player/idle_1.webp',
  '/defense/player/idle_2.webp',
  '/defense/player/idle_3.webp',
] as const;

export const DEFENSE_PLAYER_SLASH_URL = '/defense/player/slash.webp';

export const DEFENSE_PLAYER_SKILL_POSE_URLS = [
  PLAYER_POSE_IMAGE_URLS.skill1,
  PLAYER_POSE_IMAGE_URLS.skill2,
  PLAYER_POSE_IMAGE_URLS.skill3,
  PLAYER_POSE_IMAGE_URLS.skill4,
  PLAYER_POSE_IMAGE_URLS.skill5,
  PLAYER_POSE_IMAGE_URLS.skill6,
] as const;

export const DEFENSE_PLAYER_SCENE_IMAGE_URLS = [
  ...DEFENSE_PLAYER_IDLE_URLS,
  DEFENSE_PLAYER_SLASH_URL,
  PLAYER_POSE_IMAGE_URLS.guardD,
  ...DEFENSE_PLAYER_SKILL_POSE_URLS,
] as const;

const DEFENSE_IDLE_FRAME_SEC = 0.28;
const DEFENSE_IDLE_PING_PONG = [0, 1, 2, 1] as const;

const pickIdleFrameIndex = (elapsedSec: number): number => {
  const frame = Math.floor(elapsedSec / DEFENSE_IDLE_FRAME_SEC + 1e-9);
  return DEFENSE_IDLE_PING_PONG[frame % DEFENSE_IDLE_PING_PONG.length];
};

export const pickDefenseIdlePoseUrl = (elapsedSec: number): string => (
  DEFENSE_PLAYER_IDLE_URLS[pickIdleFrameIndex(elapsedSec)]
);

/** Training mode: slash > guard > idle ping-pong (no skill poses). */
export const pickTrainingPlayerPoseUrl = (
  elapsedSec: number,
  slashUntilSec: number,
  guardPoseUntilSec: number,
): string => {
  if (slashUntilSec > 0) {
    const remaining = slashUntilSec - elapsedSec;
    if (remaining > 0 && remaining <= DEFENSE_SLASH_SEC) {
      return DEFENSE_PLAYER_SLASH_URL;
    }
  }

  if (guardPoseUntilSec > 0 && elapsedSec < guardPoseUntilSec) {
    return PLAYER_POSE_IMAGE_URLS.guardD;
  }

  return pickDefenseIdlePoseUrl(elapsedSec);
};

export const pickDefensePlayerPoseUrl = (runtime: DefenseRuntime): string => {
  if (runtime.skillPoseStartSec >= 0) {
    const skillAge = runtime.elapsedSec - runtime.skillPoseStartSec;
    const skillFrame = Math.floor(skillAge / DEFENSE_SKILL_POSE_FRAME_SEC);
    if (skillFrame >= 0 && skillFrame < DEFENSE_SKILL_POSE_FRAME_COUNT) {
      return DEFENSE_PLAYER_SKILL_POSE_URLS[skillFrame];
    }
  }

  if (runtime.slashAt !== DEFENSE_NO_SLASH) {
    const slashAge = runtime.elapsedSec - runtime.slashAt;
    if (slashAge >= 0 && slashAge <= DEFENSE_SLASH_SEC) {
      return DEFENSE_PLAYER_SLASH_URL;
    }
  }

  if (runtime.guardPoseUntilSec > 0 && runtime.elapsedSec < runtime.guardPoseUntilSec) {
    return PLAYER_POSE_IMAGE_URLS.guardD;
  }

  return pickDefenseIdlePoseUrl(runtime.elapsedSec);
};

