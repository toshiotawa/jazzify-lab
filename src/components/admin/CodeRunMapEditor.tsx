/**
 * 管理画面: Code Run マップレイアウトエディタ
 * Hash: #admin-code-run-map
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useToast } from '@/stores/toastStore';
import {
  buildMapLayoutJson,
  cellKey,
  computeWorldHeightFromGrid,
  defaultEditorSettings,
  defaultEnemyPlacement,
  findEnemyIndexAt,
  parseMapLayoutJson,
  patchEditorSettings,
  applyPitColumn,
  resolveSpikeRow,
  spikeRowsToClear,
} from './codeRunMap/codeRunMapEditorLogic';
import { drawCodeRunMapCanvas } from './codeRunMap/codeRunMapEditorCanvas';
import type {
  CodeRunEditorSettings,
  CodeRunEditorTool,
  CodeRunEnemyPlacement,
  CodeRunGridPoint,
} from './codeRunMap/codeRunMapEditorTypes';
import {
  CODE_RUN_TILE_KINDS,
  DISPLAY_TILE_BASE,
} from './codeRunMap/codeRunMapEditorTypes';

const TOOLS: Array<{ id: CodeRunEditorTool; label: string; color: string }> = [
  { id: 'ground', label: '床', color: '#6b5344' },
  { id: 'brick', label: 'レンガ', color: '#7a8499' },
  { id: 'platform', label: '足場', color: '#c9a66b' },
  { id: 'block', label: 'クレート', color: '#d4783a' },
  { id: 'spike', label: 'トゲ', color: '#e74c3c' },
  { id: 'pit', label: '穴', color: '#1a1020' },
  { id: 'enemy', label: '敵', color: '#8fd14f' },
  { id: 'spawn', label: '開始', color: '#4da3ff' },
  { id: 'goal', label: 'ゴール', color: '#ffd54f' },
  { id: 'eraser', label: '消去', color: '#444444' },
];

const CodeRunMapEditor: React.FC = () => {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<CodeRunEditorSettings>(defaultEditorSettings);
  const [cells, setCells] = useState<Map<string, string>>(() => new Map());
  const [spikeCells, setSpikeCells] = useState<Set<string>>(() => new Set());
  const [pitColumns, setPitColumns] = useState<Set<number>>(() => new Set());
  const [enemies, setEnemies] = useState<CodeRunEnemyPlacement[]>([]);
  const [spawn, setSpawn] = useState<CodeRunGridPoint | null>({ c: 2, r: 9 });
  const [goal, setGoal] = useState<CodeRunGridPoint | null>(null);
  const [tool, setTool] = useState<CodeRunEditorTool>('ground');
  const [zoom, setZoom] = useState(1);
  const [isPainting, setIsPainting] = useState(false);
  const [paintErase, setPaintErase] = useState(false);
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(-1);
  const [jsonText, setJsonText] = useState('');
  const [hoverCell, setHoverCell] = useState('');

  const displayTile = Math.round(DISPLAY_TILE_BASE * zoom);

  const layoutJson = useMemo(
    () => buildMapLayoutJson(cells, spikeCells, pitColumns, enemies, spawn, goal, settings),
    [cells, spikeCells, pitColumns, enemies, spawn, goal, settings],
  );

  const syncJson = useCallback(() => {
    setJsonText(JSON.stringify(layoutJson, null, 2));
  }, [layoutJson]);

  useEffect(() => {
    syncJson();
  }, [syncJson]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCodeRunMapCanvas(ctx, canvas.width, canvas.height, {
      cells,
      spikeCells,
      pitColumns,
      enemies,
      spawn,
      goal,
      settings,
      displayTile,
      selectedEnemyIndex,
    });
  }, [cells, spikeCells, pitColumns, enemies, spawn, goal, settings, displayTile, selectedEnemyIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = settings.worldTilesWide * displayTile;
    canvas.height = settings.gridRows * displayTile;
  }, [settings.worldTilesWide, settings.gridRows, displayTile]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const removeEnemyAt = useCallback((c: number, r: number) => {
    setEnemies((prev) => {
      const idx = findEnemyIndexAt(prev, c, r);
      if (idx < 0) return prev;
      setSelectedEnemyIndex(-1);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const placeEnemy = useCallback((c: number, r: number) => {
    const placement = defaultEnemyPlacement(c, r);
    setEnemies((prev) => {
      const idx = prev.findIndex((e) => e.c === c && e.r === r);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = placement;
        setSelectedEnemyIndex(idx);
        return next;
      }
      setSelectedEnemyIndex(prev.length);
      return [...prev, placement];
    });
  }, []);

  const applyAt = useCallback((c: number, r: number, erase: boolean) => {
    if (c < 0 || r < 0 || c >= settings.worldTilesWide || r >= settings.gridRows) return;

    if (erase) {
      removeEnemyAt(c, r);
    }

    switch (tool) {
      case 'eraser':
        setCells((prev) => {
          const next = new Map(prev);
          next.delete(cellKey(c, r));
          return next;
        });
        setSpikeCells((prev) => {
          const next = new Set(prev);
          for (const row of spikeRowsToClear(cells, c, r, settings.gridRows)) {
            next.delete(cellKey(c, row));
          }
          return next;
        });
        if (!settings.manualGround) {
          setPitColumns((prev) => {
            const next = new Set(prev);
            next.delete(c);
            return next;
          });
        }
        break;
      case 'pit':
        if (settings.manualGround) break;
        setPitColumns((prev) => {
          const next = new Set(prev);
          applyPitColumn(next, c, erase);
          return next;
        });
        break;
      case 'spike':
        setSpikeCells((prev) => {
          const next = new Set(prev);
          if (erase) {
            for (const row of spikeRowsToClear(cells, c, r, settings.gridRows)) {
              next.delete(cellKey(c, row));
            }
          } else {
            const anchorRow = resolveSpikeRow(cells, c, r, settings.gridRows);
            next.add(cellKey(c, anchorRow));
          }
          return next;
        });
        break;
      case 'spawn':
        if (!erase) setSpawn({ c, r });
        break;
      case 'goal':
        if (!erase) {
          setGoal({ c, r });
          setSettings((s) => ({ ...s, useGoalColumn: false }));
        }
        break;
      case 'enemy':
        if (erase) break;
        placeEnemy(c, r);
        break;
      default:
        if (CODE_RUN_TILE_KINDS.includes(tool as typeof CODE_RUN_TILE_KINDS[number])) {
          if (!settings.manualGround && tool === 'ground') return;
          setCells((prev) => {
            const next = new Map(prev);
            if (erase) next.delete(cellKey(c, r));
            else next.set(cellKey(c, r), tool);
            return next;
          });
        }
        break;
    }
  }, [
    tool,
    settings.worldTilesWide,
    settings.gridRows,
    settings.manualGround,
    cells,
    placeEnemy,
    removeEnemyAt,
  ]);

  const canvasToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const c = Math.floor(x / displayTile);
    const r = Math.floor(y / displayTile);
    return { c, r };
  }, [displayTile]);

  const onPointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const grid = canvasToGrid(e.clientX, e.clientY);
    if (!grid) return;
    const { c, r } = grid;
    const erase = e.button === 2 || tool === 'eraser';

    if (tool === 'enemy' && e.button === 0) {
      const hit = findEnemyIndexAt(enemies, c, r);
      if (hit >= 0) {
        setEnemies((prev) => prev.filter((_, i) => i !== hit));
        setSelectedEnemyIndex(-1);
        return;
      }
    }

    if (tool === 'enemy' && e.button === 2) {
      removeEnemyAt(c, r);
      return;
    }

    setIsPainting(true);
    setPaintErase(erase);
    applyAt(c, r, erase);
  };

  const onPointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const grid = canvasToGrid(e.clientX, e.clientY);
    if (!grid) return;
    const { c, r } = grid;
    setHoverCell(`列 ${c}  行 ${r}`);
    if (!isPainting) return;
    applyAt(c, r, paintErase);
  };

  const onPointerUp = () => {
    setIsPainting(false);
  };

  const fillGroundRow = () => {
    if (!settings.manualGround) {
      toast.warning('手動床モードをオンにしてください', { title: '床' });
      return;
    }
    setCells((prev) => {
      const next = new Map(prev);
      for (let c = 0; c < settings.worldTilesWide; c += 1) {
        next.set(cellKey(c, settings.groundRow), 'ground');
        if (settings.groundRow + 1 < settings.gridRows) {
          next.set(cellKey(c, settings.groundRow + 1), 'ground');
        }
      }
      return next;
    });
  };

  const clearAll = () => {
    if (!window.confirm('マップをすべて消去しますか？')) return;
    setCells(new Map());
    setSpikeCells(new Set());
    setPitColumns(new Set());
    setEnemies([]);
    setSpawn({ c: 2, r: settings.groundRow });
    setGoal(null);
    setSelectedEnemyIndex(-1);
  };

  const importJson = () => {
    try {
      const imported = parseMapLayoutJson(jsonText);
      setSettings(imported.settings);
      setCells(imported.cells);
      setSpikeCells(imported.spikeCells);
      setPitColumns(imported.pitColumns);
      setEnemies(imported.enemies);
      setSpawn(imported.spawn);
      setGoal(imported.goal);
      setSelectedEnemyIndex(-1);
      toast.success('JSON を読み込みました', { title: 'インポート' });
    } catch {
      toast.error('JSON の解析に失敗しました', { title: 'インポート' });
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      toast.success('クリップボードにコピーしました', { title: 'JSON' });
    } catch {
      toast.warning('コピーに失敗しました。テキストを手動で選択してください', { title: 'JSON' });
    }
  };

  const patchSettings = (patch: Partial<CodeRunEditorSettings>) => {
    setSettings((s) => patchEditorSettings(s, patch));
  };

  const groundToolDisabled = !settings.manualGround;
  const pitToolDisabled = settings.manualGround;

  return (
    <div className="space-y-4 max-w-[1600px]">
      <div>
        <h2 className="text-2xl font-bold">コードラン マップエディタ</h2>
        <p className="text-sm text-gray-400 mt-1">
          ドラッグ／クリックで配置。出力 JSON は <code className="text-emerald-300">survival_run_maps.map_data</code> にマージしてください。
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 min-h-[560px]">
        <aside className="xl:w-44 shrink-0 space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">パーツ</p>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={(t.id === 'ground' && groundToolDisabled) || (t.id === 'pit' && pitToolDisabled)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                  tool === t.id
                    ? 'border-primary-500 bg-primary-900/40'
                    : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                } ${(t.id === 'ground' && groundToolDisabled) || (t.id === 'pit' && pitToolDisabled) ? 'opacity-40 cursor-not-allowed' : ''}`}
                onClick={() => setTool(t.id)}
              >
                <span
                  className="w-5 h-5 rounded border border-white/20"
                  style={{ background: t.color }}
                />
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            左ドラッグ: 配置 · 右ドラッグ / 消去: 削除 · 敵を再クリックでも削除 · Ctrl+ホイール: ズーム
            <br />
            トゲは床・足場・クレートのセル（またはその直上）にスナップして配置されます。
            <br />
            穴は自動床モードのみ。再クリック／右クリック／消去で削除。手動床では穴は使いません。
          </p>
          <button type="button" className="btn btn-sm btn-outline w-full" onClick={fillGroundRow}>
            床行を一括塗り
          </button>
        </aside>

        <div
          className="flex-1 overflow-auto rounded-lg border border-slate-700 bg-[#12151a] min-h-[400px]"
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              setZoom((z) => Math.min(2.5, Math.max(0.5, z + (e.deltaY < 0 ? 0.1 : -0.1))));
            }
          }}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair"
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        <aside className="xl:w-72 shrink-0 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.manualGround}
              onChange={(e) => {
                const manualGround = e.target.checked;
                if (manualGround) {
                  setPitColumns(new Set());
                  if (tool === 'pit') setTool('ground');
                }
                patchSettings({ manualGround });
              }}
            />
            手動床
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.useGoalColumn}
              onChange={(e) => patchSettings({ useGoalColumn: e.target.checked })}
            />
            ゴールを列番号で指定
          </label>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="block">
              <span className="text-xs text-gray-400">横タイル</span>
              <input
                className="input input-bordered input-sm w-full mt-0.5"
                type="number"
                min={8}
                max={400}
                value={settings.worldTilesWide}
                onChange={(e) => patchSettings({ worldTilesWide: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">行数</span>
              <input
                className="input input-bordered input-sm w-full mt-0.5"
                type="number"
                min={4}
                max={80}
                value={settings.gridRows}
                onChange={(e) => patchSettings({ gridRows: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">tileSize</span>
              <input
                className="input input-bordered input-sm w-full mt-0.5"
                type="number"
                value={settings.tileSize}
                onChange={(e) => patchSettings({ tileSize: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">groundRow</span>
              <input
                className="input input-bordered input-sm w-full mt-0.5"
                type="number"
                value={settings.groundRow}
                onChange={(e) => patchSettings({ groundRow: Number(e.target.value) })}
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs text-gray-400">worldHeight（行数 × tileSize）</span>
              <input
                className="input input-bordered input-sm w-full mt-0.5 bg-slate-800/60"
                type="number"
                readOnly
                aria-readonly
                value={computeWorldHeightFromGrid(settings.gridRows, settings.tileSize)}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">goalColumn</span>
              <input
                className="input input-bordered input-sm w-full mt-0.5"
                type="number"
                value={settings.goalColumn}
                disabled={!settings.useGoalColumn}
                onChange={(e) => patchSettings({ goalColumn: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">goalOffsetX</span>
              <input
                className="input input-bordered input-sm w-full mt-0.5"
                type="number"
                value={settings.goalOffsetX}
                onChange={(e) => patchSettings({ goalOffsetX: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-primary" onClick={syncJson}>JSON 更新</button>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => { void copyJson(); }}>コピー</button>
            <button type="button" className="btn btn-sm btn-outline" onClick={importJson}>読込</button>
            <button type="button" className="btn btn-sm btn-error btn-outline" onClick={clearAll}>全消去</button>
          </div>

          <textarea
            className="textarea textarea-bordered w-full font-mono text-xs min-h-[220px] bg-slate-900"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
          <p className="text-xs text-gray-500">
            敵の移動範囲はゲーム側のデフォルトを使用します（JSON に minX/maxX は出力しません）。
          </p>
        </aside>
      </div>

      <p className="text-xs text-gray-500">{hoverCell || '準備完了'}</p>
    </div>
  );
};

export default CodeRunMapEditor;
