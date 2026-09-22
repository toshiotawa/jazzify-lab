/**
 * 認識専用デシメータ: アンチエイリアス後 q 倍間引き（48kHz 軸を維持）。
 */

export interface PestoDecimatorState {
  q: number;
  /** biquad 直前サンプル */
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  /** 間引き位相 0..q-1 */
  decimPhase: number;
  /** 出力バッファ */
  outScratch: Float32Array;
  outLen: number;
}

export const createPestoDecimatorState = (q: number): PestoDecimatorState => ({
  q,
  x1: 0,
  x2: 0,
  y1: 0,
  y2: 0,
  decimPhase: 0,
  outScratch: new Float32Array(240),
  outLen: 0,
});

/** q=2 -> ~12kHz, q=4 -> ~6kHz の 2次ローパス係数（48kHz 基準）。 */
const lowpassCoeffs = (q: number): { b0: number; b1: number; b2: number; a1: number; a2: number } => {
  const fc = 0.45 / q;
  const w0 = 2 * Math.PI * fc;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * 0.707);
  const b0 = (1 - cosW0) / 2;
  const b1 = 1 - cosW0;
  const b2 = (1 - cosW0) / 2;
  const a0 = 1 + alpha;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: (-2 * cosW0) / a0,
    a2: (1 - alpha) / a0,
  };
};

const biquadStep = (
  x0: number,
  state: PestoDecimatorState,
  c: ReturnType<typeof lowpassCoeffs>,
): number => {
  const y0 = c.b0 * x0 + c.b1 * state.x1 + c.b2 * state.x2 - c.a1 * state.y1 - c.a2 * state.y2;
  state.x2 = state.x1;
  state.x1 = x0;
  state.y2 = state.y1;
  state.y1 = y0;
  return y0;
};

/**
 * 連続 PCM を feed し、240 サンプル分が溜まったら返す。
 */
export const feedPestoDecimator = (
  input: Float32Array,
  state: PestoDecimatorState,
): Float32Array | null => {
  if (state.q <= 1) {
    if (input.length === 240) return input;
    return null;
  }

  const coeffs = lowpassCoeffs(state.q);
  for (let i = 0; i < input.length; i += 1) {
    const filtered = biquadStep(input[i] ?? 0, state, coeffs);
    if (state.decimPhase === 0 && state.outLen < 240) {
      state.outScratch[state.outLen] = filtered;
      state.outLen += 1;
    }
    state.decimPhase = (state.decimPhase + 1) % state.q;
  }

  if (state.outLen < 240) return null;
  const out = state.outScratch.slice(0, 240);
  state.outLen = 0;
  return out;
};

export const resetPestoDecimator = (state: PestoDecimatorState): void => {
  state.x1 = 0;
  state.x2 = 0;
  state.y1 = 0;
  state.y2 = 0;
  state.decimPhase = 0;
  state.outLen = 0;
};
