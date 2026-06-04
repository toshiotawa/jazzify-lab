import { describe, expect, it } from 'vitest';
import {
  buildMapLayoutJson,
  defaultEditorSettings,
  mergePits,
  parseMapLayoutJson,
} from './codeRunMapEditorLogic';
import { cellKey } from './codeRunMapEditorLogic';

describe('codeRunMapEditorLogic', () => {
  it('mergePits は連続列をまとめる', () => {
    expect(mergePits(new Set([2, 3, 4, 8]))).toEqual([
      { c0: 2, c1: 4 },
      { c0: 8, c1: 8 },
    ]);
  });

  it('manualGround 付き JSON を往復できる', () => {
    const settings = { ...defaultEditorSettings(), manualGround: true, worldTilesWide: 8, gridRows: 10 };
    const cells = new Map<string, string>([
      [cellKey(2, 5), 'ground'],
      [cellKey(3, 5), 'ground'],
      [cellKey(4, 5), 'ground'],
    ]);
    const json = buildMapLayoutJson(cells, new Set(), new Set(), [], { c: 1, r: 5 }, null, settings);
    expect(json.manualGround).toBe(true);
    expect(json.solids).toEqual([{ kind: 'ground', row: 5, c0: 2, c1: 4 }]);

    const imported = parseMapLayoutJson(JSON.stringify(json));
    expect(imported.settings.manualGround).toBe(true);
    expect(imported.cells.get(cellKey(2, 5))).toBe('ground');
  });

  it('床セル上にトゲを重ねても床は残る', () => {
    const settings = { ...defaultEditorSettings(), manualGround: true, groundRow: 9 };
    const cells = new Map<string, string>([
      [cellKey(4, 9), 'ground'],
      [cellKey(4, 10), 'ground'],
    ]);
    const spikeCells = new Set([cellKey(4, 9), cellKey(5, 9)]);
    const json = buildMapLayoutJson(cells, spikeCells, new Set(), [], null, null, settings);

    expect(json.solids).toEqual([
      { kind: 'ground', c: 4, r: 9 },
      { kind: 'ground', c: 4, r: 10 },
    ]);
    expect(json.spikes).toEqual([
      { c: 4, row: 9 },
      { c: 5, row: 9 },
    ]);

    const imported = parseMapLayoutJson(JSON.stringify(json));
    expect(imported.cells.get(cellKey(4, 9))).toBe('ground');
    expect(imported.spikeCells.has(cellKey(4, 9))).toBe(true);
    expect(imported.spikeCells.has(cellKey(5, 9))).toBe(true);
  });
});
