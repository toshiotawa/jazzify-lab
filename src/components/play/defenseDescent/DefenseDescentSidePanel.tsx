import React from 'react';
import { FaCheck, FaLock, FaPlay } from 'react-icons/fa';
import { cn } from '@/utils/cn';
import type { PlayMapNode } from '@/platform/supabasePlayMap';
import type { PlayBlockLayout } from '@/components/play/defenseDescent/playDescentLayout';

interface DefenseDescentSidePanelProps {
  isEnglishCopy: boolean;
  totalClearedCount: number;
  totalStageNodes: number;
  activeBlock: PlayBlockLayout | null;
  blockClearedCount: number;
  selectedNode: PlayMapNode | null;
  selectedNodeCleared: boolean;
  selectedNodeUnlocked: boolean;
  bestSurviveSec: number | null;
  onStart: () => void;
  onRequestUpgrade: () => void;
  startLocked: boolean;
}

export const DefenseDescentSidePanel: React.FC<DefenseDescentSidePanelProps> = ({
  isEnglishCopy,
  totalClearedCount,
  totalStageNodes,
  activeBlock,
  blockClearedCount,
  selectedNode,
  selectedNodeCleared,
  selectedNodeUnlocked,
  bestSurviveSec,
  onStart,
  onRequestUpgrade,
  startLocked,
}) => {
  const totalProgressPct = Math.round((totalClearedCount / Math.max(1, totalStageNodes)) * 100);
  const blockStageCount = activeBlock
    ? activeBlock.nodes.filter((n) => n.node.nodeKind === 'stage').length
    : 0;
  const blockProgressPct = blockStageCount > 0
    ? Math.round((blockClearedCount / blockStageCount) * 100)
    : 0;

  return (
    <aside
      className="flex h-full w-full flex-col gap-4 overflow-y-auto border border-amber-500/15 bg-gradient-to-b from-[#140c1f]/90 to-[#060410]/95 p-5 text-white font-sans shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] rounded-xl md:rounded-l-none md:rounded-r-xl md:border-l-0"
      aria-label={isEnglishCopy ? 'Phrase Defense info panel' : 'フレーズディフェンス情報パネル'}
    >
      <div className="rounded-lg border border-white/5 bg-black/30 p-3">
        <p className="text-[10px] font-bold tracking-[0.2em] text-amber-200/70">
          {isEnglishCopy ? 'PHRASE DEFENSE' : 'フレーズディフェンス'}
        </p>
        <h2 className="mt-1 text-lg font-extrabold text-amber-100">
          {isEnglishCopy ? 'Castle Descent' : '魔王城降下'}
        </h2>
        <p className="mt-2 text-xs text-slate-300">
          {isEnglishCopy ? 'Total progress' : '全体進捗'}: {totalClearedCount}/{totalStageNodes} ({totalProgressPct}%)
        </p>
      </div>

      {activeBlock && (
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <p className="text-xs font-bold text-amber-200/80">
            {isEnglishCopy ? activeBlock.labelEn : activeBlock.label}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            {isEnglishCopy ? 'Block progress' : 'ブロック進捗'}: {blockClearedCount}/{blockStageCount} ({blockProgressPct}%)
          </p>
        </div>
      )}

      {selectedNode ? (
        <div className="rounded-lg border border-amber-500/20 bg-black/35 p-4">
          <h3 className="text-base font-bold text-white">
            {isEnglishCopy ? selectedNode.titleEn : selectedNode.title}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-300">
            {selectedNodeCleared ? (
              <>
                <FaCheck className="text-emerald-400" aria-hidden />
                {isEnglishCopy ? 'Cleared' : 'クリア済み'}
              </>
            ) : selectedNodeUnlocked ? (
              isEnglishCopy ? 'Ready to play' : 'プレイ可能'
            ) : (
              <>
                <FaLock className="text-slate-500" aria-hidden />
                {isEnglishCopy ? 'Locked' : 'ロック中'}
              </>
            )}
          </p>
          {bestSurviveSec != null && (
            <p className="mt-1 text-xs text-emerald-300">
              {isEnglishCopy ? `Best survive: ${bestSurviveSec}s` : `ベスト生存: ${bestSurviveSec}秒`}
            </p>
          )}
          {startLocked ? (
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white hover:bg-amber-500"
              onClick={onRequestUpgrade}
            >
              {isEnglishCopy ? 'Upgrade to unlock' : 'アップグレードして解放'}
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                'mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white',
                selectedNodeUnlocked
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'cursor-not-allowed bg-slate-700 text-slate-400',
              )}
              onClick={onStart}
              disabled={!selectedNodeUnlocked}
            >
              <FaPlay aria-hidden />
              {isEnglishCopy ? 'Start' : '開始'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400">
          {isEnglishCopy
            ? 'Tap a node on the map to view details.'
            : 'マップのノードをタップすると詳細が表示されます。'}
        </p>
      )}
    </aside>
  );
};

export default DefenseDescentSidePanel;
