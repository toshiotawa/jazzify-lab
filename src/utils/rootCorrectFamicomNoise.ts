/**
 * 正解ルート音に重ねるファミコン風ノイズ用の短いループPCM。
 * AudioBuffer は FantasySoundManager で1回だけ生成し、以降は BufferSource のみ都度生成する。
 */
export const ROOT_CORRECT_NOISE_LOOP_SAMPLES = 2048;

/** モノラルループ用に [-1, 1] の乱数で埋める */
export function fillRootCorrectNoiseLoop(out: Float32Array): void {
  const len = out.length;
  for (let i = 0; i < len; i += 1) {
    out[i] = Math.random() * 2 - 1;
  }
}
