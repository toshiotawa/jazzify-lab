/**
 * サバイバルモード レベルアップ画面
 * 画面中央下に半透明で表示（ゲーム一時停止なし）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { LevelUpBonus } from './SurvivalTypes';

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

const SELECTION_TIMEOUT = 8;  // 選択制限時間（秒）- 短めに
const INPUT_DELAY = 0.3;      // 入力受付までの遅延（秒）
const SELECTION_DISPLAY_TIME = 0.5;  // 選択結果表示時間（秒）

const SurvivalLevelUp: React.FC<SurvivalLevelUpProps> = ({
  options,
  onSelect,
  onTimeout,
  level,
  pendingLevelUps,
  correctNotes,
  tapSelectionEnabled = false,
}) => {
  const [timer, setTimer] = useState(SELECTION_TIMEOUT);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<LevelUpBonus | null>(null);
  const timeoutCalledRef = React.useRef(false);
  
  useEffect(() => {
    setTimer(SELECTION_TIMEOUT);
    setInputEnabled(false);
    setSelectedBonus(null);
    timeoutCalledRef.current = false;
    
    const inputDelayTimer = setTimeout(() => {
      setInputEnabled(true);
    }, INPUT_DELAY * 1000);
    
    return () => clearTimeout(inputDelayTimer);
  }, [pendingLevelUps]);
  
  const handleSelect = useCallback((bonus: LevelUpBonus) => {
    if (!inputEnabled || selectedBonus) return;
    
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
    if (!inputEnabled || selectedBonus) return;
    
    for (let i = 0; i < options.length; i++) {
      const progress = getProgress(i);
      if (progress >= 100 && options[i]?.chord?.notes) {
        handleSelect(options[i]);
        break;
      }
    }
  }, [correctNotes, inputEnabled, selectedBonus, options, handleSelect]);

  return (
    <div className="fixed inset-x-0 bottom-[150px] z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto mx-4 p-3 bg-black/60 backdrop-blur-sm rounded-xl border border-yellow-500/50 shadow-lg">
        {/* ヘッダー（コンパクト） */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-yellow-400 text-sm font-sans font-bold">
            ✨ Lv.{level - pendingLevelUps + 1}
            {pendingLevelUps > 1 && <span className="text-xs ml-1">(+{pendingLevelUps - 1})</span>}
          </div>
          {/* タイマー */}
          <div className={cn(
            'text-xs font-sans px-2 py-0.5 rounded',
            timer > 3 ? 'bg-green-600/50 text-green-300' : 'bg-red-600/50 text-red-300 animate-pulse'
          )}>
            {timer.toFixed(1)}s
          </div>
        </div>
        
        {/* 選択肢（横並び、コンパクト） */}
        <div className="flex gap-2">
          {options.map((option, index) => {
            const progress = getProgress(index);
            const isComplete = progress >= 100;
            const isSelected = selectedBonus?.type === option.type;
            const hasValidChord = option?.chord?.notes != null;
            
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
                  'relative w-24 p-2 rounded-lg border transition-all',
                  'bg-gradient-to-br from-gray-800/80 to-gray-900/80',
                  isSelected
                    ? 'border-green-400 bg-green-900/50 scale-105'
                    : isComplete
                    ? 'border-yellow-400 shadow-yellow-500/30'
                    : progress > 0
                    ? 'border-green-500/50'
                    : 'border-gray-600/50 hover:border-gray-500/50',
                  tapSelectionEnabled && hasValidChord && 'cursor-pointer hover:scale-102 active:scale-98',
                  !hasValidChord && 'opacity-40 cursor-not-allowed'
                )}
              >
                {/* アイコン＆名前 */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-xs font-bold text-white font-sans truncate">
                    {option.displayName}
                  </span>
                </div>
                
                {/* コード */}
                <div className={cn(
                  'text-center py-1 px-1.5 rounded text-sm font-bold font-sans',
                  'bg-black/40',
                  isComplete ? 'text-yellow-400' : 'text-white/80',
                  !hasValidChord && 'text-red-400'
                )}>
                  {hasValidChord ? option.chord.displayName : '---'}
                </div>
                
                {/* 進捗バー */}
                <div className="mt-1.5 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-100',
                      isComplete ? 'bg-yellow-400' : 'bg-green-400'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* 選択エフェクト */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-lg bg-green-400/20 animate-pulse pointer-events-none flex items-center justify-center">
                    <span className="text-green-400 text-lg">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SurvivalLevelUp;
