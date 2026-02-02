/**
 * サバイバルモード レベルアップ画面
 * 3択からボーナスを選択
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { LevelUpBonus } from './SurvivalTypes';

interface SurvivalLevelUpProps {
  options: LevelUpBonus[];
  onSelect: (bonus: LevelUpBonus) => void;
  onTimeout: () => void;  // タイムアウト時のコールバック
  level: number;
  pendingLevelUps: number;
  onNoteInput: (note: number) => void;
  correctNotes: number[][];  // 各オプションの正解済み音
  tapSelectionEnabled?: boolean;  // タップで選択可能かどうか
}

const SELECTION_TIMEOUT = 10;  // 選択制限時間（秒）

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
  const timeoutCalledRef = React.useRef(false);
  
  // タイマー処理
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        const newValue = prev - 0.1;
        if (newValue <= 0) {
          // タイムアウト - ボーナスなしで閉じる
          if (!timeoutCalledRef.current) {
            timeoutCalledRef.current = true;
            // 次のイベントループで呼び出し（状態更新中のエラーを回避）
            setTimeout(() => onTimeout(), 0);
          }
          return 0;
        }
        return newValue;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [onTimeout]);
  
  // タップで選択
  const handleTapSelect = (option: LevelUpBonus) => {
    if (!tapSelectionEnabled) return;
    onSelect(option);
  };
  
  // 進捗計算
  const getProgress = (index: number): number => {
    const chord = options[index]?.chord;
    if (!chord || !chord.notes) return 0;
    const totalNotes = [...new Set(chord.notes.map(n => n % 12))].length;
    const correct = correctNotes[index]?.length ?? 0;
    return totalNotes > 0 ? (correct / totalNotes) * 100 : 0;
  };
  
  // 有効なオプション数をチェック
  const validOptions = options.filter(opt => opt?.chord?.notes);
  
  // 有効なオプションがない場合はタイムアウトを早める
  React.useEffect(() => {
    if (validOptions.length === 0) {
      // 全てのオプションにコードがない場合は即座にタイムアウト
      onTimeout();
    }
  }, [validOptions.length, onTimeout]);

  return (
    <div className="fixed inset-x-0 top-0 bottom-[140px] z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-4xl w-full mx-4 p-4 sm:p-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-2 border-yellow-500 shadow-2xl max-h-full overflow-y-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="text-yellow-400 text-lg font-sans mb-2">
            ✨ LEVEL UP! ✨
          </div>
          <div className="text-4xl font-bold text-white font-sans">
            Lv.{level - 1} → Lv.{level}
          </div>
          {pendingLevelUps > 1 && (
            <div className="text-sm text-yellow-300 mt-2 font-sans">
              残り {pendingLevelUps - 1} 回のレベルアップ！
            </div>
          )}
        </div>
        
        {/* タイマーバー */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1 font-sans">
            <span>⏱️ 選択制限時間</span>
            <span>{timer.toFixed(1)}s</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-100',
                timer > 3 ? 'bg-green-500' : 'bg-red-500 animate-pulse'
              )}
              style={{ width: `${(timer / SELECTION_TIMEOUT) * 100}%` }}
            />
          </div>
        </div>
        
        {/* 選択肢 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {options.map((option, index) => {
            const progress = getProgress(index);
            const isComplete = progress >= 100;
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
                  'relative p-4 rounded-xl border-2 transition-all',
                  'bg-gradient-to-br from-gray-700 to-gray-800',
                  isComplete
                    ? 'border-yellow-400 shadow-lg shadow-yellow-500/30 scale-105'
                    : 'border-gray-600 hover:border-gray-500',
                  progress > 0 && !isComplete && 'border-green-500/50',
                  tapSelectionEnabled && hasValidChord && 'cursor-pointer hover:scale-102 active:scale-98',
                  !hasValidChord && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* アイコン */}
                <div className="text-4xl text-center mb-3">
                  {option.icon}
                </div>
                
                {/* 名前 */}
                <div className="text-lg font-bold text-white text-center font-sans mb-1">
                  {option.displayName}
                </div>
                
                {/* 説明 */}
                <div className="text-xs text-gray-400 text-center mb-3 font-sans">
                  {option.description}
                </div>
                
                {/* レベル表示（あれば） */}
                {option.maxLevel && (
                  <div className="text-xs text-center text-gray-500 mb-2 font-sans">
                    Lv.{(option.currentLevel ?? 0) + 1} / {option.maxLevel}
                  </div>
                )}
                
                {/* 選択用コード */}
                <div className={cn(
                  'py-2 px-3 rounded-lg text-center',
                  'bg-black/40 border',
                  isComplete ? 'border-yellow-400' : 'border-gray-600'
                )}>
                  <div className="text-xs text-gray-400 mb-1 font-sans">
                    {tapSelectionEnabled ? '👆 タップまたは🎹 演奏' : '🎹 演奏して選択'}
                  </div>
                  <div className={cn(
                    'text-xl font-bold font-sans',
                    isComplete ? 'text-yellow-400' : 'text-white',
                    !hasValidChord && 'text-red-400'
                  )}>
                    {hasValidChord ? option.chord.displayName : '---'}
                  </div>
                </div>
                
                {/* 進捗バー */}
                <div className="mt-2 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-100',
                      isComplete ? 'bg-yellow-400' : 'bg-green-400'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* 完成エフェクト */}
                {isComplete && (
                  <div className="absolute inset-0 rounded-xl bg-yellow-400/10 animate-pulse pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* 操作説明 */}
        <div className="text-center text-sm text-gray-400 font-sans">
          {tapSelectionEnabled 
            ? '👆 タップまたは🎹 演奏でボーナスを選択！タイムアウトでボーナスなし'
            : '🎹 下のピアノでコードを演奏してボーナスを選択！タイムアウトでボーナスなし'
          }
        </div>
      </div>
    </div>
  );
};

export default SurvivalLevelUp;
