/**
 * ステージ詳細モーダル
 * ノードクリックで起動。出題コードタイプ/ルート/Mixed内訳/HINTトグル/開始/キャンセル。
 */

import React, { useCallback } from 'react';
import { cn } from '@/utils/cn';
import { FaLock, FaCheck, FaPlay, FaTimes } from 'react-icons/fa';
import { StageDefinition, STAGE_TIME_LIMIT_SECONDS } from '../SurvivalStageDefinitions';

interface StageDetailModalProps {
  open: boolean;
  stage: StageDefinition | null;
  isUnlocked: boolean;
  isCleared: boolean;
  hintMode: boolean;
  onHintModeChange: (v: boolean) => void;
  playLocked: boolean;
  onStart: () => void;
  onClose: () => void;
  onRequestUpgrade: () => void;
  isEnglishCopy: boolean;
}

export const StageDetailModal: React.FC<StageDetailModalProps> = ({
  open,
  stage,
  isUnlocked,
  isCleared,
  hintMode,
  onHintModeChange,
  playLocked,
  onStart,
  onClose,
  onRequestUpgrade,
  isEnglishCopy,
}) => {
  const handleBackdropKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  if (!open || !stage) return null;

  const chipList = stage.allowedChords.slice(0, 12);
  const extraCount = stage.allowedChords.length - chipList.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 font-sans">
      <button
        type="button"
        aria-label={isEnglishCopy ? 'Close modal' : 'モーダルを閉じる'}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={handleBackdropKey}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="descent-modal-title"
        className="relative w-full max-w-md rounded-xl border border-amber-500/30 bg-gradient-to-b from-gray-900 to-gray-950 p-5 text-white shadow-2xl"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-amber-300/80 tracking-widest">
              {isEnglishCopy ? `STAGE ${stage.stageNumber}` : `ステージ ${stage.stageNumber}`}
            </p>
            <h3 id="descent-modal-title" className="text-xl font-bold mt-1">
              {isEnglishCopy ? stage.nameEn : stage.name}
            </h3>
          </div>
          <button
            type="button"
            aria-label={isEnglishCopy ? 'Close' : '閉じる'}
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <div className="text-[11px] text-gray-400">{isEnglishCopy ? 'Chord Type' : 'コードタイプ'}</div>
            <div className="text-white font-bold mt-1">
              {isEnglishCopy ? stage.chordDisplayNameEn : stage.chordDisplayName}
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <div className="text-[11px] text-gray-400">{isEnglishCopy ? 'Root Notes' : 'ルート'}</div>
            <div className="text-white font-bold mt-1">
              {isEnglishCopy ? stage.rootPatternNameEn : stage.rootPatternName}
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <div className="text-[11px] text-gray-400">{isEnglishCopy ? 'Time' : '生存時間'}</div>
            <div className="text-amber-300 font-bold mt-1">{STAGE_TIME_LIMIT_SECONDS}s</div>
          </div>
          <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
            <div className="text-[11px] text-gray-400">{isEnglishCopy ? 'Clear' : 'クリア条件'}</div>
            <div className="text-emerald-300 font-bold mt-1 text-xs">
              {isEnglishCopy ? '90s + 300 Kills' : '90秒 + 300体撃破'}
            </div>
          </div>
        </div>

        {stage.isMixedStage && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/30 p-2.5">
            <div className="text-[11px] text-amber-300">
              {isEnglishCopy ? 'Mixed: all chord types in this block' : 'ミックス: このブロックの全コードタイプ'}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chipList.map(c => (
                <span
                  key={c}
                  className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-gray-200"
                >
                  {c}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                  +{extraCount}
                </span>
              )}
            </div>
          </div>
        )}

        <label
          className={cn(
            'mb-4 flex items-center gap-3 rounded-lg border border-yellow-500/25 bg-black/40 p-3',
            playLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          <input
            type="checkbox"
            checked={hintMode}
            disabled={playLocked}
            onChange={e => onHintModeChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-500 text-yellow-500 focus:ring-yellow-500 cursor-pointer disabled:cursor-not-allowed"
          />
          <div>
            <span className="text-sm font-bold text-yellow-300">
              {isEnglishCopy ? 'HINT MODE' : 'HINTモード'}
            </span>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {isEnglishCopy
                ? 'Shows keyboard hints. HINT-mode clears are not recorded.'
                : '鍵盤にヒントを表示。HINTモードでのクリアは記録されません。'}
            </p>
          </div>
        </label>

        {!isUnlocked && (
          <div className="mb-3 flex items-center gap-2 text-sm text-red-300">
            <FaLock />
            <span>
              {isEnglishCopy
                ? `Clear Stage ${stage.stageNumber - 1} to unlock`
                : `ステージ${stage.stageNumber - 1}をクリアで解放`}
            </span>
          </div>
        )}

        {isCleared && (
          <div className="mb-3 flex items-center gap-2 text-sm text-emerald-300">
            <FaCheck />
            <span>{isEnglishCopy ? 'Cleared!' : 'クリア済み！'}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 font-bold text-sm text-gray-200 transition-colors hover:bg-white/10"
          >
            {isEnglishCopy ? 'Cancel' : 'キャンセル'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (playLocked) {
                onRequestUpgrade();
                return;
              }
              onStart();
            }}
            disabled={!playLocked && !isUnlocked}
            className={cn(
              'flex-[1.6] flex items-center justify-center gap-2 rounded-lg py-3 font-bold text-sm transition-all',
              playLocked
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg'
                : isUnlocked
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed',
            )}
          >
            {playLocked ? <FaLock /> : <FaPlay />}
            {playLocked
              ? isEnglishCopy
                ? 'Upgrade'
                : 'アップグレード'
              : isEnglishCopy
                ? 'Start'
                : '開始'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageDetailModal;
