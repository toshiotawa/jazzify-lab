import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PIXINotesRendererInstance } from '@/components/piano/PIXINotesRenderer';
import { useGameStore } from '@/stores/gameStore';
import { MIDIController, updateGlobalVolume } from '@/utils/MidiController';
import { PitchInputController } from '@/utils/PitchInputController';
import { ensureBattlePianoAudio } from '@/utils/ensureBattlePianoAudio';
import { ensureSurvivalBattleAudio } from '@/utils/ensureSurvivalBattleAudio';
import { isIOSWebView } from '@/utils/iosbridge';

export type GameMidiAudioProfile = 'survival' | 'battle';

export type NoteInputBindings = {
  registerNoteHandler: (handler: (note: number, domTimeStampMs?: number) => void) => () => void;
  registerNoteOffHandler: (handler: (note: number) => void) => () => void;
  registerKeyHighlightHandler: (handler: (note: number, active: boolean) => void) => () => void;
  registerKeyHighlightTarget: (getRenderer: () => PIXINotesRendererInstance | null) => () => void;
  isInputConnected: boolean;
  isInputInitialized: boolean;
  /** @deprecated use isInputConnected */
  isMidiConnected: boolean;
  /** @deprecated use isInputInitialized */
  isMidiInitialized: boolean;
  getMidiController: () => MIDIController | null;
  prepareBattleAudio: () => Promise<void>;
};

export type GameMidiBindings = NoteInputBindings;

const initBattleAudio = async (): Promise<void> => {
  const { soundEffectVolume, rootSoundVolume, midiVolume } = useGameStore.getState().settings;
  await ensureBattlePianoAudio({
    midiVolume: midiVolume ?? 0.8,
    soundEffectVolume: soundEffectVolume ?? 0.8,
    rootSoundVolume: rootSoundVolume ?? 0.7,
  });
};

export const useNoteInputSession = (audioProfile: GameMidiAudioProfile): NoteInputBindings => {
  const settings = useGameStore((state) => state.settings);
  const [isInputConnected, setIsInputConnected] = useState(false);
  const [isInputInitialized, setIsInputInitialized] = useState(false);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const pitchControllerRef = useRef<PitchInputController | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const noteHandlerRef = useRef<(note: number, domTimeStampMs?: number) => void>(() => undefined);
  const noteOffHandlerRef = useRef<(note: number) => void>(() => undefined);
  const keyHighlightHandlerRef = useRef<(note: number, active: boolean) => void>(() => undefined);

  useEffect(() => {
    const midiController = new MIDIController({
      // ハイライトは setKeyHighlightCallback 経由で on/off 両方が届くため、ここでは呼ばない
      onNoteOn: (note: number, _velocity?: number, domTimeStampMs?: number) => {
        noteHandlerRef.current(note, domTimeStampMs);
      },
      onNoteOff: (note: number) => {
        noteOffHandlerRef.current(note);
      },
      playMidiSound: true,
    });
    midiController.setConnectionChangeCallback((connected) => {
      if (useGameStore.getState().settings.inputMethod === 'midi') {
        setIsInputConnected(connected);
      }
    });
    midiController.setKeyHighlightCallback((note, active) => {
      keyHighlightHandlerRef.current(note, active);
    });
    midiControllerRef.current = midiController;

    const pitchController = new PitchInputController({
      onNoteOn: (note: number, _velocity?: number, domTimeStampMs?: number) => {
        noteHandlerRef.current(note, domTimeStampMs);
        keyHighlightHandlerRef.current(note, true);
      },
      onNoteOff: (note: number) => {
        noteOffHandlerRef.current(note);
        keyHighlightHandlerRef.current(note, false);
      },
      onConnectionChange: (connected) => {
        if (useGameStore.getState().settings.inputMethod === 'voice') {
          setIsInputConnected(connected);
        }
      },
    });
    pitchControllerRef.current = pitchController;

    if (audioProfile === 'battle') {
      const initPromise = (async () => {
        try {
          await initBattleAudio();
          if (!isIOSWebView()) {
            await midiController.initialize();
          }
          setIsInputInitialized(true);
        } catch {
          setIsInputInitialized(true);
        }
      })();
      initPromiseRef.current = initPromise;
    }

    return () => {
      void midiController.destroy();
      pitchController.destroy();
      midiControllerRef.current = null;
      pitchControllerRef.current = null;
      initPromiseRef.current = null;
      setIsInputInitialized(false);
      setIsInputConnected(false);
    };
  }, [audioProfile]);

  const prepareBattleAudio = useCallback(async (): Promise<void> => {
    if (audioProfile === 'battle') {
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }
      return;
    }

    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const controller = midiControllerRef.current;
    const initPromise = (async () => {
      try {
        await ensureSurvivalBattleAudio();
        if (controller && !isIOSWebView()) {
          await controller.initialize();
        }
        setIsInputInitialized(true);
      } catch {
        setIsInputInitialized(true);
      }
    })();
    initPromiseRef.current = initPromise;
    return initPromise;
  }, [audioProfile]);

  useEffect(() => {
    let cancelled = false;
    const connect = async () => {
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }
      if (cancelled) return;

      const midi = midiControllerRef.current;
      const pitch = pitchControllerRef.current;
      if (!midi || !pitch) return;

      if (settings.inputMethod === 'voice') {
        midi.disconnect();
        pitch.setSensitivity(useGameStore.getState().settings.voiceSensitivity);
        const deviceId =
          settings.selectedAudioDevice && settings.selectedAudioDevice !== 'default'
            ? settings.selectedAudioDevice
            : undefined;
        if (PitchInputController.isSupported()) {
          await pitch.connect(deviceId);
        } else {
          await pitch.disconnect();
        }
        return;
      }

      await pitch.disconnect();
      const deviceId = settings.selectedMidiDevice;
      if (deviceId) {
        await midi.connectDevice(deviceId);
      } else {
        midi.disconnect();
      }
    };
    void connect();
    return () => {
      cancelled = true;
    };
  }, [
    settings.selectedMidiDevice,
    settings.selectedAudioDevice,
    settings.inputMethod,
    isInputInitialized,
  ]);

  // 感度は Worker への軽量メッセージだけで済む。connect の依存に入れると
  // スライダー操作ごとに AudioContext と 17MB の ONNX セッションを作り直してしまう。
  useEffect(() => {
    pitchControllerRef.current?.setSensitivity(settings.voiceSensitivity);
  }, [settings.voiceSensitivity]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume ?? 0.8);
    midiControllerRef.current?.updateVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

  const registerNoteHandler = useCallback((handler: (note: number, domTimeStampMs?: number) => void) => {
    noteHandlerRef.current = handler;
    return () => {
      if (noteHandlerRef.current === handler) {
        noteHandlerRef.current = () => undefined;
      }
    };
  }, []);

  const registerNoteOffHandler = useCallback((handler: (note: number) => void) => {
    noteOffHandlerRef.current = handler;
    return () => {
      if (noteOffHandlerRef.current === handler) {
        noteOffHandlerRef.current = () => undefined;
      }
    };
  }, []);

  const registerKeyHighlightHandler = useCallback(
    (handler: (note: number, active: boolean) => void) => {
      keyHighlightHandlerRef.current = handler;
      return () => {
        if (keyHighlightHandlerRef.current === handler) {
          keyHighlightHandlerRef.current = () => undefined;
        }
      };
    },
    [],
  );

  const registerKeyHighlightTarget = useCallback(
    (getRenderer: () => PIXINotesRendererInstance | null) => {
      const handler = (note: number, active: boolean) => {
        getRenderer()?.highlightKey(note, active);
      };
      keyHighlightHandlerRef.current = handler;
      return () => {
        if (keyHighlightHandlerRef.current === handler) {
          keyHighlightHandlerRef.current = () => undefined;
        }
      };
    },
    [],
  );

  const getMidiController = useCallback(() => midiControllerRef.current, []);

  return useMemo(
    () => ({
      registerNoteHandler,
      registerNoteOffHandler,
      registerKeyHighlightHandler,
      registerKeyHighlightTarget,
      isInputConnected,
      isInputInitialized,
      isMidiConnected: isInputConnected,
      isMidiInitialized: isInputInitialized,
      getMidiController,
      prepareBattleAudio,
    }),
    [
      registerNoteHandler,
      registerNoteOffHandler,
      registerKeyHighlightHandler,
      registerKeyHighlightTarget,
      isInputConnected,
      isInputInitialized,
      getMidiController,
      prepareBattleAudio,
    ],
  );
};