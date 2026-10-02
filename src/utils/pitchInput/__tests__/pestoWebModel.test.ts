import { createHash, webcrypto } from 'node:crypto';
import { loadPestoWebModel } from '../pestoWebModel';

const digest = (data: Uint8Array): string => createHash('sha256').update(data).digest('hex');
const source = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
const target = new Uint8Array([2, 3, 9, 10, 7, 8]);
const makePatch = () => ({
  version: 1, sourceSize: source.length, targetSize: target.length,
  sourceSha256: digest(source), targetSha256: digest(target),
  operations: [{ sourceStart: 1, length: 2 }, { data: 'CQo=' }, { sourceStart: 6, length: 2 }],
});
const installAssets = (patch: unknown, bytes = source, status = 200) => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('.json')
    ? new Response(JSON.stringify(patch), { status }) : new Response(bytes, { status })));
};

describe('PESTO optimized model loading', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reconstructs exact model bytes from source ranges and literals', async () => {
    installAssets(makePatch());
    expect(await loadPestoWebModel()).toEqual(target);
  });

  it('rejects failed HTTP requests before model initialization', async () => {
    installAssets(makePatch(), source, 404);
    await expect(loadPestoWebModel()).rejects.toThrow('Failed to load');
  });

  it('rejects a stale or corrupted source model', async () => {
    installAssets(makePatch(), new Uint8Array(8));
    await expect(loadPestoWebModel()).rejects.toThrow('source model checksum mismatch');
  });

  it.each([-1, 7, 1.5])('rejects an invalid source copy offset %s', async (sourceStart) => {
    const patch = makePatch();
    patch.operations[0] = { sourceStart, length: 2 };
    installAssets(patch);
    await expect(loadPestoWebModel()).rejects.toThrow('patch copy');
  });

  it('rejects target overflow instead of creating a truncated model', async () => {
    const patch = makePatch();
    patch.operations[1] = { data: 'CQoLDA0ODw==' };
    installAssets(patch);
    await expect(loadPestoWebModel()).rejects.toThrow('patch overflow');
  });

  it('rejects a patch producing different model bytes', async () => {
    const patch = makePatch();
    patch.operations[1] = { data: 'AQI=' };
    installAssets(patch);
    await expect(loadPestoWebModel()).rejects.toThrow('optimized model checksum mismatch');
  });
});
