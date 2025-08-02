import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FantasyStage } from '@/types';
import { useTimeStore } from '@/stores/timeStore';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useGameStore } from '@/stores/gameStore';
import { useEnemyStore } from '@/stores/enemyStore';
import { bgmManager } from '@/utils/BGMManager';
import { devLog } from '@/utils/logger';
import { MIDIController } from '@/utils/MidiController';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import PIXIRhythmRenderer from './PIXIRhythmRenderer';
import FantasySoundManager from '@/utils/FantasySoundManager';
import { resolveChord } from '@/utils/chord-utils';
import type { DisplayOpts } from '@/utils/display-note';

interface RhythmGameScreenProps {
  stage: FantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  autoStart?: boolean;
  noteNameLang?: 'en' | 'ja' | 'solfege';
  simpleNoteName?: boolean;
}

const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({
  stage,
  onGameComplete,
  onBackToStageSelect,
  autoStart = false,
  noteNameLang = 'en',
  simpleNoteName = false,
}) => {
  // ゲーム状態
  const [isGameActive, setIsGameActive] = useState(false);
  const [playerHp, setPlayerHp] = useState(stage.max_hp || 5);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [inputBuffer, setInputBuffer] = useState<number[]>([]);
  const [currentChordTarget, setCurrentChordTarget] = useState<string | null>(null);
  
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  
  // Refs
  const midiControllerRef = useRef<MIDIController | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const activeNotesRef = useRef<Set<number>>(new Set());
  const judgmentTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Stores
  const { settings } = useGameStore();
  const { startAt, readyDuration, currentBeat, currentMeasure, isCountIn, setStart } = useTimeStore();
  const rhythmStore = useRhythmStore();
  const enemyStore = useEnemyStore();
  
  // Ready状態の判定
  const isReady = startAt !== null && performance.now() - startAt < readyDuration;
  
  // ゲーム初期化
  const initializeGame = useCallback(() => {
    devLog.debug('🎮 リズムモード: ゲーム初期化開始');
    
    // 時間管理初期化
    setStart(
      stage.bpm || 120,
      stage.time_signature || 4,
      stage.measure_count || 8,
      stage.count_in_measures || 1
    );
    
    // リズムStore初期化
    rhythmStore.generate(stage);
    
    // 敵Store初期化
    enemyStore.reset();
    enemyStore.init({
      totalHp: stage.enemy_count * stage.enemy_hp,
      attackDamage: { min: stage.min_damage, max: stage.max_damage }
    });
    
    // ゲーム状態初期化
    setIsGameActive(true);
    setPlayerHp(stage.max_hp || 5);
    setScore(0);
    setCorrectCount(0);
    setTotalCount(0);
    
    devLog.debug('🎮 リズムモード: 初期化完了');
  }, [stage, setStart, rhythmStore, enemyStore]);
  
  // BGM管理
  useEffect(() => {
    if (!isReady && startAt) {
      bgmManager.play(
        stage.mp3_url || '/demo-1.mp3',
        stage.bpm || 120,
        stage.time_signature || 4,
        stage.measure_count || 8,
        stage.count_in_measures || 1,
        settings.bgmVolume ?? 0.7
      );
    }
  }, [isReady, startAt, stage, settings.bgmVolume]);
  
  // 判定処理
  const checkJudgment = useCallback(() => {
    if (!isGameActive || inputBuffer.length === 0) return;
    
    const nowMs = performance.now() - (startAt || 0) - readyDuration;
    const resolved = resolveChord(inputBuffer);
    
    if (resolved) {
      const result = rhythmStore.judge(resolved.name, nowMs);
      
      if (result === 'success') {
        // 成功
        devLog.debug('🎯 リズムモード: 判定成功', { chord: resolved.name, timing: nowMs });
        setShowCorrectEffect(true);
        setTimeout(() => setShowCorrectEffect(false), 300);
        
        // 効果音
        FantasySoundManager.playCorrect();
        
        // 敵にダメージ
        enemyStore.attack(1);
        
        // スコア更新
        setScore(prev => prev + 100);
        setCorrectCount(prev => prev + 1);
        setTotalCount(prev => prev + 1);
        
        // 入力バッファクリア
        setInputBuffer([]);
        setCurrentChordTarget(null);
      }
    }
  }, [isGameActive, inputBuffer, startAt, readyDuration, rhythmStore, enemyStore]);
  
  // 失敗判定（判定ウィンドウを過ぎた場合）
  useEffect(() => {
    if (!isGameActive || !startAt) return;
    
    const checkMissed = () => {
      const nowMs = performance.now() - startAt - readyDuration;
      const questions = rhythmStore.questions;
      const pointer = rhythmStore.currentPointer;
      
      if (pointer < questions.length) {
        const currentQuestion = questions[pointer];
        
        // 判定ウィンドウを過ぎた
        if (nowMs > currentQuestion.targetMs + 200) {
          devLog.debug('❌ リズムモード: 判定失敗（タイムアウト）', { 
            chord: currentQuestion.chord,
            timing: nowMs - currentQuestion.targetMs 
          });
          
          // プレイヤーにダメージ
          const damage = Math.floor(Math.random() * (stage.max_damage - stage.min_damage + 1)) + stage.min_damage;
          setPlayerHp(prev => {
            const newHp = Math.max(0, prev - damage);
            if (newHp === 0) {
              setIsGameActive(false);
              onGameComplete('gameover', score, correctCount, totalCount);
            }
            return newHp;
          });
          
          // ダメージエフェクト
          setDamageShake(true);
          setTimeout(() => setDamageShake(false), 500);
          FantasySoundManager.playEnemyAttack();
          
          // 次の問題へ
          rhythmStore.nextQuestion();
          setTotalCount(prev => prev + 1);
          setInputBuffer([]);
          setCurrentChordTarget(null);
        }
      }
    };
    
    const timer = setInterval(checkMissed, 16); // 60FPS
    return () => clearInterval(timer);
  }, [isGameActive, startAt, readyDuration, rhythmStore, stage, score, correctCount, totalCount, onGameComplete]);
  
  // ノート入力ハンドラー
  const handleNoteInput = useCallback((note: number) => {
    if (!isGameActive) return;
    
    setInputBuffer(prev => {
      const newBuffer = [...prev, note];
      devLog.debug('🎹 入力バッファ更新:', newBuffer);
      return newBuffer;
    });
    
    // 即座に判定をチェック
    setTimeout(checkJudgment, 0);
  }, [isGameActive, checkJudgment]);
  
  // ノートリリースハンドラー
  const handleNoteRelease = useCallback(async (note: number) => {
    try {
      const { stopNote } = await import('@/utils/MidiController');
      stopNote(note);
      activeNotesRef.current.delete(note);
    } catch (error) {
      console.error('Failed to stop note:', error);
    }
  }, []);
  
  // MIDIコントローラー初期化
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number) => {
          handleNoteInput(note);
          activeNotesRef.current.add(note);
        },
        onNoteOff: (note: number) => {
          activeNotesRef.current.delete(note);
        },
      });
      
      controller.initialize();
      midiControllerRef.current = controller;
    }
    
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, [handleNoteInput]);
  
  // MIDIデバイス接続
  useEffect(() => {
    const connect = async () => {
      const deviceId = settings.selectedMidiDevice;
      if (midiControllerRef.current && deviceId) {
        await midiControllerRef.current.connectDevice(deviceId);
      }
    };
    connect();
  }, [settings.selectedMidiDevice]);
  
  // 敵全滅チェック
  useEffect(() => {
    if (enemyStore.hp <= 0 && isGameActive) {
      setIsGameActive(false);
      onGameComplete('clear', score, correctCount, totalCount);
    }
  }, [enemyStore.hp, isGameActive, score, correctCount, totalCount, onGameComplete]);
  
  // 自動開始
  useEffect(() => {
    if (autoStart) {
      initializeGame();
    }
  }, [autoStart, initializeGame]);
  
  // PIXIレンダラー準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    pixiRendererRef.current = renderer;
  }, []);
  
  // 現在のコード取得
  const getCurrentChord = useCallback(() => {
    const questions = rhythmStore.questions;
    const pointer = rhythmStore.currentPointer;
    
    if (pointer < questions.length) {
      return questions[pointer].chord;
    }
    return null;
  }, [rhythmStore.questions, rhythmStore.currentPointer]);
  
  // ハート表示
  const renderHearts = useCallback((hp: number, maxHp: number) => {
    const hearts = [];
    for (let i = 0; i < maxHp; i++) {
      hearts.push(
        <span key={i} className={`text-2xl ${i < hp ? 'text-red-500' : 'text-gray-600'}`}>
          {i < hp ? '❤️' : '🖤'}
        </span>
      );
    }
    return hearts;
  }, []);
  
  return (
    <div className={`min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex flex-col ${damageShake ? 'animate-shake' : ''}`}>
      {/* ヘッダー */}
      <div className="p-4 text-white">
        <div className="flex justify-between items-center">
          <button
            onClick={onBackToStageSelect}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
          >
            ← 戻る
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold">{stage.name}</h2>
            <p className="text-sm text-gray-300">
              リズム / {stage.chord_progression_data ? '進行' : 'ランダム'}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm">スコア: {score}</p>
            <p className="text-sm">正解: {correctCount}/{totalCount}</p>
          </div>
        </div>
      </div>
      
      {/* ゲームエリア */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* リズムレーン */}
        <div className="w-full max-w-4xl mb-8">
          <PIXIRhythmRenderer
            width={800}
            height={200}
            questions={rhythmStore.questions}
            currentPointer={rhythmStore.currentPointer}
            isReady={isReady}
          />
        </div>
        
        {/* HP表示 */}
        <div className="mb-4">
          <div className="text-white text-center mb-2">
            <p className="text-sm">プレイヤー HP</p>
            <div className="flex gap-1">
              {renderHearts(playerHp, stage.max_hp || 5)}
            </div>
          </div>
          
          <div className="text-white text-center">
            <p className="text-sm">敵 HP: {enemyStore.hp}/{stage.enemy_count * stage.enemy_hp}</p>
            <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(enemyStore.hp / (stage.enemy_count * stage.enemy_hp)) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* エフェクト表示 */}
        {showCorrectEffect && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl font-bold text-yellow-300 animate-bounce">
              PERFECT!
            </div>
          </div>
        )}
      </div>
      
      {/* ピアノ鍵盤 */}
      <div ref={gameAreaRef} className="h-32 bg-black">
        <PIXINotesRenderer
          width={window.innerWidth}
          height={128}
          onReady={handlePixiReady}
          onNotePress={handleNoteInput}
          onNoteRelease={handleNoteRelease}
          whiteKeyStartNote={60}
          visibleWhiteKeys={14}
          mobileVisibleWhiteKeys={14}
          showKeyHighlight={true}
          showNoteNames={settings.noteNameStyle !== 'off'}
          noteNameLang={noteNameLang}
          simpleNoteName={simpleNoteName}
          instrumentMode="piano"
          renderMode="standard"
          disableStandardNotes={true}
        />
      </div>
      
      {/* Ready表示 */}
      {isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <span className="font-dotgothic16 text-7xl text-white animate-pulse">
            Ready
          </span>
        </div>
      )}
      
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          <div>M {isCountIn ? '/' : currentMeasure} - B {currentBeat}</div>
          <div>現在のコード: {getCurrentChord()}</div>
          <div>入力: {inputBuffer.join(', ')}</div>
        </div>
      )}
    </div>
  );
};

export default RhythmGameScreen;