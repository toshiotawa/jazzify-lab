import { PESTO_CHUNK_SIZE } from '@/utils/pitchInput/pitchInputTypes';

/** q>1 のとき 240 サンプルチャンクを q 個連結してデシメータへ渡す。 */
export class PitchDecimationBuffer {
  private readonly factor: number;
  private readonly scratch: Float32Array;
  private fill = 0;

  constructor(factor: number) {
    this.factor = Math.max(1, factor);
    this.scratch = new Float32Array(PESTO_CHUNK_SIZE * this.factor);
  }

  reset(): void {
    this.fill = 0;
  }

  /** 240 サンプルを追加。factor 分揃ったら連結バッファを返す。 */
  push(chunk: Float32Array): Float32Array | null {
    if (this.factor <= 1) return chunk;
    this.scratch.set(chunk, this.fill);
    this.fill += PESTO_CHUNK_SIZE;
    if (this.fill < this.scratch.length) return null;
    this.fill = 0;
    return this.scratch.slice();
  }
}
