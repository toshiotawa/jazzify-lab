/**
 * サバイバルモード レベルアップ画面
 * ゲーム画面中央下に半透明で表示（一時停止なし）
 * 3択からボーナスを選択
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { LevelUpBonus } from './SurvivalTypes';
import { FantasySoundManager } from '@/utils/FantasySoundManager';

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
const SELECTION_DISPLAY_TIME = 0.5;  // 選択結果表示時間（秒）- 短縮

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
    
    // レベルアップ音を再生（音量小さめ）
    try {
      // FantasySoundManagerのplayStageClearを音量小さめで再生
      const originalVolume = FantasySoundManager.getVolume();
      FantasySoundManager.setVolume(originalVolume * 0.3);  // 30%の音量
      FantasySoundManager.playStageClear();
      // 少し遅延して元の音量に戻す
      setTimeout(() => {
        FantasySoundManager.setVolume(originalVolume);
      }, 500);
    } catch {
      // 音声再生エラーは無視
    }
    
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
    <div className="fixed bottom-[140px] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="max-w-3xl w-full mx-4 p-3 bg-black/70 backdrop-blur-sm rounded-xl border border-yellow-500/50 pointer-events-auto">
        {/* ヘッダー - コンパクト */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-sm font-sans">✨ LEVEL UP!</span>
            <span className="text-lg font-bold text-white font-sans">
              Lv.{level - pendingLevelUps} → Lv.{level - pendingLevelUps + 1}
            </span>
            {pendingLevelUps > 1 && (
              <span className="text-xs text-yellow-300 font-sans">
                +{pendingLevelUps - 1}
              </span>
            )}
          </div>
          
          {/* タイマー */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-100',
                  timer > 3 ? 'bg-green-500' : 'bg-red-500'
                )}
                style={{ width: `${(timer / SELECTION_TIMEOUT) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8">{timer.toFixed(0)}s</span>
          </div>
        </div>
        
        {/* 選択肢 - 横並びコンパクト */}
        <div className="flex gap-2">
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
                  'relative flex-1 p-2 rounded-lg border transition-all',
                  'bg-gradient-to-br from-gray-700/80 to-gray-800/80',
                  isComplete || isSelected
                    ? 'border-yellow-400 shadow-lg shadow-yellow-500/20'
                    : 'border-gray-600',
                  progress > 0 && !isComplete && 'border-green-500/50',
                  tapSelectionEnabled && hasValidChord && 'cursor-pointer hover:scale-102 active:scale-98',
                  !hasValidChord && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* アイコンと名前 */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{option.icon}</span>
                  <span className={cn(
                    'text-sm font-bold font-sans',
                    isComplete || isSelected ? 'text-yellow-300' : 'text-white'
                  )}>
                    {option.displayName}
                  </span>
                </div>
                
                {/* 選択用コード */}
                <div className={cn(
                  'py-1 px-2 rounded text-center',
                  'bg-black/40',
                  isComplete ? 'text-yellow-400' : 'text-white',
                  !hasValidChord && 'text-red-400'
                )}>
                  <span className="text-base font-bold font-sans">
                    {hasValidChord ? option.chord.displayName : '---'}
                  </span>
                </div>
                
                {/* 進捗バー */}
                <div className="mt-1 h-1 bg-gray-600 rounded-full overflow-hidden">
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
                  <div className="absolute inset-0 rounded-lg bg-yellow-400/20 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* 操作説明 - 最小化 */}
        {!inputEnabled && (
          <div className="mt-2 text-center text-xs text-yellow-400 animate-pulse font-sans">
            ⏳ 準備中...
          </div>
        )}
      </div>
    </div>
  );
};

export default SurvivalLevelUp;
