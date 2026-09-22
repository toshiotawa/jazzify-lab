/**
 * defenseMelodyLoopCrossfade - 2 小節メロディループの切れ目を等パワー重なりでつなぐ。
 */

export const MELODY_LOOP_OVERLAP_MS = 15;

export const applyMelodyLoopCrossfade = (data: Float32Array, sampleRate: number): void => {
  const overlapFrames = Math.max(1, Math.round(sampleRate * (MELODY_LOOP_OVERLAP_MS / 1000)));
  if (data.length <= overlapFrames * 2) {
    return;
  }

  // De-click the loop tail only; preserve downbeat attack at sample 0.
  for (let index = 0; index < overlapFrames; index += 1) {
    const head = data[index] ?? 0;
    const tailIndex = data.length - overlapFrames + index;
    const tail = data[tailIndex] ?? 0;
    const progress = index / overlapFrames;
    const fadeOut = Math.cos((Math.PI / 2) * progress);
    const fadeIn = Math.sin((Math.PI / 2) * progress);
    data[tailIndex] = tail * fadeOut + head * fadeIn;
  }
};
