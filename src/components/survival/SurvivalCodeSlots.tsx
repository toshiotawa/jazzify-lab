/**
 * サバイバルモード コードスロットUI
 * A/B/C列のコードスロットと進捗表示
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { CodeSlot, SLOT_TIMEOUT } from './SurvivalTypes';

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
}

// ===== スロットタイプの色設定 =====
const SLOT_COLORS = {
  A: {
    bg: 'from-blue-600/80 to-blue-800/80',
    border: 'border-blue-400',
    text: 'text-blue-300',
    glow: 'shadow-blue-500/50',
    label: '🔫 A',
    description: '遠距離弾',
  },
  B: {
    bg: 'from-orange-600/80 to-orange-800/80',
    border: 'border-orange-400',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/50',
    label: '👊 B',
    description: '近接攻撃',
  },
  C: {
    bg: 'from-purple-600/80 to-purple-800/80',
    border: 'border-purple-400',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/50',
    label: '🪄 C',
    description: '魔法',
  },
  D: {
    bg: 'from-pink-600/80 to-pink-800/80',
    border: 'border-pink-400',
    text: 'text-pink-300',
    glow: 'shadow-pink-500/50',
    label: '✨ D',
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
  isSealed?: boolean;           // ボス戦中の C/D 封印表示
}

const SlotDisplay: React.FC<SlotDisplayProps> = ({
  slot,
  nextSlot,
  isHinted,
  isMagicOnCooldown = false,
  isMagicSlot = false,
  isSealed = false,
}) => {
  const colors = SLOT_COLORS[slot.type];
  
  // 正解進捗（構成音のうち何音正解したか）
  const totalNotes = slot.chord?.notes.length ?? 0;
  const correctCount = slot.correctNotes.length;
  const progressPercent = totalNotes > 0 ? (correctCount / totalNotes) * 100 : 0;
  
  // 魔法スロット化されたA/B列、またはC/D列でクールダウン中の場合は灰色表示
  const isDisabledByCooldown =
    ((slot.type === 'C' || slot.type === 'D' || isMagicSlot) && slot.isEnabled && isMagicOnCooldown);
  const slotLabel = isMagicSlot ? `🪄 ${slot.type}` : colors.label;
  
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* 現在のスロット */}
      <div
        className={cn(
          'relative w-full h-14 md:h-20 rounded-lg border-2 overflow-hidden transition-all',
          colors.border,
          'bg-gradient-to-br',
          colors.bg,
          slot.isCompleted && 'animate-pulse',
          slot.isCompleted && `shadow-lg ${colors.glow}`,
          isHinted && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black',
          !slot.isEnabled && 'opacity-50 grayscale',
          isDisabledByCooldown && 'opacity-50 grayscale',
          isSealed && 'opacity-40 grayscale'
        )}
      >
        {/* ラベル */}
        <div className="absolute top-1 left-1 text-xs font-sans opacity-70">
          {slotLabel}
        </div>
        
        {/* コード名 */}
        <div className="flex items-center justify-center h-full px-1">
          {isSealed ? (
            <span className="text-lg text-red-300 font-sans" aria-label="封印中">
              ⛔
            </span>
          ) : slot.isEnabled ? (
            <span className={cn(
              'font-bold font-sans leading-tight text-center break-all',
              (slot.chord?.displayName?.length ?? 0) > 10 ? 'text-[10px] md:text-xs' :
              (slot.chord?.displayName?.length ?? 0) > 6 ? 'text-xs md:text-sm' :
              (slot.chord?.displayName?.length ?? 0) > 4 ? 'text-sm md:text-lg' : 'text-base md:text-2xl',
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
              className="h-full bg-green-400 transition-all duration-100"
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
          'w-full h-8 md:h-10 rounded-lg border-2 flex flex-col items-center justify-center',
          'bg-gradient-to-br from-gray-800/80 to-gray-900/80',
          colors.border,
          'border-opacity-50',
          !slot.isEnabled && 'opacity-30',
          isDisabledByCooldown && 'opacity-30'
        )}
      >
        <span className="text-[10px] font-sans text-gray-500 leading-none">NEXT</span>
        <span className={cn(
          'font-bold font-sans leading-tight text-center break-all',
          (nextSlot.chord?.displayName?.length ?? 0) > 8 ? 'text-[10px]' :
          (nextSlot.chord?.displayName?.length ?? 0) > 5 ? 'text-xs' : 'text-base',
          colors.text
        )}>
          {slot.isEnabled && !isDisabledByCooldown ? (nextSlot.chord?.displayName ?? '---') : '---'}
        </span>
      </div>
    </div>
  );
};

// ===== メインコンポーネント =====
const SurvivalCodeSlots: React.FC<SurvivalCodeSlotsProps> = ({
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
          if (isStageMode && index >= 3) return null;
          // ボス戦では D 列を非表示、C 列は封印アイコンで表示
          if (isBossStage && index === 3) return null;
          return (
            <SlotDisplay
              key={slot.type}
              slot={slot}
              nextSlot={nextSlots[index]}
              isHinted={hintSlotIndex === index}
              isMagicOnCooldown={getSlotCooldown(index)}
              isMagicSlot={isSlotMagic(index)}
              isSealed={isBossStage && index >= 2}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SurvivalCodeSlots;
