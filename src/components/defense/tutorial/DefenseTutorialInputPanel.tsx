import React from 'react';
import type { InputMethod } from '@/types';
import { MidiDeviceSelector, AudioDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { PitchInputController } from '@/utils/PitchInputController';
import { useGameStore } from '@/stores/gameStore';

interface DefenseTutorialInputPanelProps {
  readonly inputMethod: InputMethod;
  readonly isEnglishCopy: boolean;
  readonly midiDeviceId: string | null;
  readonly onMidiDeviceChange: (deviceId: string | null) => void;
  readonly isMidiConnected: boolean;
  readonly voiceSensitivity: number;
  readonly voiceFastResponse: boolean;
  readonly voiceLowRegister: boolean;
  readonly onVoiceSensitivityChange: (value: number) => void;
  readonly onVoiceFastResponseChange: (enabled: boolean) => void;
  readonly onVoiceLowRegisterChange: (enabled: boolean) => void;
  readonly backingVolume: number;
  readonly onBackingVolumeChange: (value: number) => void;
  readonly midiVolume: number;
  readonly onMidiVolumeChange: (value: number) => void;
  readonly detectedNoteLabel: string | null;
  readonly connectionStatus: string;
  readonly onReady: () => void;
  readonly onFallbackInput?: (method: InputMethod) => void;
}

const cardClass = 'rounded-xl border border-slate-600 bg-slate-800/80 p-4 text-left';

export const DefenseTutorialInputChoice: React.FC<{
  readonly isEnglishCopy: boolean;
  readonly onSelect: (method: InputMethod) => void;
}> = ({ isEnglishCopy, onSelect }) => (
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
    <p className="text-center text-lg font-semibold text-white">
      {isEnglishCopy ? 'Choose your input method.' : '入力方式を選んでください。'}
    </p>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {([
        ['midi', isEnglishCopy ? 'MIDI' : 'MIDI', isEnglishCopy ? 'Electronic piano / MIDI keyboard' : '電子ピアノ・MIDIキーボード'],
        ['voice', isEnglishCopy ? 'Microphone' : 'マイク', isEnglishCopy ? 'Play into the mic' : '楽器の音をマイクで読み取る'],
        ['touch', isEnglishCopy ? 'On-screen keyboard' : '画面鍵盤', isEnglishCopy ? 'Tap keys on screen' : '画面の鍵盤をタップ'],
      ] as const).map(([method, title, desc]) => (
        <button
          key={method}
          type="button"
          className={`${cardClass} hover:border-blue-400 transition-colors`}
          onClick={() => onSelect(method)}
        >
          <div className="text-lg font-semibold text-white">{title}</div>
          <p className="mt-2 text-sm text-slate-300">{desc}</p>
        </button>
      ))}
    </div>
  </div>
);

export const DefenseTutorialInputPanel: React.FC<DefenseTutorialInputPanelProps> = ({
  inputMethod,
  isEnglishCopy,
  midiDeviceId,
  onMidiDeviceChange,
  isMidiConnected,
  voiceSensitivity,
  voiceFastResponse,
  voiceLowRegister,
  onVoiceSensitivityChange,
  onVoiceFastResponseChange,
  onVoiceLowRegisterChange,
  backingVolume,
  onBackingVolumeChange,
  midiVolume,
  onMidiVolumeChange,
  detectedNoteLabel,
  connectionStatus,
  onReady,
  onFallbackInput,
}) => {
  const audioDeviceId = useGameStore((state) => state.settings.selectedAudioDevice);
  const updateSettings = useGameStore((state) => state.updateSettings);

  if (inputMethod === 'touch') {
    return (
      <div className={`${cardClass} mx-auto max-w-lg px-4`}>
        <p className="text-sm text-slate-300">
          {isEnglishCopy
            ? 'Play do, re, and mi on the keyboard below as shown on the staff.'
            : '譜面のド・レ・ミを、下の鍵盤で演奏しましょう。'}
        </p>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={onReady}>
          {isEnglishCopy ? 'Start' : '始める'}
        </button>
      </div>
    );
  }

  if (inputMethod === 'midi') {
    return (
      <div className={`${cardClass} mx-auto max-w-lg space-y-4`}>
        <MidiDeviceSelector value={midiDeviceId} onChange={onMidiDeviceChange} />
        <p className="text-sm text-slate-300">{connectionStatus}</p>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-200">
            {isEnglishCopy ? 'MIDI volume (app playback)' : 'MIDI音量（アプリ内の演奏音）'}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(midiVolume * 100)}
            onChange={(event) => onMidiVolumeChange(Number(event.target.value) / 100)}
            className="range range-primary range-sm w-full"
          />
        </label>
        <p className="text-xs text-slate-400">
          {isEnglishCopy
            ? 'Adjust app playback volume. Use your keyboard for hardware volume.'
            : 'アプリから鳴る演奏音の音量です。電子ピアノ本体の音量は本体で調整してください。'}
        </p>
        <button type="button" className="btn btn-primary w-full" onClick={onReady} disabled={!isMidiConnected}>
          {isEnglishCopy ? 'Start' : '始める'}
        </button>
        {!isMidiConnected && onFallbackInput ? (
          <div className="space-y-2 border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-400">
              {isEnglishCopy
                ? 'No MIDI device detected. You can continue with another input method.'
                : 'MIDIデバイスが見つかりません。別の入力方法で続けられます。'}
            </p>
            <button type="button" className="btn btn-outline w-full" onClick={() => onFallbackInput('voice')}>
              {isEnglishCopy ? 'Continue with microphone' : 'マイク入力で続ける'}
            </button>
            <button type="button" className="btn btn-outline w-full" onClick={() => onFallbackInput('touch')}>
              {isEnglishCopy ? 'Continue with on-screen keyboard' : '今は画面鍵盤で続ける'}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${cardClass} mx-auto max-w-lg space-y-4`}>
      <p className="text-sm text-amber-200/90">
        {isEnglishCopy
          ? 'Headphones are recommended. Speaker bleed can make recognition unstable.'
          : 'イヤホン・ヘッドホンをおすすめします。スピーカーの音をマイクが拾うと、判定が不安定になることがあります。'}
      </p>
      {!PitchInputController.isSupported() ? (
        <p className="text-sm text-red-300">
          {isEnglishCopy ? 'Voice input is not supported in this browser.' : 'このブラウザでは音声入力に対応していません。'}
        </p>
      ) : (
        <AudioDeviceSelector
          value={audioDeviceId}
          onChange={(deviceId) => updateSettings({ selectedAudioDevice: deviceId })}
        />
      )}
      <p className="text-sm text-slate-300">{connectionStatus}</p>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm text-slate-200">
          <span>{isEnglishCopy ? 'Mic sensitivity' : 'マイク感度'}</span>
          <span>{voiceSensitivity}</span>
        </span>
        <input
          type="range"
          min={1}
          max={10}
          value={voiceSensitivity}
          onChange={(event) => onVoiceSensitivityChange(Number(event.target.value))}
          className="range range-primary range-sm w-full"
        />
        <p className="mt-1 text-xs text-slate-400">
          {isEnglishCopy
            ? 'Recommended: 5. Higher values detect quieter sounds more easily. Lower if notes are picked up too often.'
            : 'おすすめ: 5。高いほど小さな音でも検出されやすくなります。拾いすぎる場合は下げてください。'}
        </p>
      </label>
      <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
        <span>{isEnglishCopy ? 'Fast response' : '高速反応'}</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={voiceFastResponse}
          onChange={(event) => onVoiceFastResponseChange(event.target.checked)}
        />
      </label>
      <p className="text-xs text-slate-400">
        {isEnglishCopy
          ? 'Turn this ON when pitch is hard to recognize. False detections may increase.'
          : 'ピッチが認識しづらい時にONにしてください。※誤検出が増える可能性があります。'}
      </p>
      <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
        <span>{isEnglishCopy ? 'Low register' : '低音読み取り'}</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={voiceLowRegister}
          onChange={(event) => onVoiceLowRegisterChange(event.target.checked)}
        />
      </label>
      <p className="text-xs text-slate-400">
        {isEnglishCopy
          ? 'Turn this ON for low notes such as double bass. Response is a little slower.'
          : 'コントラバスなど低い音が拾いにくいときにONにしてください。反応は少し遅くなります。'}
      </p>
      <div className="rounded-lg bg-slate-900/60 p-3 text-sm">
        <div className="text-slate-400">{isEnglishCopy ? 'Detected pitch' : '認識中の音'}</div>
        <div className="text-white">{detectedNoteLabel ?? '—'}</div>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-200">
          {isEnglishCopy ? 'Demo volume' : '音源の音量'}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(backingVolume * 100)}
          onChange={(event) => onBackingVolumeChange(Number(event.target.value) / 100)}
          className="range range-primary range-sm w-full"
        />
      </label>
      <button type="button" className="btn btn-primary w-full" onClick={onReady}>
        {isEnglishCopy ? 'Start' : '始める'}
      </button>
    </div>
  );
};
