import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildPestoWebModel } from '../../../../vite.pesto-model-plugin';
import { loadPestoWebModel } from '../pestoWebModel';

const directory = 'public/models/pesto/pesto-mir1k-g7-48000-240-refill';
const bytes = buildPestoWebModel(readFileSync(`${directory}.onnx`), JSON.parse(readFileSync(`${directory}-compact-v2.patch.json`, 'utf8')));
const install = (model: Uint8Array = bytes, status = 200) => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(model, { status })));
};

describe('direct PESTO model loading', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('fetches only the compact asset and validates its checksum', async () => {
    install();
    const loaded = await loadPestoWebModel();
    expect(Buffer.compare(Buffer.from(loaded), Buffer.from(bytes))).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx');
  });
  it('rejects failed HTTP requests', async () => {
    install(bytes, 404);
    await expect(loadPestoWebModel()).rejects.toThrow('Failed to load');
  });
  it('rejects a truncated model before initializing ONNX', async () => {
    install(bytes.subarray(0, -1));
    await expect(loadPestoWebModel()).rejects.toThrow('model size');
  });
  it('rejects corruption even if the model has the expected size', async () => {
    const corrupted = bytes.slice(); corrupted[corrupted.length - 1] ^= 1;
    install(corrupted);
    await expect(loadPestoWebModel()).rejects.toThrow('checksum mismatch');
  });
});
