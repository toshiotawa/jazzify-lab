import React, { useEffect, useState } from 'react';
import { MidiDeviceSelector, AudioDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';
import { PitchInputController, type PitchInputLatencyStats } from '@/utils/PitchInputController';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const formatLatencyMs = (value: number | null): string =>
  value === null ? '—' : `${Math.round(value)}ms`;

export interface InputMethodSelectorProps {
  midiDeviceId: string | null;
  onMidiDeviceChange: (deviceId: string | null) => void;
  isMidiConnected?: boolean;
  /** 和音モード等、単音のみの警告を表示 */
  showMonophonicWarning?: boolean;
  className?: string;
}

export const InputMethodSelector: React.FC<InputMethodSelectorProps> = ({
  midiDeviceId,
  onMidiDeviceChange,
  isMidiConnected = false,
  showMonophonicWarning = false,
  className = '',
}) => {
  const { settings, updateSettings } = useGameStore();
  const en = shouldUseEnglishCopy();
  const [latencyStats, setLatencyStats] = useState<PitchInputLatencyStats>({
    captureIntervalMs: null,
    inferenceMs: null,
  });

  useEffect(() => {
    if (settings.inputMethod !== 'voice') {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setLatencyStats(PitchInputController.getLatencyStats());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [settings.inputMethod]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          {en ? 'Input method' : '入力方式'}
        </label>
        <p className="text-xs text-gray-400 mb-3">
          {en
            ? 'Choose MIDI (keyboard) or voice input (microphone). Default: MIDI.'
            : 'MIDI（キーボード）または音声入力（マイク）を選択できます。デフォルトはMIDIです。'}
        </p>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => updateSettings({ inputMethod: 'midi' })}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.inputMethod === 'midi'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎹 MIDI
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ inputMethod: 'voice' })}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              settings.inputMethod === 'voice'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {en ? '🎤 Voice' : '🎤 音声'}
          </button>
        </div>
      </div>

      {settings.inputMethod === 'midi' && (
        <div className="bg-blue-900 bg-opacity-20 p-3 rounded-lg border border-blue-700 border-opacity-30">
          <h4 className="text-sm font-medium text-blue-200 mb-2">
            {en ? '🎹 MIDI device' : '🎹 MIDIデバイス'}
          </h4>
          <MidiDeviceSelector
            value={midiDeviceId}
            onChange={onMidiDeviceChange}
            className="w-full"
          />
          <div className="mt-1 text-xs text-gray-400">
            {isMidiConnected
              ? en ? '✅ Connected' : '✅ 接続済み'
              : en ? '❌ Not connected' : '❌ 未接続'}
          </div>
        </div>
      )}

      {settings.inputMethod === 'voice' && (
        <div className="bg-purple-900 bg-opacity-20 p-3 rounded-lg border border-purple-700 border-opacity-30 space-y-3">
          <h4 className="text-sm font-medium text-purple-200">
            {en ? '🎤 Voice input (PESTO)' : '🎤 音声入力（PESTO）'}
          </h4>
          {showMonophonicWarning && (
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 border-opacity-40 rounded p-2">
              <p className="text-xs text-yellow-300">
                {en
                  ? '⚠️ Monophonic only. Chord modes detect one note at a time.'
                  : '⚠️ 単音での読み取り専用です。和音モードでは1音ずつしか判定されません。'}
              </p>
            </div>
          )}
          <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 border-opacity-30 rounded p-2">
            <p className="text-xs text-yellow-200">
              {en
                ? '🎧 Headphones recommended to avoid speaker feedback.'
                : '🎧 スピーカー音の回り込みを防ぐため、ヘッドホンの使用を推奨します。'}
            </p>
          </div>
          {!PitchInputController.isSupported() && (
            <p className="text-xs text-red-300">
              {en
                ? 'Voice input is not supported in this browser.'
                : 'このブラウザでは音声入力に対応していません。'}
            </p>
          )}
          <AudioDeviceSelector
            value={settings.selectedAudioDevice}
            onChange={(deviceId) => updateSettings({ selectedAudioDevice: deviceId })}
          />
          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs text-purple-200">
              <span>{en ? 'Sensitivity' : '感度'}</span>
              <span>{settings.voiceSensitivity}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={settings.voiceSensitivity}
              onChange={(e) => updateSettings({ voiceSensitivity: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">
              {en
                ? 'Higher values detect quieter sounds more easily. Lower if notes are picked up too often.'
                : '高いほど小さな音でも検出されやすくなります。拾いすぎる場合は下げてください。'}
            </p>
          </label>
          <p className="text-xs text-gray-400 font-mono">
            {en
              ? `Input ${formatLatencyMs(latencyStats.captureIntervalMs)} / infer ${formatLatencyMs(latencyStats.inferenceMs)}`
              : `入力 ${formatLatencyMs(latencyStats.captureIntervalMs)} / 推論 ${formatLatencyMs(latencyStats.inferenceMs)}`}
          </p>
        </div>
      )}
    </div>
  );
};
