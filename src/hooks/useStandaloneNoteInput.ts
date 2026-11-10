/**
 * 画面内で MIDIController を直接持つ耳コピ等向けの入力セッション。
 * 音声は PitchPlease piano の多声検出をそのまま note on/off にする。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { InputMethod } from '@/types';
import { MIDIController, updateGlobalVolume } from '@/utils/MidiController';
import { ensureBattlePianoAudio } from '@/utils/ensureBattlePianoAudio';
import { isIOSWebView } from '@/utils/iosbridge';
import { midiToNoteName } from '@/utils/musicXmlOrnamentExpander';
import { isVoiceMicrophoneSupported } from '@/utils/pitchInput/voiceMicrophoneSupport';
import type { PolyPitchVoiceInput } from '@/utils/pitchInput/polyPitchVoiceInput';

export type StandaloneInputConnectionStatus =
  | 'idle'
  | 'requesting'
  | 'preparing'
  | 'ready'
  | 'disconnected'
  | 'error';

interface UseStandaloneNoteInputOptions {
  onNoteOn: (note: number, domTimeStampMs?: number) => void;
  onNoteOff?: (note: number) => void;
  onKeyHighlight?: (note: number, active: boolean) => void;
  playMidiSound?: boolean;
  masterVolume?: number;
  enabled?: boolean;
  inputMethod?: InputMethod;
}

interface UseStandaloneNoteInputResult {
  readonly isConnected: boolean;
  readonly connectionStatus: StandaloneInputConnectionStatus;
  readonly detectedNoteLabel: string | null;
}

export const useStandaloneNoteInput = ({
  onNoteOn,
  onNoteOff,
  onKeyHighlight,
  playMidiSound = true,
  masterVolume = 1,
  enabled = true,
  inputMethod: inputMethodOverride,
}: UseStandaloneNoteInputOptions): UseStandaloneNoteInputResult => {
  const settings = useGameStore((state) => state.settings);
  const effectiveMethod = inputMethodOverride ?? settings.inputMethod;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StandaloneInputConnectionStatus>('idle');
  const [detectedNoteLabel, setDetectedNoteLabel] = useState<string | null>(null);
  const midiRef = useRef<MIDIController | null>(null);
  const polyRef = useRef<PolyPitchVoiceInput | null>(null);
  const polyActiveCountRef = useRef(0);
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  const onKeyHighlightRef = useRef(onKeyHighlight);
  const connectGenerationRef = useRef(0);
  const masterVolumeRef = useRef(masterVolume);
  masterVolumeRef.current = masterVolume;

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
      onNoteOn: (note, _vel, domTimeStampMs) => {
        onNoteOnRef.current(note, domTimeStampMs);
      },
      onNoteOff: (note) => {
        onNoteOffRef.current?.(note);
      },
      playMidiSound,
    });
    midi.setConnectionChangeCallback((connected) => {
      const method = inputMethodOverride ?? useGameStore.getState().settings.inputMethod;
      if (method === 'midi') {
        setIsConnected(connected);
        setConnectionStatus(connected ? 'ready' : 'disconnected');
      }
    });
    midi.setKeyHighlightCallback((note, active) => {
      onKeyHighlightRef.current?.(note, active);
    });
    midiRef.current = midi;

    const { midiVolume, soundEffectVolume, rootSoundVolume } = useGameStore.getState().settings;
    void ensureBattlePianoAudio({ midiVolume: midiVolume * masterVolumeRef.current, soundEffectVolume, rootSoundVolume })
      .then(() => {
        const latestSettings = useGameStore.getState().settings;
        updateGlobalVolume(latestSettings.midiVolume * masterVolumeRef.current);
        if (!isIOSWebView()) {
          return midi.initialize();
        }
        return undefined;
      })
      .catch(() => undefined);

    return () => {
      connectGenerationRef.current += 1;
      void midi.destroy();
      void polyRef.current?.disconnect();
      midiRef.current = null;
      polyRef.current = null;
    };
  }, [playMidiSound, inputMethodOverride]);

  useEffect(() => {
    updateGlobalVolume((settings.midiVolume ?? 0.8) * masterVolume);
  }, [settings.midiVolume, masterVolume]);

  const connect = useCallback(async () => {
    const generation = connectGenerationRef.current + 1;
    connectGenerationRef.current = generation;
    const midi = midiRef.current;
    if (!midi) return;

    if (!enabled || effectiveMethod === 'touch') {
      midi.disconnect();
      await polyRef.current?.disconnect();
      setIsConnected(false);
      setConnectionStatus('idle');
      setDetectedNoteLabel(null);
      return;
    }

    setConnectionStatus('preparing');

    if (effectiveMethod === 'voice') {
      midi.disconnect();
      const { PolyPitchVoiceInput } = await import('@/utils/pitchInput/polyPitchVoiceInput');
      if (connectGenerationRef.current !== generation) return;
      const poly = polyRef.current ?? new PolyPitchVoiceInput();
      polyRef.current = poly;
      polyActiveCountRef.current = 0;
      if (!isVoiceMicrophoneSupported()) {
        setIsConnected(false);
        setConnectionStatus('error');
        return;
      }
      setConnectionStatus('requesting');
      const latest = useGameStore.getState().settings;
      const deviceId = latest.selectedAudioDevice && latest.selectedAudioDevice !== 'default'
        ? latest.selectedAudioDevice
        : undefined;
      const ok = await poly.connect({
        onNoteOn: (note, domTimeStampMs) => {
          polyActiveCountRef.current += 1;
          onNoteOnRef.current(note, domTimeStampMs);
          onKeyHighlightRef.current?.(note, true);
          setDetectedNoteLabel(midiToNoteName(note));
        },
        onNoteOff: (note) => {
          polyActiveCountRef.current = Math.max(0, polyActiveCountRef.current - 1);
          onNoteOffRef.current?.(note);
          onKeyHighlightRef.current?.(note, false);
          if (polyActiveCountRef.current === 0) setDetectedNoteLabel(null);
        },
        onConnectionChange: (connected) => {
          if (connectGenerationRef.current !== generation) return;
          const method = inputMethodOverride ?? useGameStore.getState().settings.inputMethod;
          if (method !== 'voice') return;
          setIsConnected(connected);
          setConnectionStatus((current) => {
            if (!connected && current === 'error') return current;
            return connected ? 'ready' : 'disconnected';
          });
        },
        onError: () => {
          if (connectGenerationRef.current !== generation) return;
          const method = inputMethodOverride ?? useGameStore.getState().settings.inputMethod;
          if (method !== 'voice') return;
          setIsConnected(false);
          setConnectionStatus('error');
        },
      }, deviceId, latest.voiceEchoCancellation ?? true, latest.voiceInputChannel ?? 1);
      if (connectGenerationRef.current !== generation) return;
      setIsConnected(ok);
      setConnectionStatus(ok ? 'ready' : 'error');
      return;
    }

    await polyRef.current?.disconnect();
    setDetectedNoteLabel(null);
    if (settings.selectedMidiDevice) {
      const ok = await midi.connectDevice(settings.selectedMidiDevice);
      if (connectGenerationRef.current !== generation) return;
      setIsConnected(Boolean(ok));
      setConnectionStatus(ok ? 'ready' : 'disconnected');
    } else {
      midi.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [
    enabled,
    effectiveMethod,
    settings.selectedMidiDevice,
    settings.selectedAudioDevice,
    settings.voiceEchoCancellation,
    settings.voiceInputChannel,
    inputMethodOverride,
  ]);

  useEffect(() => {
    void connect();
  }, [connect]);

  return {
    isConnected,
    connectionStatus,
    detectedNoteLabel,
  };
};
