/**
 * 耳コピバトル魔法演出用 SE（R2 / jazzify-cdn 配信。開発時は Vite `/cdn-proxy` 経由）
 */
type EarTrainingBattleMagicSfxKind =
  | 'fireball'
  | 'snowflake'
  | 'lightning'
  | 'meteor'
  | 'quota';

const CDN_HOST = 'https://jazzify-cdn.com';
const MAGIC_SFX_PATH = '/sfx/ear-training-battle/fire-magic-1.mp3';

const toPlaybackUrl = (absoluteUrl: string): string => {
  if (absoluteUrl.startsWith(CDN_HOST)) {
    return `/cdn-proxy${absoluteUrl.slice(CDN_HOST.length)}`;
  }
  return absoluteUrl;
};

const magicUrl = (): string => toPlaybackUrl(`${CDN_HOST}${MAGIC_SFX_PATH}`);

let sharedAudio: HTMLAudioElement | null = null;

const ensureAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!sharedAudio) {
    const el = new Audio(magicUrl());
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
    void audio.play();
  } catch {
    // ブラウザの自動再生制限などは無視
  }
};
