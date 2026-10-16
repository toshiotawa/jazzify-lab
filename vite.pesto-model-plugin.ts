import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
// Keep the emitted filename aligned with the browser's model ID (covered by asset/loading tests).
const PESTO_MODEL_ID = 'pesto-mir1k-g7-48000-240-refill-compact-v2';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);
const isSize = (value: unknown): value is number => (
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0
);
const digest = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

/** Build-time only: retain the checked-in patch as the reproducible model source. */
export const buildPestoWebModel = (source: Uint8Array, patch: unknown): Uint8Array => {
  if (!isRecord(patch) || patch.version !== 1 || patch.sourceSize !== source.byteLength
      || !isSize(patch.targetSize) || patch.targetSize > source.byteLength
      || typeof patch.sourceSha256 !== 'string' || typeof patch.targetSha256 !== 'string'
      || !Array.isArray(patch.operations)) throw new Error('Invalid PESTO model patch');
  if (digest(source) !== patch.sourceSha256) throw new Error('PESTO source checksum mismatch');
  const output = new Uint8Array(patch.targetSize);
  let position = 0;
  for (const operation of patch.operations) {
    if (!isRecord(operation)) throw new Error('Invalid PESTO patch operation');
    if (typeof operation.data === 'string') {
      const bytes = Buffer.from(operation.data, 'base64');
      if (position + bytes.length > output.length) throw new Error('PESTO patch overflow');
      output.set(bytes, position);
      position += bytes.length;
    } else if (typeof operation.sourceStart === 'number' && Number.isSafeInteger(operation.sourceStart)
        && operation.sourceStart >= 0 && isSize(operation.length)
        && operation.sourceStart + operation.length <= source.length
        && position + operation.length <= output.length) {
      output.set(source.subarray(operation.sourceStart, operation.sourceStart + operation.length), position);
      position += operation.length;
    } else throw new Error('Invalid PESTO patch copy');
  }
  if (position !== output.length || digest(output) !== patch.targetSha256) {
    throw new Error('PESTO model checksum mismatch');
  }
  return output;
};

export const pestoModelAssetPlugin = (): Plugin => {
  let root = process.cwd();
  let command = 'serve';
  const path = `/models/pesto/${PESTO_MODEL_ID}.onnx`;
  const readModel = (): Uint8Array => buildPestoWebModel(
    readFileSync(resolve(root, 'public/models/pesto/pesto-mir1k-g7-48000-240-refill.onnx')),
    JSON.parse(readFileSync(resolve(root, `public/models/pesto/${PESTO_MODEL_ID}.patch.json`), 'utf8')),
  );
  return {
    name: 'pesto-model-asset',
    configResolved(config) { root = config.root; command = config.command; },
    buildStart() {
      if (command !== 'build') return;
      this.addWatchFile(resolve(root, 'public/models/pesto/pesto-mir1k-g7-48000-240-refill.onnx'));
      this.addWatchFile(resolve(root, `public/models/pesto/${PESTO_MODEL_ID}.patch.json`));
      this.emitFile({ type: 'asset', fileName: path.slice(1), source: readModel() });
    },
    configureServer(server) {
      // One buffer per dev-server instance; no per-request reconstruction.
      const model = readModel();
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== path) { next(); return; }
        response.setHeader('Content-Type', 'application/octet-stream');
        response.end(model);
      });
    },
  };
};
