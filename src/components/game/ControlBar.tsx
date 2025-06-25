import React, { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaBackward, 
  FaForward, 
  FaRedo,
  FaTimes,
  FaHome
} from 'react-icons/fa';
import { 
  MdLoop,
  MdSkipPrevious,
  MdSkipNext,
  MdReplay
} from 'react-icons/md';

/**
 * ゲームコントロールバーコンポーネント
 * シークバー、再生コントロール、ループ、移調機能を提供
 */
const ControlBar: React.FC = () => {
  const gameState = useGameStore();
  const {
    mode,
    isPlaying,
    currentTime,
    currentSong,
    settings,
    abRepeat
  } = gameState;

  const isPracticeMode = mode === 'practice';
  const canInteract = isPracticeMode;
  const songDuration = currentSong?.duration || 0;

  // 時間フォーマット関数
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // シークバーハンドラー
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canInteract) return;
    const newTime = parseFloat(e.target.value);
    gameState.seek(newTime);
  }, [canInteract, gameState]);

  // 5秒スキップハンドラー
  const handleSkipBackward = useCallback(() => {
    gameState.skipBackward(5);
  }, [gameState]);

  const handleSkipForward = useCallback(() => {
    gameState.skipForward(5);
  }, [gameState]);

  // ABリピートハンドラー
  const handleSetAStart = useCallback(() => {
    gameState.setABRepeatStart(currentTime);
  }, [gameState, currentTime]);

  const handleSetBEnd = useCallback(() => {
    gameState.setABRepeatEnd(currentTime);
  }, [gameState, currentTime]);

  // ループON/OFF切り替え（改善版）
  const handleToggleLoop = useCallback(() => {
    if (abRepeat.startTime !== null && abRepeat.endTime !== null) {
      // A/B地点が設定済みの場合、ON/OFFを切り替え
      gameState.toggleABRepeat();
    } else {
      // A/B地点が未設定の場合、現在時刻を中心とした短いループを自動設定
      const autoStartTime = Math.max(0, currentTime - 5); // 5秒前
      const autoEndTime = Math.min(songDuration, currentTime + 10); // 10秒後
      gameState.setABRepeatStart(autoStartTime);
      gameState.setABRepeatEnd(autoEndTime);
      // 自動でループを有効化
      setTimeout(() => gameState.toggleABRepeat(), 50);
    }
  }, [gameState, abRepeat, currentTime, songDuration]);

  // 最初に戻るハンドラー（練習モード用）
  const handleRestart = useCallback(() => {
    gameState.seek(0);
    if (!isPlaying) {
      gameState.play();
    }
  }, [gameState, isPlaying]);

  // 本番モード用の再生/最初に戻るボタン（一時停止なし）
  const handlePlayOrRestart = useCallback(() => {
    if (currentTime > 0) {
      // 時間が進んでいるなら最初に戻って再生
      gameState.seek(0);
      gameState.play();
    } else {
      // 最初の状態なら再生
      gameState.play();
    }
  }, [gameState, currentTime]);

  // A地点クリア
  const handleClearA = useCallback(() => {
    gameState.clearABRepeatStart();
  }, [gameState]);

  // B地点クリア
  const handleClearB = useCallback(() => {
    gameState.clearABRepeatEnd();
  }, [gameState]);

  // 移調ハンドラー
  const handleTransposeDown = useCallback(() => {
    gameState.transpose(-1);
  }, [gameState]);

  const handleTransposeUp = useCallback(() => {
    gameState.transpose(1);
  }, [gameState]);

  return (
    <div className="control-bar bg-game-surface border-t border-gray-700 w-full sticky bottom-0 z-20">
      {/* シークバー */}
      <div className="seekbar-container p-3 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="range"
              min="0"
              max={songDuration}
              value={currentTime}
              step="0.1"
              onChange={handleSeek}
              disabled={!canInteract}
              className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer 
                ${canInteract ? 'hover:bg-gray-600' : 'opacity-50 cursor-not-allowed'}
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0`}
            />
            
            {/* ループマーカー */}
            {(abRepeat.startTime !== null || abRepeat.endTime !== null) && songDuration > 0 && (
              <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
                {/* A地点マーカー */}
                {abRepeat.startTime !== null && (
                  <div
                    className="absolute top-0 w-1 h-2 bg-green-400 shadow-lg"
                    style={{
                      left: `${(abRepeat.startTime / songDuration) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                    title={`A地点: ${formatTime(abRepeat.startTime)}`}
                  />
                )}
                
                {/* B地点マーカー */}
                {abRepeat.endTime !== null && (
                  <div
                    className="absolute top-0 w-1 h-2 bg-red-400 shadow-lg"
                    style={{
                      left: `${(abRepeat.endTime / songDuration) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                    title={`B地点: ${formatTime(abRepeat.endTime)}`}
                  />
                )}
                
                {/* ループ範囲の背景 */}
                {abRepeat.startTime !== null && abRepeat.endTime !== null && (
                  <div
                    className={`absolute top-0 h-2 ${abRepeat.enabled ? 'bg-green-400' : 'bg-gray-400'} opacity-30 rounded`}
                    style={{
                      left: `${(abRepeat.startTime / songDuration) * 100}%`,
                      width: `${((abRepeat.endTime - abRepeat.startTime) / songDuration) * 100}%`
                    }}
                  />
                )}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-300 min-w-[80px] text-right">
            {formatTime(currentTime)} / {formatTime(songDuration)}
          </div>
        </div>
      </div>

      {/* コントロールボタン - 1行レイアウト */}
      <div className="controls-container p-4 flex flex-col sm:flex-row">
        <div className="flex justify-center items-center space-x-3 flex-wrap overflow-x-auto">
          {isPracticeMode ? (
            // 練習モード: 5秒戻る、再生/一時停止、5秒進む、ループ、移調
            <>
              <button
                onClick={handleSkipBackward}
                className="control-btn control-btn-secondary"
                title="5秒戻る"
              >
                <FaBackward />
              </button>

              <button
                onClick={() => isPlaying ? gameState.pause() : gameState.play()}
                className="control-btn control-btn-primary"
                disabled={!currentSong}
                title={isPlaying ? '一時停止' : '再生'}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              <button
                onClick={handleSkipForward}
                className="control-btn control-btn-secondary"
                title="5秒進む"
              >
                <FaForward />
              </button>

              {/* ループコントロール */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={handleToggleLoop}
                  className={`control-btn control-btn-sm ${abRepeat.enabled ? 'control-btn-loop-active' : 'control-btn-loop'}`}
                  title="ABリピートON/OFF"
                >
                  <MdLoop />
                </button>
              </div>

              {/* A/B地点設定（コンパクト） */}
              <div className="flex items-center space-x-1 ml-2 text-xs">
                <button
                  onClick={handleSetAStart}
                  className="control-btn control-btn-xs control-btn-secondary"
                  title="A地点設定"
                >
                  A
                </button>
                <span className="text-gray-400 w-8 text-center">
                  {abRepeat.startTime !== null ? Math.floor(abRepeat.startTime / 60) + ':' + String(Math.floor(abRepeat.startTime % 60)).padStart(2, '0') : '--'}
                </span>
                {abRepeat.startTime !== null && (
                  <button
                    onClick={handleClearA}
                    className="control-btn control-btn-xs control-btn-danger"
                    title="A地点クリア"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
                
                <span className="text-gray-500">~</span>
                
                <button
                  onClick={handleSetBEnd}
                  className="control-btn control-btn-xs control-btn-secondary"
                  title="B地点設定"
                >
                  B
                </button>
                <span className="text-gray-400 w-8 text-center">
                  {abRepeat.endTime !== null ? Math.floor(abRepeat.endTime / 60) + ':' + String(Math.floor(abRepeat.endTime % 60)).padStart(2, '0') : '--'}
                </span>
                {abRepeat.endTime !== null && (
                  <button
                    onClick={handleClearB}
                    className="control-btn control-btn-xs control-btn-danger"
                    title="B地点クリア"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>

              {/* 移調コントロール */}
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={handleTransposeDown}
                  className="control-btn control-btn-xs control-btn-secondary"
                  title="半音下げる"
                >
                  ♭
                </button>
                <span className="text-gray-300 min-w-[30px] text-center text-sm">
                  {settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}
                </span>
                <button
                  onClick={handleTransposeUp}
                  className="control-btn control-btn-xs control-btn-secondary"
                  title="半音上げる"
                >
                  ♯
                </button>
              </div>
            </>
          ) : (
            // 本番モード: 再生/最初に戻るボタン（状況に応じて動作変化）
            <>
              <button
                onClick={handlePlayOrRestart}
                className="control-btn control-btn-primary"
                disabled={!currentSong}
                title={
                  currentTime > 0 
                    ? '最初に戻って再生' 
                    : '再生'
                }
              >
                {currentTime > 0 ? <MdReplay /> : <FaPlay />}
              </button>

              <button
                onClick={() => gameState.stop()}
                className="control-btn control-btn-secondary"
                disabled={!currentSong}
                title="停止"
              >
                <FaStop />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlBar; 