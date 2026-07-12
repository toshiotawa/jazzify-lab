import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PIXINotesRenderer, type PIXINotesRendererInstance } from '@/components/piano/PIXINotesRenderer';
import { getWindow } from '@/platform';
import { countWhiteKeysInMidiRange } from '@/utils/webKeyboardDisplayRange';

export interface EarTrainingPianoOverlayHandle {
  highlightKey: (midiNote: number, active: boolean) => void;
  setVoicingHints: (pendingMidiNotes: readonly number[], completedMidiNotes: readonly number[]) => void;
  setVoicingHintsByIntensity: (
    strongMidis: readonly number[],
    mediumMidis: readonly number[],
    softMidis: readonly number[],
    completedMidiNotes: readonly number[],
  ) => void;
  clearVoicingHints: () => void;
}

interface EarTrainingPianoOverlayProps {
  minMidi: number;
  maxMidi: number;
  onPianoKeyDown: (midiNote: number) => void;
  onPianoKeyUp: (midiNote: number) => void;
}

const PIANO_HEIGHT = 88;

const EarTrainingPianoOverlay = forwardRef<EarTrainingPianoOverlayHandle, EarTrainingPianoOverlayProps>(({
  minMidi,
  maxMidi,
  onPianoKeyDown,
  onPianoKeyUp,
}, ref) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const onPianoKeyDownRef = useRef(onPianoKeyDown);
  const onPianoKeyUpRef = useRef(onPianoKeyUp);
  const [renderer, setRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    onPianoKeyDownRef.current = onPianoKeyDown;
  }, [onPianoKeyDown]);

  useEffect(() => {
    onPianoKeyUpRef.current = onPianoKeyUp;
  }, [onPianoKeyUp]);

  useImperativeHandle(ref, () => ({
    highlightKey: (midiNote, active) => rendererRef.current?.highlightKey(midiNote, active),
    setVoicingHints: (pendingMidiNotes, completedMidiNotes) => {
      rendererRef.current?.setVoicingHints(pendingMidiNotes, completedMidiNotes);
    },
    setVoicingHintsByIntensity: (strongMidis, mediumMidis, softMidis, completedMidiNotes) => {
      rendererRef.current?.setVoicingHintsByIntensity(strongMidis, mediumMidis, softMidis, completedMidiNotes);
    },
    clearVoicingHints: () => {
      rendererRef.current?.clearVoicingHints();
    },
  }), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const updateWidth = () => {
      setContainerWidth(Math.max(320, Math.floor(root.clientWidth || getWindow().innerWidth)));
    };
    updateWidth();

    const platformWindow = getWindow();
    platformWindow.addEventListener('resize', updateWidth);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateWidth);
      observer.observe(root);
    }

    return () => {
      platformWindow.removeEventListener('resize', updateWidth);
      observer?.disconnect();
    };
  }, []);

  const whiteKeyCount = useMemo(
    () => countWhiteKeysInMidiRange(minMidi, maxMidi),
    [minMidi, maxMidi],
  );

  const handleRendererReady = useCallback((nextRenderer: PIXINotesRendererInstance | null) => {
    rendererRef.current = nextRenderer;
    setRenderer(nextRenderer);
    if (!nextRenderer) {
      return;
    }

    nextRenderer.setKeyCallbacks(
      note => onPianoKeyDownRef.current(note),
      note => onPianoKeyUpRef.current(note),
    );
  }, []);

  useEffect(() => {
    if (!renderer) {
      return;
    }

    const viewportWidth = containerWidth || getWindow().innerWidth;
    const whiteKeyWidth = viewportWidth / Math.max(1, whiteKeyCount);
    renderer.updateSettings({
      noteNameStyle: 'abc',
      simpleDisplayMode: true,
      pianoHeight: PIANO_HEIGHT,
      noteHeight: 12,
      noteWidth: Math.max(whiteKeyWidth - 2, 16),
      transpose: 0,
      transposingInstrument: 'concert_pitch',
      practiceGuide: 'off',
      showHitLine: false,
      viewportHeight: PIANO_HEIGHT,
      timingAdjustment: 0,
    });
    renderer.setTouchActionMode('none');
  }, [containerWidth, renderer, whiteKeyCount]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 h-[88px] bg-black/20"
    >
      <div className="absolute inset-0 overflow-hidden">
        <PIXINotesRenderer
          width={containerWidth || getWindow().innerWidth}
          height={PIANO_HEIGHT}
          minMidi={minMidi}
          maxMidi={maxMidi}
          onReady={handleRendererReady}
          className="h-full w-full"
        />
      </div>
    </div>
  );
});

EarTrainingPianoOverlay.displayName = 'EarTrainingPianoOverlay';

export default EarTrainingPianoOverlay;
