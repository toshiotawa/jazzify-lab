/**
 * 画面内で MIDIController を直接持つ耳コピ等向けの入力セッション。
 * useNoteInputSession と同等の MIDI/音声切替を提供する。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { MIDIController } from '@/utils/MidiController';
import { PitchInputController } from '@/utils/PitchInputController';
import { ensureBattlePianoAudio } from '@/utils/ensureBattlePianoAudio';
import { isIOSWebView } from '@/utils/iosbridge';

interface UseStandaloneNoteInputOptions {
  onNoteOn: (note: number, domTimeStampMs?: number) => void;
  onNoteOff?: (note: number) => void;
  onKeyHighlight?: (note: number, active: boolean) => void;
  playMidiSound?: boolean;
}

export const useStandaloneNoteInput = ({
  onNoteOn,
  onNoteOff,
  onKeyHighlight,
  playMidiSound = true,
}: UseStandaloneNoteInputOptions): { isConnected: boolean } => {
  const settings = useGameStore((state) => state.settings);
  const [isConnected, setIsConnected] = useState(false);
  const midiRef = useRef<MIDIController | null>(null);
  const pitchRef = useRef<PitchInputController | null>(null);
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  const onKeyHighlightRef = useRef(onKeyHighlight);

  useEffect(() => {
    onNoteOnRef.current = onNoteOn;
  }, [onNoteOn]);
  useEffect(() => {
    onNoteOffRef.current = onNoteOff;
  }, [onNoteOff]);
  useEffect(() => {
    onKeyHighlightRef.current = onKeyHighlight;
  }, [onKeyHighlight]);

  useEffect(() => {
    const midi = new MIDIController({
      // ハイライトは setKeyHighlightCallback 経由で on/off 両方が届くため、ここでは呼ばない
      onNoteOn: (note, _vel, domTimeStampMs) => {
        onNoteOnRef.current(note, domTimeStampMs);
      },
      onNoteOff: (note) => {
        onNoteOffRef.current?.(note);
      },
      playMidiSound,
    });
    midi.setConnectionChangeCallback((connected) => {
      if (useGameStore.getState().settings.inputMethod === 'midi') {
        setIsConnected(connected);
      }
    });
    midi.setKeyHighlightCallback((note, active) => {
      onKeyHighlightRef.current?.(note, active);
    });
    midiRef.current = midi;

    const pitch = new PitchInputController({
      onNoteOn: (note, _velocity, domTimeStampMs) => {
        onNoteOnRef.current(note, domTimeStampMs);
        onKeyHighlightRef.current?.(note, true);
      },
      onNoteOff: (note) => {
        onNoteOffRef.current?.(note);
        onKeyHighlightRef.current?.(note, false);
      },
      onConnectionChange: (connected) => {
        if (useGameStore.getState().settings.inputMethod === 'voice') {
          setIsConnected(connected);
        }
      },
    });
    pitchRef.current = pitch;

    // 音量は毎回 store から読む。依存配列に入れるとスライダー操作でデバイスが切断される。
    const { midiVolume, soundEffectVolume, rootSoundVolume } = useGameStore.getState().settings;
    void ensureBattlePianoAudio({ midiVolume, soundEffectVolume, rootSoundVolume })
      .then(() => {
        if (!isIOSWebView()) {
          return midi.initialize();
        }
        return undefined;
      })
      .catch(() => undefined);

    return () => {
      void midi.destroy();
      pitch.destroy();
      midiRef.current = null;
      pitchRef.current = null;
    };
  }, [playMidiSound]);

  const connect = useCallback(async () => {
    const midi = midiRef.current;
    const pitch = pitchRef.current;
    if (!midi || !pitch) return;

    if (settings.inputMethod === 'voice') {
      midi.disconnect();
      pitch.setSensitivity(useGameStore.getState().settings.voiceSensitivity);
      const deviceId =
        settings.selectedAudioDevice && settings.selectedAudioDevice !== 'default'
          ? settings.selectedAudioDevice
          : undefined;
      if (PitchInputController.isSupported()) {
        const ok = await pitch.connect(deviceId);
        setIsConnected(ok);
      } else {
        setIsConnected(false);
      }
      return;
    }

    await pitch.disconnect();
    if (settings.selectedMidiDevice) {
      const ok = await midi.connectDevice(settings.selectedMidiDevice);
      setIsConnected(Boolean(ok));
    } else {
      midi.disconnect();
      setIsConnected(false);
    }
  }, [settings.inputMethod, settings.selectedMidiDevice, settings.selectedAudioDevice]);

  useEffect(() => {
    void connect();
  }, [connect]);

  // 感度は Worker へのメッセージのみ。connect を再実行させない。
  useEffect(() => {
    pitchRef.current?.setSensitivity(settings.voiceSensitivity);
  }, [settings.voiceSensitivity]);

  return { isConnected };
};
