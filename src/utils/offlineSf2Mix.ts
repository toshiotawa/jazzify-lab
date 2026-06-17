import {
  loadOfflineSf2ZonesForMidiNotes,
  loadOfflineSf2ZonesForMidiRange,
  loadOfflineSf2ZonesForSurvivalCodeRunRoots,
  pickSf2ZoneForMidi,
  resolveSf2PlaybackRate,
  type OfflineSf2Zone,
} from '@/utils/sf2RootNotePlayer';

export interface OfflineNoteEvent {
  readonly startSec: number;
  readonly durationSec: number;
  readonly midi: number;
  /** 0〜1 のゲイン（ベロシティ相当） */
  readonly gain: number;
  /** ヴォイシング用: sustain=表拍（伸ばす） / staccato=裏拍 */
  readonly articulation?: MinusOneVoicingArticulation;
}

export type MinusOneVoicingArticulation = 'sustain' | 'staccato';

const OUTPUT_SAMPLE_RATE = 44100;
const NYQUIST_HZ = OUTPUT_SAMPLE_RATE / 2;
const ATTACK_SEC = 0.006;
const RELEASE_SEC = 0.055;
const TRIANGLE_SERIES_SCALE = 8 / (Math.PI * Math.PI);
/** Sf2RootNotePlayer.startInternal と同じ */
const SURVIVAL_BASS_PLAYBACK_BOOST = 1.35;
const SURVIVAL_BASS_PEAK_CAP = 1.8;

const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

export type MinusOneSynthVariant = 'triangle' | 'sine';

/** 折り返しエイリアシングを避ける三角波（奇数倍音のフーリエ級数） */
const bandLimitedTriangle = (hz: number, timeSec: number): number => {
  if (hz <= 0) {
    return 0;
  }
  let sum = 0;
  for (let harmonic = 1; harmonic <= 31; harmonic += 2) {
    const harmonicHz = hz * harmonic;
    if (harmonicHz >= NYQUIST_HZ) {
      break;
    }
    const sign = harmonic % 4 === 1 ? 1 : -1;
    sum += sign * Math.sin(2 * Math.PI * harmonicHz * timeSec) / (harmonic * harmonic);
  }
  return sum * TRIANGLE_SERIES_SCALE;
};

const synthSampleAt = (variant: MinusOneSynthVariant, hz: number, timeSec: number): number => {
  if (variant === 'sine') {
    return Math.sin(2 * Math.PI * hz * timeSec);
  }
  return bandLimitedTriangle(hz, timeSec);
};

/** ベースは常に正弦波（三角波の高次倍音がコード声部と干渉しないようにする） */
const bassSampleAt = (hz: number, timeSec: number): number => Math.sin(2 * Math.PI * hz * timeSec);

const wholeNoteEnvelope = (localSec: number, durationSec: number): number => {
  if (localSec < 0 || localSec > durationSec) {
    return 0;
  }
  if (localSec < ATTACK_SEC) {
    return localSec / ATTACK_SEC;
  }
  const releaseSec = Math.min(0.07, durationSec * 0.05);
  if (localSec > durationSec - releaseSec) {
    const releasePos = (localSec - (durationSec - releaseSec)) / releaseSec;
    return Math.max(0, 1 - releasePos);
  }
  return 1;
};

/** ヴォイシング参考用（2拍目表拍: スウィング8分・やや伸ばす） */
const voicingSustainEnvelope = (localSec: number, durationSec: number): number => {
  const attackSec = Math.min(0.01, durationSec * 0.08);
  const releaseSec = Math.min(0.05, durationSec * 0.14);
  const sustainLevel = 0.46;
  if (localSec < 0 || localSec > durationSec) {
    return 0;
  }
  if (localSec < attackSec) {
    return localSec / attackSec;
  }
  if (localSec > durationSec - releaseSec) {
    const releasePos = (localSec - (durationSec - releaseSec)) / releaseSec;
    return sustainLevel * Math.max(0, 1 - releasePos);
  }
  return sustainLevel;
};

/** ヴォイシング参考用（2拍目裏拍: スタッカート） */
const voicingStaccatoEnvelope = (localSec: number, durationSec: number): number => {
  const attackSec = 0.008;
  const releaseSec = Math.min(0.045, durationSec * 0.42);
  const sustainLevel = 0.48;
  if (localSec < 0 || localSec > durationSec) {
    return 0;
  }
  if (localSec < attackSec) {
    return localSec / attackSec;
  }
  if (localSec > durationSec - releaseSec) {
    const releasePos = (localSec - (durationSec - releaseSec)) / releaseSec;
    return sustainLevel * Math.max(0, 1 - releasePos);
  }
  return sustainLevel;
};

const voicingEnvelopeForEvent = (
  event: OfflineNoteEvent,
  localSec: number,
): number => {
  if (event.articulation === 'staccato') {
    return voicingStaccatoEnvelope(localSec, event.durationSec);
  }
  if (event.articulation === 'sustain') {
    return voicingSustainEnvelope(localSec, event.durationSec);
  }
  return voicingEnvelope(localSec, event.durationSec);
};

/** @deprecated 後方互換。新規は sustain / staccato を使う */
const voicingEnvelope = (localSec: number, durationSec: number): number => {
  const attackSec = 0.01;
  const decaySec = 0.1;
  const sustainLevel = 0.34;
  if (localSec < 0 || localSec > durationSec) {
    return 0;
  }
  if (localSec < attackSec) {
    return localSec / attackSec;
  }
  if (localSec < attackSec + decaySec) {
    const decayPos = (localSec - attackSec) / decaySec;
    return 1 - decayPos * (1 - sustainLevel);
  }
  if (localSec > durationSec - RELEASE_SEC) {
    const releasePos = (localSec - (durationSec - RELEASE_SEC)) / RELEASE_SEC;
    return sustainLevel * Math.max(0, 1 - releasePos);
  }
  return sustainLevel;
};

const mixVoicingSynthNoteIntoBuffer = (
  output: Float32Array,
  event: OfflineNoteEvent,
  variant: MinusOneSynthVariant,
): void => {
  const hz = midiToHz(event.midi);
  const startFrame = Math.floor(event.startSec * OUTPUT_SAMPLE_RATE);
  const durationFrames = Math.ceil(event.durationSec * OUTPUT_SAMPLE_RATE);
  const peakGain = Math.max(0, Math.min(0.4, event.gain * (variant === 'sine' ? 0.42 : 0.38)));

  for (let i = 0; i < durationFrames; i += 1) {
    const outIndex = startFrame + i;
    if (outIndex < 0 || outIndex >= output.length) {
      continue;
    }
    const localSec = i / OUTPUT_SAMPLE_RATE;
    const env = voicingEnvelopeForEvent(event, localSec);
    if (env <= 0) {
      continue;
    }
    const t = (startFrame + i) / OUTPUT_SAMPLE_RATE;
    output[outIndex] += synthSampleAt(variant, hz, t) * env * peakGain;
  }
};

const mixBassSynthNoteIntoBuffer = (
  output: Float32Array,
  event: OfflineNoteEvent,
): void => {
  const hz = midiToHz(event.midi);
  const startFrame = Math.floor(event.startSec * OUTPUT_SAMPLE_RATE);
  const durationFrames = Math.ceil(event.durationSec * OUTPUT_SAMPLE_RATE);
  const peakGain = Math.max(0, Math.min(0.95, event.gain * 0.9));

  for (let i = 0; i < durationFrames; i += 1) {
    const outIndex = startFrame + i;
    if (outIndex < 0 || outIndex >= output.length) {
      continue;
    }
    const localSec = i / OUTPUT_SAMPLE_RATE;
    const env = wholeNoteEnvelope(localSec, event.durationSec);
    if (env <= 0) {
      continue;
    }
    const t = (startFrame + i) / OUTPUT_SAMPLE_RATE;
    output[outIndex] += bassSampleAt(hz, t) * env * peakGain;
  }
};

const resolveZoneForMidi = (zones: readonly OfflineSf2Zone[], midi: number): OfflineSf2Zone | null => {
  const candidates = zones.filter(zone => midi >= zone.keyRange[0] && midi <= zone.keyRange[1]);
  const picked = pickSf2ZoneForMidi(
    candidates.map(zone => ({ keyRange: zone.keyRange, rootMidi: zone.rootMidi })),
    midi,
  );
  if (!picked) {
    return null;
  }
  return candidates.find(
    zone => zone.keyRange[0] === picked.keyRange[0]
      && zone.keyRange[1] === picked.keyRange[1]
      && zone.rootMidi === picked.rootMidi,
  ) ?? null;
};

const sampleAtSourceFrame = (
  zone: OfflineSf2Zone,
  sourceFrame: number,
): number => {
  const { pcm, loopStartFrame, loopEndFrame, sampleModes } = zone;
  if (pcm.length === 0) {
    return 0;
  }
  let frame = sourceFrame;
  const useLoop = (sampleModes & 1) === 1 && loopEndFrame > loopStartFrame;
  if (useLoop && frame >= loopEndFrame) {
    const loopLen = loopEndFrame - loopStartFrame;
    if (loopLen > 0) {
      frame = loopStartFrame + ((frame - loopStartFrame) % loopLen);
    }
  }
  if (frame < 0) {
    return 0;
  }
  if (frame >= pcm.length - 1) {
    return pcm[pcm.length - 1] ?? 0;
  }
  const i0 = Math.floor(frame);
  const i1 = i0 + 1;
  const frac = frame - i0;
  return pcm[i0] * (1 - frac) + pcm[i1] * frac;
};

const mixSf2NoteIntoBuffer = (
  output: Float32Array,
  zones: readonly OfflineSf2Zone[],
  event: OfflineNoteEvent,
  envelope: (localSec: number, durationSec: number) => number,
  gainScale: number,
): boolean => {
  const zone = resolveZoneForMidi(zones, event.midi);
  if (!zone) {
    return false;
  }
  const playbackRate = resolveSf2PlaybackRate(
    event.midi,
    zone.rootMidi,
    zone.coarseTune,
    zone.fineTune,
    zone.pitchCorrection,
  );
  const sourceRate = zone.sampleRate;
  const attenuationGain = Math.pow(10, -zone.initialAttenuation / 200);
  const peakGain = Math.max(
    0,
    Math.min(
      SURVIVAL_BASS_PEAK_CAP,
      event.gain * gainScale * SURVIVAL_BASS_PLAYBACK_BOOST * attenuationGain,
    ),
  );
  const startFrame = Math.floor(event.startSec * OUTPUT_SAMPLE_RATE);
  const durationFrames = Math.ceil(event.durationSec * OUTPUT_SAMPLE_RATE);

  for (let i = 0; i < durationFrames; i += 1) {
    const outIndex = startFrame + i;
    if (outIndex < 0 || outIndex >= output.length) {
      continue;
    }
    const localSec = i / OUTPUT_SAMPLE_RATE;
    const env = envelope(localSec, event.durationSec);
    if (env <= 0) {
      continue;
    }
    const sourceFrame = localSec * playbackRate * sourceRate;
    output[outIndex] += sampleAtSourceFrame(zone, sourceFrame) * peakGain * env;
  }
  return true;
};

export const loadOfflineSf2FromFile = (
  arrayBuffer: ArrayBuffer,
  minMidi: number,
  maxMidi: number,
): OfflineSf2Zone[] => loadOfflineSf2ZonesForMidiRange(arrayBuffer, minMidi, maxMidi);

export const loadOfflineSf2FromMidiNotes = (
  arrayBuffer: ArrayBuffer,
  midiNotes: readonly number[],
): OfflineSf2Zone[] => loadOfflineSf2ZonesForMidiNotes(arrayBuffer, midiNotes);

export const loadOfflineSurvivalBassSf2FromFile = (
  arrayBuffer: ArrayBuffer,
): OfflineSf2Zone[] => loadOfflineSf2ZonesForSurvivalCodeRunRoots(arrayBuffer);

/** マイナスワン用: ベース ルート（FingerBass SF2 / サバイバル正解音） */
export const renderOfflineSf2BassEvents = (
  zones: readonly OfflineSf2Zone[],
  events: readonly OfflineNoteEvent[],
  durationSec: number,
): Float32Array => {
  const frameCount = Math.ceil(durationSec * OUTPUT_SAMPLE_RATE);
  const output = new Float32Array(frameCount);
  for (const event of events) {
    const rendered = mixSf2NoteIntoBuffer(output, zones, event, wholeNoteEnvelope, 1.0);
    if (rendered) {
      mixBassSynthNoteIntoBuffer(output, { ...event, gain: event.gain * 0.5 });
    } else {
      mixBassSynthNoteIntoBuffer(output, event);
    }
  }
  return output;
};

/** マイナスワン用: 薄い合成音シンセ（triangle / sine） */
export const renderOfflineSimpleSynthEvents = (
  events: readonly OfflineNoteEvent[],
  durationSec: number,
  variant: MinusOneSynthVariant = 'triangle',
): Float32Array => {
  const frameCount = Math.ceil(durationSec * OUTPUT_SAMPLE_RATE);
  const output = new Float32Array(frameCount);
  for (const event of events) {
    mixVoicingSynthNoteIntoBuffer(output, event, variant);
  }
  return output;
};

/** 合成音ベース（SF2 ゾーンが無い場合のフォールバック） */
export const renderOfflineSynthBassEvents = (
  events: readonly OfflineNoteEvent[],
  durationSec: number,
  _variant: MinusOneSynthVariant = 'triangle',
): Float32Array => {
  const frameCount = Math.ceil(durationSec * OUTPUT_SAMPLE_RATE);
  const output = new Float32Array(frameCount);
  for (const event of events) {
    mixBassSynthNoteIntoBuffer(output, event);
  }
  return output;
};

export const scaleFloat32Buffer = (buffer: Float32Array, scale: number): void => {
  if (scale === 1) {
    return;
  }
  for (let i = 0; i < buffer.length; i += 1) {
    buffer[i] *= scale;
  }
};

export const mixFloat32Buffers = (layers: readonly Float32Array[]): Float32Array => {
  const length = layers.reduce((max, layer) => Math.max(max, layer.length), 0);
  const output = new Float32Array(length);
  for (const layer of layers) {
    for (let i = 0; i < layer.length; i += 1) {
      output[i] += layer[i];
    }
  }
  return output;
};

export const measureFloat32Peak = (buffer: Float32Array): number => {
  let peak = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    peak = Math.max(peak, Math.abs(buffer[i]));
  }
  return peak;
};

/** クリッピング歪み（不自然な倍音）を避けるためピークを正規化（必要時のみ縮小） */
export const normalizeFloat32Peak = (
  buffer: Float32Array,
  targetPeak: number,
): void => {
  limitFloat32Peak(buffer, targetPeak);
};

/** ピークが上限を超えるときだけ縮小（持ち上げない） */
export const limitFloat32Peak = (
  buffer: Float32Array,
  targetPeak: number,
): void => {
  if (targetPeak <= 0) {
    return;
  }
  const peak = measureFloat32Peak(buffer);
  if (peak <= targetPeak || peak === 0) {
    return;
  }
  const scale = targetPeak / peak;
  for (let i = 0; i < buffer.length; i += 1) {
    buffer[i] *= scale;
  }
};

export const float32ToInt16Pcm = (input: Float32Array): Int16Array => {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    output[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
  }
  return output;
};

export const writeWavFile = (pcm: Int16Array, sampleRate: number): Uint8Array => {
  const bytesPerSample = 2;
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i += 1) {
    view.setInt16(offset, pcm[i], true);
    offset += 2;
  }
  return new Uint8Array(buffer);
};

export const OFFLINE_MIX_SAMPLE_RATE = OUTPUT_SAMPLE_RATE;
