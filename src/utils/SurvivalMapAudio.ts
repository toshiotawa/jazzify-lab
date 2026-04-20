/**
 * SurvivalMapAudio
 * ------------------------------------------------------
 * 魔王城降下マップ（サバイバルのステージ選択画面）専用のオーディオマネージャ。
 * - BGM: 指定URLをループ再生（HTMLAudioElementで実装・iOS WebView対応）
 * - SE: 任意URLを低遅延で再生（WebAudio BufferSource・同時複数再生OK）
 * - 音量は localStorage に永続化（bgm / se を個別に）
 *
 * 既存の BGMManager（楽曲プレイヤー用・カウントインありの複雑な再生）とは
 * 意図的に独立させている。
 */

import { getWindow } from '@/platform';

const CDN_HOST = 'https://jazzify-cdn.com';

function toProxyUrl(url: string): string {
  if (url.startsWith(CDN_HOST)) {
    return '/cdn-proxy' + url.slice(CDN_HOST.length);
  }
  return url;
}

const LS_BGM_VOLUME = 'survival_map_bgm_volume_v1';
const LS_SE_VOLUME = 'survival_map_se_volume_v1';
const LS_BGM_MUTE = 'survival_map_bgm_mute_v1';

type SurvivalMapSeKey = 'stage_click';

const SE_URLS: Record<SurvivalMapSeKey, string> = {
  stage_click: 'https://jazzify-cdn.com/fantasy-bgm/e42a3146-eee3-44de-b89b-3f282ec95393.mp3',
};

const DEFAULT_BGM_URL = 'https://jazzify-cdn.com/fantasy-bgm/116797c5-c714-4a4d-85c6-5212af860d0b.mp3';
const DEFAULT_BGM_VOLUME = 0.35;
const DEFAULT_SE_VOLUME = 0.8;

/** クランプ */
const clamp01 = (v: number): number => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

/** localStorage 読み取り（失敗時は fallback） */
function readStoredNumber(key: string, fallback: number): number {
  try {
    const raw = getWindow().localStorage.getItem(key);
    if (raw == null) return fallback;
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) return fallback;
    return clamp01(num);
  } catch {
    return fallback;
  }
}

function readStoredBool(key: string, fallback: boolean): boolean {
  try {
    const raw = getWindow().localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === '1' || raw === 'true';
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string): void {
  try {
    getWindow().localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

class SurvivalMapAudioImpl {
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmFadeRaf: number | null = null;
  private bgmCurrentUrl = '';
  private bgmRequestedPlaying = false;

  private seContext: AudioContext | null = null;
  private seGain: GainNode | null = null;
  private seBuffers: Map<string, AudioBuffer> = new Map();
  private seLoading: Map<string, Promise<AudioBuffer | null>> = new Map();

  private bgmVolume: number = readStoredNumber(LS_BGM_VOLUME, DEFAULT_BGM_VOLUME);
  private seVolume: number = readStoredNumber(LS_SE_VOLUME, DEFAULT_SE_VOLUME);
  private muted: boolean = readStoredBool(LS_BGM_MUTE, false);

  getBgmVolume(): number {
    return this.bgmVolume;
  }

  getSeVolume(): number {
    return this.seVolume;
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

  setSeVolume(v: number): void {
    this.seVolume = clamp01(v);
    writeStored(LS_SE_VOLUME, String(this.seVolume));
    if (this.seGain && this.seContext) {
      try {
        this.seGain.gain.setValueAtTime(this.seVolume, this.seContext.currentTime);
      } catch {
        /* ignore */
      }
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

  /**
   * BGM のストリーミング再生を開始。
   * - 同一URLで既に再生中なら何もしない
   * - 別URLなら短いフェードアウト→新URLへ切替
   */
  async playBgm(url: string = DEFAULT_BGM_URL): Promise<void> {
    if (!url) return;
    this.bgmRequestedPlaying = true;

    const playUrl = toProxyUrl(url);

    if (this.bgmAudio && this.bgmCurrentUrl === url) {
      if (this.bgmAudio.paused) {
        try {
          await this.bgmAudio.play();
        } catch {
          /* autoplay policy により失敗する場合がある。次のユーザー操作で再試行 */
        }
      }
      this.bgmAudio.volume = this.effectiveBgmVolume();
      return;
    }

    // 既存の BGM をフェードアウトして破棄
    if (this.bgmAudio) {
      await this.fadeOutAndDispose(this.bgmAudio).catch(() => {});
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
      // フェードイン
      this.fadeTo(audio, this.effectiveBgmVolume(), 600);
    } catch {
      // 自動再生失敗（ユーザー操作未発生）。次の unlock 呼び出しで再試行される。
    }
  }

  /**
   * BGM を停止（短いフェードアウト後に要素破棄）。
   */
  async stopBgm(): Promise<void> {
    this.bgmRequestedPlaying = false;
    if (!this.bgmAudio) return;
    const target = this.bgmAudio;
    this.bgmAudio = null;
    this.bgmCurrentUrl = '';
    await this.fadeOutAndDispose(target).catch(() => {});
  }

  /**
   * iOS/モバイル WebView 用: ユーザー操作コンテキストで呼び出して
   * 音声再生の autoplay ロックを解除する。
   */
  async unlock(): Promise<void> {
    await this.ensureSeContext();
    if (this.seContext?.state === 'suspended') {
      try { await this.seContext.resume(); } catch { /* ignore */ }
    }
    // BGM 再開試行
    if (this.bgmRequestedPlaying && this.bgmAudio && this.bgmAudio.paused) {
      try {
        await this.bgmAudio.play();
      } catch {
        /* ignore */
      }
    }
    // 未再生かつ要求中なら改めて再生開始
    if (this.bgmRequestedPlaying && !this.bgmAudio) {
      await this.playBgm().catch(() => {});
    }
  }

  /**
   * SE を再生。WebAudio が使える環境では低遅延、失敗時は HTMLAudio にフォールバック。
   */
  playSe(key: SurvivalMapSeKey = 'stage_click'): void {
    const url = SE_URLS[key];
    if (!url) return;
    void this.ensureSeContext().then(() => {
      this.playSeFromUrl(url);
    });
  }

  private async ensureSeContext(): Promise<void> {
    if (this.seContext && this.seGain) return;
    try {
      const Ctx = (getWindow() as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        || (getWindow() as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.seContext = new Ctx({ latencyHint: 'interactive' });
      this.seGain = this.seContext.createGain();
      this.seGain.gain.setValueAtTime(this.seVolume, this.seContext.currentTime);
      this.seGain.connect(this.seContext.destination);
    } catch {
      this.seContext = null;
      this.seGain = null;
    }
  }

  private async loadSeBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.seContext) return null;
    const cached = this.seBuffers.get(url);
    if (cached) return cached;
    const loading = this.seLoading.get(url);
    if (loading) return loading;

    const promise = (async () => {
      try {
        const resp = await fetch(toProxyUrl(url));
        const arr = await resp.arrayBuffer();
        const buf = await this.seContext!.decodeAudioData(arr.slice(0));
        this.seBuffers.set(url, buf);
        return buf;
      } catch {
        return null;
      } finally {
        this.seLoading.delete(url);
      }
    })();
    this.seLoading.set(url, promise);
    return promise;
  }

  private async playSeFromUrl(url: string): Promise<void> {
    if (!this.seContext || !this.seGain) {
      this.playSeHtmlAudio(url);
      return;
    }
    try {
      if (this.seContext.state === 'suspended') {
        try { await this.seContext.resume(); } catch { /* ignore */ }
      }
      const buf = await this.loadSeBuffer(url);
      if (!buf) {
        this.playSeHtmlAudio(url);
        return;
      }
      const src = this.seContext.createBufferSource();
      src.buffer = buf;
      src.connect(this.seGain);
      src.start(0);
      src.addEventListener('ended', () => {
        try { src.disconnect(); } catch { /* ignore */ }
      });
    } catch {
      this.playSeHtmlAudio(url);
    }
  }

  private playSeHtmlAudio(url: string): void {
    try {
      const audio = new Audio(toProxyUrl(url));
      audio.volume = this.seVolume;
      audio.addEventListener('ended', () => {
        try { audio.src = ''; } catch { /* ignore */ }
      });
      const p = audio.play();
      if (p && typeof (p as Promise<void>).catch === 'function') {
        (p as Promise<void>).catch(() => { /* ignore */ });
      }
    } catch {
      /* ignore */
    }
  }

  private fadeTo(audio: HTMLAudioElement, target: number, durationMs: number): void {
    if (this.bgmFadeRaf !== null) {
      try { cancelAnimationFrame(this.bgmFadeRaf); } catch { /* ignore */ }
      this.bgmFadeRaf = null;
    }
    const from = audio.volume;
    const start = performance.now();
    const step = (now: number): void => {
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

/** シングルトン */
export const SurvivalMapAudio = new SurvivalMapAudioImpl();

export const SURVIVAL_MAP_BGM_URL = DEFAULT_BGM_URL;
