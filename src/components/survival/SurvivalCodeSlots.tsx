/**
 * サバイバルモード コードスロットUI
 * Shot/Punch/Magic 列のコードスロットと進捗表示
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { SurvivalProgressionStaff } from './SurvivalProgressionStaff';
import { CodeSlot, SLOT_TIMEOUT } from './SurvivalTypes';

/** HINT ON の Progression 時、Punch（B）右にスタッフを出すために GameScreen が渡すスナップショット */
export interface SurvivalProgressionStaffSnapshot {
  readonly voicingNames: readonly string[];
  readonly keyFifths: number;
  readonly correctPitchClasses: readonly number[];
}

const progressionStaffSnapshotEqual = (
  a: SurvivalProgressionStaffSnapshot | null | undefined,
  b: SurvivalProgressionStaffSnapshot | null | undefined,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.keyFifths === b.keyFifths &&
    a.correctPitchClasses.length === b.correctPitchClasses.length &&
    a.correctPitchClasses.every((pc, ix) => pc === b.correctPitchClasses[ix]) &&
    a.voicingNames.length === b.voicingNames.length &&
    a.voicingNames.every((n, ix) => n === b.voicingNames[ix])
  );
};

interface SurvivalCodeSlotsProps {
  currentSlots: [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
  nextSlots: [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
  hintSlotIndex: number | null;  // ヒント表示中のスロット（0=A, 1=B, 2=C, 3=D）
  aSlotCooldown: number;  // A列のクールダウン
  bSlotCooldown: number;  // B列のクールダウン
  cSlotCooldown: number;  // C列のクールダウン
  dSlotCooldown: number;  // D列のクールダウン
  hasMagic: boolean;
  isAMagicSlot?: boolean;
  isBMagicSlot?: boolean;
  isStageMode?: boolean;
  /** ボス戦時は C/D 列を封印表示にする */
  isBossStage?: boolean;
  /** Progression（コード進行）ステージ時は B 列のみ拡大表示する */
  isProgressionStage?: boolean;
  /** Progression + HINT 時、Punch 右側のヘ音スタッフ用（欠落時は非表示） */
  progressionStaffSnapshot?: SurvivalProgressionStaffSnapshot | null;
}

// ===== スロットタイプの色設定 =====
const SLOT_COLORS = {
  A: {
    bg: 'from-blue-600/80 to-blue-800/80',
    border: 'border-blue-400',
    text: 'text-blue-300',
    glow: 'shadow-blue-500/50',
    label: '🔫 Shot',
    description: '遠距離弾',
  },
  B: {
    bg: 'from-orange-600/80 to-orange-800/80',
    border: 'border-orange-400',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/50',
    label: '👊 Punch',
    description: '近接攻撃',
  },
  C: {
    bg: 'from-purple-600/80 to-purple-800/80',
    border: 'border-purple-400',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/50',
    label: '🪄 Magic',
    description: '魔法',
  },
  D: {
    bg: 'from-pink-600/80 to-pink-800/80',
    border: 'border-pink-400',
    text: 'text-pink-300',
    glow: 'shadow-pink-500/50',
    label: '✨ Magic',
    description: '魔法',
  },
};

// ===== 単一スロット表示 =====
interface SlotDisplayProps {
  slot: CodeSlot;
  nextSlot: CodeSlot;
  isHinted: boolean;
  isMagicOnCooldown?: boolean;  // 対象列の魔法がクールダウン中か
  isMagicSlot?: boolean;        // この列が魔法スロットか
  isWide?: boolean;             // ボス戦中は A/B のみで幅を太く
}

const SlotDisplayComponent: React.FC<SlotDisplayProps> = ({
  slot,
  nextSlot,
  isHinted,
  isMagicOnCooldown = false,
  isMagicSlot = false,
  isWide = false,
}) => {
  const colors = SLOT_COLORS[slot.type];
  
  // 正解進捗（構成音のうち何音正解したか）
  const totalNotes = slot.chord?.notes.length ?? 0;
  const correctCount = slot.correctNotes.length;
  const progressPercent = totalNotes > 0 ? (correctCount / totalNotes) * 100 : 0;
  
  // 魔法スロット化されたA/B列、またはC/D列でクールダウン中の場合は灰色表示
  const isDisabledByCooldown =
    ((slot.type === 'C' || slot.type === 'D' || isMagicSlot) && slot.isEnabled && isMagicOnCooldown);
  const slotLabel = isMagicSlot ? '🪄 Magic' : colors.label;
  
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* 現在のスロット */}
      <div
        className={cn(
          'relative w-full rounded-lg border-2 overflow-hidden transition-all',
          isWide ? 'h-20 md:h-28' : 'h-14 md:h-20',
          colors.border,
          'bg-gradient-to-br',
          colors.bg,
          slot.isCompleted && 'animate-pulse',
          slot.isCompleted && `shadow-lg ${colors.glow}`,
          isHinted && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black',
          !slot.isEnabled && 'opacity-50 grayscale',
          isDisabledByCooldown && 'opacity-50 grayscale'
        )}
      >
        {/* ラベル */}
        <div className={cn(
          'absolute top-1 left-1 font-sans opacity-70',
          isWide ? 'text-sm md:text-base' : 'text-xs'
        )}>
          {slotLabel}
        </div>
        
        {/* コード名 */}
        <div className="flex items-center justify-center h-full px-1">
          {slot.isEnabled ? (
            <span className={cn(
              'font-bold font-sans leading-tight text-center break-all',
              isWide
                ? ((slot.chord?.displayName?.length ?? 0) > 10 ? 'text-sm md:text-base'
                    : (slot.chord?.displayName?.length ?? 0) > 6 ? 'text-base md:text-lg'
                    : (slot.chord?.displayName?.length ?? 0) > 4 ? 'text-xl md:text-2xl'
                    : 'text-2xl md:text-4xl')
                : ((slot.chord?.displayName?.length ?? 0) > 10 ? 'text-[10px] md:text-xs'
                    : (slot.chord?.displayName?.length ?? 0) > 6 ? 'text-xs md:text-sm'
                    : (slot.chord?.displayName?.length ?? 0) > 4 ? 'text-sm md:text-lg'
                    : 'text-base md:text-2xl'),
              slot.isCompleted ? 'text-yellow-300' : 'text-white',
              isDisabledByCooldown && 'text-gray-500'
            )}>
              {slot.chord?.displayName ?? '---'}
            </span>
          ) : (
            <span className="text-lg text-gray-400 font-sans">
              🔒
            </span>
          )}
        </div>
        
        {/* 進捗バー（下部） */}
        {slot.isEnabled && !slot.isCompleted && !isDisabledByCooldown && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
            <div
              className="h-full bg-green-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
        
        {/* 完成エフェクト */}
        {slot.isCompleted && (
          <div className="absolute inset-0 bg-yellow-400/30 animate-ping" />
        )}
        
        {/* ヒントアイコン */}
        {isHinted && (
          <div className="absolute top-1 right-1 text-sm animate-bounce">
            💡
          </div>
        )}
      </div>
      
      {/* 次のスロット（見やすく大きめ表示） */}
      <div
        className={cn(
          'w-full rounded-lg border-2 flex flex-col items-center justify-center',
          isWide ? 'h-12 md:h-14' : 'h-8 md:h-10',
          'bg-gradient-to-br from-gray-800/80 to-gray-900/80',
          colors.border,
          'border-opacity-50',
          !slot.isEnabled && 'opacity-30',
          isDisabledByCooldown && 'opacity-30'
        )}
      >
        <span className={cn(
          'font-sans text-gray-500 leading-none',
          isWide ? 'text-xs' : 'text-[10px]'
        )}>NEXT</span>
        <span className={cn(
          'font-bold font-sans leading-tight text-center break-all',
          isWide
            ? ((nextSlot.chord?.displayName?.length ?? 0) > 8 ? 'text-xs md:text-sm'
                : (nextSlot.chord?.displayName?.length ?? 0) > 5 ? 'text-sm md:text-base'
                : 'text-lg md:text-xl')
            : ((nextSlot.chord?.displayName?.length ?? 0) > 8 ? 'text-[10px]'
                : (nextSlot.chord?.displayName?.length ?? 0) > 5 ? 'text-xs' : 'text-base'),
          colors.text
        )}>
          {slot.isEnabled && !isDisabledByCooldown ? (nextSlot.chord?.displayName ?? '---') : '---'}
        </span>
      </div>
    </div>
  );
};

// SlotDisplay の表示は slot の「型・コード・正解数・完了・有効」のみに依存する。
// gameLoop で毎フレーム変化する `timer` / `completedTime` は表示に使っていないので比較から除外する。
const isSlotVisualEqual = (a: CodeSlot, b: CodeSlot): boolean =>
  a === b || (
    a.type === b.type &&
    a.chord === b.chord &&
    a.correctNotes.length === b.correctNotes.length &&
    a.isCompleted === b.isCompleted &&
    a.isEnabled === b.isEnabled
  );

const SlotDisplay = React.memo(SlotDisplayComponent, (prev, next) =>
  prev.isHinted === next.isHinted &&
  prev.isMagicOnCooldown === next.isMagicOnCooldown &&
  prev.isMagicSlot === next.isMagicSlot &&
  prev.isWide === next.isWide &&
  isSlotVisualEqual(prev.slot, next.slot) &&
  isSlotVisualEqual(prev.nextSlot, next.nextSlot)
);

// ===== メインコンポーネント =====
const SurvivalCodeSlotsComponent: React.FC<SurvivalCodeSlotsProps> = ({
  currentSlots,
  nextSlots,
  hintSlotIndex,
  aSlotCooldown,
  bSlotCooldown,
  cSlotCooldown,
  dSlotCooldown,
  hasMagic,
  isAMagicSlot = false,
  isBMagicSlot = false,
  isStageMode = false,
  isBossStage = false,
  isProgressionStage = false,
  progressionStaffSnapshot = null,
}) => {
  // 各スロットのクールダウン状態を判定
  const getSlotCooldown = (index: number): boolean => {
    if (!hasMagic) return false;
    if (index === 0 && isAMagicSlot) return aSlotCooldown > 0;  // A列魔法モード
    if (index === 1 && isBMagicSlot) return bSlotCooldown > 0;  // B列魔法モード
    if (index === 2) return cSlotCooldown > 0;  // C列
    if (index === 3) return dSlotCooldown > 0;  // D列
    return false;
  };

  // 各スロットが魔法スロットかどうか
  const isSlotMagic = (index: number): boolean => {
    if (index === 0) return isAMagicSlot;
    if (index === 1) return isBMagicSlot;
    return false;
  };
  
  return (
    <div className="flex flex-col items-center gap-2 py-2 px-0 md:px-4 bg-black/60 rounded-xl backdrop-blur-sm border border-gray-700 w-full md:w-auto md:min-w-[28rem] lg:min-w-[32rem]">
      {/* スロット行 */}
      <div className="flex gap-1 md:gap-2 w-full justify-center">
        {currentSlots.map((slot, index) => {
          // Progression ステージは B 列(index=1)のみ表示し、中央寄せ・拡大表示
          if (isProgressionStage && index !== 1) return null;
          if (!isProgressionStage && isStageMode && index >= 3) return null;
          // ボス戦では C/D 列を完全非表示（A/B 列のみ）
          if (!isProgressionStage && isBossStage && index >= 2) return null;
          const rowWithStaff =
            isProgressionStage &&
            progressionStaffSnapshot &&
            progressionStaffSnapshot.voicingNames.length > 0;

          return (
            <div
              key={slot.type}
              className={cn(
                'flex',
                rowWithStaff
                  ? 'flex-row flex-1 gap-3 items-center justify-center w-full max-w-[min(56rem,calc(100vw-2rem))] mx-auto'
                  : isProgressionStage
                    ? 'flex-1 max-w-[24rem] mx-auto'
                    : 'flex-1 min-w-0'
              )}
            >
              <div className={rowWithStaff ? 'shrink-0 w-[10rem] md:w-[12rem]' : undefined}>
                <SlotDisplay
                  slot={slot}
                  nextSlot={nextSlots[index]}
                  isHinted={hintSlotIndex === index}
                  isMagicOnCooldown={getSlotCooldown(index)}
                  isMagicSlot={isSlotMagic(index)}
                  isWide={isBossStage || isProgressionStage}
                />
              </div>
              {rowWithStaff && (
                <SurvivalProgressionStaff
                  correctPitchClasses={progressionStaffSnapshot.correctPitchClasses}
                  keyFifths={progressionStaffSnapshot.keyFifths}
                  voicingNames={progressionStaffSnapshot.voicingNames}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 外側コンポーネントも同様に「表示に影響する差分」だけを比較し、毎フレームの timer 更新での再レンダーを回避する。
const areSlotsVisualEqual = (
  a: readonly [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
  b: readonly [CodeSlot, CodeSlot, CodeSlot, CodeSlot]
): boolean => a === b || a.every((slot, i) => isSlotVisualEqual(slot, b[i]));

const SurvivalCodeSlots = React.memo(SurvivalCodeSlotsComponent, (prev, next) =>
  prev.hintSlotIndex === next.hintSlotIndex &&
  prev.hasMagic === next.hasMagic &&
  prev.isAMagicSlot === next.isAMagicSlot &&
  prev.isBMagicSlot === next.isBMagicSlot &&
  prev.isStageMode === next.isStageMode &&
  prev.isBossStage === next.isBossStage &&
  prev.isProgressionStage === next.isProgressionStage &&
  progressionStaffSnapshotEqual(prev.progressionStaffSnapshot, next.progressionStaffSnapshot) &&
  // クールダウンは「> 0 か否か」だけが表示に影響するため真偽値で比較する
  (prev.aSlotCooldown > 0) === (next.aSlotCooldown > 0) &&
  (prev.bSlotCooldown > 0) === (next.bSlotCooldown > 0) &&
  (prev.cSlotCooldown > 0) === (next.cSlotCooldown > 0) &&
  (prev.dSlotCooldown > 0) === (next.dSlotCooldown > 0) &&
  areSlotsVisualEqual(prev.currentSlots, next.currentSlots) &&
  areSlotsVisualEqual(prev.nextSlots, next.nextSlots)
);

export default SurvivalCodeSlots;
