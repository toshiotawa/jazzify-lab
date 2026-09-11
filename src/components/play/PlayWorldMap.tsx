import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCodeRunRankThresholds,
  fetchPlayMapBlocks,
  fetchPlayMapNodeClears,
  fetchPlayMapNodes,
  type PlayMapMode,
  type PlayMapNode,
} from '@/platform/supabasePlayMap';
import { buildWorldMapLayout, isBlockUnlocked } from '@/components/play/worldLayout';
import {
  formatCodeRunRankCondition,
  meetsCodeRunRankRequirement,
  type CodeRunLetterRank,
} from '@/utils/codeRunRank';
import WebPaywallModal from '@/components/ui/WebPaywallModal';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { cn } from '@/utils/cn';

interface PlayWorldMapProps {
  mode: PlayMapMode;
  isEnglishCopy: boolean;
  isPremiumMember: boolean;
  onSelectNode: (node: PlayMapNode) => void;
  onSelectQuestNode: (node: PlayMapNode) => void;
}

const PlayWorldMap: React.FC<PlayWorldMapProps> = ({
  mode,
  isEnglishCopy,
  isPremiumMember,
  onSelectNode,
  onSelectQuestNode,
}) => {
  const [tier, setTier] = useState<'basic' | 'advanced'>('basic');
  const [blocks, setBlocks] = useState<Awaited<ReturnType<typeof fetchPlayMapBlocks>>>([]);
  const [nodes, setNodes] = useState<Awaited<ReturnType<typeof fetchPlayMapNodes>>>([]);
  const [clears, setClears] = useState<Awaited<ReturnType<typeof fetchPlayMapNodeClears>>>([]);
  const [thresholds, setThresholds] = useState<Awaited<ReturnType<typeof fetchCodeRunRankThresholds>>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<PlayMapNode | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [lockedNotice, setLockedNotice] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [b, n, c, t] = await Promise.all([
        fetchPlayMapBlocks(mode),
        fetchPlayMapNodes(mode),
        fetchPlayMapNodeClears(mode),
        mode === 'code_run' ? fetchCodeRunRankThresholds() : Promise.resolve([]),
      ]);
      setBlocks(b);
      setNodes(n);
      setClears(c);
      setThresholds(t);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const clearByNodeId = useMemo(() => {
    const map = new Map<string, (typeof clears)[number]>();
    clears.forEach((c) => map.set(c.nodeId, c));
    return map;
  }, [clears]);

  // RPC はクリア時のみ行を作るため「行がある = クリア済み」（quest ノードはメトリクス無し）
  const clearedNodeIds = useMemo(() => {
    const set = new Set<string>();
    clears.forEach((c) => set.add(c.nodeId));
    return set;
  }, [clears]);

  const layout = useMemo(
    () => buildWorldMapLayout(blocks, nodes, tier),
    [blocks, nodes, tier],
  );

  const handleNodeTap = useCallback((node: PlayMapNode, blockIndex: number) => {
    const unlocked = isBlockUnlocked(blockIndex, layout.blocks, clearedNodeIds, isPremiumMember);
    if (!unlocked) {
      if (!isPremiumMember && blockIndex >= 1) {
        setShowPaywall(true);
      } else {
        setLockedNotice(true);
      }
      return;
    }
    setLockedNotice(false);
    setSelectedNode(node);
  }, [clearedNodeIds, isPremiumMember, layout.blocks]);

  const handleStart = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.nodeKind === 'quest') {
      onSelectQuestNode(selectedNode);
      return;
    }
    onSelectNode(selectedNode);
  }, [onSelectNode, onSelectQuestNode, selectedNode]);

  if (loading) {
    return <LoadingScreen compact />;
  }

  const selectedClear = selectedNode ? clearByNodeId.get(selectedNode.id) : undefined;

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col">
      <div className="flex gap-2 px-4 py-2">
        {(['basic', 'advanced'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={cn(
              'rounded-full px-4 py-1 text-sm font-bold',
              tier === tab ? 'bg-white text-slate-900' : 'bg-white/10 text-white',
            )}
            onClick={() => setTier(tab)}
          >
            {tab === 'basic'
              ? (isEnglishCopy ? 'Basic' : 'Basic')
              : (isEnglishCopy ? 'Advanced' : 'Advanced')}
          </button>
        ))}
      </div>

      <div
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: '100%',
            maxWidth: layout.logicalWidth,
            height: layout.totalHeight,
          }}
        >
          {layout.blocks.map((blockLayout) => {
            const unlocked = isBlockUnlocked(
              blockLayout.blockIndex,
              layout.blocks,
              clearedNodeIds,
              isPremiumMember,
            );
            return (
              <section
                key={blockLayout.block.id}
                className="absolute left-0 right-0"
                style={{ top: blockLayout.y, height: blockLayout.height }}
              >
                <div className="mx-auto w-fit rounded-xl border border-white/20 bg-black/40 px-4 py-2 text-center text-sm font-bold text-amber-200">
                  {isEnglishCopy ? blockLayout.block.labelEn : blockLayout.block.label}
                </div>
                <div className={cn(!unlocked && 'opacity-40')}>
                  {blockLayout.nodes.map(({ node, x, y }) => {
                    const clear = clearByNodeId.get(node.id);
                    const cleared = clear != null;
                    const rankLabel = mode === 'code_run' ? clear?.bestRank : null;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        className={cn(
                          'absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold',
                          cleared
                            ? 'border-emerald-400 bg-emerald-900/60 text-emerald-100'
                            : 'border-white/30 bg-slate-800/80 text-white',
                        )}
                        style={{ left: x, top: y }}
                        onClick={() => handleNodeTap(node, blockLayout.blockIndex)}
                      >
                        {rankLabel ?? (node.nodeKind === 'quest' ? '?' : '●')}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {lockedNotice && !selectedNode && (
        <div className="border-t border-white/10 bg-slate-950/95 p-4 text-xs text-amber-200">
          {isEnglishCopy
            ? 'Clear every stage in the previous block to unlock this block.'
            : '前のブロックの全ステージをクリアすると解放されます。'}
        </div>
      )}

      {selectedNode && (
        <div className="border-t border-white/10 bg-slate-950/95 p-4">
          <h3 className="font-bold text-white">
            {isEnglishCopy ? selectedNode.titleEn : selectedNode.title}
          </h3>
          {mode === 'code_run' && selectedNode.nodeKind === 'stage' && (
            <p className="mt-1 text-xs text-slate-300">
              {formatCodeRunRankCondition(
                selectedNode.requiredRank,
                thresholds.map((t) => ({
                  rank: t.rank,
                  maxSeconds: t.maxSeconds,
                  sortOrder: t.sortOrder,
                })),
                isEnglishCopy,
              )}
            </p>
          )}
          {selectedClear?.bestRank && mode === 'code_run' && (
            <p className="mt-1 text-xs text-emerald-300">
              {isEnglishCopy ? `Best rank: ${selectedClear.bestRank}` : `最高ランク: ${selectedClear.bestRank}`}
            </p>
          )}
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white hover:bg-indigo-500"
            onClick={handleStart}
          >
            {isEnglishCopy ? 'Start' : '開始'}
          </button>
        </div>
      )}

      <WebPaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        isEnglishCopy={isEnglishCopy}
        source={mode === 'code_run' ? 'code_run' : 'phrase_defense'}
      />
    </div>
  );
};

export default PlayWorldMap;
