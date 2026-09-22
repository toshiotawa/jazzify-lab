/**
 * 画面内で MIDIController を直接持つ耳コピ等向けの入力セッション。
 * useNoteInputSession と同等の MIDI/音声切替を提供する。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { InputMethod } from '@/types';
import { MIDIController } from '@/utils/MidiController';
import {
  PitchInputController,
  type PitchInputLatencyStats,
} from '@/utils/PitchInputController';
import { ensureBattlePianoAudio } from '@/utils/ensureBattlePianoAudio';
import { updateGlobalVolume } from '@/utils/MidiController';
import { isIOSWebView } from '@/utils/iosbridge';
import { midiToNoteName } from '@/utils/musicXmlOrnamentExpander';
import type { ExpectedPitchCandidates } from '@/utils/pitchInput/expectedPitchCandidates';

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
  enabled?: boolean;
  inputMethod?: InputMethod;
  voiceFastResponse?: boolean;
  voiceLowRegister?: boolean;
  /** Phrase Defense の期待 pitch class ビットマスク。0 は補助なし。 */
  expectedPitchMask?: number;
  expectedPitchCandidates?: ExpectedPitchCandidates;
}

interface UseStandaloneNoteInputResult {
  readonly isConnected: boolean;
  readonly connectionStatus: StandaloneInputConnectionStatus;
  readonly inputLevelDb: number | null;
  readonly detectedNoteLabel: string | null;
  readonly latencyStats: PitchInputLatencyStats;
}

export const useStandaloneNoteInput = ({
  onNoteOn,
  onNoteOff,
  onKeyHighlight,
  playMidiSound = true,
  enabled = true,
  inputMethod: inputMethodOverride,
  voiceFastResponse = false,
  voiceLowRegister = false,
  expectedPitchMask = 0,
  expectedPitchCandidates,
}: UseStandaloneNoteInputOptions): UseStandaloneNoteInputResult => {
  const settings = useGameStore((state) => state.settings);
  const effectiveMethod = inputMethodOverride ?? settings.inputMethod;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StandaloneInputConnectionStatus>('idle');
  const [detectedNoteLabel, setDetectedNoteLabel] = useState<string | null>(null);
  const [latencyStats, setLatencyStats] = useState<PitchInputLatencyStats>({
    captureIntervalMs: null,
    inferenceMs: null,
    diagnostics: null,
  });
  const midiRef = useRef<MIDIController | null>(null);
  const pitchRef = useRef<PitchInputController | null>(null);
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  const onKeyHighlightRef = useRef(onKeyHighlight);
  const connectGenerationRef = useRef(0);
  const voiceFastResponseRef = useRef(voiceFastResponse);
  voiceFastResponseRef.current = voiceFastResponse;
  const voiceLowRegisterRef = useRef(voiceLowRegister);
  voiceLowRegisterRef.current = voiceLowRegister;
  const expectedPitchMaskRef = useRef(expectedPitchMask);
  expectedPitchMaskRef.current = expectedPitchMask;
  const expectedPitchCandidatesRef = useRef(expectedPitchCandidates);
  expectedPitchCandidatesRef.current = expectedPitchCandidates;

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

    const pitch = new PitchInputController({
      onNoteOn: (note, _velocity, domTimeStampMs) => {
        onNoteOnRef.current(note, domTimeStampMs);
        onKeyHighlightRef.current?.(note, true);
        setDetectedNoteLabel(midiToNoteName(note));
      },
      onNoteOff: (note) => {
        onNoteOffRef.current?.(note);
        onKeyHighlightRef.current?.(note, false);
        setDetectedNoteLabel(null);
      },
      onConnectionChange: (connected) => {
        const method = inputMethodOverride ?? useGameStore.getState().settings.inputMethod;
        if (method === 'voice') {
          setIsConnected(connected);
          setConnectionStatus(connected ? 'ready' : 'disconnected');
        }
      },
    });
    pitchRef.current = pitch;

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
  }, [playMidiSound, inputMethodOverride]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

  useEffect(() => {
    pitchRef.current?.setPitchStableFrames(voiceFastResponse ? 2 : 4);
  }, [voiceFastResponse]);

  useEffect(() => {
    pitchRef.current?.setLowRegister(voiceLowRegister);
  }, [voiceLowRegister]);

  useEffect(() => {
    pitchRef.current?.setSensitivity(settings.voiceSensitivity);
  }, [settings.voiceSensitivity]);

  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch) {
      return undefined;
    }
    if (expectedPitchCandidates) {
      pitch.setExpectedPitchCandidates(expectedPitchCandidates);
    } else {
      pitch.setExpectedPitchMask(expectedPitchMask);
    }
    return () => {
      pitch.setExpectedPitchCandidates({ pitchClassMask: 0, midis: [] });
    };
  }, [expectedPitchCandidates, expectedPitchMask]);

  const connect = useCallback(async () => {
    const generation = connectGenerationRef.current + 1;
    connectGenerationRef.current = generation;
    const midi = midiRef.current;
    const pitch = pitchRef.current;
    if (!midi || !pitch) return;

    if (!enabled || effectiveMethod === 'touch') {
      midi.disconnect();
      await pitch.disconnect();
      setIsConnected(false);
      setConnectionStatus('idle');
      setDetectedNoteLabel(null);
      return;
    }

    setConnectionStatus('preparing');

    if (effectiveMethod === 'voice') {
      midi.disconnect();
      pitch.setPitchStableFrames(voiceFastResponseRef.current ? 2 : 4);
      pitch.setLowRegister(voiceLowRegisterRef.current);
      pitch.setSensitivity(useGameStore.getState().settings.voiceSensitivity);
      const candidates = expectedPitchCandidatesRef.current;
      if (candidates) {
        pitch.setExpectedPitchCandidates(candidates);
      } else {
        pitch.setExpectedPitchMask(expectedPitchMaskRef.current);
      }
      const deviceId =
        settings.selectedAudioDevice && settings.selectedAudioDevice !== 'default'
          ? settings.selectedAudioDevice
          : undefined;
      if (PitchInputController.isSupported()) {
        setConnectionStatus('requesting');
        const ok = await pitch.connect(deviceId);
        if (connectGenerationRef.current !== generation) return;
        setIsConnected(ok);
        setConnectionStatus(ok ? 'ready' : 'error');
      } else {
        setIsConnected(false);
        setConnectionStatus('error');
      }
      return;
    }

    await pitch.disconnect();
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
  ]);

  useEffect(() => {
    void connect();
  }, [connect]);

  useEffect(() => {
    if (effectiveMethod !== 'voice' || !enabled) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setLatencyStats(PitchInputController.getLatencyStats());
    }, 1000 / 12);
    return () => window.clearInterval(timer);
  }, [effectiveMethod, enabled]);

  const inputLevelDb = latencyStats.captureIntervalMs !== null
    ? -60 + Math.min(60, latencyStats.inferenceMs ?? 0)
    : null;

  return {
    isConnected,
    connectionStatus,
    inputLevelDb,
    detectedNoteLabel,
    latencyStats,
  };
};
