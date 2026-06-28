import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PIXINotesRendererInstance } from '@/components/game/PIXINotesRenderer';
import { getWindow } from '@/platform';

type PixiNotesRendererComponent = React.ComponentType<{
  width: number;
  height: number;
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}>;

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
  onPianoKeyDown: (midiNote: number) => void;
  onPianoKeyUp: (midiNote: number) => void;
}

const PIANO_HEIGHT = 88;
const VISIBLE_WHITE_KEYS = 14;
const TOTAL_WHITE_KEYS = 52;
const C4_WHITE_INDEX = 23;
const FULL_KEYBOARD_WIDTH_THRESHOLD = 1100;

const EarTrainingPianoOverlay = forwardRef<EarTrainingPianoOverlayHandle, EarTrainingPianoOverlayProps>(({
  onPianoKeyDown,
  onPianoKeyUp,
}, ref) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const onPianoKeyDownRef = useRef(onPianoKeyDown);
  const onPianoKeyUpRef = useRef(onPianoKeyUp);
  const hasUserScrolledRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const [renderer, setRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [PixiNotesRenderer, setPixiNotesRenderer] = useState<PixiNotesRendererComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('@/components/game/PIXINotesRenderer')
      .then((mod) => {
        if (!cancelled) {
          setPixiNotesRenderer(() => mod.PIXINotesRenderer);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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

  const layout = useMemo(() => {
    const gameAreaWidth = containerWidth || getWindow().innerWidth;
    if (gameAreaWidth >= FULL_KEYBOARD_WIDTH_THRESHOLD) {
      return { needsScroll: false, pixiWidth: gameAreaWidth };
    }

    const whiteKeyWidth = gameAreaWidth / VISIBLE_WHITE_KEYS;
    return {
      needsScroll: true,
      pixiWidth: Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth),
    };
  }, [containerWidth]);

  const centerPianoC4 = useCallback(() => {
    const container = scrollRef.current;
    if (!container || hasUserScrolledRef.current) {
      return;
    }

    const contentWidth = container.scrollWidth;
    const viewportWidth = container.clientWidth;
    if (!contentWidth || !viewportWidth || contentWidth <= viewportWidth) {
      return;
    }

    const whiteKeyWidth = contentWidth / TOTAL_WHITE_KEYS;
    const c4CenterX = (C4_WHITE_INDEX + 0.5) * whiteKeyWidth;
    const desiredScroll = Math.max(0, Math.min(contentWidth - viewportWidth, c4CenterX - viewportWidth / 2));
    isProgrammaticScrollRef.current = true;
    try {
      container.scrollTo({ left: desiredScroll, behavior: 'auto' });
    } catch {
      container.scrollLeft = desiredScroll;
    }
    container.scrollLeft = desiredScroll;
    getWindow().requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

  const requestCenterPianoC4 = useCallback(() => {
    const platformWindow = getWindow();
    platformWindow.requestAnimationFrame(() => {
      platformWindow.requestAnimationFrame(centerPianoC4);
    });
  }, [centerPianoC4]);

  const handlePianoScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      return;
    }
    hasUserScrolledRef.current = true;
  }, []);

  const shiftPianoOctave = useCallback((direction: -1 | 1) => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    hasUserScrolledRef.current = true;
    const whiteKeyWidth = container.scrollWidth / TOTAL_WHITE_KEYS;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const nextScroll = Math.max(0, Math.min(maxScroll, container.scrollLeft + direction * whiteKeyWidth * 7));
    isProgrammaticScrollRef.current = true;
    container.scrollLeft = nextScroll;
    getWindow().requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

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
    requestCenterPianoC4();
  }, [requestCenterPianoC4]);

  useEffect(() => {
    if (!renderer) {
      return;
    }

    const whiteKeyWidth = (containerWidth || getWindow().innerWidth) / TOTAL_WHITE_KEYS;
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
    renderer.setTouchActionMode(layout.needsScroll ? 'pan-x' : 'none');
    requestCenterPianoC4();
  }, [containerWidth, layout.needsScroll, renderer, requestCenterPianoC4]);

  const piano = PixiNotesRenderer ? (
    <PixiNotesRenderer
      width={layout.pixiWidth}
      height={PIANO_HEIGHT}
      onReady={handleRendererReady}
      className="h-full w-full"
    />
  ) : (
    <div className="h-full w-full bg-slate-900/80" aria-hidden="true" />
  );

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 h-[88px] bg-black/20"
    >
      {layout.needsScroll ? (
        <>
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-x-scroll overflow-y-hidden scrollbar-hidden"
            style={{ touchAction: 'pan-x' }}
            onScroll={handlePianoScroll}
          >
            <div style={{ width: layout.pixiWidth, height: '100%' }}>
              {piano}
            </div>
          </div>
          <div className="pointer-events-auto absolute left-1 top-0 z-10 flex h-7 items-center gap-0.5">
            <button
              type="button"
              aria-label="1 octave left"
              onPointerDown={(event) => {
                event.stopPropagation();
                shiftPianoOctave(-1);
              }}
              className="flex h-7 w-7 select-none items-center justify-center rounded bg-black/60 text-sm text-white/80 active:bg-white/20"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="1 octave right"
              onPointerDown={(event) => {
                event.stopPropagation();
                shiftPianoOctave(1);
              }}
              className="flex h-7 w-7 select-none items-center justify-center rounded bg-black/60 text-sm text-white/80 active:bg-white/20"
            >
              ›
            </button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          {piano}
        </div>
      )}
    </div>
  );
});

EarTrainingPianoOverlay.displayName = 'EarTrainingPianoOverlay';

export default EarTrainingPianoOverlay;
