/**
 * サバイバルモード レベルアップ画面
 * 3択からボーナスを選択
 */

import React, { useState, useEffect, useCallback } from 'react';
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
const INPUT_DELAY = 0.5;       // 入力受付までの遅延（秒）
const SELECTION_DISPLAY_TIME = 0.8;  // 選択結果表示時間（秒）

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
  const [inputEnabled, setInputEnabled] = useState(false);  // 入力受付状態
  const [selectedBonus, setSelectedBonus] = useState<LevelUpBonus | null>(null);  // 選択されたボーナス
  const timeoutCalledRef = React.useRef(false);
  
  // pendingLevelUpsが変わったらタイマーと入力状態をリセット
  useEffect(() => {
    setTimer(SELECTION_TIMEOUT);
    setInputEnabled(false);
    setSelectedBonus(null);
    timeoutCalledRef.current = false;
    
    // 0.5秒後に入力を有効化
    const inputDelayTimer = setTimeout(() => {
      setInputEnabled(true);
    }, INPUT_DELAY * 1000);
    
    return () => clearTimeout(inputDelayTimer);
  }, [pendingLevelUps]);
  
  // 選択時の処理
  const handleSelect = useCallback((bonus: LevelUpBonus) => {
    if (!inputEnabled || selectedBonus) return;
    
    // 選択結果を表示
    setSelectedBonus(bonus);
    
    // 一定時間後に実際の選択処理を実行
    setTimeout(() => {
      onSelect(bonus);
    }, SELECTION_DISPLAY_TIME * 1000);
  }, [inputEnabled, selectedBonus, onSelect]);
  
  // タイマー処理（選択中は停止）
  useEffect(() => {
    if (selectedBonus) return;  // 選択済みならタイマー停止
    
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
  }, [onTimeout, pendingLevelUps, selectedBonus]);
  
  // タップで選択
  const handleTapSelect = (option: LevelUpBonus) => {
    if (!tapSelectionEnabled || !inputEnabled || selectedBonus) return;
    handleSelect(option);
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
  
  // 進捗が100%になったオプションを自動選択
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
    <div className="fixed inset-x-0 top-0 bottom-[140px] z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-4xl w-full mx-4 p-4 sm:p-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-2 border-yellow-500 shadow-2xl max-h-full overflow-y-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="text-yellow-400 text-lg font-sans mb-2">
            ✨ LEVEL UP! ✨
          </div>
          <div className="text-4xl font-bold text-white font-sans">
            Lv.{level - pendingLevelUps} → Lv.{level - pendingLevelUps + 1}
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
                  <div className="text-xs text-center mb-2 font-sans">
                    <span className="text-gray-400">
                      Lv.{option.currentLevel ?? 0}
                    </span>
                    <span className="text-yellow-400 mx-1">→</span>
                    <span className="text-yellow-300 font-bold">
                      Lv.{(option.currentLevel ?? 0) + 1}
                    </span>
                    <span className="text-gray-500 ml-1">
                      / {option.maxLevel}
                    </span>
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
          {!inputEnabled ? (
            <span className="text-yellow-400 animate-pulse">⏳ 準備中...</span>
          ) : tapSelectionEnabled ? (
            '👆 タップまたは🎹 演奏でボーナスを選択！タイムアウトでボーナスなし'
          ) : (
            '🎹 下のピアノでコードを演奏してボーナスを選択！タイムアウトでボーナスなし'
          )}
        </div>
        
        {/* 選択結果オーバーレイ */}
        {selectedBonus && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl z-10">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-4">{selectedBonus.icon}</div>
              <div className="text-3xl font-bold text-yellow-400 font-sans mb-2">
                {selectedBonus.displayName}
              </div>
              <div className="text-lg text-green-400 font-sans">
                ✅ 獲得！
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurvivalLevelUp;
