/**
 * AudioWorklet entry (bundled to IIFE for addModule).
 */
/// <reference lib="webworker" />

import {
  createSeparateTracksMixerState,
  renderSeparateTracksBlock,
  type PhraseRequestMailbox,
  type SeparateTracksMixerState,
  type SeparateTracksPreparedSet,
  type TempoRequestMailbox,
} from '../defenseSeparateTracksMix';

type WorkletMessage =
  | { type: 'installSet'; set: SeparateTracksPreparedSet; sessionGeneration: number; phraseIndex: number }
  | { type: 'requestPhrase'; phraseIndex: number; revision: number; generation: number }
  | { type: 'requestTempo'; set: SeparateTracksPreparedSet; tempoRevision: number; generation: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'setGain'; bgmGain: number; melodyGain: number };

class DefenseSeparateTracksProcessor extends AudioWorkletProcessor {
  private state: SeparateTracksMixerState | null = null;

  private pendingPhraseRequest: PhraseRequestMailbox | null = null;

  private pendingTempoRequest: TempoRequestMailbox | null = null;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
      const message = event.data;
      switch (message.type) {
        case 'installSet': {
          this.state = createSeparateTracksMixerState({
            preparedSet: message.set,
            sessionGeneration: message.sessionGeneration,
            initialPhraseIndex: message.phraseIndex,
          });
          this.pendingPhraseRequest = null;
          this.pendingTempoRequest = null;
          this.port.postMessage({ type: 'ready', setId: message.set.setId });
          break;
        }
        case 'requestPhrase':
          this.pendingPhraseRequest = {
            phraseIndex: message.phraseIndex,
            revision: message.revision,
            generation: message.generation,
          };
          break;
        case 'requestTempo':
          this.pendingTempoRequest = {
            preparedSet: message.set,
            tempoRevision: message.tempoRevision,
            generation: message.generation,
          };
          break;
        case 'pause':
          if (this.state) {
            this.state = { ...this.state, paused: true };
          }
          break;
        case 'resume':
          if (this.state) {
            this.state = { ...this.state, paused: false };
          }
          break;
        case 'stop':
          this.state = null;
          this.pendingPhraseRequest = null;
          this.pendingTempoRequest = null;
          break;
        case 'setGain':
          if (this.state) {
            this.state = {
              ...this.state,
              bgmGain: message.bgmGain,
              melodyGain: message.melodyGain,
            };
          }
          break;
        default:
          break;
      }
    };
  }

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>,
  ): boolean {
    const output = outputs[0];
    if (!output || output.length === 0 || !this.state) {
      return true;
    }

    const left = output[0];
    const right = output[1] ?? output[0];
    const blockFrames = left?.length ?? 0;
    if (!left || blockFrames <= 0) {
      return true;
    }

    const phraseRequest = this.pendingPhraseRequest;
    const tempoRequest = this.pendingTempoRequest;
    this.pendingPhraseRequest = null;
    this.pendingTempoRequest = null;

    const result = renderSeparateTracksBlock({
      state: this.state,
      outputLeft: left,
      outputRight: right,
      blockFrames,
      phraseRequest,
      tempoRequest,
    });

    this.state = result.state;

    if (result.appliedPhraseAtBoundary || result.appliedTempoAtBoundary) {
      this.port.postMessage({
        type: 'boundary',
        appliedPhrase: result.appliedPhraseAtBoundary,
        appliedTempo: result.appliedTempoAtBoundary,
        absoluteCycle: result.state.absoluteCycle,
        phaseFrame: result.state.phaseFrame,
        audiblePhraseIndex: result.state.audiblePhraseIndex,
        speedPercent: result.state.activeSet.speedPercent,
      });
    }

    return true;
  }
}

registerProcessor('defense-separate-tracks-processor', DefenseSeparateTracksProcessor);

export {};
