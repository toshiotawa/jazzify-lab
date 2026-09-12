import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCodeRunRankThresholds,
  fetchPlayMapBlocks,
  fetchPlayMapNodeClears,
  fetchPlayMapNodes,
  type PlayMapNode,
  type PlayMapTier,
} from '@/platform/supabasePlayMap';
import { useDescentCamera } from '@/components/survival/descent/useDescentCamera';
import { MAP_LOGICAL_WIDTH } from '@/components/survival/descent/descentLayout';
import { CODE_RUN_MAP_PRELOAD_IMAGES } from '@/utils/codeRunMapAssets';
import { cn } from '@/utils/cn';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { getWindow } from '@/platform';
import CodeRunDescentBlock, { CodeRunBlockDimVeil } from '@/components/play/codeRunMap/CodeRunDescentBlock';
import CodeRunDescentSidePanel from '@/components/play/codeRunMap/CodeRunDescentSidePanel';
import CodeRunSkyBackground from '@/components/play/codeRunMap/parts/CodeRunSkyBackground';
import DescentCharacter from '@/components/survival/descent/parts/DescentCharacter';
import {
  buildPlayDescentLayout,
  countClearedStageNodes,
  countStageNodes,
  findFrontierNodeId,
  getAccessiblePlayBlockIndex,
  getPlayNodePosition,
  isPlayDescentBlockUnlocked,
  type PlayBlockLayout,
} from '@/components/play/defenseDescent/playDescentLayout';

interface CodeRunDescentMapProps {
  isEnglishCopy: boolean;
  isPremiumMember: boolean;
  onSelectNode: (node: PlayMapNode) => void;
  onSelectQuestNode: (node: PlayMapNode) => void;
}

const VIEWPORT_FALLBACK_HEIGHT = 720;

let codeRunMapPreloadPromise: Promise<void> | null = null;

const preloadCodeRunMapImages = (): Promise<void> => {
  if (codeRunMapPreloadPromise) return codeRunMapPreloadPromise;
  codeRunMapPreloadPromise = new Promise((resolve) => {
    let remaining = CODE_RUN_MAP_PRELOAD_IMAGES.length;
    if (remaining === 0) {
      resolve();
      return;
    }
    const done = (): void => {
      remaining -= 1;
      if (remaining === 0) resolve();
    };
    CODE_RUN_MAP_PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = src;
    });
  });
  return codeRunMapPreloadPromise;
};

const CodeRunDescentMap: React.FC<CodeRunDescentMapProps> = ({
  isEnglishCopy,
  isPremiumMember,
  onSelectNode,
  onSelectQuestNode,
}) => {
  const [tier, setTier] = useState<PlayMapTier>('basic');
  const [blocks, setBlocks] = useState<Awaited<ReturnType<typeof fetchPlayMapBlocks>>>([]);
  const [nodes, setNodes] = useState<Awaited<ReturnType<typeof fetchPlayMapNodes>>>([]);
  const [clears, setClears] = useState<Awaited<ReturnType<typeof fetchPlayMapNodeClears>>>([]);
  const [rankThresholds, setRankThresholds] = useState<Awaited<ReturnType<typeof fetchCodeRunRankThresholds>>>([]);
  const [loading, setLoading] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [lockedNotice, setLockedNotice] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    return !getWindow().matchMedia('(min-width: 768px)').matches;
  });
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: MAP_LOGICAL_WIDTH, height: VIEWPORT_FALLBACK_HEIGHT });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedBlocks, loadedNodes, loadedClears, thresholds] = await Promise.all([
        fetchPlayMapBlocks('code_run'),
        fetchPlayMapNodes('code_run'),
        fetchPlayMapNodeClears('code_run'),
        fetchCodeRunRankThresholds(),
      ]);
      setBlocks(loadedBlocks);
      setNodes(loadedNodes);
      setClears(loadedClears);
      setRankThresholds(thresholds);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    void preloadCodeRunMapImages().then(() => setAssetsReady(true));
  }, [reload]);

  useEffect(() => {
    const mq = getWindow().matchMedia('(min-width: 768px)');
    const onChange = (): void => setIsMobileLayout(!mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, assetsReady]);

  const layout = useMemo(
    () => buildPlayDescentLayout(blocks, nodes, tier),
    [blocks, nodes, tier],
  );

  const clearedNodeIds = useMemo(() => {
    const set = new Set<string>();
    clears.forEach((c) => set.add(c.nodeId));
    return set;
  }, [clears]);

  const clearByNodeId = useMemo(() => {
    const map = new Map<string, (typeof clears)[number]>();
    clears.forEach((c) => map.set(c.nodeId, c));
    return map;
  }, [clears]);

  const mappedThresholds = useMemo(
    () => rankThresholds.map((t) => ({
      rank: t.rank,
      maxSeconds: t.maxSeconds,
      sortOrder: t.sortOrder,
    })),
    [rankThresholds],
  );

  const frontierNodeId = useMemo(
    () => findFrontierNodeId(layout.blocks, clearedNodeIds, isPremiumMember),
    [layout.blocks, clearedNodeIds, isPremiumMember],
  );

  const accessibleBlockIndex = useMemo(
    () => getAccessiblePlayBlockIndex(layout.blocks, clearedNodeIds, isPremiumMember),
    [layout.blocks, clearedNodeIds, isPremiumMember],
  );

  const scale = useMemo(() => {
    const fitted = Math.min(Math.max(0.55, viewport.width / MAP_LOGICAL_WIDTH), 1.15);
    return Math.round(fitted * 0.75 * 100) / 100;
  }, [viewport.width]);

  const mapWidthPx = MAP_LOGICAL_WIDTH * scale;
  const mapHeightPx = layout.totalHeight * scale;
  const worldWidthPx = mapWidthPx;
  const worldOffsetX = Math.max(0, (viewport.width - worldWidthPx) / 2);

  const { cameraY, focusCamera, adjustCamera } = useDescentCamera({
    viewportHeight: viewport.height,
    scale,
    frontierStageNumber: 0,
    clearedStages: new Set<number>(),
    mapLogicalHeight: layout.totalHeight,
  });

  const visibleBlockLayouts = useMemo(() => {
    if (layout.blocks.length === 0) return layout.blocks;
    const bufferLogical = Math.max(420, viewport.height / Math.max(scale, 0.1));
    const minY = Math.max(0, cameraY / scale - bufferLogical);
    const maxY = (cameraY + viewport.height) / scale + bufferLogical;
    return layout.blocks.filter((block) => block.endY >= minY && block.startY <= maxY);
  }, [layout.blocks, cameraY, scale, viewport.height]);

  useEffect(() => {
    if (loading || !assetsReady) return;
    if (!frontierNodeId) return;
    const pos = getPlayNodePosition(layout, frontierNodeId);
    if (pos) focusCamera(pos.y, true);
  }, [loading, assetsReady, frontierNodeId, focusCamera, layout, tier]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || loading || !assetsReady) return undefined;

    let dragging = false;
    let lastClientY = 0;
    let downClientY = 0;
    let movedDuringDrag = false;

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      adjustCamera(e.deltaY);
    };

    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('button,[role="button"]')) return;
      dragging = true;
      movedDuringDrag = false;
      lastClientY = e.clientY;
      downClientY = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (!dragging) return;
      const dy = e.clientY - lastClientY;
      lastClientY = e.clientY;
      if (Math.abs(e.clientY - downClientY) > 4) movedDuringDrag = true;
      adjustCamera(-dy);
    };

    const onPointerUp = (e: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      if (movedDuringDrag) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [adjustCamera, loading, assetsReady]);

  const handleSelectNode = useCallback((nodeId: string, blockIndex: number) => {
    const unlocked = isPlayDescentBlockUnlocked(
      blockIndex,
      layout.blocks,
      clearedNodeIds,
      isPremiumMember,
    );
    if (!unlocked) {
      if (!isPremiumMember && blockIndex >= 1) {
        setShowPaywall(true);
      } else {
        setLockedNotice(true);
      }
      return;
    }
    setLockedNotice(false);
    setSelectedNodeId(nodeId);
    const pos = getPlayNodePosition(layout, nodeId);
    if (pos) focusCamera(pos.y, true);
    if (isMobileLayout) setIsMobileDetailOpen(true);
  }, [
    clearedNodeIds,
    focusCamera,
    isMobileLayout,
    isPremiumMember,
    layout,
  ]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId],
  );

  const selectedBlockIndex = useMemo(() => {
    if (!selectedNodeId) return accessibleBlockIndex;
    const block = layout.blocks.find((b) => b.nodes.some((n) => n.nodeId === selectedNodeId));
    return block?.blockIndex ?? accessibleBlockIndex;
  }, [accessibleBlockIndex, layout.blocks, selectedNodeId]);

  const panelBlock = useMemo((): PlayBlockLayout | null => {
    return layout.blocks[selectedBlockIndex] ?? layout.blocks[0] ?? null;
  }, [layout.blocks, selectedBlockIndex]);

  const panelBlockClearedCount = useMemo(() => {
    if (!panelBlock) return 0;
    return panelBlock.nodes.filter(
      (n) => n.node.nodeKind === 'stage' && clearedNodeIds.has(n.nodeId),
    ).length;
  }, [panelBlock, clearedNodeIds]);

  const selectedNodeUnlocked = useMemo(() => {
    if (!selectedNode) return false;
    const blockIndex = layout.blocks.findIndex((b) => b.blockId === selectedNode.blockId);
    return isPlayDescentBlockUnlocked(blockIndex, layout.blocks, clearedNodeIds, isPremiumMember);
  }, [clearedNodeIds, isPremiumMember, layout.blocks, selectedNode]);

  const startLocked = Boolean(
    selectedNode
    && !selectedNodeUnlocked
    && !isPremiumMember
    && selectedBlockIndex >= 1,
  );

  const handleStart = useCallback(() => {
    if (!selectedNode || !selectedNodeUnlocked) return;
    setIsMobileDetailOpen(false);
    if (selectedNode.nodeKind === 'quest') {
      onSelectQuestNode(selectedNode);
      return;
    }
    onSelectNode(selectedNode);
  }, [onSelectNode, onSelectQuestNode, selectedNode, selectedNodeUnlocked]);

  const frontierPosition = frontierNodeId ? getPlayNodePosition(layout, frontierNodeId) : undefined;
  const frontierFacing: 'left' | 'right' | 'center' = (() => {
    if (!frontierPosition || !frontierNodeId) return 'center';
    const block = layout.blocks.find((b) => b.nodes.some((n) => n.nodeId === frontierNodeId));
    if (!block) return 'center';
    const indexInBlock = block.nodes.findIndex((n) => n.nodeId === frontierNodeId);
    if (indexInBlock < 0) return 'center';
    const next = block.nodes[indexInBlock + 1];
    if (!next) return 'center';
    if (next.x > frontierPosition.x) return 'right';
    if (next.x < frontierPosition.x) return 'left';
    return 'center';
  })();

  const totalStageNodes = useMemo(() => countStageNodes(layout), [layout]);
  const totalClearedCount = useMemo(
    () => countClearedStageNodes(layout, clearedNodeIds),
    [layout, clearedNodeIds],
  );

  const selectedClear = selectedNode ? clearByNodeId.get(selectedNode.id) : undefined;

  if (loading || !assetsReady) {
    return <LoadingScreen compact />;
  }

  return (
    <div className="relative flex h-[calc(100dvh-56px)] flex-col bg-[#7ec8f0]">
      <style>{`
        @keyframes descent-breath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes descent-frontier-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      <div className="mx-auto grid w-full max-w-[1180px] flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-0 flex-col">
          <div className="flex gap-2 px-4 py-2">
            {(['basic', 'advanced'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  'rounded-full px-4 py-1 text-sm font-bold',
                  tier === tab ? 'bg-white text-slate-900' : 'bg-white/20 text-white',
                )}
                onClick={() => {
                  setTier(tab);
                  setSelectedNodeId(null);
                  setIsMobileDetailOpen(false);
                }}
              >
                {tab === 'basic'
                  ? (isEnglishCopy ? 'Basic' : 'Basic')
                  : (isEnglishCopy ? 'Advanced' : 'Advanced')}
              </button>
            ))}
          </div>

          <div
            ref={viewportRef}
            className="relative min-h-0 flex-1 overflow-hidden touch-none select-none"
            style={{
              boxShadow: 'inset 0 0 80px 10px rgba(255,255,255,0.15)',
              cursor: 'grab',
            }}
          >
            <div
              className="absolute top-0 will-change-transform"
              style={{
                left: worldOffsetX,
                width: worldWidthPx,
                height: mapHeightPx,
                transform: `translate3d(0, ${-cameraY}px, 0)`,
              }}
            >
              <CodeRunSkyBackground
                widthPx={worldWidthPx}
                heightPx={mapHeightPx}
                scale={scale}
                layouts={visibleBlockLayouts}
              />

              <div
                className="absolute left-1/2 top-0"
                style={{
                  width: mapWidthPx,
                  height: mapHeightPx,
                  transform: 'translateX(-50%)',
                }}
              >
                {visibleBlockLayouts.map((blockLayout) => {
                  const dim = blockLayout.blockIndex > accessibleBlockIndex;
                  const blockUnlocked = isPlayDescentBlockUnlocked(
                    blockLayout.blockIndex,
                    layout.blocks,
                    clearedNodeIds,
                    isPremiumMember,
                  );
                  return (
                    <CodeRunDescentBlock
                      key={blockLayout.blockId}
                      layout={blockLayout}
                      scale={scale}
                      selectedNodeId={selectedNodeId}
                      clearedNodeIds={clearedNodeIds}
                      blockUnlocked={blockUnlocked}
                      onSelectNode={(nodeId) => handleSelectNode(nodeId, blockLayout.blockIndex)}
                      dim={dim}
                      isEnglishCopy={isEnglishCopy}
                      frontierNodeId={frontierNodeId}
                    />
                  );
                })}

                {visibleBlockLayouts.map((blockLayout) => (
                  blockLayout.blockIndex > accessibleBlockIndex ? (
                    <CodeRunBlockDimVeil
                      key={`veil-${blockLayout.blockId}`}
                      layout={blockLayout}
                      scale={scale}
                      widthPx={mapWidthPx}
                    />
                  ) : null
                ))}

                {frontierPosition && (
                  <DescentCharacter
                    xPx={frontierPosition.x * scale}
                    yPx={frontierPosition.y * scale}
                    scale={scale}
                    facing={frontierFacing}
                  />
                )}
              </div>
            </div>
          </div>

          {lockedNotice && !selectedNode && (
            <div className="border-t border-white/20 bg-sky-900/80 p-4 text-xs text-amber-100">
              {isEnglishCopy
                ? 'Clear every stage in the previous block to unlock this block.'
                : '前のブロックの全ステージをクリアすると解放されます。'}
            </div>
          )}
        </div>

        <div className="hidden md:block md:min-h-0 md:h-full">
          <CodeRunDescentSidePanel
            isEnglishCopy={isEnglishCopy}
            totalClearedCount={totalClearedCount}
            totalStageNodes={totalStageNodes}
            activeBlock={panelBlock}
            blockClearedCount={panelBlockClearedCount}
            selectedNode={selectedNode}
            selectedNodeCleared={selectedNode ? clearedNodeIds.has(selectedNode.id) : false}
            selectedNodeUnlocked={selectedNodeUnlocked}
            bestRank={selectedClear?.bestRank ?? null}
            rankThresholds={mappedThresholds}
            onStart={handleStart}
            onRequestUpgrade={() => setShowPaywall(true)}
            startLocked={startLocked}
          />
        </div>
      </div>

      {isMobileLayout && isMobileDetailOpen && selectedNode && (
        <div className="fixed inset-0 z-40 flex items-end md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={isEnglishCopy ? 'Close node detail' : 'ノード詳細を閉じる'}
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileDetailOpen(false)}
          />
          <div className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-sky-400/30 bg-gradient-to-b from-[#1a2840]/95 to-[#0a1428]/95 shadow-[0_-10px_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileDetailOpen(false)}
              aria-label={isEnglishCopy ? 'Close' : '閉じる'}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/30 px-2 py-1 text-xs text-gray-200 hover:bg-black/50"
            >
              ✕
            </button>
            <div className="flex-1 overflow-y-auto px-3 pb-5 pt-1">
              <CodeRunDescentSidePanel
                isEnglishCopy={isEnglishCopy}
                totalClearedCount={totalClearedCount}
                totalStageNodes={totalStageNodes}
                activeBlock={panelBlock}
                blockClearedCount={panelBlockClearedCount}
                selectedNode={selectedNode}
                selectedNodeCleared={clearedNodeIds.has(selectedNode.id)}
                selectedNodeUnlocked={selectedNodeUnlocked}
                bestRank={selectedClear?.bestRank ?? null}
                rankThresholds={mappedThresholds}
                onStart={handleStart}
                onRequestUpgrade={() => setShowPaywall(true)}
                startLocked={startLocked}
              />
            </div>
          </div>
        </div>
      )}

      <WebPaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        isEnglishCopy={isEnglishCopy}
        source="code_run"
      />
    </div>
  );
};

export default CodeRunDescentMap;
