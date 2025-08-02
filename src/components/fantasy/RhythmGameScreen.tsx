import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useEnemyStore } from '@/stores/enemyStore';
import { usePlayerStore } from '@/stores/playerStore';
import { FantasyStage } from '@/types';
import PIXIRhythmRenderer from './PIXIRhythmRenderer';
import { bgmManager } from '@/utils/BGMManager';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName } from '@/utils/display-note';
import FantasySoundManager from '@/utils/FantasySoundManager';

interface RhythmGameScreenProps {
  stage: FantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number) => void;
  onBack: () => void;
}

const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({ stage, onGameComplete, onBack }) => {
  const timeStore = useTimeStore();
  const rhythmStore = useRhythmStore();
  const enemyStore = useEnemyStore();
  const playerStore = usePlayerStore();
  const [midiController, setMidiController] = useState<MIDIController | null>(null);
  const { settings } = useGameStore();
  const [gameAreaSize, setGameAreaSize] = useState({ width: window.innerWidth, height: 400 });
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [inputBuffer, setInputBuffer] = useState<number[]>([]);
  const activeNotesRef = useRef<Set<number>>(new Set());

  // ゲーム初期化
  useEffect(() => {
    // プレイヤーとエネミーの初期化
    playerStore.setHp(stage.max_hp || 5);
    playerStore.resetSp();
    enemyStore.setHp(stage.enemy_hp || 3);
    
    // ステージに基づいて出題生成
    rhythmStore.generate(stage);

    // BGM開始のための時間設定
    const bpm = stage.bpm || 120;
    const timeSignature = stage.time_signature || 4;
    const measureCount = stage.measure_count || 8;
    const countInMeasures = stage.count_in_measures || 1;
    
    timeStore.setStart(bpm, timeSignature, measureCount, countInMeasures);

    // スコアリセット
    setScore(0);
    setInputBuffer([]);

    return () => {
      bgmManager.stop();
      rhythmStore.reset();
    };
  }, [stage]);

  // MIDIコントローラー初期化と管理
  useEffect(() => {
    const controller = new MIDIController({
      onNoteOn: (note: number, velocity?: number) => {
        handleNoteInput(note);
        activeNotesRef.current.add(note);
      },
      onNoteOff: (note: number) => {
        activeNotesRef.current.delete(note);
      },
    });
    
    setMidiController(controller);
    controller.initialize();

    return () => {
      controller.destroy();
    };
  }, []);

  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    setInputBuffer(prev => {
      const newBuffer = [...prev, note];
      
      // コード判定
      const chordResult = resolveChord(newBuffer);
      if (chordResult) {
        const currentQuestion = rhythmStore.questions[rhythmStore.pointer];
        if (currentQuestion) {
          const now = performance.now();
          const timeStore = useTimeStore.getState();
          const elapsedMs = now - (timeStore.startAt || 0);
          
          // 判定ウィンドウ内かチェック
          if (Math.abs(elapsedMs - currentQuestion.targetMs) <= 200) {
            const displayName = toDisplayChordName(chordResult, {});
            if (displayName === currentQuestion.chord) {
              // 成功
              rhythmStore.judgeSuccess();
              FantasySoundManager.playAttackSound();
              setScore(prev => prev + 100);
              return []; // バッファクリア
            }
          }
        }
      }
      
      return newBuffer;
    });
  }, []);

  // MIDIデバイス接続
  useEffect(() => {
    if (midiController && settings.selectedMidiDevice) {
      midiController.connectDevice(settings.selectedMidiDevice);
    }
  }, [midiController, settings.selectedMidiDevice]);

  // BGM再生
  useEffect(() => {
    const isReady = timeStore.startAt !== null && performance.now() - timeStore.startAt < timeStore.readyDuration;
    if (!isReady && timeStore.startAt) {
      bgmManager.play(
        stage.bgm_url || stage.mp3_url || '/demo-1.mp3',
        stage.bpm || 120,
        stage.time_signature || 4,
        stage.measure_count || 8,
        stage.count_in_measures || 1,
        settings.bgmVolume ?? 0.7
      );
    }
  }, [timeStore.startAt, timeStore.readyDuration, stage, settings.bgmVolume]);

  // サイズ更新
  useEffect(() => {
    const update = () => {
      if (gameAreaRef.current) {
        setGameAreaSize({
          width: gameAreaRef.current.clientWidth,
          height: gameAreaRef.current.clientHeight
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // タイマー処理と判定
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      rhythmStore.tick(now);
      timeStore.tick();
    }, 16); // 60FPS

    return () => clearInterval(interval);
  }, []);

  // ゲーム完了チェック
  useEffect(() => {
    if (enemyStore.hp <= 0) {
      onGameComplete('clear', score);
    } else if (playerStore.hp <= 0) {
      onGameComplete('gameover', score);
    }
  }, [enemyStore.hp, playerStore.hp, score, onGameComplete]);

  // Ready表示
  const isReady = timeStore.startAt !== null && performance.now() - timeStore.startAt < timeStore.readyDuration;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* ヘッダー */}
      <div className="p-4 flex justify-between items-center bg-gray-800">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          戻る
        </button>
        <div className="flex gap-8">
          <p className="text-xl">スコア: {score}</p>
          <p className="text-xl">HP: {playerStore.hp} / {stage.max_hp || 5}</p>
        </div>
      </div>

      {/* ゲームエリア */}
      <div ref={gameAreaRef} className="flex-1 relative">
        <PIXIRhythmRenderer 
          width={gameAreaSize.width} 
          height={gameAreaSize.height}
          questions={rhythmStore.questions}
          pointer={rhythmStore.pointer}
          enemyHp={enemyStore.hp}
          maxEnemyHp={stage.enemy_hp || 3}
        />
        
        {/* Ready表示 */}
        {isReady && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <span className="font-dotgothic16 text-7xl text-white animate-pulse">
              Ready
            </span>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-4 bg-gray-800">
        <p className="text-center">
          {timeStore.isCountIn ? 'M / - B' : `M ${timeStore.currentMeasure} - B`} {timeStore.currentBeat}
        </p>
      </div>
    </div>
  );
};

export default RhythmGameScreen;