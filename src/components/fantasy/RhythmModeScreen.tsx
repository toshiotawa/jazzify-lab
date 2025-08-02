import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FantasyStage, ChordDefinition, JudgmentResult, RhythmGameState } from '@/types';
import { useRhythmGameEngine } from './RhythmGameEngine';
import { RhythmNotesRenderer } from './RhythmNotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import { bgmManager as BGMManager } from '@/utils/BGMManager';
import { Howl } from 'howler';
import { ArrowLeft } from 'lucide-react';
import { useTimeStore } from '@/stores/timeStore';
import { detectChords } from '@/utils/chord-detector';
import { toDisplayName } from '@/utils/display-note';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';

interface RhythmModeScreenProps {
  stage: FantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score?: number) => void;
  onBackToStageSelect: () => void;
}

export const RhythmModeScreen: React.FC<RhythmModeScreenProps> = ({
  stage,
  onGameComplete,
  onBackToStageSelect
}) => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [notesRenderer, setNotesRenderer] = useState<RhythmNotesRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const timeStore = useTimeStore();
  const bgmRef = useRef<Howl | null>(null);
  const { settings, updateSettings } = useGameStore();
  
  // ピアノ関連
  const [fantasyPixiInstance, setFantasyPixiInstance] = useState<FantasyPIXIInstance | null>(null);
  const pianoAreaRef = useRef<HTMLDivElement>(null);
  const [pianoAreaSize, setPianoAreaSize] = useState({ width: 1000, height: 200 });
  
  // MIDI関連
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const handleNoteInputRef = useRef<(note: number) => void>();
  
  // 入力ノート管理
  const inputNotesRef = useRef<number[]>([]);
  const resetTimerRef = useRef<NodeJS.Timeout>();

  const handleGameStateChange = useCallback((state: RhythmGameState) => {
    // ゲーム状態の更新を反映
  }, []);

  const handleJudgment = useCallback((result: JudgmentResult) => {
    if (!notesRenderer) return;
    
    // エフェクト表示
    if (result.type === 'hit' && result.rank) {
      notesRenderer.triggerHitEffect(100, 60, result.rank);
    } else if (result.type === 'miss') {
      notesRenderer.triggerMissEffect(100, 60);
    }
  }, [notesRenderer]);

  const handleGameComplete = useCallback((result: 'clear' | 'gameover', finalState: RhythmGameState) => {
    // BGM停止
    if (bgmRef.current) {
      bgmRef.current.stop();
    }
    
    // ゲーム完了処理
    onGameComplete(result, finalState.score);
  }, [onGameComplete]);

  const {
    gameState,
    processChordInput,
    initializeGame,
    getCurrentGameTime,
    update
  } = useRhythmGameEngine({
    stage,
    onStateChange: handleGameStateChange,
    onJudgment: handleJudgment,
    onGameComplete: handleGameComplete
  });

  // レンダラー初期化
  useEffect(() => {
    if (gameAreaRef.current && !notesRenderer) {
      const renderer = new RhythmNotesRenderer(
        gameAreaRef.current.clientWidth,
        120 // リズムモード用の高さ
      );
      
      gameAreaRef.current.appendChild(renderer.getCanvas());
      setNotesRenderer(renderer);
    }

    return () => {
      if (notesRenderer) {
        notesRenderer.destroy();
      }
    };
  }, []);
  
  // ピアノエリアのサイズ監視
  useEffect(() => {
    const update = () => {
      if (pianoAreaRef.current) {
        setPianoAreaSize({
          width: pianoAreaRef.current.clientWidth,
          height: pianoAreaRef.current.clientHeight
        });
      }
    };
    update(); // 初期化時
    const ro = new ResizeObserver(update);
    if (pianoAreaRef.current) {
      ro.observe(pianoAreaRef.current);
    }
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // BGM初期化
  useEffect(() => {
    if (stage.bgm_url || stage.bgmUrl) {
      bgmRef.current = BGMManager.loadBGM(stage.bgm_url || stage.bgmUrl || '');
    }
  }, [stage]);

  // ゲーム開始処理
  useEffect(() => {
    if (!isReady || !notesRenderer) return;

    // カウントダウン表示
    const countdownDuration = (stage.count_in_measures || stage.countInMeasures || 1) * 4 * (60 / (stage.bpm || 120)) * 1000;
    
    setTimeout(() => {
      setShowCountdown(false);
      
      // BGM再生開始
      if (bgmRef.current) {
        bgmRef.current.play();
      }
      
      // ゲーム初期化
      initializeGame();
    }, countdownDuration);
  }, [isReady, notesRenderer, stage, initializeGame]);

  // ゲームループ
  useEffect(() => {
    if (!gameState.isPlaying || !notesRenderer) return;
    
    const gameLoop = () => {
      update();
      
      // ノーツ描画更新
      notesRenderer.updateNotes(gameState.notes, gameState.currentTime);
      
      requestAnimationFrame(gameLoop);
    };
    
    const animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState.isPlaying, gameState.notes, gameState.currentTime, notesRenderer, update]);
  
  // MIDI初期化
  useEffect(() => {
    const initMidi = async () => {
      const midiController = new MIDIController({
        onStateChange: setIsMidiConnected,
        onNoteOn: (note: number) => {
          if (handleNoteInputRef.current) {
            handleNoteInputRef.current(note);
          }
        },
        onNoteOff: () => {}
      });
      
      midiControllerRef.current = midiController;
      await midiController.initMIDI();
    };
    
    initMidi();
    
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
      }
    };
  }, []);
  
  // MIDI接続監視
  useEffect(() => {
    const connect = async () => {
      const deviceId = settings.selectedMidiDevice;
      if (midiControllerRef.current && deviceId) {
        await midiControllerRef.current.connectDevice(deviceId);
      } else if (midiControllerRef.current && !deviceId) {
        midiControllerRef.current.disconnect();
      }
    };
    connect();
  }, [settings.selectedMidiDevice]);

  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isPlaying) return;
    
    // 既存のタイマーをクリア
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    
    // ノートを追加
    inputNotesRef.current = [...inputNotesRef.current, note];
    
    // PIXIに入力を反映
    if (fantasyPixiInstance) {
      fantasyPixiInstance.handleNoteInput(note);
    }
    
    // コードを検出
    const detectedChords = detectChords(inputNotesRef.current, stage.allowed_chords);
    
    if (detectedChords.length > 0) {
      // 最初に検出されたコードを使用
      const chordName = detectedChords[0];
      const chord: ChordDefinition = {
        id: chordName,
        displayName: toDisplayName(chordName),
        root: chordName.charAt(0),
        notes: inputNotesRef.current
      };
      
      processChordInput(chord);
      
      // 入力をリセット
      inputNotesRef.current = [];
      if (fantasyPixiInstance) {
        fantasyPixiInstance.resetNotes();
      }
    }
    
    // 1秒後に自動リセット
    resetTimerRef.current = setTimeout(() => {
      inputNotesRef.current = [];
      if (fantasyPixiInstance) {
        fantasyPixiInstance.resetNotes();
      }
    }, 1000);
  }, [gameState.isPlaying, processChordInput, stage.allowed_chords, fantasyPixiInstance]);
  
  // handleNoteInputが定義された後にRefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  // ピアノ準備完了ハンドラ
  const handlePianoReady = useCallback((instance: FantasyPIXIInstance | null) => {
    setFantasyPixiInstance(instance);
    if (instance) {
      setIsReady(true);
    }
  }, []);

  // カウントダウン表示
  const renderCountdown = () => {
    if (!showCountdown) return null;
    
    const { currentMeasure } = timeStore;
    const countInMeasures = stage.count_in_measures || stage.countInMeasures || 1;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
        <div className="text-white text-6xl font-bold">
          {countInMeasures - currentMeasure + 1}
        </div>
      </div>
    );
  };

  return (
    <div className="rhythm-mode-screen h-screen bg-gray-900 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToStageSelect}
            className="flex items-center gap-2 px-4 py-2 text-white hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </button>
          <h2 className="text-xl font-bold">
            Stage {stage.stage_number || stage.stageNumber} - {stage.name}
          </h2>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div>BPM: {stage.bpm || 120}</div>
          <div>小節: {stage.measure_count || stage.measureCount || 8}</div>
        </div>
      </div>
      
      {/* ノーツレーン */}
      <div className="relative">
        <div 
          ref={gameAreaRef}
          className="rhythm-notes-area bg-gray-800 border-2 border-gray-700"
          style={{ height: '120px' }}
        />
        {renderCountdown()}
      </div>
      
      {/* ゲーム情報 */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-gray-400 text-sm">HP</div>
              <div className="text-2xl font-bold">{gameState.playerHp}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Enemy HP</div>
              <div className="text-2xl font-bold">{gameState.enemyHp}</div>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-gray-400 text-sm">Score</div>
              <div className="text-2xl font-bold">{gameState.score}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Combo</div>
              <div className="text-2xl font-bold">{gameState.combo}</div>
            </div>
          </div>
        </div>
        
        {/* 判定結果表示 */}
        <div className="mt-4 flex justify-center gap-8 text-sm">
          <div className="text-green-400">Perfect: {gameState.hitCount}</div>
          <div className="text-red-400">Miss: {gameState.missCount}</div>
          <div className="text-yellow-400">Max Combo: {gameState.maxCombo}</div>
        </div>
      </div>
      
      {/* ピアノ鍵盤 */}
      <div ref={pianoAreaRef} className="flex-1 piano-area bg-black">
        <FantasyPIXIRenderer
          width={pianoAreaSize.width}
          height={pianoAreaSize.height}
          onReady={handlePianoReady}
          monsters={[]}
          playerHp={gameState.playerHp}
          maxPlayerHp={stage.max_hp || stage.maxHp}
          showSheetMusic={false}
          allowedChords={stage.allowed_chords}
          onNoteInput={handleNoteInput}
          useExternalMIDI={true}
          isGameStarted={gameState.isPlaying}
          settings={settings}
          noteNameLang={'en'}
          simpleNoteName={false}
        />
      </div>
      
      {/* ゲーム終了画面 */}
      {!gameState.isPlaying && gameState.score > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">
              {gameState.playerHp > 0 ? 'Stage Clear!' : 'Game Over'}
            </h2>
            <div className="space-y-2 mb-6">
              <div>Score: {gameState.score}</div>
              <div>Max Combo: {gameState.maxCombo}</div>
              <div>Accuracy: {Math.round((gameState.hitCount / (gameState.hitCount + gameState.missCount)) * 100)}%</div>
            </div>
            <button 
              onClick={onBackToStageSelect}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              ステージ選択へ戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
};