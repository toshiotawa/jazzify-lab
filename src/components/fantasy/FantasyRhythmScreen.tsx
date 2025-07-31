/**
 * ファンタジーリズムモード画面
 * リズムゲームのUI表示を担当
 */

import React, { useEffect, useState, useRef } from 'react';
import { useFantasyRhythmEngine } from './FantasyRhythmEngine';
// import FantasyPIXIRenderer from './FantasyPIXIRenderer'; // 未使用のため削除
import { FantasyStage } from './FantasyGameEngine';
import MidiController from '@/utils/MidiController';
import { bgmManager } from '@/utils/BGMManager';
import { useTimeStore } from '@/stores/timeStore';
import { devLog } from '@/utils/logger';
import { type DisplayOpts } from '@/utils/display-note';

interface FantasyRhythmScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correct: number, total: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: 'en' | 'solfege';
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

const FantasyRhythmScreen: React.FC<FantasyRhythmScreenProps> = ({
  stage,
  autoStart = false,
  onGameComplete,
  onBackToStageSelect,
  noteNameLang = 'en',
  simpleNoteName = false
}) => {
  const [isReady, setIsReady] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.7);
  const timeStore = useTimeStore();
  const midiControllerRef = useRef<MidiController | null>(null);
  const animationFrameRef = useRef<number>();

  // ディスプレイオプション
  const displayOpts: DisplayOpts = {
    lang: noteNameLang,
    simple: simpleNoteName
  };

  // リズムエンジンの初期化
  const {
    gameState,
    handleInput,
    startGame,
    stopGame
  } = useFantasyRhythmEngine(
    stage,
    displayOpts,
    // onChordCorrect
    (chord, damage, _monsterId) => {
      devLog.debug(`🎯 リズムモード正解: ${chord.displayName}, ダメージ: ${damage}`);
    },
    // onChordIncorrect
    (expectedChord) => {
      devLog.debug(`❌ リズムモード不正解: 期待 ${expectedChord.displayName}`);
    },
    // onEnemyAttack
    (monsterId) => {
      devLog.debug(`⚔️ モンスター攻撃: ${monsterId}`);
    },
    // onGameComplete
    (result) => {
      stopGame();
      onGameComplete(result, gameState.score, gameState.correctCount, gameState.totalCount);
    }
  );

  // BGM再生
  useEffect(() => {
    if (stage.bgmUrl && isReady) {
      bgmManager.setRhythmMode(true);
      bgmManager.play(
        stage.bgmUrl,
        stage.bpm,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 0,
        bgmVolume
      );
    }

    return () => {
      bgmManager.stop();
    };
  }, [stage, isReady, bgmVolume]);

  // タイムストアの初期化
  useEffect(() => {
    if (isReady) {
      timeStore.setRhythmMode(true);
      timeStore.setStart(
        stage.bpm,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 0
      );
      startGame();
    }

    return () => {
      timeStore.reset();
    };
  }, [isReady, stage, timeStore, startGame]);

  // アニメーションループ
  useEffect(() => {
    if (!isReady) return;

    const animate = () => {
      timeStore.tick();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady, timeStore]);

  // MIDI初期化
  useEffect(() => {
    const initMidi = async () => {
      try {
        midiControllerRef.current = new MidiController({
          onNoteOn: (note) => {
            if (gameState.isActive) {
              handleInput(note);
            }
          },
          onNoteOff: () => {
            // リズムモードではNoteOffは使用しない
          }
        });
        await midiControllerRef.current.initialize();
      } catch (error) {
        devLog.debug('MIDI初期化エラー:', error);
      }
    };

    initMidi();

    return () => {
      midiControllerRef.current?.disconnect();
    };
  }, [gameState.isActive, handleInput]);

  // 自動開始
  useEffect(() => {
    if (autoStart && !isReady) {
      setTimeout(() => setIsReady(true), 100);
    }
  }, [autoStart, isReady]);

  // 現在のタイミング情報を取得
  const timingInfo = timeStore.getCurrentTimingInfo();
  const displayMeasure = timingInfo.isInCountIn ? '/' : String(timeStore.currentMeasure);
  const displayBeat = timeStore.currentBeat;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToStageSelect}
              className="px-4 py-2 bg-gray-800 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all"
            >
              ← 戻る
            </button>
            <div className="text-xl font-bold">
              {stage.stageNumber} {stage.name}
            </div>
          </div>
          
          {/* タイミング表示 */}
          <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
            <div className="text-lg font-mono">
              M {displayMeasure} - B {displayBeat}
            </div>
          </div>
        </div>

        {/* プレイヤーステータス */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>HP:</span>
            <div className="flex gap-1">
              {Array.from({ length: stage.maxHp }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded ${
                    i < gameState.playerHp ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="text-xl">
            スコア: {gameState.score}
          </div>
        </div>
      </div>

      {/* ゲーム画面 */}
      <div className="relative h-screen">
        {/* モンスター表示エリア */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-8 max-w-4xl w-full px-8">
            {['A', 'B', 'C', 'D'].map((position) => {
              const monster = gameState.activeMonsters.find(m => m.position === position);
              return (
                <div key={position} className="relative">
                  <div className="bg-black bg-opacity-30 rounded-lg p-4 h-48 flex flex-col items-center justify-center">
                    {monster ? (
                      <>
                        {/* モンスターアイコン */}
                        <div className="text-4xl mb-2">👾</div>
                        
                        {/* コード名 */}
                        <div className="text-xl font-bold mb-2">
                          {monster.chordDefinition.displayName}
                        </div>
                        
                        {/* タイミングゲージ */}
                        <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-100"
                            style={{ width: `${monster.gaugeProgress}%` }}
                          />
                          {/* 80%マーカー */}
                          <div className="absolute top-0 bottom-0 w-1 bg-red-500" style={{ left: '80%' }} />
                        </div>
                        
                        {/* HP */}
                        <div className="mt-2 text-sm">
                          HP: {monster.currentHp}/{monster.maxHp}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 text-center">
                        <div className="text-2xl mb-2">-</div>
                        <div className="text-sm">{position}列</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 開始ボタン */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <button
              onClick={() => setIsReady(true)}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-2xl font-bold transition-all transform hover:scale-105"
            >
              ゲーム開始
            </button>
          </div>
        )}
      </div>

      {/* BGM音量調整 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-lg p-2">
        <label className="flex items-center gap-2 text-sm">
          <span>BGM:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={bgmVolume * 100}
            onChange={(e) => {
              const volume = parseInt(e.target.value) / 100;
              setBgmVolume(volume);
              bgmManager.setVolume(volume);
            }}
            className="w-24"
          />
        </label>
      </div>

      {/* MIDI接続状態 (デバッグ用) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-xs opacity-50">
          MIDI: {midiControllerRef.current ? 'Connected' : 'Disconnected'}
        </div>
      )}
    </div>
  );
};

export default FantasyRhythmScreen;