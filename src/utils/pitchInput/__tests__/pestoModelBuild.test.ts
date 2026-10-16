import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildPestoWebModel } from '../../../../vite.pesto-model-plugin';

const source = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
const target = new Uint8Array([2, 3, 9, 10, 7, 8]);
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const patch = () => ({
  version: 1, sourceSize: source.length, targetSize: target.length,
  sourceSha256: hash(source), targetSha256: hash(target),
  operations: [{ sourceStart: 1, length: 2 }, { data: 'CQo=' }, { sourceStart: 6, length: 2 }],
});

describe('build-time PESTO asset', () => {
  it('materializes the same compact-v2 bytes as the deployed patch', () => {
    const directory = 'public/models/pesto/pesto-mir1k-g7-48000-240-refill';
    const bytes = buildPestoWebModel(readFileSync(`${directory}.onnx`), JSON.parse(readFileSync(`${directory}-compact-v2.patch.json`, 'utf8')));
    expect(bytes.length).toBe(11_150_637);
    expect(hash(bytes)).toBe('c50ca16a07297ddc2b788403268a43736cceb792ec599746da7d5486bca974b8');
  });
  it('copies both source ranges and literal bytes', () => {
    expect(buildPestoWebModel(source, patch())).toEqual(target);
  });
  it('rejects a corrupt source or target', () => {
    expect(() => buildPestoWebModel(new Uint8Array(8), patch())).toThrow('source checksum');
    expect(() => buildPestoWebModel(source, { ...patch(), targetSha256: 'bad' })).toThrow('model checksum');
  });
  it.each([-1, 7, 1.5])('rejects an invalid copy offset %s', (sourceStart) => {
    const p = patch(); p.operations[0] = { sourceStart, length: 2 };
    expect(() => buildPestoWebModel(source, p)).toThrow('patch copy');
  });
  it('rejects overflow and truncated output', () => {
    const p = patch(); p.operations[1] = { data: 'CQoLDA0ODw==' };
    expect(() => buildPestoWebModel(source, p)).toThrow('overflow');
    expect(() => buildPestoWebModel(source, { ...patch(), operations: [] })).toThrow('checksum');
  });
});
