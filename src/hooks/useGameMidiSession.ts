import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PIXINotesRendererInstance } from '@/components/piano/PIXINotesRenderer';
import { useGameStore } from '@/stores/gameStore';
import {
  MIDIController,
  initializeAudioSystem,
  updateGlobalVolume,
  warmupIOSBattleSoundFonts,
} from '@/utils/MidiController';
import { ensureBattlePianoAudio } from '@/utils/ensureBattlePianoAudio';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { isIOSWebView } from '@/utils/iosbridge';

export type GameMidiAudioProfile = 'survival' | 'battle';

export type GameMidiBindings = {
  registerNoteHandler: (handler: (note: number) => void) => () => void;
  registerNoteOffHandler: (handler: (note: number) => void) => () => void;
  registerKeyHighlightHandler: (handler: (note: number, active: boolean) => void) => () => void;
  registerKeyHighlightTarget: (getRenderer: () => PIXINotesRendererInstance | null) => () => void;
  isMidiConnected: boolean;
  isMidiInitialized: boolean;
  getMidiController: () => MIDIController | null;
};

const initSurvivalAudio = async (): Promise<void> => {
  const { soundEffectVolume, rootSoundVolume, midiVolume } = useGameStore.getState().settings;
  const seVol = soundEffectVolume ?? 0.8;
  const rootVol = rootSoundVolume ?? 0.7;
  FantasySoundManager.setRootVolume(rootVol);
  FantasySoundManager.enableRootSound(true);
  warmupIOSBattleSoundFonts();
  FantasySoundManager.preloadCorrectRootBassSoundFont().catch(() => {});

  if (isIOSWebView()) {
    await FantasySoundManager.init(seVol, rootVol, true).catch(() => undefined);
    return;
  }

  await Promise.all([
    initializeAudioSystem().then(() => {
      updateGlobalVolume(midiVolume ?? 0.8);
    }),
    FantasySoundManager.init(seVol, rootVol, true).then(() => {
      FantasySoundManager.enableRootSound(true);
    }),
  ]);
  FantasySoundManager.ensureContextsRunning();
};

const initBattleAudio = async (): Promise<void> => {
  const { soundEffectVolume, rootSoundVolume, midiVolume } = useGameStore.getState().settings;
  await ensureBattlePianoAudio({
    midiVolume: midiVolume ?? 0.8,
    soundEffectVolume: soundEffectVolume ?? 0.8,
    rootSoundVolume: rootSoundVolume ?? 0.7,
  });
};

export const useGameMidiSession = (audioProfile: GameMidiAudioProfile): GameMidiBindings => {
  const settings = useGameStore((state) => state.settings);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [isMidiInitialized, setIsMidiInitialized] = useState(false);
  const controllerRef = useRef<MIDIController | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const noteHandlerRef = useRef<(note: number) => void>(() => undefined);
  const noteOffHandlerRef = useRef<(note: number) => void>(() => undefined);
  const keyHighlightHandlerRef = useRef<(note: number, active: boolean) => void>(() => undefined);

  useEffect(() => {
    const controller = new MIDIController({
      onNoteOn: (note: number) => {
        noteHandlerRef.current(note);
      },
      onNoteOff: (note: number) => {
        noteOffHandlerRef.current(note);
      },
      playMidiSound: true,
    });
    controller.setConnectionChangeCallback((connected) => {
      setIsMidiConnected(connected);
    });
    controller.setKeyHighlightCallback((note, active) => {
      keyHighlightHandlerRef.current(note, active);
    });
    controllerRef.current = controller;

    const initPromise = (async () => {
      try {
        if (audioProfile === 'survival') {
          await initSurvivalAudio();
        } else {
          await initBattleAudio();
        }
        if (!isIOSWebView()) {
          await controller.initialize();
        }
        setIsMidiInitialized(true);
      } catch {
        setIsMidiInitialized(true);
      }
    })();
    initPromiseRef.current = initPromise;

    return () => {
      void controller.destroy();
      controllerRef.current = null;
      initPromiseRef.current = null;
      setIsMidiInitialized(false);
      setIsMidiConnected(false);
    };
  }, [audioProfile]);

  useEffect(() => {
    let cancelled = false;
    const connect = async () => {
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }
      if (cancelled || !controllerRef.current) {
        return;
      }
      if (settings.inputMethod === 'voice') {
        controllerRef.current.disconnect();
        return;
      }
      const deviceId = settings.selectedMidiDevice;
      if (deviceId) {
        await controllerRef.current.connectDevice(deviceId);
      } else {
        controllerRef.current.disconnect();
      }
    };
    void connect();
    return () => {
      cancelled = true;
    };
  }, [settings.selectedMidiDevice, settings.inputMethod, isMidiInitialized]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume ?? 0.8);
    controllerRef.current?.updateVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

  const registerNoteHandler = useCallback((handler: (note: number) => void) => {
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

  const getMidiController = useCallback(() => controllerRef.current, []);

  return useMemo(
    () => ({
      registerNoteHandler,
      registerNoteOffHandler,
      registerKeyHighlightHandler,
      registerKeyHighlightTarget,
      isMidiConnected,
      isMidiInitialized,
      getMidiController,
    }),
    [
      registerNoteHandler,
      registerNoteOffHandler,
      registerKeyHighlightHandler,
      registerKeyHighlightTarget,
      isMidiConnected,
      isMidiInitialized,
      getMidiController,
    ],
  );
};
