/**
 * Separate-tracks defense deck: AudioWorklet bridge for BGM + melody mix.
 */
import processorUrl from '@/game/defense/audio/defenseSeparateTracksProcessor.entry.ts?url';

import { isDefenseSharedProgressionSeparateTracksStage } from '@/game/defense/defenseAudioRegistrationMode';
import {
  advanceTransportByElapsedFrames,
  computeBeatInForm,
  type SeparateTracksGrid,
} from '@/game/defense/defenseSeparateTracksTransport';
import {
  prepareSeparateTracksBuffers,
  separateTracksCacheKey,
} from '@/game/defense/defenseSeparateTracksBuffers';
import type { SeparateTracksPreparedSet } from '@/game/defense/defenseSeparateTracksMix';
import type { DefenseStage } from '@/game/defense/defenseTypes';
import { VOICE_INPUT_BGM_DUCK } from '@/utils/voiceInputBgmDuck';

let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
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

export const unlockDefenseSeparateTracksAudioContext = (): void => {
  try {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') {
      void ctx.resume();
    }
  } catch {
    /* unavailable */
  }
};

interface Snapshot {
  readonly absoluteCycle: number;
  readonly phaseFrame: number;
  readonly audiblePhraseIndex: number;
  readonly speedPercent: number;
  readonly grid: SeparateTracksGrid;
  readonly audioTime: number;
}

class DefenseSeparateTracksDeck {
  private stage: DefenseStage | null = null;

  private workletNode: AudioWorkletNode | null = null;

  private masterGain: GainNode | null = null;

  private sessionGeneration = 0;

  private requestRevision = 0;

  private appliedSpeedPercent = 100;

  private requestedSpeedPercent = 100;

  private tempoRevision = 0;

  private pendingTempoPrepare: Promise<SeparateTracksPreparedSet> | null = null;

  private pendingTempoRevision = 0;

  private activePreparedSet: SeparateTracksPreparedSet | null = null;

  private readonly preparedCache = new Map<string, SeparateTracksPreparedSet>();

  private snapshot: Snapshot | null = null;

  private voiceInputDucking = false;

  private userVolume = 1;

  private paused = false;

  private pausedSnapshot: Snapshot | null = null;

  private processorLoaded = false;

  private async ensureProcessor(ctx: AudioContext): Promise<void> {
    if (this.processorLoaded) {
      return;
    }
    await ctx.audioWorklet.addModule(processorUrl);
    this.processorLoaded = true;
  }

  private updateGain(): void {
    if (!this.workletNode) {
      return;
    }
    const duck = this.voiceInputDucking ? VOICE_INPUT_BGM_DUCK : 1;
    const master = this.userVolume * duck;
    this.workletNode.port.postMessage({
      type: 'setGain',
      bgmGain: 0.5 * master,
      melodyGain: 0.5 * master,
    });
    if (this.masterGain) {
      this.masterGain.gain.value = 1;
    }
  }

  private buildSnapshotFromMessage(data: {
    absoluteCycle: number;
    phaseFrame: number;
    audiblePhraseIndex: number;
    speedPercent: number;
  }): void {
    if (!this.activePreparedSet) {
      return;
    }
    this.snapshot = {
      absoluteCycle: data.absoluteCycle,
      phaseFrame: data.phaseFrame,
      audiblePhraseIndex: data.audiblePhraseIndex,
      speedPercent: data.speedPercent,
      grid: this.activePreparedSet.grid,
      audioTime: getAudioContext().currentTime,
    };
    this.appliedSpeedPercent = data.speedPercent;
  }

  async prepare(stage: DefenseStage, speedRatio: number): Promise<void> {
    if (!isDefenseSharedProgressionSeparateTracksStage(stage)) {
      throw new Error('DefenseSeparateTracksDeck requires shared_progression_separate_tracks stage');
    }

    const ctx = getAudioContext();
    await this.ensureProcessor(ctx);

    const speedPercent = Math.round(speedRatio * 100);
    const cacheKey = separateTracksCacheKey({
      stageId: stage.id,
      bgmUrl: stage.audioUrl ?? '',
      melodyUrl: stage.melodyAudioUrl ?? '',
      bpm: stage.bpm,
      beatsPerBar: stage.beatsPerBar,
      progressionBars: stage.progressionBars ?? stage.phraseBars,
      phraseBars: stage.phraseBars,
      speedPercent,
      sampleRate: ctx.sampleRate,
    });

    let prepared = this.preparedCache.get(cacheKey);
    if (!prepared) {
      prepared = await prepareSeparateTracksBuffers({
        stage,
        speedRatio,
        audioContext: ctx,
      });
      this.preparedCache.set(cacheKey, prepared);
    }

    this.stage = stage;
    this.activePreparedSet = prepared;
    this.appliedSpeedPercent = speedPercent;
    this.requestedSpeedPercent = speedPercent;
  }

  async start(stage: DefenseStage, phraseIndex: number, speedRatio: number): Promise<void> {
    await this.prepare(stage, speedRatio);
    const ctx = getAudioContext();
    await this.ensureProcessor(ctx);

    this.sessionGeneration += 1;
    this.requestRevision = 0;
    this.paused = false;
    this.pausedSnapshot = null;

    if (this.workletNode) {
      this.workletNode.disconnect();
    }
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.connect(ctx.destination);
    }

    this.workletNode = new AudioWorkletNode(ctx, 'defense-separate-tracks-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    this.workletNode.connect(this.masterGain);

    this.workletNode.port.onmessage = (event) => {
      const data = event.data as {
        type?: string;
        absoluteCycle?: number;
        phaseFrame?: number;
        audiblePhraseIndex?: number;
        speedPercent?: number;
      };
      if (data.type === 'boundary' && data.absoluteCycle !== undefined) {
        this.buildSnapshotFromMessage({
          absoluteCycle: data.absoluteCycle,
          phaseFrame: data.phaseFrame ?? 0,
          audiblePhraseIndex: data.audiblePhraseIndex ?? 0,
          speedPercent: data.speedPercent ?? this.appliedSpeedPercent,
        });
      }
    };

    const prepared = this.activePreparedSet;
    if (!prepared) {
      throw new Error('Separate tracks prepared set missing');
    }

    this.workletNode.port.postMessage({
      type: 'installSet',
      set: prepared,
      sessionGeneration: this.sessionGeneration,
      phraseIndex,
    });

    this.snapshot = {
      absoluteCycle: 0,
      phaseFrame: 0,
      audiblePhraseIndex: phraseIndex,
      speedPercent: prepared.speedPercent,
      grid: prepared.grid,
      audioTime: ctx.currentTime,
    };

    this.updateGain();
    if (ctx.state !== 'running') {
      await ctx.resume();
    }
  }

  requestPhrase(phraseIndex: number, revision: number): void {
    if (!this.workletNode) {
      return;
    }
    this.workletNode.port.postMessage({
      type: 'requestPhrase',
      phraseIndex,
      revision,
      generation: this.sessionGeneration,
    });
  }

  async requestTempo(speedPercent: number): Promise<void> {
    if (!this.stage || !this.workletNode) {
      return;
    }
    this.requestedSpeedPercent = speedPercent;
    const nextRevision = this.tempoRevision + 1;
    this.tempoRevision = nextRevision;
    this.pendingTempoRevision = nextRevision;

    const speedRatio = speedPercent / 100;
    const generation = this.sessionGeneration;

    this.pendingTempoPrepare = prepareSeparateTracksBuffers({
      stage: this.stage,
      speedRatio,
      audioContext: getAudioContext(),
    });

    try {
      const prepared = await this.pendingTempoPrepare;
      if (this.sessionGeneration !== generation || this.pendingTempoRevision !== nextRevision) {
        return;
      }
      this.workletNode.port.postMessage({
        type: 'requestTempo',
        set: prepared,
        tempoRevision: nextRevision,
        generation,
      });
    } finally {
      this.pendingTempoPrepare = null;
    }
  }

  pause(): void {
    const live = this.resolveLiveTransport();
    this.paused = true;
    if (live && this.snapshot) {
      const frozen: Snapshot = {
        ...this.snapshot,
        absoluteCycle: live.absoluteCycle,
        phaseFrame: live.phaseFrame,
        audioTime: getAudioContext().currentTime,
      };
      this.snapshot = frozen;
      this.pausedSnapshot = frozen;
    } else {
      this.pausedSnapshot = this.snapshot;
    }
    this.workletNode?.port.postMessage({ type: 'pause' });
  }

  resume(): void {
    this.paused = false;
    if (this.snapshot) {
      this.snapshot = {
        ...this.snapshot,
        audioTime: getAudioContext().currentTime,
      };
    }
    this.workletNode?.port.postMessage({ type: 'resume' });
  }

  stop(): void {
    this.sessionGeneration += 1;
    this.workletNode?.port.postMessage({ type: 'stop' });
    this.workletNode?.disconnect();
    this.workletNode = null;
    this.snapshot = null;
    this.pausedSnapshot = null;
    this.pendingTempoPrepare = null;
    this.stage = null;
    this.activePreparedSet = null;
  }

  setUserVolume(volume: number): void {
    this.userVolume = Math.max(0, Math.min(1, volume));
    this.updateGain();
  }

  setVoiceInputDucking(active: boolean): void {
    this.voiceInputDucking = active;
    this.updateGain();
  }

  getBeatInForm(): number {
    const live = this.paused
      ? (this.pausedSnapshot ?? this.snapshot)
      : (this.resolveLiveTransport() ?? this.snapshot);
    if (!live) {
      return 0;
    }
    return computeBeatInForm(
      live.absoluteCycle,
      live.phaseFrame,
      live.grid.cycleFrames,
      live.grid.phraseBars,
      this.stage?.beatsPerBar ?? 4,
      live.grid.cyclesPerForm,
    );
  }

  private resolveLiveTransport(): Snapshot | null {
    const snap = this.snapshot;
    if (!snap) {
      return null;
    }
    if (this.paused) {
      return snap;
    }
    const ctx = sharedAudioContext;
    if (!ctx) {
      return snap;
    }
    const elapsedFrames = Math.round(Math.max(0, ctx.currentTime - snap.audioTime) * snap.grid.sampleRate);
    const advanced = advanceTransportByElapsedFrames(
      snap.absoluteCycle,
      snap.phaseFrame,
      snap.grid.cycleFrames,
      elapsedFrames,
    );
    return {
      ...snap,
      absoluteCycle: advanced.absoluteCycle,
      phaseFrame: advanced.phaseFrame,
    };
  }

  getAppliedSpeedPercent(): number {
    return this.appliedSpeedPercent;
  }

  getRequestedSpeedPercent(): number {
    return this.requestedSpeedPercent;
  }

  isTempoPreparing(): boolean {
    return this.pendingTempoPrepare !== null;
  }

  isPaused(): boolean {
    return this.paused;
  }
}

export const defenseSeparateTracksDeck = new DefenseSeparateTracksDeck();
