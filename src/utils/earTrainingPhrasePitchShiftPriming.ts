/** SoundTouch 処理後バッファ先頭の無音/プライミング区間を秒で推定する（ループ A-B 切り出し補正用）。 */
export const detectPhraseBufferLeadingOffsetSec = (
  buffer: AudioBuffer,
  options: {
    amplitudeThreshold?: number;
    maxSearchSec?: number;
  } = {},
): number => {
  const threshold = options.amplitudeThreshold ?? 1e-4;
  const maxSearchFrames = Math.min(
    buffer.length,
    Math.ceil(buffer.sampleRate * (options.maxSearchSec ?? 0.05)),
  );
  const channelCount = buffer.numberOfChannels;
  for (let frame = 0; frame < maxSearchFrames; frame += 1) {
    let peak = 0;
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.abs(buffer.getChannelData(channel)[frame] ?? 0);
      if (sample > peak) {
        peak = sample;
      }
    }
    if (peak >= threshold) {
      return frame / buffer.sampleRate;
    }
  }
  return 0;
};

/** 移調済みバッファ群から最大の先頭オフセットを返す（キー間のズレを吸収）。 */
export const resolvePhraseBufferPrimingOffsetSec = (
  buffers: readonly AudioBuffer[],
): number => {
  let maxOffsetSec = 0;
  for (const buffer of buffers) {
    maxOffsetSec = Math.max(maxOffsetSec, detectPhraseBufferLeadingOffsetSec(buffer));
  }
  return maxOffsetSec;
};
