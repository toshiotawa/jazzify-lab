/**
 * Defense mode player sprite URLs and pose selection (pure, allocation-free).
 */
import { BATTLE_IDLE_FRAME_MS, HERO_IDLE_FRAMES, HERO_SLASH_FRAMES } from '@/game/earTraining/battlePixelSprites';
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

export const DEFENSE_PLAYER_IDLE_URLS = HERO_IDLE_FRAMES;

const slashFrame = (age: number): string => HERO_SLASH_FRAMES[Math.min(
  HERO_SLASH_FRAMES.length - 1, Math.floor(age / DEFENSE_SLASH_SEC * HERO_SLASH_FRAMES.length),
)];

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
  ...HERO_SLASH_FRAMES,
  PLAYER_POSE_IMAGE_URLS.guardD,
  ...DEFENSE_PLAYER_SKILL_POSE_URLS,
] as const;

const pickIdleFrameIndex = (elapsedSec: number): number => {
  const frame = Math.floor(elapsedSec * 1000 / BATTLE_IDLE_FRAME_MS + 1e-9);
  return frame % HERO_IDLE_FRAMES.length;
};

const pickDefenseIdlePoseUrl = (elapsedSec: number): string => (
  DEFENSE_PLAYER_IDLE_URLS[pickIdleFrameIndex(elapsedSec)]
);

/** Training mode: slash > guard > idle cycle (no skill poses). */
export const pickTrainingPlayerPoseUrl = (
  elapsedSec: number,
  slashUntilSec: number,
  guardPoseUntilSec: number,
): string => {
  if (slashUntilSec > 0) {
    const remaining = slashUntilSec - elapsedSec;
    if (remaining > 0 && remaining <= DEFENSE_SLASH_SEC) {
      return slashFrame(DEFENSE_SLASH_SEC - remaining);
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
      return slashFrame(slashAge);
    }
  }

  if (runtime.guardPoseUntilSec > 0 && runtime.elapsedSec < runtime.guardPoseUntilSec) {
    return PLAYER_POSE_IMAGE_URLS.guardD;
  }

  return pickDefenseIdlePoseUrl(runtime.elapsedSec);
};

export interface ScenePlayerPoseCache {
  lastResolvedPlayerPose: HTMLImageElement | null;
}

export const createScenePlayerPoseCache = (): ScenePlayerPoseCache => ({
  lastResolvedPlayerPose: null,
});

export const resolveScenePlayerPoseImage = (
  loadedImages: Map<string, HTMLImageElement>,
  cache: ScenePlayerPoseCache,
  poseUrl: string,
): HTMLImageElement | undefined => {
  const requested = loadedImages.get(poseUrl);
  if (requested) {
    cache.lastResolvedPlayerPose = requested;
    return requested;
  }
  return cache.lastResolvedPlayerPose ?? undefined;
};

