import { connectEffetuneLive, disconnectEffetuneLive, type EffetuneLabLiveHandle } from '@/utils/pitchLab/effetuneLab';
import {
  createPitchPleaseLab,
  startPitchPleaseOnStream,
  stopPitchPlease,
  type PitchPleaseLabHandle,
} from '@/utils/pitchLab/pitchPleaseLab';
import {
  createPolyMidiGate,
  createPolyMidiMask,
  fillMaskFromEffeTuneLevels,
  fillMaskFromPitchPleaseNotes,
  releasePolyMidiMask,
  resetPolyMidiGate,
  stepPolyMidiGate,
  suppressWeakerNeighbors,
} from '@/utils/pitchInput/polyPitchActiveSet';
import type { PolyphonicVoiceEngine } from '@/utils/pitchInput/voicePitchEngine';

export interface PolyPitchVoiceCallbacks {
  onNoteOn: (note: number, domTimeStampMs?: number) => void;
  onNoteOff: (note: number) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

const microphoneConstraints = (deviceId?: string, echoCancellation = true): MediaTrackConstraints => ({
  deviceId: deviceId ? { exact: deviceId } : undefined,
  echoCancellation,
  noiseSuppression: false,
  autoGainControl: false,
});

export class PolyPitchVoiceInput {
  private readonly gate = createPolyMidiGate();
  private readonly scratch = createPolyMidiMask();
  private readonly levels = new Float32Array(128);
  private readonly drop = createPolyMidiMask();
  private stream: MediaStream | null = null;
  private ownsStream = false;
  private audioContext: AudioContext | null = null;
  private pitchPlease: PitchPleaseLabHandle | null = null;
  private effetune: EffetuneLabLiveHandle | null = null;
  private callbacks: PolyPitchVoiceCallbacks | null = null;

  async connect(
    engine: PolyphonicVoiceEngine,
    callbacks: PolyPitchVoiceCallbacks,
    deviceId?: string,
    echoCancellation = true,
  ): Promise<boolean> {
    await this.disconnect();
    resetPolyMidiGate(this.gate);
    this.callbacks = callbacks;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: microphoneConstraints(deviceId, echoCancellation),
        video: false,
      });
      this.stream = stream;
      this.ownsStream = true;
      if (engine === 'effetune') {
        const context = new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' });
        this.audioContext = context;
        if (context.state === 'suspended') await context.resume();
        this.effetune = await connectEffetuneLive(
          context,
          stream,
          null,
          undefined,
          (frame) => {
            fillMaskFromEffeTuneLevels(
              this.scratch,
              this.gate.emitted,
              frame.levels,
              frame.firstMidi,
              frame.divisionsPerSemitone,
              this.levels,
            );
            suppressWeakerNeighbors(this.scratch, this.levels, this.drop);
            this.emitEdges();
          },
        );
      } else {
        const model = engine === 'pitchplease-piano' ? 'piano' : 'fast';
        this.pitchPlease = createPitchPleaseLab(model, null, undefined, (frame) => {
          fillMaskFromPitchPleaseNotes(this.scratch, this.levels, frame.notes, frame.probs);
          if (frame.probs) suppressWeakerNeighbors(this.scratch, this.levels, this.drop);
          this.emitEdges();
        });
        const started = await startPitchPleaseOnStream(this.pitchPlease, stream);
        if (!started) {
          await this.disconnect();
          callbacks.onError?.('PitchPlease を開始できませんでした');
          return false;
        }
      }
      callbacks.onConnectionChange?.(true);
      return true;
    } catch {
      await this.disconnect();
      callbacks.onError?.('マイクへのアクセスに失敗しました');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pitchPlease) stopPitchPlease(this.pitchPlease);
    this.pitchPlease = null;
    if (this.effetune) disconnectEffetuneLive(this.effetune);
    this.effetune = null;
    if (this.audioContext) {
      await this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }
    if (this.ownsStream) {
      this.stream?.getTracks().forEach((track) => track.stop());
    }
    this.stream = null;
    this.ownsStream = false;
    const callbacks = this.callbacks;
    releasePolyMidiMask(this.gate.emitted, (midi) => callbacks?.onNoteOff(midi));
    resetPolyMidiGate(this.gate);
    callbacks?.onConnectionChange?.(false);
    this.callbacks = null;
  }

  private emitEdges(): void {
    const callbacks = this.callbacks;
    if (!callbacks) return;
    const now = performance.now();
    stepPolyMidiGate(
      this.gate,
      this.scratch,
      now,
      (midi) => callbacks.onNoteOn(midi, now),
      (midi) => callbacks.onNoteOff(midi),
    );
  }
}
