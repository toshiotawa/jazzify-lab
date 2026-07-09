/**
 * OSMD パリィ正解用の短い打撃 SE（Web Audio 合成。鍵盤音と帯域が被りにくい）。
 */

export type OsmdParrySeTier = 'normal' | 'chain' | 'finish';

const PLAY_THROTTLE_MS = 32;
const BASE_GAIN = 0.55;

let audioContext: AudioContext | null = null;
let lastPlayInvocationMs = 0;

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

export const unlockOsmdParrySe = (): void => {
  try {
    const ctx = ensureContext();
    if (!ctx) {
      return;
    }
    void ctx.resume().catch(() => undefined);
  } catch {
    // 音声未対応環境
  }
};

const tierParams = (tier: OsmdParrySeTier): { freq: number; decay: number; gain: number; noise: number } => {
  switch (tier) {
    case 'finish':
      return { freq: 1760, decay: 0.09, gain: 0.95, noise: 0.22 };
    case 'chain':
      return { freq: 1480, decay: 0.07, gain: 0.82, noise: 0.18 };
    default:
      return { freq: 1240, decay: 0.055, gain: 0.7, noise: 0.14 };
  }
};

const playSynthesizedHit = (ctx: AudioContext, tier: OsmdParrySeTier): void => {
  const params = tierParams(tier);
  const now = ctx.currentTime;

  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(params.freq, now);
  tone.frequency.exponentialRampToValueAtTime(params.freq * 0.55, now + params.decay);
  toneGain.gain.setValueAtTime(params.gain * BASE_GAIN, now);
  toneGain.gain.exponentialRampToValueAtTime(0.001, now + params.decay);
  tone.connect(toneGain);
  toneGain.connect(ctx.destination);
  tone.start(now);
  tone.stop(now + params.decay + 0.02);

  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * params.noise;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 2200;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(params.noise * BASE_GAIN, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + params.decay * 0.85);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + params.decay);
};

export const playOsmdParrySe = (tier: OsmdParrySeTier = 'normal'): void => {
  if (typeof window === 'undefined') {
    return;
  }
  const invocationNow =
    typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (invocationNow - lastPlayInvocationMs < PLAY_THROTTLE_MS) {
    return;
  }
  lastPlayInvocationMs = invocationNow;

  try {
    const ctx = ensureContext();
    if (!ctx) {
      return;
    }
    void ctx.resume().then(() => {
      playSynthesizedHit(ctx, tier);
    }).catch(() => undefined);
  } catch {
    // フェイルサイレント
  }
};
