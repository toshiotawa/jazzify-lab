import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaBackward, 
  FaForward, 
  FaTimes,
  FaCompressAlt,
  FaExpandAlt,
  FaMusic
} from 'react-icons/fa';
import { 
  MdLoop,
  MdReplay
} from 'react-icons/md';


/**
 * ゲームコントロールバーコンポーネント
 * シークバー、再生コントロール、ループ、移調機能を提供
 */
const ControlBar: React.FC = () => {
  const {
    mode,
    isPlaying,
    currentTime,
    currentSong,
    settings,
    abRepeat,
    lessonContext,
    missionContext
  } = useGameSelector((state) => ({
    mode: state.mode,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    currentSong: state.currentSong,
    settings: state.settings,
    abRepeat: state.abRepeat,
    lessonContext: state.lessonContext,
    missionContext: state.missionContext
  }));

  const {
    play,
    pause: pauseAction,
    stop,
    seek,
    skipBackward,
    skipForward,
    setABRepeatStart,
    setABRepeatEnd,
    toggleABRepeat,
    clearABRepeatStart,
    clearABRepeatEnd,
    transpose,
    updateSettings,
    toggleSettings
  } = useGameActions();

  const isPracticeMode = mode === 'practice';
  const canInteract = isPracticeMode;
  const songDuration = currentSong?.duration || 0;
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingA, setIsDraggingA] = useState(false);
  const [isDraggingB, setIsDraggingB] = useState(false);

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
    seek(newTime);
  }, [canInteract, seek]);

  // 5秒スキップハンドラー
  const handleSkipBackward = useCallback(() => {
    skipBackward(5);
  }, [skipBackward]);

  const handleSkipForward = useCallback(() => {
    skipForward(5);
  }, [skipForward]);

  // ABリピートハンドラー
  const handleSetAStart = useCallback(() => {
    setABRepeatStart(currentTime);
  }, [setABRepeatStart, currentTime]);

  const handleSetBEnd = useCallback(() => {
    setABRepeatEnd(currentTime);
  }, [setABRepeatEnd, currentTime]);

  // ループON/OFF切り替え（改善版）
  const handleToggleLoop = useCallback(() => {
    if (abRepeat.startTime !== null && abRepeat.endTime !== null) {
      // A/B地点が設定済みの場合、ON/OFFを切り替え
      toggleABRepeat();
    } else {
      // A/B地点が未設定の場合、現在時刻を中心とした短いループを自動設定
      const autoStartTime = Math.max(0, currentTime - 5); // 5秒前
      const autoEndTime = Math.min(songDuration, currentTime + 10); // 10秒後
      setABRepeatStart(autoStartTime);
      setABRepeatEnd(autoEndTime);
      // 自動でループを有効化
      setTimeout(() => toggleABRepeat(), 50);
    }
  }, [toggleABRepeat, setABRepeatStart, setABRepeatEnd, abRepeat, currentTime, songDuration]);

  // 本番モード用の再生/最初に戻るボタン（一時停止なし）
  const handlePlayOrRestart = useCallback(() => {
    if (currentTime > 0) {
      // 時間が進んでいるなら最初に戻って再生
      seek(0);
      play();
    } else {
      // 最初の状態なら再生
      play();
    }
  }, [seek, currentTime, play]);

  // A地点クリア
  const handleClearA = useCallback(() => {
    clearABRepeatStart();
  }, [clearABRepeatStart]);

  // B地点クリア
  const handleClearB = useCallback(() => {
    clearABRepeatEnd();
  }, [clearABRepeatEnd]);

  // 移調ハンドラー
  const handleTransposeDown = useCallback(() => {
    transpose(-1);
  }, [transpose]);

  const handleTransposeUp = useCallback(() => {
    transpose(1);
  }, [transpose]);

  // ヘッダー表示/非表示の切り替え
  const toggleHeader = useCallback(() => {
    updateSettings({ showHeader: !settings.showHeader });
  }, [updateSettings, settings.showHeader]);


  // 楽譜表示の切り替え
  const toggleSheetMusic = useCallback(() => {
    updateSettings({ showSheetMusic: !settings.showSheetMusic });
  }, [updateSettings, settings.showSheetMusic]);

  // A/Bマーカーのドラッグ処理
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingA && !isDraggingB) {
        return;
      }
      if (!seekBarRef.current || songDuration <= 0) {
        return;
      }

      const rect = seekBarRef.current.getBoundingClientRect();
      if (rect.width === 0) {
        return;
      }
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = ratio * songDuration;

      if (isDraggingA) {
        if (abRepeat.endTime !== null && time >= abRepeat.endTime) {
          setABRepeatStart(Math.max(0, abRepeat.endTime - 0.1));
        } else {
          setABRepeatStart(time);
        }
      } else if (isDraggingB) {
        if (abRepeat.startTime !== null && time <= abRepeat.startTime) {
          setABRepeatEnd(Math.min(songDuration, abRepeat.startTime + 0.1));
        } else {
          setABRepeatEnd(time);
        }
      }
    };

    const handlePointerUp = () => {
      setIsDraggingA(false);
      setIsDraggingB(false);
    };

    if (isDraggingA || isDraggingB) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingA, isDraggingB, songDuration, abRepeat, setABRepeatStart, setABRepeatEnd]);

  return (
    <div className="w-full">
      {/* シークバー */}
      {settings.showSeekbar && (
        <div className="px-2 py-1 bg-gray-900" ref={seekBarRef}>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 h-6 flex items-center">
              {/* 背景のバー */}
              <div className="absolute w-full h-1 bg-gray-700 rounded-lg overflow-hidden">
                {/* ループ範囲の背景 */}
                {abRepeat.startTime !== null && abRepeat.endTime !== null && songDuration > 0 && (
                  <div
                    className={`absolute top-0 h-full transition-colors duration-200 ${
                      abRepeat.enabled ? 'bg-green-500 opacity-50 animate-pulse-slow' : 'bg-gray-400 opacity-30'
                    }`}
                    style={{
                      left: `${(abRepeat.startTime / songDuration) * 100}%`,
                      width: `${((abRepeat.endTime - abRepeat.startTime) / songDuration) * 100}%`
                    }}
                  />
                )}
              </div>

              <input
                type="range"
                min="0"
                max={songDuration}
                value={currentTime}
                step="0.1"
                onChange={handleSeek}
                disabled={!canInteract}
                className={`absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-10
                  ${canInteract ? '' : 'cursor-not-allowed'}
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:-mt-1.5
                  [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0`}
              />

              {(abRepeat.startTime !== null || abRepeat.endTime !== null) && songDuration > 0 && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                  {abRepeat.startTime !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-green-500 cursor-ew-resize hover:scale-110 transition-transform shadow-md rounded-sm pointer-events-auto flex items-center justify-center"
                      style={{
                        left: `${(abRepeat.startTime / songDuration) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        if (canInteract) {
                          setIsDraggingA(true);
                        }
                      }}
                      title={`A地点: ${formatTime(abRepeat.startTime)} (ドラッグで移動)`}
                    >
                      <span className="text-[8px] font-bold text-black">A</span>
                    </div>
                  )}

                  {abRepeat.endTime !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-red-500 cursor-ew-resize hover:scale-110 transition-transform shadow-md rounded-sm pointer-events-auto flex items-center justify-center"
                      style={{
                        left: `${(abRepeat.endTime / songDuration) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        if (canInteract) {
                          setIsDraggingB(true);
                        }
                      }}
                      title={`B地点: ${formatTime(abRepeat.endTime)} (ドラッグで移動)`}
                    >
                      <span className="text-[8px] font-bold text-black">B</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-300 min-w-[80px] text-right">
              {formatTime(currentTime)} / {formatTime(songDuration)}
            </div>
          </div>
        </div>
      )}

      {/* コントロールボタン */}
      <div className="px-3 py-1 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
        <div className="flex justify-center items-center space-x-3 overflow-x-auto whitespace-nowrap">
          {isPracticeMode ? (
            <>
              <button
                onClick={handleSkipBackward}
                className="control-btn control-btn-xxs control-btn-secondary control-btn-transport"
                title="5秒戻る"
              >
                <FaBackward />
              </button>

              <button
                onClick={() => (isPlaying ? pauseAction() : play())}
                className="control-btn control-btn-xxs control-btn-primary control-btn-transport"
                disabled={!currentSong}
                title={isPlaying ? '一時停止' : '再生'}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              <button
                onClick={handleSkipForward}
                className="control-btn control-btn-xxs control-btn-secondary control-btn-transport"
                title="5秒進む"
              >
                <FaForward />
              </button>

              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button
                  onClick={handleToggleLoop}
                  className={`control-btn control-btn-xxs ${abRepeat.enabled ? 'control-btn-loop-active' : 'control-btn-loop'}`}
                  title="ABリピートON/OFF"
                >
                  <MdLoop />
                </button>
              </div>

              <div className="flex items-center space-x-1 ml-2 text-xs flex-shrink-0">
                <button
                  onClick={handleSetAStart}
                  className={`control-btn control-btn-xxs ${abRepeat.startTime !== null ? 'control-btn-primary' : 'control-btn-secondary'}`}
                  title="A地点設定"
                >
                  A
                </button>
                <span className="text-gray-400 w-8 text-center">
                  {abRepeat.startTime !== null
                    ? `${Math.floor(abRepeat.startTime / 60)}:${String(Math.floor(abRepeat.startTime % 60)).padStart(2, '0')}`
                    : '--'}
                </span>
                {abRepeat.startTime !== null && (
                  <button
                    onClick={handleClearA}
                    className="control-btn control-btn-xxs control-btn-danger"
                    title="A地点クリア"
                  >
                    <FaTimes size={10} />
                  </button>
                )}

                <span className="text-gray-500">~</span>

                <button
                  onClick={handleSetBEnd}
                  className={`control-btn control-btn-xxs ${abRepeat.endTime !== null ? 'control-btn-primary' : 'control-btn-secondary'}`}
                  title="B地点設定"
                >
                  B
                </button>
                <span className="text-gray-400 w-8 text-center">
                  {abRepeat.endTime !== null
                    ? `${Math.floor(abRepeat.endTime / 60)}:${String(Math.floor(abRepeat.endTime % 60)).padStart(2, '0')}`
                    : '--'}
                </span>
                {abRepeat.endTime !== null && (
                  <button
                    onClick={handleClearB}
                    className="control-btn control-btn-xxs control-btn-danger"
                    title="B地点クリア"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>

              {!lessonContext && !missionContext && (
                <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                  <button
                    onClick={handleTransposeDown}
                    className="control-btn control-btn-xxs control-btn-secondary"
                    title="半音下げる"
                    disabled={settings.transpose <= -6}
                  >
                    ♭
                  </button>
                  <span className="text-gray-300 min-w-[30px] text-center text-sm">
                    {settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}
                  </span>
                  <button
                    onClick={handleTransposeUp}
                    className="control-btn control-btn-xxs control-btn-secondary"
                    title="半音上げる"
                    disabled={settings.transpose >= 6}
                  >
                    ♯
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handlePlayOrRestart}
                className="control-btn control-btn-xxs control-btn-primary control-btn-transport"
                disabled={!currentSong}
                title={currentTime > 0 ? '最初に戻って再生' : '再生'}
              >
                {currentTime > 0 ? <MdReplay /> : <FaPlay />}
              </button>

              <button
                onClick={() => stop({ resetPosition: false })}
                className="control-btn control-btn-xxs control-btn-secondary control-btn-transport"
                disabled={!currentSong}
                title="停止"
              >
                <FaStop />
              </button>

              {!lessonContext && !missionContext && (
                <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                  <button
                    onClick={handleTransposeDown}
                    className="control-btn control-btn-xxs control-btn-secondary"
                    title="半音下げる"
                    disabled={settings.transpose <= -6}
                  >
                    ♭
                  </button>
                  <span className="text-gray-300 min-w-[30px] text-center text-sm">
                    {settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}
                  </span>
                  <button
                    onClick={handleTransposeUp}
                    className="control-btn control-btn-xxs control-btn-secondary"
                    title="半音上げる"
                    disabled={settings.transpose >= 6}
                  >
                    ♯
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button
            onClick={toggleSettings}
            className="control-btn control-btn-xxs control-btn-secondary"
            title="設定"
          >
            ⚙️
          </button>

          <button
            onClick={toggleSheetMusic}
            className={`control-btn control-btn-xxs ${settings.showSheetMusic ? 'control-btn-primary' : 'control-btn-secondary'}`}
            title={settings.showSheetMusic ? '楽譜を隠す' : '楽譜を表示'}
          >
            <FaMusic />
          </button>

          <button
            onClick={toggleHeader}
            className="control-btn control-btn-xxs control-btn-secondary"
            title={settings.showHeader ? 'ヘッダーを隠す' : 'ヘッダーを表示'}
          >
            {settings.showHeader ? <FaCompressAlt /> : <FaExpandAlt />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
