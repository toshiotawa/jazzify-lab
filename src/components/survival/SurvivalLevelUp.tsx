/**
 * サバイバルモード レベルアップ画面
 * 3択からボーナスを選択
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { LevelUpBonus } from './SurvivalTypes';
import { ChordDefinition } from '../fantasy/FantasyGameEngine';

interface SurvivalLevelUpProps {
  options: LevelUpBonus[];
  onSelect: (bonus: LevelUpBonus) => void;
  level: number;
  pendingLevelUps: number;
  onNoteInput: (note: number) => void;
  correctNotes: number[][];  // 各オプションの正解済み音
}

const SELECTION_TIMEOUT = 10;  // 選択制限時間（秒）

const SurvivalLevelUp: React.FC<SurvivalLevelUpProps> = ({
  options,
  onSelect,
  level,
  pendingLevelUps,
  correctNotes,
}) => {
  const [timer, setTimer] = useState(SELECTION_TIMEOUT);
  
  // タイマー処理
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        const newValue = prev - 0.1;
        if (newValue <= 0) {
          // タイムアウト - ボーナスなしで閉じる
          // 空のボーナスを選択（呼び出し元で処理）
          return 0;
        }
        return newValue;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // 進捗計算
  const getProgress = (index: number): number => {
    const chord = options[index]?.chord;
    if (!chord) return 0;
    const totalNotes = [...new Set(chord.notes.map(n => n % 12))].length;
    const correct = correctNotes[index]?.length ?? 0;
    return totalNotes > 0 ? (correct / totalNotes) * 100 : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-4xl w-full mx-4 p-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-2 border-yellow-500 shadow-2xl">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="text-yellow-400 text-lg font-mono mb-2">
            ✨ LEVEL UP! ✨
          </div>
          <div className="text-4xl font-bold text-white font-mono">
            Lv.{level - 1} → Lv.{level}
          </div>
          {pendingLevelUps > 1 && (
            <div className="text-sm text-yellow-300 mt-2">
              残り {pendingLevelUps - 1} 回のレベルアップ！
            </div>
          )}
        </div>
        
        {/* タイマーバー */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
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
            
            return (
              <div
                key={option.type}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all',
                  'bg-gradient-to-br from-gray-700 to-gray-800',
                  isComplete
                    ? 'border-yellow-400 shadow-lg shadow-yellow-500/30 scale-105'
                    : 'border-gray-600 hover:border-gray-500',
                  progress > 0 && !isComplete && 'border-green-500/50'
                )}
              >
                {/* アイコン */}
                <div className="text-4xl text-center mb-3">
                  {option.icon}
                </div>
                
                {/* 名前 */}
                <div className="text-lg font-bold text-white text-center font-mono mb-1">
                  {option.displayName}
                </div>
                
                {/* 説明 */}
                <div className="text-xs text-gray-400 text-center mb-3">
                  {option.description}
                </div>
                
                {/* レベル表示（あれば） */}
                {option.maxLevel && (
                  <div className="text-xs text-center text-gray-500 mb-2">
                    Lv.{(option.currentLevel ?? 0) + 1} / {option.maxLevel}
                  </div>
                )}
                
                {/* 選択用コード */}
                <div className={cn(
                  'py-2 px-3 rounded-lg text-center',
                  'bg-black/40 border',
                  isComplete ? 'border-yellow-400' : 'border-gray-600'
                )}>
                  <div className="text-xs text-gray-400 mb-1 font-mono">
                    🎹 演奏して選択
                  </div>
                  <div className={cn(
                    'text-xl font-bold font-mono',
                    isComplete ? 'text-yellow-400' : 'text-white'
                  )}>
                    {option.chord?.displayName ?? '---'}
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
        <div className="text-center text-sm text-gray-400 font-mono">
          🎹 コードを演奏してボーナスを選択！タイムアウトでボーナスなし
        </div>
      </div>
    </div>
  );
};

export default SurvivalLevelUp;
