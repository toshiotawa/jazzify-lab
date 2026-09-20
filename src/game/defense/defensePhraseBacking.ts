import type { DefensePhrase, DefenseStage } from '@/game/defense/defenseTypes';
import {
  isDefenseSharedProgressionStage,
  isDefenseSingleSourceStage,
} from '@/game/defense/defenseAudioRegistrationMode';
import { resolveDefenseAudioLoopWindow } from '@/game/defense/defenseAudioLoopWindow';

export interface DefensePhraseBackingPlayback {
  readonly buffer: AudioBuffer;
  readonly loopStart: number;
  readonly loopEnd: number;
  readonly startOffset: number;
  readonly barCount: number;
}

const SPEED_RATIO_EPSILON = 0.0001;

export const resolveDefensePhrasePreloadUrls = (
  stage: DefenseStage,
  phraseIndices: readonly number[],
): readonly string[] => {
  if (isDefenseSharedProgressionStage(stage)) {
    const urls = stage.phrases
      .map((phrase) => phrase.audioUrl)
      .filter((url) => url.length > 0);
    return [...new Set(urls)];
  }
  if (isDefenseSingleSourceStage(stage)) {
    return stage.audioUrl ? [stage.audioUrl] : [];
  }
  const urls = phraseIndices
    .map((index) => stage.phrases[index]?.audioUrl ?? '')
    .filter((url) => url.length > 0);
  return [...new Set(urls)];
};

export const sliceAudioBuffer = (
  ctx: AudioContext,
  source: AudioBuffer,
  startSec: number,
  endSec: number,
): AudioBuffer => {
  const safeStart = Math.max(0, Math.min(source.duration, startSec));
  const safeEnd = Math.max(safeStart, Math.min(source.duration, endSec));
  const frameCount = Math.max(0, Math.ceil((safeEnd - safeStart) * source.sampleRate));
  if (frameCount <= 0) {
    return ctx.createBuffer(source.numberOfChannels, 1, source.sampleRate);
  }

  const sliced = ctx.createBuffer(source.numberOfChannels, frameCount, source.sampleRate);
  const startFrame = Math.floor(safeStart * source.sampleRate);
  for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
    const input = source.getChannelData(channel);
    const output = sliced.getChannelData(channel);
    output.set(input.subarray(startFrame, startFrame + frameCount));
  }
  return sliced;
};

const resolveDefensePhraseBarCount = (
  stage: Pick<DefenseStage, 'phraseBars' | 'progressionBars' | 'audioRegistrationMode'>,
  phrase: Pick<DefensePhrase, 'loopStartMeasure' | 'loopEndMeasure'>,
): number => {
  if (isDefenseSharedProgressionStage(stage)) {
    return Math.max(1, stage.progressionBars ?? stage.phraseBars);
  }
  if (phrase.loopStartMeasure !== null && phrase.loopEndMeasure !== null) {
    return Math.max(1, phrase.loopEndMeasure - phrase.loopStartMeasure + 1);
  }
  return Math.max(1, stage.phraseBars);
};

const fitAudioBufferToDuration = (
  ctx: AudioContext,
  source: AudioBuffer,
  durationSec: number,
): AudioBuffer => {
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
};

export const resolveDefensePhraseLoopWindow = (
  stage: Pick<DefenseStage, 'bpm' | 'beatsPerBar'>,
  phrase: Pick<DefensePhrase, 'loopStartMeasure' | 'loopEndMeasure'>,
  bufferDurationSec?: number,
) => {
  if (phrase.loopStartMeasure === null || phrase.loopEndMeasure === null) {
    return null;
  }
  return resolveDefenseAudioLoopWindow({
    startMeasure: phrase.loopStartMeasure,
    endMeasure: phrase.loopEndMeasure,
    bpm: stage.bpm,
    beatsPerBar: stage.beatsPerBar,
    bufferDurationSec,
  });
};

export const buildDefensePhraseBackingPlayback = (
  decoded: AudioBuffer,
  stage: DefenseStage,
  phrase: DefensePhrase,
  _ctx: AudioContext,
): DefensePhraseBackingPlayback => {
  const loopWindow = resolveDefensePhraseLoopWindow(stage, phrase, decoded.duration);
  const useSharedLoopRange = isDefenseSingleSourceStage(stage) && loopWindow !== null;
  const barCount = resolveDefensePhraseBarCount(stage, phrase);

  if (useSharedLoopRange) {
    return {
      buffer: decoded,
      loopStart: loopWindow.startSec,
      loopEnd: loopWindow.endSec,
      startOffset: loopWindow.startSec,
      barCount,
    };
  }

  return {
    buffer: decoded,
    loopStart: 0,
    loopEnd: decoded.duration,
    startOffset: 0,
    barCount,
  };
};

export const prepareDefensePhraseBackingPlayback = async (
  ctx: AudioContext,
  stage: DefenseStage,
  phrase: DefensePhrase,
  speedRatio: number,
  decodeRaw: (url: string) => Promise<AudioBuffer>,
  applySpeed: (buffer: AudioBuffer, ratio: number) => Promise<AudioBuffer>,
): Promise<DefensePhraseBackingPlayback> => {
  const decoded = await decodeRaw(phrase.audioUrl);
  const loopWindow = resolveDefensePhraseLoopWindow(stage, phrase, decoded.duration);
  const useSharedLoopRange = isDefenseSingleSourceStage(stage) && loopWindow !== null;
  const needsSpeedChange = Math.abs(speedRatio - 1) >= SPEED_RATIO_EPSILON;
  const barCount = resolveDefensePhraseBarCount(stage, phrase);
  const safeRatio = Math.max(0.1, speedRatio);

  if (useSharedLoopRange && needsSpeedChange) {
    const sliced = sliceAudioBuffer(ctx, decoded, loopWindow.startSec, loopWindow.endSec);
    const processed = await applySpeed(sliced, safeRatio);
    const fitted = fitAudioBufferToDuration(ctx, processed, loopWindow.durationSec / safeRatio);
    return {
      buffer: fitted,
      loopStart: 0,
      loopEnd: fitted.duration,
      startOffset: 0,
      barCount,
    };
  }

  if (!useSharedLoopRange && needsSpeedChange) {
    const processed = await applySpeed(decoded, safeRatio);
    const fitted = fitAudioBufferToDuration(ctx, processed, decoded.duration / safeRatio);
    return {
      buffer: fitted,
      loopStart: 0,
      loopEnd: fitted.duration,
      startOffset: 0,
      barCount,
    };
  }

  return buildDefensePhraseBackingPlayback(decoded, stage, phrase, ctx);
};
