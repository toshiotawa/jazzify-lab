import type { EarTrainingStage } from '@/types';

/** OSMD 本番バトル: 1周あたりのターゲット数 N に対する敵HP（2周×平均50） */
const OSMD_COMBAT_HP_PER_TARGET = 100;

/** 正解ターゲットごとの与ダメージ（ランダム範囲） */
const OSMD_COMBAT_HIT_DAMAGE_MIN = 40;
const OSMD_COMBAT_HIT_DAMAGE_MAX = 60;

/** 本番 OSMD の固定ミス被ダメ（player_hp は DB のみ作者指定） */
export const OSMD_COMBAT_MISS_DAMAGE = 20;

export const osmdEnemyMaxHpForTargetCount = (targetCountPerLoop: number): number => {
  const safe = Math.max(0, Math.floor(targetCountPerLoop));
  return safe * OSMD_COMBAT_HP_PER_TARGET;
};

/** 正解1ヒット分の与ダメージ。`rng` はテスト用差し替え（既定は Math.random）。 */
/** チュートリアル以外の chord_osmd 本番でランタイム自動戦闘値を使う */
export const usesEarTrainingOsmdAutoCombatStats = (
  stage: Pick<EarTrainingStage, 'mode'>,
  hasTutorial: boolean,
): boolean => stage.mode === 'chord_osmd' && !hasTutorial;

export const rollOsmdHitDamage = (rng: () => number = Math.random): number => {
  const span = OSMD_COMBAT_HIT_DAMAGE_MAX - OSMD_COMBAT_HIT_DAMAGE_MIN + 1;
  const roll = Math.floor(rng() * span) + OSMD_COMBAT_HIT_DAMAGE_MIN;
  return Math.min(
    OSMD_COMBAT_HIT_DAMAGE_MAX,
    Math.max(OSMD_COMBAT_HIT_DAMAGE_MIN, roll),
  );
};
