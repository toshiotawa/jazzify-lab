/**
 * 耳コピバトル魔法演出用 SE。
 * `public/sfx/ear-training-battle/fire-magic-1.mp3` を同一オリジンで配信（CDN 未配置・Vite dev の cdn-proxy 無しでも再生可能）
 */
type EarTrainingBattleMagicSfxKind =
  | 'fireball'
  | 'snowflake'
  | 'lightning'
  | 'meteor'
  | 'quota';

const MAGIC_SFX_SAME_ORIGIN = '/sfx/ear-training-battle/fire-magic-1.mp3';

let sharedAudio: HTMLAudioElement | null = null;

const ensureAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!sharedAudio) {
    const el = new Audio(MAGIC_SFX_SAME_ORIGIN);
    el.preload = 'auto';
    void el.load();
    sharedAudio = el;
  }
  return sharedAudio;
};

/** 魔法エフェクト発火時のみ呼ぶ（詠唱・敵攻撃は除く）。同一音源を種別ごとに共用。 */
export const playEarTrainingBattleMagicSfx = (kind: EarTrainingBattleMagicSfxKind): void => {
  void kind;
  const audio = ensureAudio();
  if (!audio) {
    return;
  }
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // 自動再生制限など
    });
  } catch {
    // 同期エラーのみ
  }
};
