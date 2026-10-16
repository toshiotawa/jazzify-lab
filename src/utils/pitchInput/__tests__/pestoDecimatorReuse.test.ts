import { createHash } from 'node:crypto';
import { createPestoDecimatorState, feedPestoDecimator, resetPestoDecimator } from '../pestoDecimator';

// Golden PCM hashes produced by the previous allocating implementation, including a partial reset.
it.each([
  [2, '1551ef785a3f6d0102b0d6c4eaa5b4e06330f34ab9f3d8fa9412a1e51a815546'],
  [4, '9c3a498cf470569a60b9761bbeab1a5648d339bf9b74a7cedbab1918966b20cd'],
] as const)('preserves streaming PCM exactly with a reusable buffer at q=%s', (q, expectedHash) => {
  const state = createPestoDecimatorState(q);
  const hash = createHash('sha256');
  for (let n = 0; n < 120; n += 1) {
    if (n === 57) resetPestoDecimator(state);
    const input = Float32Array.from({ length: 240 }, (_, i) => (
      Math.sin((n * 240 + i) * 0.017) * 0.2 + Math.cos((n * 240 + i) * 0.073) * 0.05
    ));
    const out = feedPestoDecimator(input, state);
    if (out) {
      expect(out).toBe(state.outScratch);
      hash.update(new Uint8Array(out.buffer, out.byteOffset, out.byteLength));
    }
  }
  expect(hash.digest('hex')).toBe(expectedHash);
});
