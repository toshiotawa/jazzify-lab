import React, { useCallback } from 'react';
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

  return (
    <div className="w-full">
      {/* シークバー - showSeekbarフラグで制御 */}
      {settings.showSeekbar && (
        <div className="px-2 py-1 bg-gray-900">
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
                className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer
                  ${canInteract ? 'hover:bg-gray-600' : 'opacity-50 cursor-not-allowed'}
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0`}
              />
              
              {/* ループマーカー - 練習モードのみ表示、ドラッグ可能 */}
              {isPracticeMode && (abRepeat.startTime !== null || abRepeat.endTime !== null) && songDuration > 0 && (
                <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
                  {/* A地点マーカー - ドラッグ可能 */}
                  {abRepeat.startTime !== null && (
                    <div
                      className="absolute top-0 w-2 h-2 bg-green-400 shadow-lg cursor-ew-resize pointer-events-auto z-10"
                      style={{
                        left: `${(abRepeat.startTime / songDuration) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                      title={`A地点: ${formatTime(abRepeat.startTime)} (ドラッグで移動)`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (!rect) return;
                          const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                          const newTime = percent * songDuration;
                          if (abRepeat.endTime === null || newTime < abRepeat.endTime) {
                            setABRepeatStart(newTime);
                          }
                        };
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  )}
                  
                  {/* B地点マーカー - ドラッグ可能 */}
                  {abRepeat.endTime !== null && (
                    <div
                      className="absolute top-0 w-2 h-2 bg-red-400 shadow-lg cursor-ew-resize pointer-events-auto z-10"
                      style={{
                        left: `${(abRepeat.endTime / songDuration) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                      title={`B地点: ${formatTime(abRepeat.endTime)} (ドラッグで移動)`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                          if (!rect) return;
                          const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                          const newTime = percent * songDuration;
                          if (abRepeat.startTime === null || newTime > abRepeat.startTime) {
                            setABRepeatEnd(newTime);
                          }
                        };
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  )}
                  
                  {/* ループ範囲の背景 - ON時は目立たせる */}
                  {abRepeat.startTime !== null && abRepeat.endTime !== null && (
                    <div
                      className={`absolute top-0 h-2 ${
                        abRepeat.enabled 
                          ? 'bg-green-400 opacity-50' 
                          : 'bg-gray-400 opacity-20'
                      } rounded transition-opacity`}
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
      )}

      {/* コントロールボタン - 1行レイアウト */}
      <div className="px-3 py-1 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
        <div className="flex justify-center items-center space-x-3 overflow-x-auto whitespace-nowrap">
          {isPracticeMode ? (
            // 練習モード: 5秒戻る、再生/一時停止、5秒進む、ループ、移調
            <>
                <button
                  onClick={handleSkipBackward}

                  className="control-btn control-btn-xxs control-btn-secondary control-btn-transport"
                title="5秒戻る"
              >
                <FaBackward />
              </button>

                <button
                  onClick={() => isPlaying ? pauseAction() : play()}

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

              {/* ループコントロール - 練習モードのみ表示 */}
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button
                  onClick={handleToggleLoop}
                  className={`control-btn control-btn-xxs ${abRepeat.enabled ? 'control-btn-loop-active' : 'control-btn-loop'}`}
                  title="ABリピートON/OFF"
                >
                  <MdLoop />
                </button>
              </div>

              {/* A/B地点設定（コンパクト） - 練習モードのみ表示 */}
              <div className="flex items-center space-x-1 ml-2 text-xs flex-shrink-0">
                <button
                  onClick={handleSetAStart}
                  className={`control-btn control-btn-xxs ${abRepeat.startTime !== null ? 'control-btn-primary' : 'control-btn-secondary'}`}
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
                  {abRepeat.endTime !== null ? Math.floor(abRepeat.endTime / 60) + ':' + String(Math.floor(abRepeat.endTime % 60)).padStart(2, '0') : '--'}
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

              {/* 移調コントロール - レッスンモード・ミッションモードでは非表示 */}
              {!lessonContext && !missionContext && (
                <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                  {/* 練習モードでは常に移調ボタンを表示 */}
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
            // 本番モード: 再生/最初に戻るボタン（状況に応じて動作変化）
            <>
                <button
                  onClick={handlePlayOrRestart}

                  className="control-btn control-btn-xxs control-btn-primary control-btn-transport"

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
                  onClick={() => stop({ resetPosition: false })}
                  className="control-btn control-btn-xxs control-btn-secondary control-btn-transport"

                disabled={!currentSong}
                title="停止"
              >
                <FaStop />
              </button>

              {/* 移調コントロール（レッスンモード・ミッションモードでは非表示） */}
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
        
        {/* 右側: FPSモニター、設定、楽譜表示、シークバー切り替えボタン */}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">

          
          {/* 設定ボタン */}
          <button
            onClick={toggleSettings}
            className="control-btn control-btn-xxs control-btn-secondary"
            title="設定"
          >
            ⚙️
          </button>
          
          {/* 楽譜表示切り替えボタン */}
          <button
            onClick={toggleSheetMusic}
            className={`control-btn control-btn-xxs ${settings.showSheetMusic ? 'control-btn-primary' : 'control-btn-secondary'}`}
            title={settings.showSheetMusic ? '楽譜を隠す' : '楽譜を表示'}
          >
            <FaMusic />
          </button>
          
          {/* ヘッダー表示/非表示ボタン */}
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
