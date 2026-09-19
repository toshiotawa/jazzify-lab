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
import {
  prepareDefensePhraseBackingPlayback,
  type DefensePhraseBackingPlayback,
} from '@/game/defense/defensePhraseBacking';
import type { DefensePhrase, DefenseStage } from '@/game/defense/defenseTypes';
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
  startOffset: number;
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
  private userVolume = 1;
  private readonly rawBufferByUrl = new Map<string, Promise<AudioBuffer>>();
  private readonly processedBufferBySource = new WeakMap<AudioBuffer, Map<string, Promise<AudioBuffer>>>();
  private readonly bufferFactoryByUrl = new Map<string, (ctx: AudioContext) => AudioBuffer>();

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

  setUserVolume(volume: number): void {
    this.userVolume = Math.max(0, Math.min(1, volume));
    this.applyMasterOutputGain();
  }

  setVoiceInputDucking(enabled: boolean): void {
    if (this.voiceInputDucking === enabled) {
      return;
    }
    this.voiceInputDucking = enabled;
    this.applyMasterOutputGain();
  }

  private applyMasterOutputGain(): void {
    const graph = this.graph;
    if (!graph) {
      return;
    }
    const duck = this.voiceInputDucking ? VOICE_INPUT_BGM_DUCK : 1;
    graph.masterGain.gain.value = this.userVolume * duck;
  }

  getCurrentTime(): number {
    return this.graph?.ctx.currentTime ?? 0;
  }

  async preload(urls: readonly string[]): Promise<void> {
    const { ctx } = this.ensureGraph();
    const unique = [...new Set(urls.filter((url) => url.length > 0))];
    await Promise.all(unique.map((url) => this.decodeRawUrl(ctx, url)));
  }

  registerBufferFactory(
    url: string,
    factory: (ctx: AudioContext) => AudioBuffer,
  ): void {
    this.bufferFactoryByUrl.set(url, factory);
    this.rawBufferByUrl.delete(url);
  }

  preparePhraseBacking(
    stage: DefenseStage,
    phrase: DefensePhrase,
    speedRatio: number,
  ): Promise<DefensePhraseBackingPlayback> {
    const { ctx } = this.ensureGraph();
    return prepareDefensePhraseBackingPlayback(
      ctx,
      stage,
      phrase,
      speedRatio,
      (url) => this.decodeRawUrl(ctx, url),
      (buffer, ratio) => this.applyPlaybackRateInternal(buffer, ratio),
    );
  }

  private decodeRawUrl(ctx: AudioContext, url: string): Promise<AudioBuffer> {
    let promise = this.rawBufferByUrl.get(url);
    if (!promise) {
      promise = (async () => {
        const factory = this.bufferFactoryByUrl.get(url);
        if (factory) {
          return factory(ctx);
        }
        const arrayBuffer = await fetchCachedFullAudioBuffer(url);
        return ctx.decodeAudioData(arrayBuffer.slice(0));
      })();
      this.rawBufferByUrl.set(url, promise);
    }
    return promise;
  }

  private applyPlaybackRateInternal(
    buffer: AudioBuffer,
    speedRatio: number,
  ): Promise<AudioBuffer> {
    const safeRatio = Math.max(0.1, Math.min(8, speedRatio));
    if (Math.abs(safeRatio - 1) < 0.0001) {
      return Promise.resolve(buffer);
    }
    const ratioKey = safeRatio.toFixed(4);
    let byRatio = this.processedBufferBySource.get(buffer);
    if (!byRatio) {
      byRatio = new Map<string, Promise<AudioBuffer>>();
      this.processedBufferBySource.set(buffer, byRatio);
    }
    let promise = byRatio.get(ratioKey);
    if (!promise) {
      promise = processOffline({
        input: buffer,
        processorUrl: soundtouchProcessorUrl,
        pitchSemitones: 0,
        playbackRate: safeRatio,
      });
      byRatio.set(ratioKey, promise);
    }
    return promise;
  }

  private createLoopingSlot(
    graph: DeckGraph,
    playback: DefensePhraseBackingPlayback,
  ): DeckSlot {
    const gain = graph.ctx.createGain();
    gain.connect(graph.masterGain);
    const source = graph.ctx.createBufferSource();
    source.buffer = playback.buffer;
    source.loop = true;
    const safeLoopEnd = Math.max(
      playback.loopStart + 1e-6,
      Math.min(playback.loopEnd, playback.buffer.duration),
    );
    source.loopStart = Math.max(0, Math.min(playback.loopStart, safeLoopEnd - 1e-6));
    source.loopEnd = safeLoopEnd;
    source.connect(gain);
    return { source, gain, startOffset: playback.startOffset };
  }

  start(playback: DefensePhraseBackingPlayback): void {
    const graph = this.ensureGraph();
    this.stopInternal(false);
    this.activeIsA = true;
    this.transportStart = graph.ctx.currentTime + START_LEAD_SEC;

    const slot = this.createLoopingSlot(graph, playback);
    slot.gain.gain.value = 1;
    slot.source.start(this.transportStart, slot.startOffset);

    this.slotA = slot;
    this.slotB = null;
  }

  /** 次の小節頭（余裕がなければその次）に切替を予約し、切替時刻（AudioContext 時刻）を返す。 */
  scheduleSwitch(nextPlayback: DefensePhraseBackingPlayback): number {
    const graph = this.ensureGraph();
    const now = graph.ctx.currentTime;
    const barSec = barSeconds(this.bpm, this.beatsPerBar);
    const deadline = scheduleDeadlineSec(graph.ctx.baseLatency ?? 0);
    const switchAt = nextSwitchTime(now, this.transportStart, barSec, deadline);

    const current = this.activeIsA ? this.slotA : this.slotB;
    if (!current) {
      return switchAt;
    }

    const next = this.createLoopingSlot(graph, nextPlayback);
    next.gain.gain.setValueAtTime(0, switchAt);
    next.gain.gain.linearRampToValueAtTime(1, switchAt + FADE_IN_SEC);
    next.source.start(switchAt, next.startOffset);

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
      this.rawBufferByUrl.clear();
    }
  }
}

export const defenseBackingDeck = new DefenseBackingDeck();
