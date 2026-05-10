/**
 * LessonMapAudio
 * ------------------------------------------------------
 * レッスンモードの「学びの旅マップ」(コース詳細画面) 専用オーディオマネージャ。
 * SurvivalMapAudio とは独立させ、BGM URL と localStorage キーを別にしている。
 */

import { getWindow } from '@/platform';

const CDN_HOST = 'https://jazzify-cdn.com';

const toProxyUrl = (url: string): string => {
  if (url.startsWith(CDN_HOST)) {
    return '/cdn-proxy' + url.slice(CDN_HOST.length);
  }
  return url;
};

const LS_BGM_VOLUME = 'lesson_map_bgm_volume_v1';
const LS_BGM_MUTE = 'lesson_map_bgm_mute_v1';

const DEFAULT_BGM_URL = 'https://jazzify-cdn.com/fantasy-bgm/ab2d7f15-c19f-4222-872c-415dbc3c5638.mp3';
const DEFAULT_BGM_VOLUME = 0.3;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

const readStoredNumber = (key: string, fallback: number): number => {
  try {
    const raw = getWindow().localStorage?.getItem(key);
    if (raw == null) return fallback;
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) return fallback;
    return clamp01(num);
  } catch {
    return fallback;
  }
};

const readStoredBool = (key: string, fallback: boolean): boolean => {
  try {
    const raw = getWindow().localStorage?.getItem(key);
    if (raw == null) return fallback;
    return raw === '1' || raw === 'true';
  } catch {
    return fallback;
  }
};

const writeStored = (key: string, value: string): void => {
  try {
    getWindow().localStorage?.setItem(key, value);
  } catch {
    /* ignore */
  }
};

/** コース切替時などの一時的な unmount/remount に備えた猶予時間(ms) */
const STOP_GRACE_PERIOD_MS = 600;

class LessonMapAudioImpl {
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmFadeRaf: number | null = null;
  private bgmCurrentUrl = '';
  private bgmRequestedPlaying = false;
  private pendingStopTimer: ReturnType<typeof setTimeout> | null = null;

  private bgmVolume: number = readStoredNumber(LS_BGM_VOLUME, DEFAULT_BGM_VOLUME);
  private muted: boolean = readStoredBool(LS_BGM_MUTE, false);

  getBgmVolume(): number {
    return this.bgmVolume;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setBgmVolume(v: number): void {
    this.bgmVolume = clamp01(v);
    writeStored(LS_BGM_VOLUME, String(this.bgmVolume));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.effectiveBgmVolume();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    writeStored(LS_BGM_MUTE, muted ? '1' : '0');
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.effectiveBgmVolume();
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private effectiveBgmVolume(): number {
    return this.muted ? 0 : this.bgmVolume;
  }

  async playBgm(url: string = DEFAULT_BGM_URL): Promise<void> {
    if (!url) return;
    this.cancelPendingStop();
    this.bgmRequestedPlaying = true;
    const playUrl = toProxyUrl(url);

    if (this.bgmAudio && this.bgmCurrentUrl === url) {
      if (this.bgmAudio.paused) {
        try {
          await this.bgmAudio.play();
        } catch {
          /* ignore */
        }
      }
      this.fadeTo(this.bgmAudio, this.effectiveBgmVolume(), 300);
      return;
    }

    if (this.bgmAudio) {
      await this.fadeOutAndDispose(this.bgmAudio).catch(() => { /* ignore */ });
      this.bgmAudio = null;
    }

    const audio = new Audio();
    audio.src = playUrl;
    audio.loop = true;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.volume = 0;

    this.bgmAudio = audio;
    this.bgmCurrentUrl = url;

    try {
      await audio.play();
      // await 中に別の audio へ置き換わっていた場合は中断する
      if (this.bgmAudio !== audio) {
        try { audio.pause(); } catch { /* ignore */ }
        return;
      }
      this.fadeTo(audio, this.effectiveBgmVolume(), 600);
    } catch {
      /* autoplay 失敗時は unlock 呼び出しで再試行 */
    }
  }

  /**
   * BGM を停止する。
   * unmount/remount のような瞬間的な離脱では `playBgm` が猶予時間内に再呼び出し
   * された場合に停止をキャンセルするため、コース切替時の再生成でも BGM が
   * 途切れない。
   */
  stopBgm(): void {
    this.bgmRequestedPlaying = false;
    if (!this.bgmAudio) return;
    if (this.pendingStopTimer !== null) return;
    const target = this.bgmAudio;
    this.pendingStopTimer = setTimeout(() => {
      this.pendingStopTimer = null;
      // 猶予時間内に playBgm が呼ばれた場合はスキップ
      if (this.bgmRequestedPlaying) return;
      if (this.bgmAudio !== target) return;
      this.bgmAudio = null;
      this.bgmCurrentUrl = '';
      void this.fadeOutAndDispose(target).catch(() => { /* ignore */ });
    }, STOP_GRACE_PERIOD_MS);
  }

  /** 即時に BGM を停止 (レッスン開始時など明確に離脱するケース向け) */
  async stopBgmImmediately(): Promise<void> {
    this.cancelPendingStop();
    this.bgmRequestedPlaying = false;
    if (!this.bgmAudio) return;
    const target = this.bgmAudio;
    this.bgmAudio = null;
    this.bgmCurrentUrl = '';
    await this.fadeOutAndDispose(target).catch(() => { /* ignore */ });
  }

  private cancelPendingStop(): void {
    if (this.pendingStopTimer !== null) {
      clearTimeout(this.pendingStopTimer);
      this.pendingStopTimer = null;
    }
  }

  async unlock(): Promise<void> {
    if (this.bgmRequestedPlaying && this.bgmAudio && this.bgmAudio.paused) {
      try {
        await this.bgmAudio.play();
      } catch {
        /* ignore */
      }
    }
    if (this.bgmRequestedPlaying && !this.bgmAudio) {
      await this.playBgm().catch(() => { /* ignore */ });
    }
  }

  private fadeTo(audio: HTMLAudioElement, target: number, durationMs: number): void {
    // 既に別の audio に置き換わっていたら新しい fade を始めない
    if (this.bgmAudio !== audio) return;
    if (this.bgmFadeRaf !== null) {
      try {
        cancelAnimationFrame(this.bgmFadeRaf);
      } catch {
        /* ignore */
      }
      this.bgmFadeRaf = null;
    }
    const from = audio.volume;
    const start = performance.now();
    const step = (now: number): void => {
      // ステップ中に audio が置き換わった場合は中断
      if (this.bgmAudio !== audio) {
        this.bgmFadeRaf = null;
        return;
      }
      const t = Math.min(1, (now - start) / durationMs);
      audio.volume = from + (target - from) * t;
      if (t < 1) {
        this.bgmFadeRaf = requestAnimationFrame(step);
      } else {
        this.bgmFadeRaf = null;
      }
    };
    this.bgmFadeRaf = requestAnimationFrame(step);
  }

  private fadeOutAndDispose(audio: HTMLAudioElement): Promise<void> {
    return new Promise(resolve => {
      const from = audio.volume;
      const durationMs = 280;
      const start = performance.now();
      const step = (now: number): void => {
        const t = Math.min(1, (now - start) / durationMs);
        audio.volume = Math.max(0, from * (1 - t));
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          try { audio.pause(); } catch { /* ignore */ }
          try { audio.src = ''; } catch { /* ignore */ }
          try { audio.load(); } catch { /* ignore */ }
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }
}

export const LessonMapAudio = new LessonMapAudioImpl();
export const LESSON_MAP_BGM_URL = DEFAULT_BGM_URL;
