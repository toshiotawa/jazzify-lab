/** 風船破裂 SE (`public/Balloon.mp3`)。ゲーム開始時に preload し、ヒット時にワンショット再生。 */

const BALLOON_POP_URL = '/Balloon.mp3';
/** 小さめの音量（SE 全体より控えめ） */
const POP_GAIN = 0.28;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loadPromise: Promise<void> | null = null;

const ensureContext = (): AudioContext | null => {
  if (ctx) return ctx;
  try {
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor({ latencyHint: 'interactive' });
    return ctx;
  } catch {
    return null;
  }
};

export const preloadBalloonRushPopAudio = (): void => {
  if (buffer || loadPromise) return;
  loadPromise = (async () => {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    try {
      const resp = await fetch(BALLOON_POP_URL);
      const arr = await resp.arrayBuffer();
      buffer = await audioCtx.decodeAudioData(arr.slice(0));
    } catch {
      buffer = null;
    }
  })();
};

export const playBalloonRushPop = (): void => {
  void (async () => {
    if (!buffer && loadPromise) {
      await loadPromise;
    }
    const audioCtx = ensureContext();
    if (!audioCtx || !buffer) {
      try {
        const audio = new Audio(BALLOON_POP_URL);
        audio.volume = POP_GAIN;
        void audio.play();
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const src = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      gain.gain.value = POP_GAIN;
      src.buffer = buffer;
      src.connect(gain);
      gain.connect(audioCtx.destination);
      src.start(0);
      src.addEventListener('ended', () => {
        try {
          src.disconnect();
          gain.disconnect();
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
  })();
};
