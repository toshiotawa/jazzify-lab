/**
 * Separate-tracks: decode, validate source WAV, build speed-normalized PCM sets.
 */
import { processOffline } from '@soundtouchjs/audio-worklet';
import soundtouchProcessorUrl from '@soundtouchjs/audio-worklet/processor?url';

import {
  computeAllPhraseLoopWindows,
  computeExpectedSourceFrames,
  computeSeparateTracksGrid,
  isSeparateTracksSourceFrameCountValid,
  type SeparateTracksPhraseBars,
} from '@/game/defense/defenseSeparateTracksTransport';
import type {
  SeparateTracksPhrasePcm,
  SeparateTracksPreparedSet,
} from '@/game/defense/defenseSeparateTracksMix';
import type { DefenseStage } from '@/game/defense/defenseTypes';
import { fetchCachedFullAudioBuffer } from '@/utils/audioFetchCache';
import { toCdnProxyUrl } from '@/utils/cdnProxy';

import { applyMelodyLoopCrossfade } from '@/game/defense/defenseMelodyLoopCrossfade';

const SPEED_RATIO_EPSILON = 0.0001;
const PROCESSOR_VERSION = 2;

let nextSetId = 1;

const applyEnvelope = (data: Float32Array, sampleRate: number): void => {
  applyMelodyLoopCrossfade(data, sampleRate);
};

const copyChannel = (
  source: AudioBuffer,
  channel: number,
  startFrame: number,
  frameCount: number,
): Float32Array => {
  const data = new Float32Array(frameCount);
  const channelData = source.getChannelData(Math.min(channel, source.numberOfChannels - 1));
  data.set(channelData.subarray(startFrame, startFrame + frameCount));
  return data;
};

const normalizeToFrames = (
  left: Float32Array,
  right: Float32Array,
  targetFrames: number,
): { left: Float32Array; right: Float32Array } => {
  const outLeft = new Float32Array(targetFrames);
  const outRight = new Float32Array(targetFrames);
  const copyCount = Math.min(targetFrames, left.length, right.length);
  outLeft.set(left.subarray(0, copyCount));
  outRight.set(right.subarray(0, copyCount));
  if (copyCount > 1 && copyCount < targetFrames) {
    outLeft[copyCount] = left[copyCount - 1] ?? 0;
    outRight[copyCount] = right[copyCount - 1] ?? 0;
  }
  return { left: outLeft, right: outRight };
};

const applyPlaybackRate = async (
  buffer: AudioBuffer,
  speedRatio: number,
): Promise<AudioBuffer> => {
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
};

const decodeUrl = async (ctx: AudioContext, url: string): Promise<AudioBuffer> => {
  const arrayBuffer = await fetchCachedFullAudioBuffer(toCdnProxyUrl(url));
  return ctx.decodeAudioData(arrayBuffer.slice(0));
};

const validateSourceLength = (
  buffer: AudioBuffer,
  expectedFrames: number,
  label: string,
): void => {
  if (!isSeparateTracksSourceFrameCountValid(buffer.length, expectedFrames)) {
    throw new Error(
      `${label} length mismatch: expected ${expectedFrames} frames, got ${buffer.length}`,
    );
  }
};

export const buildSeparateTracksPreparedSet = async (params: {
  readonly stage: DefenseStage;
  readonly bgmBuffer: AudioBuffer;
  readonly melodyBuffer: AudioBuffer;
  readonly speedRatio: number;
  readonly sampleRate: number;
}): Promise<SeparateTracksPreparedSet> => {
  const { stage, bgmBuffer, melodyBuffer, speedRatio, sampleRate } = params;
  const phraseBars = stage.phraseBars as SeparateTracksPhraseBars;
  const progressionBars = stage.progressionBars ?? stage.phraseBars;
  const phraseCount = stage.phrases.length;

  const grid = computeSeparateTracksGrid({
    sampleRate,
    bpm: stage.bpm,
    beatsPerBar: stage.beatsPerBar,
    phraseBars,
    progressionBars,
    playbackRatio: speedRatio,
  });

  const expectedBgmFrames = computeExpectedSourceFrames(
    progressionBars,
    stage.bpm,
    stage.beatsPerBar,
    bgmBuffer.sampleRate,
  );
  const expectedMelodyFrames = computeExpectedSourceFrames(
    phraseCount * phraseBars,
    stage.bpm,
    stage.beatsPerBar,
    melodyBuffer.sampleRate,
  );

  validateSourceLength(bgmBuffer, expectedBgmFrames, 'BGM');
  validateSourceLength(melodyBuffer, expectedMelodyFrames, 'Melody');

  const processedBgm = await applyPlaybackRate(bgmBuffer, speedRatio);
  const windows = computeAllPhraseLoopWindows(
    phraseCount,
    phraseBars,
    stage.bpm,
    stage.beatsPerBar,
    melodyBuffer.sampleRate,
  );

  const phrasePcms: SeparateTracksPhrasePcm[] = [];
  for (const window of windows) {
    const sliceFrames = window.sourceEndFrame - window.sourceStartFrame;
    const sliceBuffer = sliceFrames > 0
      ? (() => {
        const sliceSampleRate = melodyBuffer.sampleRate;
        const tempCtx = new OfflineAudioContext(2, sliceFrames, sliceSampleRate);
        const sliced = tempCtx.createBuffer(
          melodyBuffer.numberOfChannels,
          sliceFrames,
          sliceSampleRate,
        );
        for (let ch = 0; ch < sliced.numberOfChannels; ch += 1) {
          sliced.copyToChannel(
            melodyBuffer.getChannelData(ch).subarray(window.sourceStartFrame, window.sourceEndFrame),
            ch,
          );
        }
        return sliced;
      })()
      : melodyBuffer;

    const stretched = await applyPlaybackRate(sliceBuffer, speedRatio);
    let left = copyChannel(stretched, 0, 0, stretched.length);
    let right = stretched.numberOfChannels > 1
      ? copyChannel(stretched, 1, 0, stretched.length)
      : copyChannel(stretched, 0, 0, stretched.length);

    const normalized = normalizeToFrames(left, right, grid.cycleFrames);
    left = normalized.left;
    right = normalized.right;
    applyEnvelope(left, sampleRate);
    applyEnvelope(right, sampleRate);
    phrasePcms.push({ left, right });
  }

  let bgmLeft = copyChannel(processedBgm, 0, 0, processedBgm.length);
  let bgmRight = processedBgm.numberOfChannels > 1
    ? copyChannel(processedBgm, 1, 0, processedBgm.length)
    : copyChannel(processedBgm, 0, 0, processedBgm.length);

  const normalizedBgm = normalizeToFrames(bgmLeft, bgmRight, grid.bgmFrames);
  bgmLeft = normalizedBgm.left;
  bgmRight = normalizedBgm.right;

  const setId = nextSetId;
  nextSetId += 1;

  return {
    grid,
    bgmLeft,
    bgmRight,
    phrasePcms,
    speedPercent: Math.round(speedRatio * 100),
    setId,
  };
};

export const prepareSeparateTracksBuffers = async (params: {
  readonly stage: DefenseStage;
  readonly speedRatio: number;
  readonly audioContext: AudioContext;
}): Promise<SeparateTracksPreparedSet> => {
  const { stage, speedRatio, audioContext } = params;
  const bgmUrl = stage.audioUrl ?? '';
  const melodyUrl = stage.melodyAudioUrl ?? '';
  if (bgmUrl.length === 0 || melodyUrl.length === 0) {
    throw new Error('Separate tracks stage requires BGM and melody URLs');
  }

  const [bgmBuffer, melodyBuffer] = await Promise.all([
    decodeUrl(audioContext, bgmUrl),
    decodeUrl(audioContext, melodyUrl),
  ]);

  return buildSeparateTracksPreparedSet({
    stage,
    bgmBuffer,
    melodyBuffer,
    speedRatio,
    sampleRate: audioContext.sampleRate,
  });
};

export const separateTracksCacheKey = (params: {
  readonly stageId: string;
  readonly bgmUrl: string;
  readonly melodyUrl: string;
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly progressionBars: number;
  readonly phraseBars: number;
  readonly speedPercent: number;
  readonly sampleRate: number;
}): string => (
  [
    params.stageId,
    params.bgmUrl,
    params.melodyUrl,
    params.bpm,
    params.beatsPerBar,
    params.progressionBars,
    params.phraseBars,
    params.speedPercent,
    params.sampleRate,
    PROCESSOR_VERSION,
  ].join('|')
);
