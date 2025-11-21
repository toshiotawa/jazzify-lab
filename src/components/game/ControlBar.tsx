import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  
  // ドラッグ操作用のRefとState
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

  // ループON/OFF切り替え
  const handleToggleLoop = useCallback(() => {
    if (abRepeat.startTime !== null && abRepeat.endTime !== null) {
      toggleABRepeat();
    } else {
      const autoStartTime = Math.max(0, currentTime - 5);
      const autoEndTime = Math.min(songDuration, currentTime + 10);
      setABRepeatStart(autoStartTime);
      setABRepeatEnd(autoEndTime);
      setTimeout(() => toggleABRepeat(), 50);
    }
  }, [toggleABRepeat, setABRepeatStart, setABRepeatEnd, abRepeat, currentTime, songDuration]);

  // 本番モード用の再生/最初に戻るボタン
  const handlePlayOrRestart = useCallback(() => {
    if (currentTime > 0) {
      seek(0);
      play();
    } else {
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

  // UI切り替え
  const toggleHeader = useCallback(() => {
    updateSettings({ showHeader: !settings.showHeader });
  }, [updateSettings, settings.showHeader]);

  const toggleSheetMusic = useCallback(() => {
    updateSettings({ showSheetMusic: !settings.showSheetMusic });
  }, [updateSettings, settings.showSheetMusic]);

  // --- ドラッグ処理 ---
  const calculateTimeFromPageX = useCallback((pageX: number) => {
    if (!seekBarRef.current || songDuration <= 0) return 0;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(pageX - rect.left, rect.width));
    return (x / rect.width) * songDuration;
  }, [songDuration]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingA) {
        const newTime = calculateTimeFromPageX(e.pageX);
        // B地点を超えないように制限
        if (abRepeat.endTime !== null && newTime >= abRepeat.endTime) return;
        setABRepeatStart(newTime);
      } else if (isDraggingB) {
        const newTime = calculateTimeFromPageX(e.pageX);
        // A地点を下回らないように制限
        if (abRepeat.startTime !== null && newTime <= abRepeat.startTime) return;
        setABRepeatEnd(newTime);
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
  }, [isDraggingA, isDraggingB, calculateTimeFromPageX, abRepeat.startTime, abRepeat.endTime, setABRepeatStart, setABRepeatEnd]);


  return (
    <div className="w-full">
      {/* シークバー - showSeekbarフラグで制御 */}
      {settings.showSeekbar && (
        <div className="px-2 py-1 bg-gray-900 select-none">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 h-6 flex items-center" ref={seekBarRef}>
              {/* 背景レール */}
              <div className="absolute w-full h-1 bg-gray-700 rounded-lg overflow-hidden">
                 {/* ループ範囲の背景 (ステージモードでは非表示) */}
                {isPracticeMode && abRepeat.startTime !== null && abRepeat.endTime !== null && (
                  <div
                    className={`absolute top-0 h-full ${abRepeat.enabled ? 'bg-green-500 opacity-60' : 'bg-gray-500 opacity-30'}`}
                    style={{
                      left: `${(abRepeat.startTime / songDuration) * 100}%`,
                      width: `${((abRepeat.endTime - abRepeat.startTime) / songDuration) * 100}%`
                    }}
                  />
                )}
              </div>

              {/* input range (シーク用) */}
              <input
                type="range"
                min="0"
                max={songDuration}
                value={currentTime}
                step="0.01"
                onChange={handleSeek}
                disabled={!canInteract}
                className={`absolute w-full h-1 bg-transparent appearance-none cursor-pointer z-10
                  ${canInteract ? '' : 'opacity-50 cursor-not-allowed'}
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:mt-[-6px]
                  [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0`}
              />
              
              {/* ループマーカー (ドラッグ可能) - ステージモードでは非表示 */}
              {isPracticeMode && (abRepeat.startTime !== null || abRepeat.endTime !== null) && songDuration > 0 && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                  {/* A地点マーカー */}
                  {abRepeat.startTime !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-8 cursor-ew-resize pointer-events-auto group flex flex-col items-center justify-center"
                      style={{
                        left: `${(abRepeat.startTime / songDuration) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setIsDraggingA(true);
                      }}
                      title={`A地点: ${formatTime(abRepeat.startTime)}`}
                    >
                      {/* マーカーの見た目 */}
                      <div className="w-0.5 h-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]"></div>
                      <div className="absolute top-0 w-3 h-3 bg-green-400 rounded-full -mt-1"></div>
                      <div className="absolute bottom-0 w-3 h-3 bg-green-400 rounded-full -mb-1 text-[8px] text-black font-bold flex items-center justify-center">A</div>
                    </div>
                  )}
                  
                  {/* B地点マーカー */}
                  {abRepeat.endTime !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-8 cursor-ew-resize pointer-events-auto group flex flex-col items-center justify-center"
                      style={{
                        left: `${(abRepeat.endTime / songDuration) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setIsDraggingB(true);
                      }}
                      title={`B地点: ${formatTime(abRepeat.endTime)}`}
                    >
                      <div className="w-0.5 h-full bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.8)]"></div>
                      <div className="absolute top-0 w-3 h-3 bg-red-400 rounded-full -mt-1"></div>
                      <div className="absolute bottom-0 w-3 h-3 bg-red-400 rounded-full -mb-1 text-[8px] text-black font-bold flex items-center justify-center">B</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-300 min-w-[80px] text-right font-mono">
              {formatTime(currentTime)} / {formatTime(songDuration)}
            </div>
          </div>
        </div>
      )}

      {/* コントロールボタン */}
      <div className="px-3 py-1 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
        <div className="flex justify-center items-center space-x-3 overflow-x-auto whitespace-nowrap">
          {isPracticeMode ? (
            // 練習モード
            <>
              <button onClick={handleSkipBackward} className="control-btn control-btn-xxs control-btn-secondary control-btn-transport" title="5秒戻る"><FaBackward /></button>
              <button onClick={() => isPlaying ? pauseAction() : play()} className="control-btn control-btn-xxs control-btn-primary control-btn-transport" disabled={!currentSong} title={isPlaying ? '一時停止' : '再生'}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={handleSkipForward} className="control-btn control-btn-xxs control-btn-secondary control-btn-transport" title="5秒進む"><FaForward /></button>

              {/* ループコントロール */}
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button
                  onClick={handleToggleLoop}
                  className={`control-btn control-btn-xxs ${abRepeat.enabled ? 'control-btn-loop-active' : 'control-btn-loop'}`}
                  title="ABリピートON/OFF"
                >
                  <MdLoop />
                </button>
              </div>

              {/* A/B地点設定 */}
              <div className="flex items-center space-x-1 ml-2 text-xs flex-shrink-0">
                <button onClick={handleSetAStart} className={`control-btn control-btn-xxs ${abRepeat.startTime !== null ? 'control-btn-primary' : 'control-btn-secondary'}`} title="A地点設定">A</button>
                <span className="text-gray-400 w-8 text-center font-mono">
                  {abRepeat.startTime !== null ? formatTime(abRepeat.startTime) : '--:--'}
                </span>
                {abRepeat.startTime !== null && (
                  <button onClick={handleClearA} className="control-btn control-btn-xxs control-btn-danger" title="A地点クリア"><FaTimes size={10} /></button>
                )}
                
                <span className="text-gray-500">~</span>
                
                <button onClick={handleSetBEnd} className={`control-btn control-btn-xxs ${abRepeat.endTime !== null ? 'control-btn-primary' : 'control-btn-secondary'}`} title="B地点設定">B</button>
                <span className="text-gray-400 w-8 text-center font-mono">
                  {abRepeat.endTime !== null ? formatTime(abRepeat.endTime) : '--:--'}
                </span>
                {abRepeat.endTime !== null && (
                  <button onClick={handleClearB} className="control-btn control-btn-xxs control-btn-danger" title="B地点クリア"><FaTimes size={10} /></button>
                )}
              </div>

              {/* 移調 - 練習モードのみ */}
              {!lessonContext && !missionContext && (
                <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                  <button onClick={handleTransposeDown} className="control-btn control-btn-xxs control-btn-secondary" title="半音下げる" disabled={settings.transpose <= -6}>♭</button>
                  <span className="text-gray-300 min-w-[30px] text-center text-sm">{settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}</span>
                  <button onClick={handleTransposeUp} className="control-btn control-btn-xxs control-btn-secondary" title="半音上げる" disabled={settings.transpose >= 6}>♯</button>
                </div>
              )}
            </>
          ) : (
            // 本番モード（ABループ関連は非表示）
            <>
              <button onClick={handlePlayOrRestart} className="control-btn control-btn-xxs control-btn-primary control-btn-transport" disabled={!currentSong} title={currentTime > 0 ? '最初に戻って再生' : '再生'}>
                {currentTime > 0 ? <MdReplay /> : <FaPlay />}
              </button>
              <button onClick={() => stop({ resetPosition: false })} className="control-btn control-btn-xxs control-btn-secondary control-btn-transport" disabled={!currentSong} title="停止"><FaStop /></button>

              {/* 移調（本番モードでも課題条件がなければ表示） */}
              {!lessonContext && !missionContext && (
                <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                  <button onClick={handleTransposeDown} className="control-btn control-btn-xxs control-btn-secondary" title="半音下げる" disabled={settings.transpose <= -6}>♭</button>
                  <span className="text-gray-300 min-w-[30px] text-center text-sm">{settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}</span>
                  <button onClick={handleTransposeUp} className="control-btn control-btn-xxs control-btn-secondary" title="半音上げる" disabled={settings.transpose >= 6}>♯</button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* 右側コントロール */}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button onClick={toggleSettings} className="control-btn control-btn-xxs control-btn-secondary" title="設定">⚙️</button>
          <button onClick={toggleSheetMusic} className={`control-btn control-btn-xxs ${settings.showSheetMusic ? 'control-btn-primary' : 'control-btn-secondary'}`} title={settings.showSheetMusic ? '楽譜を隠す' : '楽譜を表示'}><FaMusic /></button>
          <button onClick={toggleHeader} className="control-btn control-btn-xxs control-btn-secondary" title={settings.showHeader ? 'ヘッダーを隠す' : 'ヘッダーを表示'}>
            {settings.showHeader ? <FaCompressAlt /> : <FaExpandAlt />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
