/**
 * 降下マップ 右側情報パネル (デスクトップ向け)
 * - SURVIVAL 見出し / 全体進捗
 * - 現在 or 選択中ブロック名 / 進捗
 * - 選択中ステージ詳細 / 状態 / ベスト / 開始ボタン
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { FaLock, FaCheck, FaPlay, FaCrown } from 'react-icons/fa';
import { StageDefinition, STAGE_TIME_LIMIT_SECONDS } from '../SurvivalStageDefinitions';
import { BlockMeta } from './descentBlocks';
import { SurvivalStageClear } from '@/platform/supabaseSurvival';

interface DescentSidePanelProps {
  isEnglishCopy: boolean;
  totalClearedCount: number;
  totalStages: number;
  activeBlock: BlockMeta | null;
  blockClearedCount: number;
  selectedStage: StageDefinition | null;
  selectedStageIsUnlocked: boolean;
  selectedStageIsCleared: boolean;
  selectedStageClear: SurvivalStageClear | null;
  hintMode: boolean;
  onHintModeChange: (v: boolean) => void;
  playLocked: boolean;
  onStart: () => void;
  onRequestUpgrade: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const DescentSidePanel: React.FC<DescentSidePanelProps> = ({
  isEnglishCopy,
  totalClearedCount,
  totalStages,
  activeBlock,
  blockClearedCount,
  selectedStage,
  selectedStageIsUnlocked,
  selectedStageIsCleared,
  selectedStageClear,
  hintMode,
  onHintModeChange,
  playLocked,
  onStart,
  onRequestUpgrade,
}) => {
  const totalProgressPct = Math.round((totalClearedCount / Math.max(1, totalStages)) * 100);
  const blockProgressPct = activeBlock
    ? Math.round((blockClearedCount / activeBlock.stageCount) * 100)
    : 0;

  return (
    <aside
      className="flex h-full w-full flex-col gap-4 overflow-y-auto rounded-xl border border-amber-500/15 bg-gradient-to-b from-[#140c1f]/90 to-[#060410]/95 p-5 text-white font-sans shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]"
      aria-label={isEnglishCopy ? 'Survival info panel' : 'サバイバル情報パネル'}
    >
      <div className="rounded-lg border border-white/5 bg-black/30 p-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[11px] tracking-wider text-gray-400">
            {isEnglishCopy ? 'TOTAL PROGRESS' : '全体進捗'}
          </span>
          <span className="font-mono text-sm text-amber-200">
            {totalProgressPct}%
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_0_10px_rgba(255,180,80,0.65)]"
            style={{ width: `${totalProgressPct}%` }}
          />
        </div>
      </div>

      {activeBlock && (
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[11px] tracking-wider text-gray-400">
              {isEnglishCopy ? 'CURRENT BLOCK' : '現在のブロック'}
            </span>
            <span className="font-mono text-xs text-gray-300">
              {blockClearedCount} / {activeBlock.stageCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              {isEnglishCopy ? activeBlock.labelEn : activeBlock.label}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
              style={{ width: `${blockProgressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-amber-500/20 bg-black/40 p-4">
        {selectedStage ? (
          <>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] tracking-widest text-amber-300/80">
                {isEnglishCopy ? `STAGE ${selectedStage.stageNumber}` : `ステージ ${selectedStage.stageNumber}`}
              </span>
              {selectedStageIsCleared ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">
                  <FaCheck className="text-[10px]" />
                  {isEnglishCopy ? 'Cleared' : 'クリア済'}
                </span>
              ) : selectedStageIsUnlocked ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-200">
                  {isEnglishCopy ? 'Unlocked' : '解放中'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/15 px-2 py-0.5 text-[10px] text-gray-400">
                  <FaLock className="text-[10px]" />
                  {isEnglishCopy ? 'Locked' : '未解放'}
                </span>
              )}
            </div>
            <h3 className="mb-3 text-lg font-bold leading-tight">
              {isEnglishCopy ? selectedStage.nameEn : selectedStage.name}
            </h3>

            <dl className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-white/5 p-2">
                <dt className="text-[10px] text-gray-400">
                  {isEnglishCopy ? 'Chord Type' : 'コードタイプ'}
                </dt>
                <dd className="mt-0.5 font-bold text-white">
                  {isEnglishCopy ? selectedStage.chordDisplayNameEn : selectedStage.chordDisplayName}
                </dd>
              </div>
              <div className="rounded-md bg-white/5 p-2">
                <dt className="text-[10px] text-gray-400">
                  {isEnglishCopy ? 'Root' : 'ルート'}
                </dt>
                <dd className="mt-0.5 font-bold text-white">
                  {isEnglishCopy ? selectedStage.rootPatternNameEn : selectedStage.rootPatternName}
                </dd>
              </div>
              <div className="rounded-md bg-white/5 p-2">
                <dt className="text-[10px] text-gray-400">
                  {isEnglishCopy ? 'Time' : '制限時間'}
                </dt>
                <dd className="mt-0.5 font-bold text-amber-300">
                  {STAGE_TIME_LIMIT_SECONDS}s
                </dd>
              </div>
              <div className="rounded-md bg-white/5 p-2">
                <dt className="text-[10px] text-gray-400">
                  {isEnglishCopy ? 'Clear' : 'クリア条件'}
                </dt>
                <dd className="mt-0.5 text-[11px] font-bold text-emerald-300">
                  {isEnglishCopy ? '90s + 300 Kills' : '90秒 + 300体'}
                </dd>
              </div>
            </dl>

            {selectedStage.isMixedStage && (
              <div className="mb-3 rounded-md border border-amber-500/25 bg-amber-950/25 p-2 text-[11px] text-amber-200">
                {isEnglishCopy
                  ? 'Mixed: all chord types in this block.'
                  : 'ミックス: このブロック全コードタイプ'}
              </div>
            )}

            {selectedStageClear && (
              <div className="mb-3 rounded-md border border-emerald-500/20 bg-emerald-950/20 p-2.5">
                <div className="mb-1 flex items-center gap-2 text-[11px] text-emerald-200">
                  <FaCrown className="text-emerald-300" />
                  {isEnglishCopy ? 'Best Record' : 'ベスト記録'}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div>
                    <div className="text-gray-400 text-[10px]">
                      {isEnglishCopy ? 'Time' : '時間'}
                    </div>
                    <div className="font-mono text-white">
                      {formatTime(selectedStageClear.survivalTimeSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[10px]">
                      {isEnglishCopy ? 'Lv' : 'Lv'}
                    </div>
                    <div className="font-mono text-white">
                      {selectedStageClear.finalLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-[10px]">
                      {isEnglishCopy ? 'Kills' : '撃破'}
                    </div>
                    <div className="font-mono text-white">
                      {selectedStageClear.enemiesDefeated}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <label
              className={cn(
                'mb-3 flex cursor-pointer items-center gap-3 rounded-md border border-yellow-500/25 bg-black/40 p-2.5',
                playLocked && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                type="checkbox"
                checked={hintMode}
                disabled={playLocked}
                onChange={e => onHintModeChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-500 text-yellow-500 focus:ring-yellow-500"
              />
              <div>
                <span className="text-xs font-bold text-yellow-300">
                  {isEnglishCopy ? 'HINT MODE' : 'HINTモード'}
                </span>
                <p className="text-[10px] text-gray-400">
                  {isEnglishCopy
                    ? 'Shows keyboard hints. Clears not recorded.'
                    : '鍵盤ヒント表示。クリア記録はされません。'}
                </p>
              </div>
            </label>

            {!selectedStageIsUnlocked && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-red-500/20 bg-red-950/20 px-2 py-1.5 text-xs text-red-300">
                <FaLock />
                <span>
                  {isEnglishCopy
                    ? `Clear Stage ${selectedStage.stageNumber - 1} to unlock`
                    : `ステージ${selectedStage.stageNumber - 1}をクリアで解放`}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (playLocked) {
                  onRequestUpgrade();
                  return;
                }
                onStart();
              }}
              disabled={!playLocked && !selectedStageIsUnlocked}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all',
                playLocked
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg'
                  : selectedStageIsUnlocked
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
                    : 'cursor-not-allowed bg-gray-700 text-gray-500',
              )}
            >
              {playLocked ? <FaLock /> : <FaPlay />}
              {playLocked
                ? isEnglishCopy ? 'Upgrade' : 'アップグレード'
                : isEnglishCopy ? 'Start' : '開始'}
            </button>
          </>
        ) : (
          <div className="py-6 text-center text-sm text-gray-400">
            {isEnglishCopy
              ? 'Select a stage on the map to see details.'
              : 'マップ上のステージを選ぶと詳細が表示されます。'}
          </div>
        )}
      </div>

      <div className="mt-auto text-center text-[10px] tracking-wider text-gray-500">
        {isEnglishCopy
          ? 'Scroll / drag the map to explore.'
          : 'マップをホイール/ドラッグで移動できます。'}
      </div>
    </aside>
  );
};

export default DescentSidePanel;
