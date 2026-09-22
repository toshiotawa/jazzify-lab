/**
 * 48kHz への状態保持リサンプル。分割処理でも位相を引き継ぐ。
 */

export interface Resampler48kState {
  inputRate: number;
  ratio: number;
  /** 現在チャンク内の読み取り位相（入力サンプル単位） */
  phase: number;
}

export const createResampler48kState = (inputRate: number): Resampler48kState => ({
  inputRate,
  ratio: inputRate / 48_000,
  phase: 0,
});

const linearAt = (input: Float32Array, index: number): number => {
  const idx = Math.floor(index);
  const frac = index - idx;
  const s0 = input[idx] ?? 0;
  const s1 = input[idx + 1] ?? s0;
  return s0 + (s1 - s0) * frac;
};

/**
 * input を 48kHz 相当のサンプル列へ変換し output に追記する。
 * @returns 書き込んだ 48k サンプル数
 */
export const resampleTo48kStateful = (
  input: Float32Array,
  output: Float32Array,
  outputOffset: number,
  state: Resampler48kState,
): number => {
  if (Math.abs(state.ratio - 1) < 0.001) {
    const copyLen = Math.min(input.length, output.length - outputOffset);
    output.set(input.subarray(0, copyLen), outputOffset);
    state.phase = 0;
    return copyLen;
  }

  let outIndex = outputOffset;
  let phase = state.phase;
  const maxOut = output.length;

  while (outIndex < maxOut) {
    if (phase >= input.length) {
      phase -= input.length;
      break;
    }
    output[outIndex] = linearAt(input, phase);
    outIndex += 1;
    phase += state.ratio;
  }

  state.phase = phase;
  return outIndex - outputOffset;
};

/** 一括リサンプル（テスト用参照実装）。 */
export const resampleTo48kBatch = (input: Float32Array, inputRate: number): Float32Array => {
  if (Math.abs(inputRate - 48_000) < 0.001) {
    return new Float32Array(input);
  }
  const output = new Float32Array(Math.ceil(input.length / (inputRate / 48_000)) + 1);
  const state = createResampler48kState(inputRate);
  const written = resampleTo48kStateful(input, output, 0, state);
  return output.subarray(0, written);
};
