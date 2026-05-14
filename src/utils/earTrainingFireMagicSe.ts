/**
 * コードヴォイシング戦闘演出用の「炎魔法」SE。
 * `public/火炎魔法1.mp3` を Web Audio API で低遅延再生する。
 */

const FILENAME_ENC = encodeURIComponent('火炎魔法1.mp3');
const PLAY_THROTTLE_MS = 60;
const DEFAULT_GAIN = 0.9;

let audioContext: AudioContext | null = null;
let cachedBuffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer | null> | null = null;
/** `playFireMagicSe` 呼び出しの連打抑止（非同期読み込み前に判定） */
let lastPlayInvocationMs = 0;

const getAssetUrl = (): string => {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${FILENAME_ENC}`;
};

const ensureContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!audioContext) {
    const Ctor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    audioContext = new Ctor();
  }
  return audioContext;
};

const loadBufferInner = async (): Promise<AudioBuffer | null> => {
  try {
    const ctx = ensureContext();
    if (!ctx) {
      return null;
    }
    const res = await fetch(getAssetUrl());
    if (!res.ok) {
      return null;
    }
    const arr = await res.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arr.slice(0));
    cachedBuffer = decoded;
    return decoded;
  } catch {
    return null;
  }
};

export const unlockFireMagicSe = (): void => {
  try {
    const ctx = ensureContext();
    if (!ctx) {
      return;
    }
    void ctx.resume().catch(() => undefined);
  } catch {
    // 音声未対応環境など
  }
};

export const preloadFireMagicSe = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (cachedBuffer) {
    return;
  }
  if (!loadPromise) {
    loadPromise = loadBufferInner();
  }
};

/** @param linearGain 線形ゲイン（0〜1）。未指定は 0.9 */
export const playFireMagicSe = (linearGain?: number): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const invocationNow =
    typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (invocationNow - lastPlayInvocationMs < PLAY_THROTTLE_MS) {
    return;
  }
  lastPlayInvocationMs = invocationNow;

  preloadFireMagicSe();

  void (async () => {
    try {
      const ctx = ensureContext();
      if (!ctx) {
        return;
      }

      let buf = cachedBuffer;
      if (!buf && loadPromise) {
        buf = await loadPromise;
      }
      if (!buf) {
        return;
      }

      await ctx.resume();

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      const gain = linearGain ?? DEFAULT_GAIN;
      gainNode.gain.value = Math.min(1, Math.max(0, Number.isFinite(gain) ? gain : DEFAULT_GAIN));
      source.buffer = buf;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(0);
    } catch {
      // フェイルサイレント
    }
  })();
};
