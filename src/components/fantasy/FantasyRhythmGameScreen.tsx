/**
 * ファンタジーリズムゲーム画面
 * リズムモード専用のゲーム画面実装
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { useFantasyRhythmEngine } from './FantasyRhythmEngine';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import RhythmTimingIndicator from './rhythm/RhythmTimingIndicator';
import RhythmJudgmentDisplay, { addJudgment } from './rhythm/RhythmJudgmentDisplay';
import FantasySettingsModal from './FantasySettingsModal';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import type { FantasyStage } from '@/types';
import type { JudgmentType } from '@/types/rhythm';
import type { DisplayOpts } from '@/utils/display-note';

interface FantasyRhythmGameScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

const FantasyRhythmGameScreen: React.FC<FantasyRhythmGameScreenProps> = ({
  stage,
  autoStart = false,
  onGameComplete,
  onBackToStageSelect,
  noteNameLang = 'en',
  simpleNoteName = false,
  lessonMode = false
}) => {
  // 状態管理
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text: string }>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const [judgmentResults, setJudgmentResults] = useState<Array<{ id: string; type: JudgmentType; timestamp: number }>>([]);
  
  // refs
  const midiControllerRef = useRef<MIDIController | null>(null);
  const activeNotesRef = useRef<Set<number>>(new Set());
  const handleNoteInputRef = useRef<(note: number, source?: 'mouse' | 'midi') => void>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // ストア
  const { settings, updateSettings } = useGameStore();
  
  // リズムゲームエンジン
  const {
    gameState,
    isInitialized,
    handleChordInput,
    stopGame
  } = useFantasyRhythmEngine({
    stage,
    onGameStateChange: (state) => {
      devLog.debug('リズムゲーム状態更新:', state);
    },
    onChordJudge: (judgment, chord, monsterId) => {
      devLog.debug('コード判定:', { judgment, chord, monsterId });
      
      // 判定結果を表示
      addJudgment(setJudgmentResults, judgment);
      
      // エフェクト音
      if (judgment !== 'miss') {
        FantasySoundManager.playMagic('fire');
      }
    },
    onGameComplete: (result, finalState) => {
      const text = result === 'clear' ? 'Stage Clear!' : 'Game Over';
      setOverlay({ text });
      
      setTimeout(() => {
        setOverlay(null);
        onGameComplete(
          result,
          finalState.score,
          finalState.perfectHits + finalState.goodHits,
          finalState.totalHits + finalState.missHits
        );
      }, 2000);
    },
    onMonsterDefeat: (monsterId) => {
      devLog.debug('モンスター撃破:', monsterId);
    }
  });
  
  // MIDI/音声入力のハンドリング
  const handleNoteInputBridge = useCallback(async (note: number, source: 'mouse' | 'midi' = 'mouse') => {
    if (source === 'mouse' && activeNotesRef.current.has(note)) {
      return;
    }
    
    // 音声再生
    try {
      const { playNote } = await import('@/utils/MidiController');
      await playNote(note, 80);
      activeNotesRef.current.add(note);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
    
    // ノートを追加していく（コード判定用）
    if (!activeNotesRef.current.has(note)) {
      activeNotesRef.current.add(note);
    }
  }, []);
  
  // ノートリリース時の処理
  const handleNoteRelease = useCallback((note: number) => {
    activeNotesRef.current.delete(note);
    
    // 全てのノートがリリースされたらコード判定
    if (activeNotesRef.current.size === 0) {
      const notes = Array.from(activeNotesRef.current);
      if (notes.length > 0) {
        handleChordInput(notes);
      }
    }
  }, [handleChordInput]);
  
  // MIDIコントローラーの初期化
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note, velocity) => {
          handleNoteInputBridge(note, 'midi');
        },
        onNoteOff: (note) => {
          handleNoteRelease(note);
        }
      });
      
      midiControllerRef.current = controller;
      controller.initialize();
    }
    
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // PIXIレンダラーの準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    setPixiRenderer(renderer);
    
    if (renderer) {
      renderer.updateSettings({
        noteNameStyle: settings.noteNameStyle || 'abc',
        simpleDisplayMode: true,
        pianoHeight: 120,
        noteHeight: 16,
        noteWidth: 20,
        transpose: 0,
        transposingInstrument: 'concert_pitch',
        practiceGuide: stage.show_guide ? 'key' : 'off',
        showHitLine: false,
        viewportHeight: 120,
        timingAdjustment: 0,
        effects: {
          glow: true,
          particles: false,
          trails: false
        }
      });
      
      // キーボードクリックイベント
      renderer.setKeyCallbacks(
        (note: number) => {
          handleNoteInputBridge(note, 'mouse');
        },
        async (note: number) => {
          handleNoteRelease(note);
        }
      );
    }
  }, [settings.noteNameStyle, stage.show_guide, handleNoteInputBridge, handleNoteRelease]);
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      stopGame();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // オート開始
  useEffect(() => {
    if (autoStart && isInitialized) {
      // 自動開始の実装（必要に応じて）
    }
  }, [autoStart, isInitialized]);
  
  return (
    <div ref={containerRef} className={cn(
      "relative w-full h-screen bg-gray-900 overflow-hidden",
      damageShake && "animate-shake"
    )}>
      {/* ゲームUI */}
      <div className="absolute inset-0 flex flex-col">
        {/* ヘッダー */}
        <div className="relative z-20 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToStageSelect}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <i className="fas fa-arrow-left text-xl" />
              </button>
              
              <div className="text-white">
                <div className="text-lg font-bold">{stage.name}</div>
                <div className="text-sm text-gray-400">
                  リズムモード - {stage.rhythm_pattern === 'random' ? 'ランダム' : 'プログレッション'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* HP表示 */}
              <div className="flex items-center gap-2">
                <i className="fas fa-heart text-red-500 text-xl" />
                <span className="text-white font-bold text-lg">
                  {gameState.playerHp} / {stage.max_hp}
                </span>
              </div>
              
              {/* 設定ボタン */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <i className="fas fa-cog text-xl" />
              </button>
            </div>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 flex">
          {/* 左側: タイミング表示 */}
          <div className="w-2/3 p-4">
            <RhythmTimingIndicator
              monsters={gameState.activeMonsters}
              className="h-full"
            />
          </div>
          
          {/* 右側: 判定結果表示 */}
          <div className="w-1/3 p-4">
            <RhythmJudgmentDisplay
              combo={gameState.combo}
              maxCombo={gameState.maxCombo}
              perfectHits={gameState.perfectHits}
              goodHits={gameState.goodHits}
              missHits={gameState.missHits}
              score={gameState.score}
              className="h-full"
            />
          </div>
        </div>
        
        {/* ピアノキーボード */}
        <div className="relative z-10 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700">
          <PIXINotesRenderer
            songTitle=""
            bpm={stage.bpm || 120}
            onReady={handlePixiReady}
            currentTime={0}
            isPlaying={false}
            chordInfos={[]}
            className="w-full h-32"
          />
        </div>
      </div>
      
      {/* オーバーレイ */}
      {overlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-6xl font-bold text-white animate-pulse">
            {overlay.text}
          </div>
        </div>
      )}
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default FantasyRhythmGameScreen;