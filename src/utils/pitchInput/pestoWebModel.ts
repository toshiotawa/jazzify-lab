import { PESTO_MODEL_ID } from './pitchInputTypes';

const SOURCE_MODEL_URL = '/models/pesto/pesto-mir1k-g7-48000-240-refill.onnx';
const PATCH_URL = `/models/pesto/${PESTO_MODEL_ID}.patch.json`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSize = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const sha256 = async (buffer: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/** Reconstruct the precomputed ONNX once during Worker initialization.
 * CQT padding zeros and constant shape work are removed offline. No trained
 * coefficient, input sample, 5ms stride, refill cache or tracker rule changes.
 */
export const loadPestoWebModel = async (): Promise<Uint8Array> => {
  const [sourceResponse, patchResponse] = await Promise.all([fetch(SOURCE_MODEL_URL), fetch(PATCH_URL)]);
  if (!sourceResponse.ok || !patchResponse.ok) throw new Error('Failed to load PESTO model assets');
  const [sourceBuffer, patch]: [ArrayBuffer, unknown] = await Promise.all([
    sourceResponse.arrayBuffer(), patchResponse.json(),
  ]);
  if (!isRecord(patch) || patch.version !== 1 || patch.sourceSize !== sourceBuffer.byteLength
      || !isSize(patch.targetSize) || patch.targetSize > sourceBuffer.byteLength
      || typeof patch.sourceSha256 !== 'string' || typeof patch.targetSha256 !== 'string'
      || !Array.isArray(patch.operations)) {
    throw new Error('Invalid PESTO model patch');
  }
  if (await sha256(sourceBuffer) !== patch.sourceSha256) throw new Error('PESTO source model checksum mismatch');
  const source = new Uint8Array(sourceBuffer);
  const model = new Uint8Array(patch.targetSize);
  let position = 0;
  for (const operation of patch.operations) {
    if (!isRecord(operation)) throw new Error('Invalid PESTO model patch operation');
    if (typeof operation.data === 'string') {
      const literal = atob(operation.data);
      if (position + literal.length > model.length) throw new Error('PESTO model patch overflow');
      for (let i = 0; i < literal.length; i += 1) model[position + i] = literal.charCodeAt(i);
      position += literal.length;
    } else if (typeof operation.sourceStart === 'number' && Number.isSafeInteger(operation.sourceStart)
        && operation.sourceStart >= 0 && isSize(operation.length)
        && operation.sourceStart + operation.length <= source.length
        && position + operation.length <= model.length) {
      model.set(source.subarray(operation.sourceStart, operation.sourceStart + operation.length), position);
      position += operation.length;
    } else {
      throw new Error('Invalid PESTO model patch copy');
    }
  }
  if (position !== model.length || await sha256(model.buffer) !== patch.targetSha256) {
    throw new Error('PESTO optimized model checksum mismatch');
  }
  return model;
};
