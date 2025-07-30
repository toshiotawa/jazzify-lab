import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Music,
  Volume2,
  Settings,
  Metronome
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RhythmControlBarProps {
  onOpenPatternSelector: () => void;
}

/**
 * リズムコントロールバーコンポーネント
 */
const RhythmControlBar: React.FC<RhythmControlBarProps> = ({ onOpenPatternSelector }) => {
  const {
    isPlaying,
    play,
    pause,
    stop,
    resetRhythmScore,
    settings,
    updateRhythmSettings,
    isMetronomeOn,
    setRhythmMetronome,
    pattern,
  } = useGameStore((state) => ({
    isPlaying: state.isPlaying,
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    resetRhythmScore: state.resetRhythmScore,
    settings: state.rhythmState.settings,
    updateRhythmSettings: state.updateRhythmSettings,
    isMetronomeOn: state.rhythmState.isMetronomeOn,
    setRhythmMetronome: state.setRhythmMetronome,
    pattern: state.rhythmState.pattern,
  }));

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
    resetRhythmScore();
  };

  const handleSpeedChange = (value: number[]) => {
    updateRhythmSettings({ notesSpeed: value[0] });
  };

  return (
    <div className="rhythm-control-bar p-4 bg-gray-900/50 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        {/* 左側: 再生コントロール */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlayPause}
            size="lg"
            variant="default"
            className={cn(
              'min-w-[100px]',
              isPlaying && 'bg-green-600 hover:bg-green-700'
            )}
            disabled={!pattern}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                一時停止
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                再生
              </>
            )}
          </Button>

          <Button
            onClick={handleStop}
            size="icon"
            variant="outline"
            disabled={!isPlaying && !pattern}
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            onClick={resetRhythmScore}
            size="icon"
            variant="outline"
            title="スコアリセット"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* 中央: パターン情報とスピード調整 */}
        <div className="flex-1 flex items-center gap-4">
          {pattern && (
            <div className="text-sm text-gray-300">
              <span className="font-medium">{pattern.name}</span>
              <span className="mx-2 text-gray-500">|</span>
              <span>{pattern.bpm} BPM</span>
            </div>
          )}

          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-xs text-gray-400">速度</span>
            <Slider
              value={[settings.notesSpeed]}
              onValueChange={handleSpeedChange}
              min={0.5}
              max={3.0}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 min-w-[3ch]">
              {settings.notesSpeed.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* 右側: その他のコントロール */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setRhythmMetronome(!isMetronomeOn)}
            size="icon"
            variant={isMetronomeOn ? 'default' : 'outline'}
            title="メトロノーム"
          >
            <Metronome className="w-4 h-4" />
          </Button>

          <Button
            onClick={onOpenPatternSelector}
            size="icon"
            variant="outline"
            title="パターン選択"
          >
            <Music className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            title="設定"
            disabled // TODO: 設定モーダル実装後に有効化
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* メトロノーム音量（メトロノームON時のみ表示） */}
      {isMetronomeOn && (
        <div className="mt-3 flex items-center gap-2 max-w-xs">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={[settings.metronomeVolume]}
            onValueChange={(value) => updateRhythmSettings({ metronomeVolume: value[0] })}
            min={0}
            max={1}
            step={0.1}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 min-w-[3ch]">
            {Math.round(settings.metronomeVolume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default RhythmControlBar;