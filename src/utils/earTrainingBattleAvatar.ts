import {
  DEFAULT_AVATAR_URL,
  EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS,
  EAR_TRAINING_ENEMY_AVATAR_URLS,
  EAR_TRAINING_PLAYER_AVATAR_URL,
} from '@/utils/constants';

/** dialogue_only での敵アバター用ステージ UUID（iOS `EarTrainingTutorialDialogueBattleDriver` と同値文字列が理想） */
export const EAR_TRAINING_TUTORIAL_DIALOGUE_STAGE_ID_FOR_AVATAR =
  'B0000000-0000-4000-8000-000000000001';

/**
 * `stage.id` と敵情報から耳コピバトル用の敵アバター URL を決める（クイズ等と同一ロジック）。
 */
export const resolveEarTrainingEnemyAvatarFromBattleSourceKey = (
  battleSourceKey: string,
): { url: string; flipX: boolean } => {
  let hash = 0;
  for (let index = 0; index < battleSourceKey.length; index += 1) {
    hash = ((hash << 5) - hash + battleSourceKey.charCodeAt(index)) | 0;
  }
  const avatarIndex = Math.abs(hash) % EAR_TRAINING_ENEMY_AVATAR_URLS.length;
  const url = EAR_TRAINING_ENEMY_AVATAR_URLS[avatarIndex] ?? DEFAULT_AVATAR_URL;
  return {
    url,
    flipX: EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS.has(url),
  };
};

export const buildEarTrainingEnemyBattleSourceKey = (
  stageId: string,
  enemy: { id?: string | null; name?: string | null } | null,
): string => `${stageId}:${enemy?.id ?? enemy?.name ?? 'enemy'}`;

/** チュートリアル `dialogue_only` の相方（ジャ爺）Web 用（iOS `survival_jajii` と同素材） */
export const EAR_TRAINING_PARTNER_JAJII_AVATAR_URL = '/default_avater/jajii.png';

/** ジャ爺立ち絵の横向き調整が必要なら true にする */
export const EAR_TRAINING_PARTNER_JAJII_AVATAR_FLIP_X = false;

export const earTrainingPartnerJajiiDisplayName = (isEnglishCopy: boolean): string => (
  isEnglishCopy ? 'Jazz Elder' : 'ジャ爺'
);

export { EAR_TRAINING_PLAYER_AVATAR_URL };
