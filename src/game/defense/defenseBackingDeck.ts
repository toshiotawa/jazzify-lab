/**
 * Defense mode backing track A/B deck with bar-head scheduled crossfade (Web Audio API).
 *
 * The next phrase is started on the audio clock at the next bar head; the current deck fades
 * out over ~6ms before the boundary and the next deck fades in over ~3ms after it.
 */
import { processOffline } from '@soundtouchjs/audio-worklet';
import soundtouchProcessorUrl from '@soundtouchjs/audio-worklet/processor?url';
import { fetchCachedFullAudioBuffer } from '@/utils/audioFetchCache';
import {
  barSeconds,
  nextSwitchTime,
  scheduleDeadlineSec,
} from '@/game/defense/defenseTransport';
import { VOICE_INPUT_BGM_DUCK } from '@/utils/voiceInputBgmDuck';

const START_LEAD_SEC = 0.15;
const FADE_OUT_LEAD_SEC = 0.006;
const FADE_IN_SEC = 0.003;
const STOP_AFTER_FADE_SEC = 0.05;

let sharedAudioContext: AudioContext | null = null;

const getSharedAudioContext = (): AudioContext => {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    return sharedAudioContext;
  }
  const Ctor = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) {
    throw new Error('AudioContext is not available');
  }
  sharedAudioContext = new Ctor();
  return sharedAudioContext;
};

export const unlockDefenseBackingAudioContext = (): void => {
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state !== 'running') {
      void ctx.resume();
    }
  } catch {
    /* AudioContext unavailable; playback is simply skipped */
  }
};

interface DeckSlot {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

interface DeckGraph {
  ctx: AudioContext;
  masterGain: GainNode;
}

class DefenseBackingDeck {
  private graph: DeckGraph | null = null;
  private slotA: DeckSlot | null = null;
  private slotB: DeckSlot | null = null;
  private activeIsA = true;
  private transportStart = 0;
  private bpm = 120;
  private beatsPerBar = 4;
  private voiceInputDucking = false;
  private readonly bufferByUrl = new Map<string, Promise<AudioBuffer>>();

  private ensureGraph(): DeckGraph {
    if (this.graph) {
      return this.graph;
    }
    const ctx = getSharedAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
    this.graph = { ctx, masterGain };
    return this.graph;
  }

  setTransportConfig(bpm: number, beatsPerBar: number): void {
    this.bpm = Math.max(1, bpm);
    this.beatsPerBar = Math.max(1, beatsPerBar);
  }

  setVoiceInputDucking(enabled: boolean): void {
    if (this.voiceInputDucking === enabled) {
      return;
    }
    this.voiceInputDucking = enabled;
    const graph = this.graph;
    if (!graph) {
      return;
    }
    graph.masterGain.gain.value = enabled ? VOICE_INPUT_BGM_DUCK : 1;
  }

  getCurrentTime(): number {
    return this.graph?.ctx.currentTime ?? 0;
  }

  async preload(urls: readonly string[], speedRatio = 1): Promise<void> {
    const { ctx } = this.ensureGraph();
    const unique = [...new Set(urls.filter((url) => url.length > 0))];
    await Promise.all(unique.map((url) => this.decodeUrl(ctx, url, speedRatio)));
  }

  decodeForDeck(url: string, speedRatio = 1): Promise<AudioBuffer> {
    return this.decodeUrl(this.ensureGraph().ctx, url, speedRatio);
  }

  private static bufferCacheKey(url: string, speedRatio: number): string {
    return `${url}\0${speedRatio.toFixed(4)}`;
  }

  private decodeUrl(ctx: AudioContext, url: string, speedRatio = 1): Promise<AudioBuffer> {
    const safeRatio = Math.max(0.1, Math.min(8, speedRatio));
    const cacheKey = DefenseBackingDeck.bufferCacheKey(url, safeRatio);
    let promise = this.bufferByUrl.get(cacheKey);
    if (!promise) {
      promise = (async () => {
        const arrayBuffer = await fetchCachedFullAudioBuffer(url);
        const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
        if (Math.abs(safeRatio - 1) < 0.0001) {
          return decoded;
        }
        return processOffline({
          input: decoded,
          processorUrl: soundtouchProcessorUrl,
          pitchSemitones: 0,
          playbackRate: safeRatio,
        });
      })();
      this.bufferByUrl.set(cacheKey, promise);
    }
    return promise;
  }

  private createLoopingSlot(graph: DeckGraph, buffer: AudioBuffer): DeckSlot {
    const gain = graph.ctx.createGain();
    gain.connect(graph.masterGain);
    const source = graph.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;
    source.connect(gain);
    return { source, gain };
  }

  start(buffer: AudioBuffer): void {
    const graph = this.ensureGraph();
    this.stopInternal(false);
    this.activeIsA = true;
    this.transportStart = graph.ctx.currentTime + START_LEAD_SEC;

    const slot = this.createLoopingSlot(graph, buffer);
    slot.gain.gain.value = 1;
    slot.source.start(this.transportStart, 0);

    this.slotA = slot;
    this.slotB = null;
  }

  /** 次の小節頭（余裕がなければその次）に切替を予約し、切替時刻（AudioContext 時刻）を返す。 */
  scheduleSwitch(nextBuffer: AudioBuffer): number {
    const graph = this.ensureGraph();
    const now = graph.ctx.currentTime;
    const barSec = barSeconds(this.bpm, this.beatsPerBar);
    const deadline = scheduleDeadlineSec(graph.ctx.baseLatency ?? 0);
    const switchAt = nextSwitchTime(now, this.transportStart, barSec, deadline);

    const current = this.activeIsA ? this.slotA : this.slotB;
    if (!current) {
      return switchAt;
    }

    const next = this.createLoopingSlot(graph, nextBuffer);
    next.gain.gain.setValueAtTime(0, switchAt);
    next.gain.gain.linearRampToValueAtTime(1, switchAt + FADE_IN_SEC);
    next.source.start(switchAt, 0);

    current.gain.gain.setValueAtTime(1, switchAt - FADE_OUT_LEAD_SEC);
    current.gain.gain.linearRampToValueAtTime(0, switchAt);
    current.source.stop(switchAt + STOP_AFTER_FADE_SEC);

    if (this.activeIsA) {
      this.slotB = next;
    } else {
      this.slotA = next;
    }

    return switchAt;
  }

  /** 切替時刻を過ぎた後に呼ぶ。旧デッキを解放して新デッキをアクティブにする。 */
  commitSwitch(): void {
    this.activeIsA = !this.activeIsA;
    const inactive = this.activeIsA ? this.slotB : this.slotA;
    if (inactive) {
      this.disposeSlot(inactive);
    }
    if (this.activeIsA) {
      this.slotB = null;
    } else {
      this.slotA = null;
    }
  }

  stop(): void {
    this.stopInternal(true);
  }

  private disposeSlot(slot: DeckSlot): void {
    try {
      slot.source.stop();
    } catch {
      /* already stopped */
    }
    slot.source.disconnect();
    slot.gain.disconnect();
  }

  private stopInternal(clearBuffers: boolean): void {
    if (this.slotA) this.disposeSlot(this.slotA);
    if (this.slotB) this.disposeSlot(this.slotB);
    this.slotA = null;
    this.slotB = null;
    if (clearBuffers) {
      this.bufferByUrl.clear();
    }
  }
}

export const defenseBackingDeck = new DefenseBackingDeck();
