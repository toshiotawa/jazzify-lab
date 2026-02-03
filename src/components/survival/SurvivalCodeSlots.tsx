/**
 * サバイバルモード コードスロットUI
 * A/B/C列のコードスロットと進捗表示
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { CodeSlot, SLOT_TIMEOUT } from './SurvivalTypes';
import { Crosshair, Sword, Wand2, Lock, Lightbulb } from 'lucide-react';

interface SurvivalCodeSlotsProps {
  currentSlots: [CodeSlot, CodeSlot, CodeSlot];
  nextSlots: [CodeSlot, CodeSlot, CodeSlot];
  hintSlotIndex: number | null;  // ヒント表示中のスロット（0=A, 1=B, 2=C）
  magicCooldown: number;
  hasMagic: boolean;
}

// ===== スロットタイプの色設定 =====
const SLOT_COLORS = {
  A: {
    bg: 'from-blue-600/80 to-blue-800/80',
    border: 'border-blue-400',
    text: 'text-blue-300',
    glow: 'shadow-blue-500/50',
    icon: <Crosshair className="w-3 h-3 inline mr-1" />,
    label: 'A',
    description: '遠距離弾',
  },
  B: {
    bg: 'from-orange-600/80 to-orange-800/80',
    border: 'border-orange-400',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/50',
    icon: <Sword className="w-3 h-3 inline mr-1" />,
    label: 'B',
    description: '近接攻撃',
  },
  C: {
    bg: 'from-purple-600/80 to-purple-800/80',
    border: 'border-purple-400',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/50',
    icon: <Wand2 className="w-3 h-3 inline mr-1" />,
    label: 'C',
    description: '魔法',
  },
};

// ===== 単一スロット表示 =====
interface SlotDisplayProps {
  slot: CodeSlot;
  nextSlot: CodeSlot;
  isHinted: boolean;
  isMagicOnCooldown?: boolean;  // C列の魔法がクールダウン中か
}

const SlotDisplay: React.FC<SlotDisplayProps> = ({ slot, nextSlot, isHinted, isMagicOnCooldown = false }) => {
  const colors = SLOT_COLORS[slot.type];
  const timerPercent = (slot.timer / SLOT_TIMEOUT) * 100;
  
  // 正解進捗（構成音のうち何音正解したか）
  const totalNotes = slot.chord?.notes.length ?? 0;
  const correctCount = slot.correctNotes.length;
  const progressPercent = totalNotes > 0 ? (correctCount / totalNotes) * 100 : 0;
  
  // C列で魔法がクールダウン中の場合は灰色表示
  const isDisabledByCooldown = slot.type === 'C' && slot.isEnabled && isMagicOnCooldown;
  
  return (
    <div className="flex flex-col items-center gap-1">
      {/* 現在のスロット */}
      <div
        className={cn(
          'relative w-24 h-20 rounded-lg border-2 overflow-hidden transition-all',
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
        <div className="absolute top-1 left-1 text-xs font-sans opacity-70 flex items-center">
          {colors.icon}
          {colors.label}
        </div>
        
        {/* コード名 */}
        <div className="flex items-center justify-center h-full">
          {slot.isEnabled ? (
            <span className={cn(
              'text-2xl font-bold font-sans',
              slot.isCompleted ? 'text-yellow-300' : 'text-white',
              isDisabledByCooldown && 'text-gray-500'
            )}>
              {slot.chord?.displayName ?? '---'}
            </span>
          ) : (
            <Lock className="w-5 h-5 text-gray-400" />
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
        
        {/* タイマーバー（上部） */}
        {slot.isEnabled && !slot.isCompleted && !isDisabledByCooldown && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/40">
            <div
              className={cn(
                'h-full transition-all duration-100',
                timerPercent > 30 ? 'bg-white/70' : 'bg-red-500'
              )}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        )}
        
        {/* 完成エフェクト */}
        {slot.isCompleted && (
          <div className="absolute inset-0 bg-yellow-400/30 animate-ping" />
        )}
        
        {/* ヒントアイコン */}
        {isHinted && (
          <div className="absolute top-1 right-1 animate-bounce">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
          </div>
        )}
      </div>
      
      {/* 次のスロット（小さく表示） */}
      <div
        className={cn(
          'w-16 h-8 rounded border flex items-center justify-center',
          'bg-black/40 border-gray-600',
          !slot.isEnabled && 'opacity-30',
          isDisabledByCooldown && 'opacity-30'
        )}
      >
        <span className="text-xs font-sans text-gray-400">
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
  magicCooldown,
  hasMagic,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-black/60 rounded-xl backdrop-blur-sm border border-gray-700">
      {/* スロット行 */}
      <div className="flex gap-3">
        {currentSlots.map((slot, index) => (
          <SlotDisplay
            key={slot.type}
            slot={slot}
            nextSlot={nextSlots[index]}
            isHinted={hintSlotIndex === index}
            isMagicOnCooldown={hasMagic && magicCooldown > 0}
          />
        ))}
      </div>
    </div>
  );
};

export default SurvivalCodeSlots;
