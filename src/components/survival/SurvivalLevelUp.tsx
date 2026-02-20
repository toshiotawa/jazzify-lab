/**
 * サバイバルモード レベルアップ画面
 * ドラッグ移動可能なコンパクトウィンドウ（一時停止なし）
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { LevelUpBonus } from './SurvivalTypes';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';

interface SurvivalLevelUpProps {
  options: LevelUpBonus[];
  onSelect: (bonus: LevelUpBonus) => void;
  onTimeout: () => void;
  level: number;
  pendingLevelUps: number;
  onNoteInput: (note: number) => void;
  correctNotes: number[][];
  tapSelectionEnabled?: boolean;
}

const SELECTION_TIMEOUT = 10;
const INPUT_DELAY = 0.5;
const SELECTION_DISPLAY_TIME = 0.02;

// コンポーネントのアンマウント/再マウント間でドラッグ位置を保持
let persistedPosition = { x: 0, y: 0 };

const SurvivalLevelUp: React.FC<SurvivalLevelUpProps> = ({
  options,
  onSelect,
  onTimeout,
  level,
  pendingLevelUps,
  correctNotes,
  tapSelectionEnabled = false,
}) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  const [timer, setTimer] = useState(SELECTION_TIMEOUT);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<LevelUpBonus | null>(null);
  const timeoutCalledRef = useRef(false);
  const selectionMadeRef = useRef(false);

  // ドラッグ移動（モジュールレベル変数で位置を永続化）
  const [position, setPosition] = useState(persistedPosition);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionAtDragStartRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionAtDragStartRef.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newPos = {
      x: positionAtDragStartRef.current.x + dx,
      y: positionAtDragStartRef.current.y + dy,
    };
    setPosition(newPos);
    persistedPosition = newPos;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    setTimer(SELECTION_TIMEOUT);
    setInputEnabled(false);
    setSelectedBonus(null);
    timeoutCalledRef.current = false;
    selectionMadeRef.current = false;

    const playLevelUpSound = async () => {
      try {
        const originalVolume = FantasySoundManager.getVolume();
        if (typeof originalVolume === 'number' && originalVolume > 0) {
          FantasySoundManager.setVolume(Math.min(originalVolume, 0.3));
          await FantasySoundManager.playStageClear();
          FantasySoundManager.setVolume(originalVolume);
        } else {
          FantasySoundManager.setVolume(0.3);
          await FantasySoundManager.playStageClear();
        }
      } catch {
        // ignore
      }
    };
    playLevelUpSound();

    const inputDelayTimer = setTimeout(() => {
      setInputEnabled(true);
    }, INPUT_DELAY * 1000);

    return () => clearTimeout(inputDelayTimer);
  }, [pendingLevelUps]);

  const handleSelect = useCallback((bonus: LevelUpBonus) => {
    if (!inputEnabled || selectedBonus || selectionMadeRef.current) return;
    selectionMadeRef.current = true;
    setSelectedBonus(bonus);
    setTimeout(() => {
      onSelect(bonus);
    }, SELECTION_DISPLAY_TIME * 1000);
  }, [inputEnabled, selectedBonus, onSelect]);

  useEffect(() => {
    if (selectedBonus) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        const newValue = prev - 0.1;
        if (newValue <= 0) {
          if (!timeoutCalledRef.current) {
            timeoutCalledRef.current = true;
            setTimeout(() => onTimeout(), 0);
          }
          return 0;
        }
        return newValue;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onTimeout, pendingLevelUps, selectedBonus]);

  const handleTapSelect = (option: LevelUpBonus) => {
    if (!tapSelectionEnabled || !inputEnabled || selectedBonus) return;
    handleSelect(option);
  };

  const getProgress = (index: number): number => {
    const chord = options[index]?.chord;
    if (!chord || !chord.notes) return 0;
    const totalNotes = [...new Set(chord.notes.map(n => n % 12))].length;
    const correct = correctNotes[index]?.length ?? 0;
    return totalNotes > 0 ? (correct / totalNotes) * 100 : 0;
  };

  const validOptions = options.filter(opt => opt?.chord?.notes);

  React.useEffect(() => {
    if (validOptions.length === 0) {
      onTimeout();
    }
  }, [validOptions.length, onTimeout]);

  React.useEffect(() => {
    if (!inputEnabled || selectedBonus || selectionMadeRef.current) return;
    for (let i = 0; i < options.length; i++) {
      const progress = getProgress(i);
      if (progress >= 100 && options[i]?.chord?.notes) {
        handleSelect(options[i]);
        break;
      }
    }
  }, [correctNotes, inputEnabled, selectedBonus, options, handleSelect]);

  const isCompact = options.length > 3;

  return (
    <div
      className="fixed z-40 pointer-events-none"
      style={{
        top: '8px',
        left: '50%',
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
      }}
    >
      <div className={cn(
        'pointer-events-auto rounded-lg border border-yellow-500/50 bg-black/75 backdrop-blur-sm shadow-lg shadow-black/40',
        isCompact ? 'max-w-[520px]' : 'max-w-[420px]',
      )}>
        {/* ドラッグハンドル（ヘッダー） */}
        <div
          className="flex items-center justify-between px-2.5 py-1.5 cursor-grab active:cursor-grabbing select-none border-b border-yellow-500/20"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <div className="flex items-center gap-1.5">
            {/* グリップインジケーター */}
            <span className="text-gray-500 text-[10px] leading-none select-none" aria-hidden="true">⠿</span>
            <span className="text-yellow-400 text-xs font-sans">✨ LV UP</span>
            <span className="text-sm font-bold text-white font-sans">
              {level - pendingLevelUps}→{level - pendingLevelUps + 1}
            </span>
            {pendingLevelUps > 1 && (
              <span className="text-[10px] text-yellow-300 font-sans">+{pendingLevelUps - 1}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-100',
                  timer > 3 ? 'bg-green-500' : 'bg-red-500'
                )}
                style={{ width: `${(timer / SELECTION_TIMEOUT) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 w-5 font-sans">{timer.toFixed(0)}s</span>
          </div>
        </div>

        {/* 選択肢 */}
        <div className={cn('flex gap-1 p-1.5', isCompact && 'gap-0.5 p-1')}>
          {options.map((option, index) => {
            const progress = getProgress(index);
            const isComplete = progress >= 100;
            const hasValidChord = option?.chord?.notes != null;
            const isSelected = selectedBonus?.type === option.type;

            return (
              <div
                key={option.type}
                onClick={() => hasValidChord && handleTapSelect(option)}
                role="button"
                tabIndex={tapSelectionEnabled && hasValidChord ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && tapSelectionEnabled && hasValidChord) {
                    handleTapSelect(option);
                  }
                }}
                className={cn(
                  'relative flex-1 rounded border transition-all',
                  isCompact ? 'p-1' : 'p-1.5',
                  'bg-gradient-to-br from-gray-700/80 to-gray-800/80',
                  isComplete || isSelected
                    ? 'border-yellow-400 shadow-md shadow-yellow-500/20'
                    : 'border-gray-600/80',
                  progress > 0 && !isComplete && 'border-green-500/50',
                  tapSelectionEnabled && hasValidChord && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
                  !hasValidChord && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* アイコンと名前 */}
                <div className="flex items-center gap-0.5 mb-0.5">
                  <span className={isCompact ? 'text-sm' : 'text-base'}>{option.icon}</span>
                  <span className={cn(
                    'font-bold font-sans truncate',
                    isCompact ? 'text-[10px]' : 'text-xs',
                    isComplete || isSelected ? 'text-yellow-300' : 'text-white'
                  )}>
                    {isEnglishCopy && option.displayNameEn ? option.displayNameEn : option.displayName}
                  </span>
                </div>

                {/* コード名 */}
                <div className={cn(
                  'rounded text-center bg-black/40',
                  isCompact ? 'py-0.5 px-0.5' : 'py-0.5 px-1',
                  isComplete ? 'text-yellow-400' : 'text-white',
                  !hasValidChord && 'text-red-400'
                )}>
                  <span className={cn(
                    'font-bold font-sans',
                    isCompact ? 'text-xs' : 'text-sm'
                  )}>
                    {hasValidChord ? option.chord.displayName : '---'}
                  </span>
                </div>

                {/* 進捗バー */}
                <div className="mt-0.5 h-0.5 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-100',
                      isComplete ? 'bg-yellow-400' : 'bg-green-400'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {isSelected && (
                  <div className="absolute inset-0 rounded bg-yellow-400/20 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* 入力遅延中の表示 */}
        {!inputEnabled && (
          <div className="pb-1 text-center text-[10px] text-yellow-400 animate-pulse font-sans">
            ⏳ {isEnglishCopy ? 'Get ready...' : '準備中...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurvivalLevelUp;
