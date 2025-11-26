/**
 * マイク入力状態表示コンポーネント
 * iOSでの動作確認と手動開始機能を提供
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PitchDetectorService, PitchResult } from '@/utils/PitchDetectorService';
import { log } from '@/utils/logger';

interface MicrophoneStatusProps {
  deviceId?: string | null;
  onNoteDetected?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
  className?: string;
}

// MIDI番号をノート名に変換
const midiToNoteName = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${noteNames[noteIndex]}${octave}`;
};

export const MicrophoneStatus: React.FC<MicrophoneStatusProps> = ({
  deviceId,
  onNoteDetected,
  onNoteOff,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchResult | null>(null);
  const [lastNote, setLastNote] = useState<number | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isLegacyMode, setIsLegacyMode] = useState(false);
  const [pitchService, setPitchService] = useState<PitchDetectorService | null>(null);

  // マイク開始
  const startMicrophone = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      log.info('🎤 マイク開始ボタンが押されました');

      // 新しいインスタンスを作成
      const service = new PitchDetectorService({
        sampleRate: 48000,
        bufferSize: 2048,
        hopSize: 512,
        yinThreshold: 0.15,
        minConfidence: 0.6, // iOSでは緩めに
        noteOnThreshold: 2,
        noteOffThreshold: 4
      });

      // コールバックを設定
      service.setCallbacks({
        onPitch: (result: PitchResult) => {
          setCurrentPitch(result);
          setDetectionCount(prev => prev + 1);
        },
        onNoteOn: (note: number, velocity: number) => {
          setLastNote(note);
          log.info(`🎵 Note ON: ${midiToNoteName(note)} (MIDI ${note})`);
          onNoteDetected?.(note, velocity);
        },
        onNoteOff: (note: number) => {
          if (lastNote === note) {
            setLastNote(null);
          }
          log.info(`🎵 Note OFF: ${midiToNoteName(note)}`);
          onNoteOff?.(note);
        }
      });

      // 初期化
      await service.initialize();
      
      // レガシーモードかどうかを確認
      setIsLegacyMode(service.isUsingScriptProcessor());

      // 開始
      await service.start(deviceId || undefined);

      setPitchService(service);
      setIsActive(true);
      log.info('✅ マイク入力開始成功');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'マイクの開始に失敗しました';
      setError(errorMessage);
      log.error('❌ マイク開始エラー:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [deviceId, onNoteDetected, onNoteOff, lastNote]);

  // マイク停止
  const stopMicrophone = useCallback(() => {
    if (pitchService) {
      pitchService.stop();
      setIsActive(false);
      setCurrentPitch(null);
      setLastNote(null);
      log.info('🎤 マイク入力停止');
    }
  }, [pitchService]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (pitchService) {
        pitchService.destroy();
      }
    };
  }, [pitchService]);

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-200">🎤 マイク入力状態</h4>
        <div className={`px-2 py-1 rounded text-xs ${
          isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
        }`}>
          {isActive ? '動作中' : '停止'}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-900/50 text-red-200 text-xs p-2 rounded mb-3">
          ⚠️ {error}
        </div>
      )}

      {/* 開始/停止ボタン */}
      <div className="mb-3">
        {!isActive ? (
          <button
            onClick={startMicrophone}
            disabled={isInitializing}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                     text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isInitializing ? '初期化中...' : '🎤 マイクを開始'}
          </button>
        ) : (
          <button
            onClick={stopMicrophone}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 
                     text-white rounded-lg text-sm font-medium transition-colors"
          >
            ⏹️ マイクを停止
          </button>
        )}
      </div>

      {/* レガシーモード表示 */}
      {isLegacyMode && (
        <div className="bg-yellow-900/50 text-yellow-200 text-xs p-2 rounded mb-3">
          📱 iOS互換モード（ScriptProcessorNode）で動作中
        </div>
      )}

      {/* リアルタイム情報 */}
      {isActive && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>検出回数:</span>
            <span className="text-green-400">{detectionCount}</span>
          </div>

          {currentPitch && currentPitch.frequency > 0 && (
            <>
              <div className="flex justify-between text-gray-400">
                <span>周波数:</span>
                <span className="text-blue-400">{currentPitch.frequency.toFixed(1)} Hz</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>信頼度:</span>
                <span className={currentPitch.confidence > 0.8 ? 'text-green-400' : 'text-yellow-400'}>
                  {(currentPitch.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </>
          )}

          {lastNote !== null && (
            <div className="flex justify-between text-gray-400">
              <span>現在のノート:</span>
              <span className="text-purple-400 font-bold text-lg">
                {midiToNoteName(lastNote)} ({lastNote})
              </span>
            </div>
          )}

          {/* 音量メーター（簡易） */}
          {currentPitch && currentPitch.frequency > 0 && (
            <div className="mt-2">
              <div className="text-gray-400 mb-1">信頼度メーター:</div>
              <div className="h-2 bg-gray-700 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                  style={{ width: `${currentPitch.confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ヒント */}
      {!isActive && !error && (
        <div className="text-xs text-gray-500 mt-2">
          💡 iPhoneでは「マイクを開始」ボタンを押してください。
          音を出すと検出結果がここに表示されます。
        </div>
      )}
    </div>
  );
};

export default MicrophoneStatus;
