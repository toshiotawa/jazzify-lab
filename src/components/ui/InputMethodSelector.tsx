import { VoiceEchoCancellationControl } from '@/components/ui/VoiceEchoCancellationControl';
import { VoiceInputChannelControl } from '@/components/ui/VoiceInputChannelControl';
import { PitchDiagnosticControls } from '@/components/ui/PitchDiagnosticControls';
import React from 'react';
import { MidiDeviceSelector, AudioDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { isProduction } from '@/utils/environment';
import { isVoiceMicrophoneSupported } from '@/utils/pitchInput/voiceMicrophoneSupport';

export interface InputMethodSelectorProps {
  midiDeviceId: string | null;
  onMidiDeviceChange: (deviceId: string | null) => void;
  isMidiConnected?: boolean;
  className?: string;
}

export const InputMethodSelector: React.FC<InputMethodSelectorProps> = ({
  midiDeviceId,
  onMidiDeviceChange,
  isMidiConnected = false,
  className = '',
}) => {
  const { settings, updateSettings } = useGameStore();
  const en = shouldUseEnglishCopy();

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
            {en ? '🎤 Voice input' : '🎤 音声入力'}
          </h4>
          <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 border-opacity-30 rounded p-2">
            <p className="text-xs text-yellow-200">
              {en
                ? '🎧 Headphones recommended to avoid speaker feedback.'
                : '🎧 スピーカー音の回り込みを防ぐため、ヘッドホンの使用を推奨します。'}
            </p>
          </div>
          {!isVoiceMicrophoneSupported() && (
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
          <VoiceEchoCancellationControl isEnglishCopy={en} />
          <VoiceInputChannelControl isEnglishCopy={en} />
          {!isProduction() ? <PitchDiagnosticControls isEnglishCopy={en} /> : null}
        </div>
      )}
    </div>
  );
};
