/**
 * defenseMelodyLoopCrossfade - メロディ PCM のループ切れ目処理。
 * 合成メロディは休符で終わるため、末尾へ先頭アタックを混ぜない。
 */

export const MELODY_LOOP_OVERLAP_MS = 15;

export const applyMelodyLoopCrossfade = (_data: Float32Array, _sampleRate: number): void => {
  // No-op: phrase PCM is played as-is; silent loop tails need no crossfade.
};
