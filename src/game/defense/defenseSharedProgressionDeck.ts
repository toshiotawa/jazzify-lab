/**
 * Shared progression backing deck: full-progression phrase files with inherited bar position.
 */
import { processOffline } from '@soundtouchjs/audio-worklet';
import soundtouchProcessorUrl from '@soundtouchjs/audio-worklet/processor?url';
import { fetchCachedFullAudioBuffer } from '@/utils/audioFetchCache';
import { isDefenseSharedProgressionStage } from '@/game/defense/defenseAudioRegistrationMode';
import {
  computeSharedProgressionExpectedFrameCount,
  isSharedProgressionFrameCountValid,
  planSharedProgressionSwitch,
  sharedProgressionBarOffsetSec,
  sharedProgressionBarSeconds,
  type SharedProgressionSwitchEveryBars,
} from '@/game/defense/defenseSharedProgressionTransport';
import { scheduleDeadlineSec } from '@/game/defense/defenseTransport';
import type { DefenseStage } from '@/game/defense/defenseTypes';
import { VOICE_INPUT_BGM_DUCK } from '@/utils/voiceInputBgmDuck';

const START_LEAD_SEC = 0.15;
const FADE_OUT_LEAD_SEC = 0.006;
const FADE_IN_SEC = 0.003;
const STOP_AFTER_FADE_SEC = 0.05;
const SPEED_RATIO_EPSILON = 0.0001;

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

export const unlockDefenseSharedProgressionAudioContext = (): void => {
  try {
    const ctx = getSharedAudioContext();
    if (ctx.state !== 'running') {
      void ctx.resume();
    }
  } catch {
    /* AudioContext unavailable */
  }
};

interface DeckGraph {
  readonly ctx: AudioContext;
  readonly masterGain: GainNode;
}

interface PhrasePlayback {
  readonly buffer: AudioBuffer;
  readonly loopStart: number;
  readonly loopEnd: number;
}

interface DeckSlot {
  source: AudioBufferSourceNode;
  gain: GainNode;
  phraseIndex: number;
}

interface ScheduledSwitch {
  phraseIndex: number;
  switchAt: number;
  requestRevision: number;
  generation: number;
}

class DefenseSharedProgressionDeck {
  private graph: DeckGraph | null = null;
  private stage: DefenseStage | null = null;
  private playbackRatio = 1;
  private progressionBars = 12;
  private switchEveryBars: SharedProgressionSwitchEveryBars = 1;
  private barSec = 2;
  private transportStart = 0;
  private generation = 0;
  private requestRevision = 0;
  private desiredPhraseIndex = 0;
  private audiblePhraseIndex = 0;
  private slotA: DeckSlot | null = null;
  private slotB: DeckSlot | null = null;
  private activeIsA = true;
  private scheduled: ScheduledSwitch | null = null;
  private incomingSlot: DeckSlot | null = null;
  private voiceInputDucking = false;
  private userVolume = 1;
  private paused = false;
  private pausedOffsetSec = 0;
  private readonly playbackByPhraseIndex = new Map<number, PhrasePlayback>();
  private readonly rawBufferByUrl = new Map<string, Promise<AudioBuffer>>();

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

  private assertSharedStage(stage: DefenseStage): void {
    if (!isDefenseSharedProgressionStage(stage)) {
      throw new Error('DefenseSharedProgressionDeck requires shared_progression stage');
    }
    if (stage.progressionBars === null || stage.progressionBars <= 0) {
      throw new Error('shared_progression requires progressionBars');
    }
    if (![1, 2, 4].includes(stage.phraseBars)) {
      throw new Error('shared_progression requires phraseBars in (1, 2, 4)');
    }
  }

  private switchEveryFromStage(stage: DefenseStage): SharedProgressionSwitchEveryBars {
    if (stage.phraseBars === 2) return 2;
    if (stage.phraseBars === 4) return 4;
    return 1;
  }

  private decodeRawUrl(ctx: AudioContext, url: string): Promise<AudioBuffer> {
    let promise = this.rawBufferByUrl.get(url);
    if (!promise) {
      promise = (async () => {
        const arrayBuffer = await fetchCachedFullAudioBuffer(url);
        return ctx.decodeAudioData(arrayBuffer.slice(0));
      })();
      this.rawBufferByUrl.set(url, promise);
    }
    return promise;
  }

  private async applyPlaybackRate(buffer: AudioBuffer, speedRatio: number): Promise<AudioBuffer> {
    const safeRatio = Math.max(0.1, Math.min(8, speedRatio));
    if (Math.abs(safeRatio - 1) < SPEED_RATIO_EPSILON) {
      return buffer;
    }
    return processOffline({
      input: buffer,
      processorUrl: soundtouchProcessorUrl,
      pitchSemitones: 0,
      playbackRate: safeRatio,
    });
  }

  private fitBufferDuration(ctx: AudioContext, source: AudioBuffer, durationSec: number): AudioBuffer {
    const frameCount = Math.max(1, Math.round(Math.max(1e-6, durationSec) * source.sampleRate));
    if (frameCount === source.length) {
      return source;
    }
    const fitted = ctx.createBuffer(source.numberOfChannels, frameCount, source.sampleRate);
    const copyCount = Math.min(source.length, frameCount);
    for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
      fitted.getChannelData(channel).set(source.getChannelData(channel).subarray(0, copyCount));
    }
    return fitted;
  }

  async prepare(stage: DefenseStage, speedRatio: number): Promise<void> {
    this.assertSharedStage(stage);
    const { ctx } = this.ensureGraph();
    const safeRatio = Math.max(0.1, speedRatio);
    const progressionBars = stage.progressionBars ?? stage.phraseBars;
    const expectedDurationSec = progressionBars * sharedProgressionBarSeconds(
      stage.bpm,
      stage.beatsPerBar,
      safeRatio,
    );

    this.playbackByPhraseIndex.clear();
    this.stage = stage;
    this.playbackRatio = safeRatio;
    this.progressionBars = progressionBars;
    this.switchEveryBars = this.switchEveryFromStage(stage);
    this.barSec = sharedProgressionBarSeconds(stage.bpm, stage.beatsPerBar, safeRatio);

    for (let index = 0; index < stage.phrases.length; index += 1) {
      const phrase = stage.phrases[index];
      const url = phrase?.audioUrl ?? '';
      if (url.length === 0) {
        throw new Error(`Missing audio URL for phrase ${index}`);
      }
      const decoded = await this.decodeRawUrl(ctx, url);
      const expectedSourceFrames = computeSharedProgressionExpectedFrameCount(
        progressionBars,
        stage.bpm,
        stage.beatsPerBar,
        decoded.sampleRate,
      );
      if (!isSharedProgressionFrameCountValid(decoded.length, expectedSourceFrames)) {
        throw new Error(`Invalid shared progression audio length for phrase ${index}`);
      }
      const processed = Math.abs(safeRatio - 1) >= SPEED_RATIO_EPSILON
        ? await this.applyPlaybackRate(decoded, safeRatio)
        : decoded;
      const fitted = this.fitBufferDuration(ctx, processed, expectedDurationSec);
      this.playbackByPhraseIndex.set(index, {
        buffer: fitted,
        loopStart: 0,
        loopEnd: fitted.duration,
      });
    }
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

  getAudiblePhraseIndex(): number {
    return this.audiblePhraseIndex;
  }

  private playbackForPhrase(phraseIndex: number): PhrasePlayback {
    const playback = this.playbackByPhraseIndex.get(phraseIndex);
    if (!playback) {
      throw new Error(`Missing prepared playback for phrase ${phraseIndex}`);
    }
    return playback;
  }

  private createLoopingSlot(
    graph: DeckGraph,
    phraseIndex: number,
    startOffsetSec: number,
  ): DeckSlot {
    const playback = this.playbackForPhrase(phraseIndex);
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
    return { source, gain, phraseIndex };
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

  private clearIncoming(): void {
    if (this.incomingSlot) {
      this.disposeSlot(this.incomingSlot);
      this.incomingSlot = null;
    }
    this.scheduled = null;
  }

  private stopInternal(clearPrepared: boolean): void {
    if (this.slotA) this.disposeSlot(this.slotA);
    if (this.slotB) this.disposeSlot(this.slotB);
    this.clearIncoming();
    this.slotA = null;
    this.slotB = null;
    this.paused = false;
    this.pausedOffsetSec = 0;
    if (clearPrepared) {
      this.playbackByPhraseIndex.clear();
      this.rawBufferByUrl.clear();
      this.stage = null;
    }
  }

  start(initialPhraseIndex: number): void {
    const graph = this.ensureGraph();
    this.generation += 1;
    this.stopInternal(false);
    this.activeIsA = true;
    this.desiredPhraseIndex = initialPhraseIndex;
    this.audiblePhraseIndex = initialPhraseIndex;
    this.requestRevision = 0;
    this.transportStart = graph.ctx.currentTime + START_LEAD_SEC;

    const slot = this.createLoopingSlot(graph, initialPhraseIndex, 0);
    slot.gain.gain.value = 1;
    slot.source.start(this.transportStart, 0);
    this.slotA = slot;
  }

  private currentAbsoluteOffsetSec(now: number): number {
    return Math.max(0, now - this.transportStart);
  }

  requestPhrase(phraseIndex: number, requestRevision: number): void {
    if (this.paused || !this.stage) {
      return;
    }
    this.desiredPhraseIndex = phraseIndex;
    this.requestRevision = requestRevision;
    if (phraseIndex === this.audiblePhraseIndex && this.scheduled === null) {
      return;
    }
    this.scheduleDesiredSwitch();
  }

  private scheduleDesiredSwitch(): void {
    const graph = this.graph;
    if (!graph || !this.stage) {
      return;
    }

    const now = graph.ctx.currentTime;
    const deadline = scheduleDeadlineSec(graph.ctx.baseLatency ?? 0);
    const plan = planSharedProgressionSwitch({
      nowAudioTime: now,
      transportStart: this.transportStart,
      barSec: this.barSec,
      progressionBars: this.progressionBars,
      switchEveryBars: this.switchEveryBars,
      schedulingLeadSec: deadline,
    });
    const startOffsetSec = sharedProgressionBarOffsetSec(plan.destinationBar0, this.barSec);

    if (
      this.scheduled !== null
      && Math.abs(this.scheduled.switchAt - plan.switchAt) < 1e-6
      && now < plan.switchAt - deadline
    ) {
      this.clearIncoming();
      this.scheduled = {
        phraseIndex: this.desiredPhraseIndex,
        switchAt: plan.switchAt,
        requestRevision: this.requestRevision,
        generation: this.generation,
      };
      const incoming = this.createLoopingSlot(graph, this.desiredPhraseIndex, startOffsetSec);
      incoming.gain.gain.setValueAtTime(0, plan.switchAt);
      incoming.gain.gain.linearRampToValueAtTime(1, plan.switchAt + FADE_IN_SEC);
      incoming.source.start(plan.switchAt, startOffsetSec);
      this.incomingSlot = incoming;
      return;
    }

    if (this.scheduled !== null && now >= this.scheduled.switchAt - deadline) {
      return;
    }

    this.clearIncoming();

    const current = this.activeIsA ? this.slotA : this.slotB;
    if (!current) {
      return;
    }

    this.scheduled = {
      phraseIndex: this.desiredPhraseIndex,
      switchAt: plan.switchAt,
      requestRevision: this.requestRevision,
      generation: this.generation,
    };

    const incoming = this.createLoopingSlot(graph, this.desiredPhraseIndex, startOffsetSec);
    incoming.gain.gain.setValueAtTime(0, plan.switchAt);
    incoming.gain.gain.linearRampToValueAtTime(1, plan.switchAt + FADE_IN_SEC);
    incoming.source.start(plan.switchAt, startOffsetSec);

    current.gain.gain.setValueAtTime(1, plan.switchAt - FADE_OUT_LEAD_SEC);
    current.gain.gain.linearRampToValueAtTime(0, plan.switchAt);
    current.source.stop(plan.switchAt + STOP_AFTER_FADE_SEC);

    this.incomingSlot = incoming;
  }

  commitDueSwitch(): void {
    const graph = this.graph;
    if (!graph || !this.scheduled || !this.incomingSlot) {
      return;
    }
    if (graph.ctx.currentTime < this.scheduled.switchAt) {
      return;
    }

    const switchedTo = this.scheduled.phraseIndex;
    this.audiblePhraseIndex = switchedTo;
    this.activeIsA = !this.activeIsA;
    const outgoing = this.activeIsA ? this.slotB : this.slotA;
    if (outgoing) {
      this.disposeSlot(outgoing);
    }
    if (this.activeIsA) {
      this.slotA = this.incomingSlot;
      this.slotB = null;
    } else {
      this.slotB = this.incomingSlot;
      this.slotA = null;
    }
    this.incomingSlot = null;
    this.scheduled = null;

    if (this.desiredPhraseIndex !== switchedTo) {
      this.scheduleDesiredSwitch();
    }
  }

  getPendingSwitchAt(): number | null {
    return this.scheduled?.switchAt ?? null;
  }

  pause(): void {
    const graph = this.graph;
    if (!graph || this.paused) {
      return;
    }
    this.pausedOffsetSec = this.currentAbsoluteOffsetSec(graph.ctx.currentTime);
    this.generation += 1;
    this.stopInternal(false);
    this.paused = true;
  }

  resume(): void {
    const graph = this.graph;
    if (!graph || !this.paused || !this.stage) {
      return;
    }
    this.paused = false;
    this.generation += 1;
    const loopDurationSec = this.progressionBars * this.barSec;
    const offsetSec = loopDurationSec > 0
      ? this.pausedOffsetSec % loopDurationSec
      : 0;
    const now = graph.ctx.currentTime;
    this.transportStart = now - offsetSec;
    const slot = this.createLoopingSlot(graph, this.audiblePhraseIndex, offsetSec);
    slot.gain.gain.value = 1;
    slot.source.start(now, offsetSec);
    this.activeIsA = true;
    this.slotA = slot;
    this.slotB = null;
    if (this.desiredPhraseIndex !== this.audiblePhraseIndex) {
      this.scheduleDesiredSwitch();
    }
  }

  stop(): void {
    this.generation += 1;
    this.stopInternal(true);
  }

  restartFromProgressionStart(phraseIndex: number, speedRatio: number): void {
    if (!this.stage) {
      return;
    }
    this.playbackRatio = Math.max(0.1, speedRatio);
    this.barSec = sharedProgressionBarSeconds(
      this.stage.bpm,
      this.stage.beatsPerBar,
      this.playbackRatio,
    );
    this.generation += 1;
    this.stopInternal(false);
    this.start(phraseIndex);
  }
}

export const defenseSharedProgressionDeck = new DefenseSharedProgressionDeck();
