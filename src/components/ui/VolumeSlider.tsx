/**
 * MIDI音量制御スライダーコンポーネント
 * requestAnimationFrameデバウンス付きで高性能な音量制御を実現
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore, useSettings } from '@/stores/gameStore';
import { updateGlobalVolume } from '@/utils/MidiController';

interface VolumeSliderProps {
  /** スライダーのラベル */
  label?: string;
  /** 音量タイプ（将来の拡張用） */
  type?: 'midi' | 'music' | 'master';
  /** 現在の音量値（0.0-1.0） */
  value: number;
  /** 音量変更コールバック */
  onChange: (value: number) => void;
  /** スライダーの幅クラス */
  className?: string;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label = '音量',
  type = 'midi',
  value,
  onChange,
  className = 'w-40'
}) => {
  const rafRef = useRef<number | undefined>(undefined);
  
  // デバウンス付き音量更新
  const updateVolumeWithDebounce = useCallback((newValue: number) => {
    // 既存のRAFをキャンセル
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // 新しいRAFを予約
    rafRef.current = requestAnimationFrame(() => {
      if (type === 'midi') {
        // MIDI音量をMIDIControllerに直接反映
        updateGlobalVolume(newValue);
      }
      // 他の音量タイプは将来の拡張用
    });
  }, [type]);
  
  // 音量変更ハンドラー
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    
    // ストア更新（即座に実行）
    onChange(newValue);
    
    // 音量反映（RAFデバウンス）
    updateVolumeWithDebounce(newValue);
  }, [onChange, updateVolumeWithDebounce]);
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xs text-gray-400 w-10 flex-shrink-0">
          {label}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={handleVolumeChange}
          className={`${className} accent-amber-400 bg-gray-700 rounded-lg appearance-none h-2 slider`}
          aria-label={`${label}調整`}
        />
        <span className="text-xs w-8 text-right text-gray-300 flex-shrink-0 tabular-nums">
          {Math.round(value * 100)}%
        </span>
      </label>
    </div>
  );
};

/**
 * MIDI専用音量スライダー（MIDIController連携付き）
 */
export const MidiVolumeSlider: React.FC<{ className?: string }> = ({ className }) => {
  const settings = useSettings();
  const updateSettings = useGameStore((state) => state.updateSettings);
  
  return (
    <VolumeSlider
      label="MIDI"
      type="midi"
      value={settings.midiVolume}
      onChange={(value) => {
        updateSettings({ midiVolume: value });
      }}
      className={className}
    />
  );
};

export default VolumeSlider; 