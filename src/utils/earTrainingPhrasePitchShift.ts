import { processOffline } from '@soundtouchjs/audio-worklet';
import soundtouchProcessorUrl from '@soundtouchjs/audio-worklet/processor?url';
import { SoundTouch } from '@soundtouchjs/core';
import {
  clampPracticeSpeedPercent,
  practiceSpeedRatio,
} from '@/utils/earTrainingPracticeSpeed';

const clampSemitones = (semitones: number): number =>
  Math.max(-12, Math.min(12, Math.trunc(semitones)));

const PROCESS_CHUNK_FRAMES = 4096;
const FLUSH_PROCESS_ITERATIONS = 64;

const interleaveChannels = (buffer: AudioBuffer): Float32Array => {
  const frameCount = buffer.length;
  const channelCount = buffer.numberOfChannels;
  const interleaved = new Float32Array(frameCount * 2);
  const left = buffer.getChannelData(0);

  if (channelCount === 1) {
    for (let frame = 0; frame < frameCount; frame += 1) {
      const sample = left[frame];
      interleaved[frame * 2] = sample;
      interleaved[frame * 2 + 1] = sample;
    }
    return interleaved;
  }

  const right = buffer.getChannelData(1);
  for (let frame = 0; frame < frameCount; frame += 1) {
    interleaved[frame * 2] = left[frame];
    interleaved[frame * 2 + 1] = right[frame];
  }
  return interleaved;
};

const drainOutputBuffer = (
  soundTouch: SoundTouch,
  collected: Float32Array[],
): void => {
  const output = soundTouch.outputBuffer;
  while (output.frameCount > 0) {
    const frames = output.frameCount;
    const chunk = new Float32Array(frames * 2);
    output.extract(chunk, 0, frames);
    output.receive(frames);
    collected.push(chunk);
  }
};

const mergeInterleavedChunks = (chunks: readonly Float32Array[]): Float32Array => {
  const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalSamples);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
};

const writeInterleavedToAudioBuffer = (
  ctx: BaseAudioContext,
  source: AudioBuffer,
  interleaved: Float32Array,
): AudioBuffer => {
  const frameCount = Math.floor(interleaved.length / 2);
  const output = ctx.createBuffer(source.numberOfChannels, frameCount, source.sampleRate);

  if (source.numberOfChannels === 1) {
    const mono = output.getChannelData(0);
    for (let frame = 0; frame < frameCount; frame += 1) {
      mono[frame] = interleaved[frame * 2];
    }
    return output;
  }

  const left = output.getChannelData(0);
  const right = output.getChannelData(1);
  for (let frame = 0; frame < frameCount; frame += 1) {
    left[frame] = interleaved[frame * 2];
    right[frame] = interleaved[frame * 2 + 1];
  }
  return output;
};

const processOfflinePitchShift = (
  source: AudioBuffer,
  semitones: number,
): Float32Array => {
  const soundTouch = new SoundTouch({
    sampleRate: source.sampleRate,
    sampleBufferType: 'fifo',
    interpolationStrategy: 'lanczos',
  });
  soundTouch.pitchSemitones = semitones;

  const interleaved = interleaveChannels(source);
  const frameCount = source.length;
  const collected: Float32Array[] = [];

  for (let offset = 0; offset < frameCount; offset += PROCESS_CHUNK_FRAMES) {
    const chunkFrames = Math.min(PROCESS_CHUNK_FRAMES, frameCount - offset);
    soundTouch.inputBuffer.putSamples(interleaved, offset, chunkFrames);
    soundTouch.process();
    drainOutputBuffer(soundTouch, collected);
  }

  for (let iteration = 0; iteration < FLUSH_PROCESS_ITERATIONS; iteration += 1) {
    const samplesBefore = collected.reduce((sum, chunk) => sum + chunk.length, 0);
    soundTouch.process();
    drainOutputBuffer(soundTouch, collected);
    const samplesAfter = collected.reduce((sum, chunk) => sum + chunk.length, 0);
    if (samplesAfter === samplesBefore) {
      break;
    }
  }

  if (collected.length === 0) {
    return interleaved;
  }

  return mergeInterleavedChunks(collected);
};

/** 練習移調用。SoundTouch でテンポを保ったままピッチだけシフトした AudioBuffer を返す。 */
export const shiftPhraseBufferPitch = async (
  source: AudioBuffer,
  semitones: number,
  audioContext?: BaseAudioContext,
): Promise<AudioBuffer> => {
  const clamped = clampSemitones(semitones);
  if (clamped === 0) {
    return source;
  }

  const processed = processOfflinePitchShift(source, clamped);
  const ctx = audioContext ?? new OfflineAudioContext(1, 1, source.sampleRate);
  return writeInterleavedToAudioBuffer(ctx, source, processed);
};

export interface ProcessOfflinePhraseBufferOptions {
  semitones?: number;
  speedPercent?: number;
}

/** 練習移調・速度変更用。SoundTouch オフラインでピッチ保持のまま処理した AudioBuffer を返す。 */
export const processOfflinePhraseBuffer = async (
  source: AudioBuffer,
  options: ProcessOfflinePhraseBufferOptions = {},
): Promise<AudioBuffer> => {
  const semitones = clampSemitones(options.semitones ?? 0);
  const speedPercent = clampPracticeSpeedPercent(options.speedPercent ?? 100);
  const playbackRate = practiceSpeedRatio(speedPercent);

  if (semitones === 0 && speedPercent === 100) {
    return source;
  }

  return processOffline({
    input: source,
    processorUrl: soundtouchProcessorUrl,
    pitchSemitones: semitones,
    playbackRate,
  });
};

export const buildPhrasePrepareCacheKey = (
  url: string,
  semitones: number,
  speedPercent = 100,
): string =>
  `${url}\0${clampSemitones(semitones)}\0${clampPracticeSpeedPercent(speedPercent)}`;
