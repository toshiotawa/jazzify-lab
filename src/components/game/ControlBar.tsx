import React, { useCallback, useRef, useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { 
  FaPlay, FaPause, FaStop, FaBackward, FaForward, FaTimes,
  FaCompressAlt, FaExpandAlt, FaMusic
} from 'react-icons/fa';
import { MdLoop, MdReplay } from 'react-icons/md';

const ControlBar: React.FC = () => {
  const {
    mode, isPlaying, currentTime, currentSong, settings, abRepeat, lessonContext, missionContext
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
    play, pause: pauseAction, stop, seek, skipBackward, skipForward,
    setABRepeatStart, setABRepeatEnd, toggleABRepeat,
    clearABRepeatStart, clearABRepeatEnd, transpose, updateSettings, toggleSettings
  } = useGameActions();

  const isPracticeMode = mode === 'practice';
  const canInteract = isPracticeMode;
  const songDuration = currentSong?.duration || 0;
  const seekbarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'seek' | 'A' | 'B' | null>(null);

  // 時間フォーマット関数
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // マウス/タッチイベントハンドラー共通化
  const handleSeekInteraction = useCallback((clientX: number, type: 'seek' | 'A' | 'B') => {
    if (!seekbarRef.current || songDuration <= 0) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = ratio * songDuration;

    if (type === 'seek') seek(time);
    else if (type === 'A') setABRepeatStart(time);
    else if (type === 'B') setABRepeatEnd(time);
  }, [songDuration, seek, setABRepeatStart, setABRepeatEnd]);

  // Pointer Events (Mouse/Touch)
  const handlePointerDown = (e: React.PointerEvent, type: 'seek' | 'A' | 'B') => {
    if (!canInteract && type !== 'seek') return;
    if (mode === 'performance' && type !== 'seek') return;

    e.preventDefault();
    setIsDragging(type);
    e.currentTarget.setPointerCapture(e.pointerId);
    
    if (type === 'seek') handleSeekInteraction(e.clientX, type);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleSeekInteraction(e.clientX, isDragging);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(null);
    }
  };

  const handleSkipBackward = useCallback(() => skipBackward(5), [skipBackward]);
  const handleSkipForward = useCallback(() => skipForward(5), [skipForward]);

  const handleToggleLoop = useCallback(() => {
    if (mode === 'performance') return;
    
    if (abRepeat.startTime !== null && abRepeat.endTime !== null) {
      toggleABRepeat();
    } else {
      const autoStartTime = Math.max(0, currentTime - 5);
      const autoEndTime = Math.min(songDuration, currentTime + 10);
      setABRepeatStart(autoStartTime);
      setABRepeatEnd(autoEndTime);
      setTimeout(() => toggleABRepeat(), 50);
    }
  }, [toggleABRepeat, setABRepeatStart, setABRepeatEnd, abRepeat, currentTime, songDuration, mode]);

  const handlePlayOrRestart = useCallback(() => {
    if (currentTime > 0) {
      seek(0);
      play();
    } else {
      play();
    }
  }, [seek, currentTime, play]);

  const handleTransposeDown = useCallback(() => transpose(-1), [transpose]);
  const handleTransposeUp = useCallback(() => transpose(1), [transpose]);
  const toggleHeader = useCallback(() => updateSettings({ showHeader: !settings.showHeader }), [updateSettings, settings]);
  const toggleSheetMusic = useCallback(() => updateSettings({ showSheetMusic: !settings.showSheetMusic }), [updateSettings, settings]);

  return (
    <div className="w-full select-none">
      {/* シークバーエリア */}
      {settings.showSeekbar && (
        <div className="px-2 py-2 bg-gray-900" 
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             onPointerLeave={handlePointerUp}
        >
          <div className="flex items-center space-x-3">
            {/* カスタムシークバー */}
            <div 
              ref={seekbarRef}
              className="relative flex-1 h-6 cursor-pointer group flex items-center"
              onPointerDown={(e) => handlePointerDown(e, 'seek')}
            >
              {/* 背景レール */}
              <div className="absolute w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                {/* 再生進捗 */}
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(currentTime / songDuration) * 100}%` }} 
                />
              </div>

              {/* ループ範囲の塗りつぶし (ON時は目立たせる) */}
              {abRepeat.startTime !== null && abRepeat.endTime !== null && (
                <div
                  className={`absolute h-1.5 rounded pointer-events-none transition-colors ${
                    abRepeat.enabled 
                      ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]' 
                      : 'bg-gray-500/50'
                  }`}
                  style={{
                    left: `${(abRepeat.startTime / songDuration) * 100}%`,
                    width: `${((abRepeat.endTime - abRepeat.startTime) / songDuration) * 100}%`
                  }}
                />
              )}

              {/* A地点マーカー (ドラッグ可能) */}
              {isPracticeMode && abRepeat.startTime !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-6 cursor-ew-resize z-10 flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ left: `${(abRepeat.startTime / songDuration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'A'); }}
                  title={`A地点: ${formatTime(abRepeat.startTime)}`}
                >
                  <div className="w-1 h-4 bg-green-400 rounded shadow-md" />
                  <div className="absolute -top-3 text-[9px] text-green-400 font-bold">A</div>
                </div>
              )}

              {/* B地点マーカー (ドラッグ可能) */}
              {isPracticeMode && abRepeat.endTime !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-6 cursor-ew-resize z-10 flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ left: `${(abRepeat.endTime / songDuration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, 'B'); }}
                  title={`B地点: ${formatTime(abRepeat.endTime)}`}
                >
                  <div className="w-1 h-4 bg-red-400 rounded shadow-md" />
                  <div className="absolute -bottom-3 text-[9px] text-red-400 font-bold">B</div>
                </div>
              )}

              {/* プレイヘッドつまみ */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none"
                style={{ left: `${(currentTime / songDuration) * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            
            <div className="text-xs text-gray-400 min-w-[70px] text-right font-mono">
              {formatTime(currentTime)} / {formatTime(songDuration)}
            </div>
          </div>
        </div>
      )}

      {/* コントロールボタン群 */}
      <div className="px-3 py-1 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-3 overflow-x-auto">
          {isPracticeMode ? (
            <>
              <button onClick={handleSkipBackward} className="control-btn control-btn-xxs control-btn-secondary"><FaBackward /></button>
              <button onClick={() => isPlaying ? pauseAction() : play()} className="control-btn control-btn-xxs control-btn-primary" disabled={!currentSong}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={handleSkipForward} className="control-btn control-btn-xxs control-btn-secondary"><FaForward /></button>

              {/* ループコントロール (練習モードのみ) */}
              <div className="flex items-center space-x-2 ml-4 border-l border-gray-700 pl-4">
                <button
                  onClick={handleToggleLoop}
                  className={`control-btn control-btn-xxs ${abRepeat.enabled ? 'control-btn-loop-active bg-green-600 text-white' : 'control-btn-loop'}`}
                  title="ABリピートON/OFF"
                >
                  <MdLoop />
                </button>
                
                {/* A/B地点設定ボタン */}
                <div className="flex items-center space-x-1 text-xs">
                  <button onClick={() => setABRepeatStart(currentTime)} className={`px-1.5 py-0.5 rounded ${abRepeat.startTime !== null ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'}`}>A</button>
                  {abRepeat.startTime !== null && <button onClick={clearABRepeatStart} className="text-gray-400 hover:text-red-400"><FaTimes size={10}/></button>}
                  <span className="text-gray-600">|</span>
                  <button onClick={() => setABRepeatEnd(currentTime)} className={`px-1.5 py-0.5 rounded ${abRepeat.endTime !== null ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300'}`}>B</button>
                  {abRepeat.endTime !== null && <button onClick={clearABRepeatEnd} className="text-gray-400 hover:text-red-400"><FaTimes size={10}/></button>}
                </div>
              </div>

              {/* 移調 (練習モードのみ) */}
              {!lessonContext && !missionContext && (
                <div className="flex items-center space-x-1 ml-4 border-l border-gray-700 pl-4">
                  <button onClick={handleTransposeDown} className="control-btn control-btn-xxs control-btn-secondary">♭</button>
                  <span className="text-gray-300 w-6 text-center text-xs">{settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}</span>
                  <button onClick={handleTransposeUp} className="control-btn control-btn-xxs control-btn-secondary">♯</button>
                </div>
              )}
            </>
          ) : (
            // 本番モード (ループ機能なし)
            <>
              <button onClick={handlePlayOrRestart} className="control-btn control-btn-xxs control-btn-primary">
                {currentTime > 0 ? <MdReplay /> : <FaPlay />}
              </button>
              <button onClick={() => stop({ resetPosition: false })} className="control-btn control-btn-xxs control-btn-secondary">
                <FaStop />
              </button>
            </>
          )}
        </div>

        {/* 右側共通コントロール */}
        <div className="flex items-center space-x-2 ml-4">
          <button onClick={toggleSettings} className="control-btn control-btn-xxs control-btn-secondary">⚙️</button>
          <button onClick={toggleSheetMusic} className={`control-btn control-btn-xxs ${settings.showSheetMusic ? 'control-btn-primary' : 'control-btn-secondary'}`}>
            <FaMusic />
          </button>
          <button onClick={toggleHeader} className="control-btn control-btn-xxs control-btn-secondary">
            {settings.showHeader ? <FaCompressAlt /> : <FaExpandAlt />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
