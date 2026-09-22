import { PitchDecimationBuffer } from '@/utils/pitchInput/pitchDecimationBuffer';
import { PESTO_CHUNK_SIZE } from '@/utils/pitchInput/pitchInputTypes';

describe('PitchDecimationBuffer', () => {
  it('returns immediately at factor 1', () => {
    const buffer = new PitchDecimationBuffer(1);
    const chunk = new Float32Array(PESTO_CHUNK_SIZE).fill(0.5);
    expect(buffer.push(chunk)).toBe(chunk);
  });

  it('waits for factor chunks at q=2', () => {
    const buffer = new PitchDecimationBuffer(2);
    const a = new Float32Array(PESTO_CHUNK_SIZE).fill(1);
    const b = new Float32Array(PESTO_CHUNK_SIZE).fill(2);
    expect(buffer.push(a)).toBeNull();
    const merged = buffer.push(b);
    expect(merged?.length).toBe(PESTO_CHUNK_SIZE * 2);
    expect(merged?.[0]).toBe(1);
    expect(merged?.[PESTO_CHUNK_SIZE]).toBe(2);
  });
});
