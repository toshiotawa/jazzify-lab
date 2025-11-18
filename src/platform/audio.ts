/**
 * 低遅延オーディオ管理
 * Windows Chrome/Edge 環境でのラグを抑えるため、AudioContext と Tone.js を一元調整する
 */

import { platform } from './index';
import { log } from '@/utils/logger';

type ToneModule = typeof import('tone');

const getAudioContextConstructor = (): typeof AudioContext | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return (
    window.AudioContext ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
};

class LowLatencyAudioManager {
  private context: AudioContext | null = null;
  private readonly isWindowsChromium: boolean;
  private readonly latencyHint: AudioContextLatencyCategory | number;
  private readonly lookAheadSeconds: number;
  private visibilityHandler?: () => void;

  constructor() {
    const navigator = platform.getWindow().navigator;
    const ua = navigator.userAgent;
    const isWindows = /Windows/i.test(ua);
    const isChromium = /(Chrome|Edg|Brave|Chromium)/i.test(ua);
    this.isWindowsChromium = isWindows && isChromium;
    this.latencyHint = this.isWindowsChromium ? 'interactive' : 'balanced';
    // Chrome/Edge の AudioWorklet では 12ms 前後が実測で安定
    this.lookAheadSeconds = this.isWindowsChromium ? 0.0125 : 0.02;
  }

  getContext(): AudioContext {
    if (this.context && this.context.state !== 'closed') {
      return this.context;
    }

    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) {
      throw new Error('Web Audio API is not available in this environment.');
    }

    const context = new AudioContextCtor({
      latencyHint: this.latencyHint,
      sampleRate: this.isWindowsChromium ? 48_000 : undefined
    });

    this.attachVisibilityHandler(context);
    this.context = context;
    return context;
  }

  async ensureRunning(): Promise<AudioContext> {
    const context = this.getContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
    return context;
  }

  async configureToneContext(toneModule?: ToneModule | null): Promise<void> {
    if (!toneModule) {
      return;
    }
    const context = await this.ensureRunning();

    try {
      // Tone.js v14+
      if ('setContext' in toneModule && typeof toneModule.setContext === 'function') {
        toneModule.setContext(context as never);
      } else if ('getContext' in toneModule && typeof toneModule.getContext === 'function') {
        const toneContext = toneModule.getContext();
        if (toneContext && toneContext !== context && 'setContext' in toneModule) {
          toneModule.setContext?.(context as never);
        }
      }

      const internalContext =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (toneModule as any).context ?? toneModule.getContext?.();
      if (internalContext) {
        internalContext.latencyHint = this.latencyHint;
        internalContext.lookAhead = this.lookAheadSeconds;
      }
    } catch (error) {
      // Toneが利用できない場合は致命的ではないのでログのみ
      log.warn('[LowLatencyAudioManager] Tone context synchronization failed:', error);
    }
  }

  getLookAhead(): number {
    return this.lookAheadSeconds;
  }

  getLatencyHint(): AudioContextLatencyCategory | number {
    return this.latencyHint;
  }

  private attachVisibilityHandler(context: AudioContext): void {
    if (typeof document === 'undefined' || this.visibilityHandler) {
      return;
    }
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && context.state === 'suspended') {
        void context.resume();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
}

export const lowLatencyAudio = new LowLatencyAudioManager();

export const getSharedAudioContext = (): AudioContext => lowLatencyAudio.getContext();
export const ensureSharedAudioContextRunning = (): Promise<AudioContext> =>
  lowLatencyAudio.ensureRunning();
export const syncToneWithSharedAudioContext = (toneModule?: ToneModule | null): Promise<void> =>
  lowLatencyAudio.configureToneContext(toneModule);
