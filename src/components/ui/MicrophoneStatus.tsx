/**
 * マイク入力状態表示コンポーネント
 * グローバルシングルトンのPitchDetectorServiceを使用
 * モーダルを閉じてもマイク入力は継続する
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  getGlobalPitchDetector, 
  PitchDetectorStatus,
  NoteOnCallback,
  NoteOffCallback,
  StatusCallback
} from '@/utils/PitchDetectorService';
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
  const [status, setStatus] = useState<PitchDetectorStatus>({
    isInitialized: false,
    isRunning: false,
    isLegacyMode: false,
    error: null,
    detectionCount: 0,
    currentNote: null,
    lastPitch: null
  });
  const [isInitializing, setIsInitializing] = useState(false);

  // グローバルサービスからの初期ステータスを取得
  useEffect(() => {
    const service = getGlobalPitchDetector();
    setStatus(service.getStatus());
  }, []);

  // ステータス更新のコールバックを登録
  useEffect(() => {
    const service = getGlobalPitchDetector();
    
    const statusCallback: StatusCallback = (newStatus) => {
      setStatus(newStatus);
    };
    
    service.addCallbacks({ onStatus: statusCallback });
    
    return () => {
      service.removeCallbacks({ onStatus: statusCallback });
    };
  }, []);

  // ノート検出コールバックを登録
  useEffect(() => {
    if (!onNoteDetected && !onNoteOff) return;
    
    const service = getGlobalPitchDetector();
    
    const noteOnCallback: NoteOnCallback = (note, velocity) => {
      onNoteDetected?.(note, velocity);
    };
    
    const noteOffCallback: NoteOffCallback = (note) => {
      onNoteOff?.(note);
    };
    
    service.addCallbacks({ 
      onNoteOn: noteOnCallback,
      onNoteOff: noteOffCallback
    });
    
    return () => {
      service.removeCallbacks({ 
        onNoteOn: noteOnCallback,
        onNoteOff: noteOffCallback
      });
    };
  }, [onNoteDetected, onNoteOff]);

  // マイク開始
  const startMicrophone = useCallback(async () => {
    setIsInitializing(true);

    try {
      log.info('🎤 マイク開始ボタンが押されました');
      
      const service = getGlobalPitchDetector();
      
      // 初期化
      if (!service.isReady()) {
        await service.initialize();
      }
      
      // 開始
      await service.start(deviceId || undefined);
      
      log.info('✅ マイク入力開始成功');

    } catch (err) {
      log.error('❌ マイク開始エラー:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [deviceId]);

  // マイク停止
  const stopMicrophone = useCallback(() => {
    const service = getGlobalPitchDetector();
    service.stop();
    log.info('🎤 マイク入力停止');
  }, []);

  const isActive = status.isRunning;
  const error = status.error;
  const lastPitch = status.lastPitch;
  const currentNote = status.currentNote;
  const detectionCount = status.detectionCount;
  const isLegacyMode = status.isLegacyMode;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-200">🎤 マイク入力状態</h4>
        <div className={`px-2 py-1 rounded text-xs ${
          isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
        }`}>
          {isActive ? '🟢 動作中' : '⚪ 停止'}
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
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                     text-white rounded-lg text-base font-bold transition-colors
                     active:scale-95 touch-manipulation"
          >
            {isInitializing ? '⏳ 初期化中...' : '🎤 マイクを開始'}
          </button>
        ) : (
          <button
            onClick={stopMicrophone}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 
                     text-white rounded-lg text-base font-bold transition-colors
                     active:scale-95 touch-manipulation"
          >
            ⏹️ マイクを停止
          </button>
        )}
      </div>

      {/* レガシーモード表示 */}
      {isLegacyMode && status.isInitialized && (
        <div className="bg-yellow-900/50 text-yellow-200 text-xs p-2 rounded mb-3">
          📱 iOS互換モード（ScriptProcessorNode）で動作中
        </div>
      )}

      {/* リアルタイム情報 */}
      {isActive && (
        <div className="space-y-2 text-xs bg-gray-900/50 p-3 rounded">
          <div className="flex justify-between text-gray-400">
            <span>検出フレーム:</span>
            <span className="text-green-400 font-mono">{detectionCount}</span>
          </div>

          {lastPitch && lastPitch.frequency > 0 && (
            <>
              <div className="flex justify-between text-gray-400">
                <span>周波数:</span>
                <span className="text-blue-400 font-mono">{lastPitch.frequency.toFixed(1)} Hz</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>信頼度:</span>
                <span className={`font-mono ${lastPitch.confidence > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {(lastPitch.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </>
          )}

          {currentNote !== null && (
            <div className="flex justify-between items-center text-gray-400 pt-2 border-t border-gray-700">
              <span>現在のノート:</span>
              <span className="text-purple-400 font-bold text-xl">
                {midiToNoteName(currentNote)}
                <span className="text-sm text-gray-500 ml-1">({currentNote})</span>
              </span>
            </div>
          )}

          {/* 信頼度メーター */}
          {lastPitch && lastPitch.frequency > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-gray-500 mb-1">信頼度:</div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-100"
                  style={{ width: `${lastPitch.confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ヒント */}
      {!isActive && !error && (
        <div className="text-xs text-gray-500 mt-3 bg-gray-900/30 p-2 rounded">
          💡 <strong>iPhoneでは上の「マイクを開始」ボタンを押してください。</strong>
          <br />
          マイク開始後、モーダルを閉じても検出は継続します。
        </div>
      )}
      
      {isActive && (
        <div className="text-xs text-green-500 mt-3 bg-green-900/20 p-2 rounded">
          ✅ マイク動作中。このモーダルを閉じても検出は継続します。
        </div>
      )}
    </div>
  );
};

export default MicrophoneStatus;
