import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OpenSheetMusicDisplay, type IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';
import { detectMaxStaffLayersFromMusicXml } from '@/utils/earTrainingOsmdMusicXmlStaff';
import type { ChordOsmdMusicXmlAttack } from '@/utils/earTrainingChordOsmd';
import {
  earTrainingOsmdNoteColorForMidiInstance,
  type EarTrainingOsmdHighlightSnapshot,
} from '@/utils/earTrainingOsmdHighlight';
import { chordOsmdAttackLookupKey, matchOsmdClustersToXmlAttacks } from '@/utils/earTrainingOsmdGraphicMatch';

interface EarTrainingChordOSMDScoreProps {
  musicXmlText: string | null;
  scoreErrorText: string | null;
  activeMeasureNumber: number;
  renderKeyValue: number;
  isEnglishCopy: boolean;
  highlightSnapshot: EarTrainingOsmdHighlightSnapshot | null;
  chordOsmdXmlAttacks: readonly ChordOsmdMusicXmlAttack[] | null;
  /** ロビーやリザルト表示中など、譜面を裏に隠したい場合に true。マウントは維持する。 */
  hidden?: boolean;
}

interface OsmdLayout {
  /** MusicXML の小節番号 → 画面上の近似中心（px、譜表スクロール用） */
  measureCentersByNumber: Record<number, number>;
  measureBoundsByNumber: Record<number, { left: number; right: number }>;
  scoreWidth: number;
}

const EMPTY_LAYOUT: OsmdLayout = {
  measureCentersByNumber: {},
  measureBoundsByNumber: {},
  scoreWidth: 0,
};

/** CSS scale に掛けるユーザー調整倍率（OSMD の再 render は避ける）。 */
const USER_ZOOM_MIN = 0.5;
const USER_ZOOM_MAX = 2;
const USER_ZOOM_STEP = 0.1;

const clampUserZoom = (value: number): number =>
  Math.min(USER_ZOOM_MAX, Math.max(USER_ZOOM_MIN, Math.round(value * 10) / 10));

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

type OsmdGraphicMeasureLike = {
  MeasureNumber?: number;
  PositionAndShape?: {
    AbsolutePosition?: { x?: number };
    BorderRight?: number;
  };
  staffEntries?: Array<{
    graphicalVoiceEntries?: Array<{
      notes?: Array<{
        PositionAndShape?: { AbsolutePosition?: { x?: number } };
        sourceNote?: { Pitch?: unknown; TransposedPitch?: unknown };
      }>;
    }>;
  }>;
};

const readMeasureList = (osmd: OpenSheetMusicDisplay): readonly (readonly OsmdGraphicMeasureLike[])[] => {
  const sheet = osmd.GraphicSheet as { MeasureList?: unknown; measureList?: unknown } | undefined;
  const raw = sheet?.MeasureList ?? sheet?.measureList;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as readonly (readonly OsmdGraphicMeasureLike[])[];
};

const collectMeasureCenters = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
  viewportWidth: number,
): OsmdLayout => {
  const boundingWidth = getFiniteNumber(osmd.GraphicSheet?.BoundingBox?.width) ?? 0;
  const renderedWidth = surface?.getBoundingClientRect().width ?? 0;
  const scaleFactor = boundingWidth > 0 && renderedWidth > 0 ? renderedWidth / boundingWidth : 10;

  const measureCentersByNumber: Record<number, number> = {};
  const measureBoundsByNumber: Record<number, { left: number; right: number }> = {};
  let maxX = 0;

  const measureList = readMeasureList(osmd);
  for (let measureIndex = 0; measureIndex < measureList.length; measureIndex += 1) {
    const row = measureList[measureIndex] ?? [];
    const measures = row.filter(Boolean) as OsmdGraphicMeasureLike[];

    if (measures.length === 0) {
      continue;
    }

    const measureNumber = measureIndex + 1;

    let noteMinX = Number.POSITIVE_INFINITY;
    let noteMaxX = Number.NEGATIVE_INFINITY;
    let measureMinX = Number.POSITIVE_INFINITY;
    let measureMaxX = Number.NEGATIVE_INFINITY;

    for (const measure of measures) {
      const measureX = getFiniteNumber(measure.PositionAndShape?.AbsolutePosition?.x);
      const measureWidth = getFiniteNumber(measure.PositionAndShape?.BorderRight) ?? 0;

      if (measureX !== null) {
        const scaledMeasureX = measureX * scaleFactor;
        measureMinX = Math.min(measureMinX, scaledMeasureX);
        measureMaxX = Math.max(measureMaxX, scaledMeasureX + measureWidth * scaleFactor);
      }

      for (const entry of measure.staffEntries ?? []) {
        for (const voiceEntry of entry.graphicalVoiceEntries ?? []) {
          for (const note of voiceEntry.notes ?? []) {
            if (!note.sourceNote?.Pitch && !note.sourceNote?.TransposedPitch) {
              continue;
            }
            const x = getFiniteNumber(note.PositionAndShape?.AbsolutePosition?.x);
            if (x !== null) {
              const scaledX = x * scaleFactor;
              noteMinX = Math.min(noteMinX, scaledX);
              noteMaxX = Math.max(noteMaxX, scaledX);
              maxX = Math.max(maxX, scaledX);
            }
          }
        }
      }
    }

    if (Number.isFinite(noteMinX) && Number.isFinite(noteMaxX)) {
      measureCentersByNumber[measureNumber] = (noteMinX + noteMaxX) / 2;
      measureBoundsByNumber[measureNumber] = { left: noteMinX, right: noteMaxX };
    } else if (Number.isFinite(measureMinX) && Number.isFinite(measureMaxX)) {
      measureCentersByNumber[measureNumber] = (measureMinX + measureMaxX) / 2;
      measureBoundsByNumber[measureNumber] = { left: measureMinX, right: measureMaxX };
    }
  }

  const scoreWidth = Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2);
  return {
    measureCentersByNumber,
    measureBoundsByNumber,
    scoreWidth,
  };
};

const collectMeasureCentersFromStaffLines = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
  viewportWidth: number,
): OsmdLayout => {
  const boundingWidth = getFiniteNumber(osmd.GraphicSheet?.BoundingBox?.width) ?? 0;
  const renderedWidth = surface?.getBoundingClientRect().width ?? 0;
  const scaleFactor = boundingWidth > 0 && renderedWidth > 0 ? renderedWidth / boundingWidth : 10;

  const byNumberBounds: Record<number, { nMin: number; nMax: number; mMin: number; mMax: number }> = {};
  let maxX = 0;

  const pages = osmd.GraphicSheet?.MusicPages ?? [];
  let measureOrdinal = 0;
  for (const page of pages) {
    for (const system of page.MusicSystems ?? []) {
      for (const staffLine of system.StaffLines ?? []) {
        for (const measure of staffLine.Measures ?? []) {
          measureOrdinal += 1;
          const mn = measureOrdinal;

          let b = byNumberBounds[mn];
          if (!b) {
            b = {
              nMin: Number.POSITIVE_INFINITY,
              nMax: Number.NEGATIVE_INFINITY,
              mMin: Number.POSITIVE_INFINITY,
              mMax: Number.NEGATIVE_INFINITY,
            };
            byNumberBounds[mn] = b;
          }

          const measureLike = measure as OsmdGraphicMeasureLike;
          const measureX = getFiniteNumber(measureLike.PositionAndShape?.AbsolutePosition?.x);
          const measureWidth = getFiniteNumber(measureLike.PositionAndShape?.BorderRight) ?? 0;
          if (measureX !== null) {
            const smx = measureX * scaleFactor;
            b.mMin = Math.min(b.mMin, smx);
            b.mMax = Math.max(b.mMax, smx + measureWidth * scaleFactor);
          }

          for (const entry of measureLike.staffEntries ?? []) {
            for (const voiceEntry of entry.graphicalVoiceEntries ?? []) {
              for (const note of voiceEntry.notes ?? []) {
                if (!note.sourceNote?.Pitch && !note.sourceNote?.TransposedPitch) {
                  continue;
                }
                const x = getFiniteNumber(note.PositionAndShape?.AbsolutePosition?.x);
                if (x !== null) {
                  const sx = x * scaleFactor;
                  b.nMin = Math.min(b.nMin, sx);
                  b.nMax = Math.max(b.nMax, sx);
                  maxX = Math.max(maxX, sx);
                }
              }
            }
          }
        }
      }
    }
  }

  const measureCentersByNumber: Record<number, number> = {};
  const measureBoundsByNumber: Record<number, { left: number; right: number }> = {};
  for (const [mnStr, b] of Object.entries(byNumberBounds)) {
    const mn = Number(mnStr);
    if (Number.isFinite(b.nMin) && Number.isFinite(b.nMax)) {
      measureCentersByNumber[mn] = (b.nMin + b.nMax) / 2;
      measureBoundsByNumber[mn] = { left: b.nMin, right: b.nMax };
    } else if (Number.isFinite(b.mMin) && Number.isFinite(b.mMax)) {
      measureCentersByNumber[mn] = (b.mMin + b.mMax) / 2;
      measureBoundsByNumber[mn] = { left: b.mMin, right: b.mMax };
    }
  }

  return {
    measureCentersByNumber,
    measureBoundsByNumber,
    scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
  };
};

type OpenSheetMusicDisplayZoomable = OpenSheetMusicDisplay & {
  zoom: number;
};

const waitNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });

const measureLayoutFromOsmd = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
  viewportWidth: number,
): OsmdLayout => {
  const primary = collectMeasureCenters(osmd, surface, viewportWidth);
  const primaryKeys = Object.keys(primary.measureCentersByNumber);
  if (primaryKeys.length > 0) {
    return primary;
  }
  return collectMeasureCentersFromStaffLines(osmd, surface, viewportWidth);
};

const OSMD_NOTE_COLORING: {
  applyToNoteheads: boolean;
  applyToStem: boolean;
  applyToBeams: boolean;
  applyToFlag: boolean;
  applyToLedgerLines: boolean;
  applyToTies: boolean;
  applyToSlurs: boolean;
} = {
  applyToNoteheads: true,
  applyToStem: true,
  applyToBeams: true,
  applyToFlag: true,
  applyToLedgerLines: true,
  applyToTies: true,
  applyToSlurs: true,
};

type GraphicalNoteColorable = {
  setColor?: (color: string, opts: typeof OSMD_NOTE_COLORING) => void;
};

const EarTrainingChordOSMDScore: React.FC<EarTrainingChordOSMDScoreProps> = ({
  musicXmlText,
  scoreErrorText,
  activeMeasureNumber,
  renderKeyValue,
  isEnglishCopy,
  highlightSnapshot,
  chordOsmdXmlAttacks,
  hidden = false,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const attackIndexRef = useRef<Map<string, Map<number, GraphicalNoteColorable[]>>>(new Map());
  const coloredNotesRef = useRef<Set<GraphicalNoteColorable>>(new Set());
  const chordOsmdXmlAttacksRef = useRef(chordOsmdXmlAttacks);
  chordOsmdXmlAttacksRef.current = chordOsmdXmlAttacks;

  const [layout, setLayout] = useState<OsmdLayout>(EMPTY_LAYOUT);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [cssScale, setCssScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1.9);
  const [mobileLandscapeOsmdShrink, setMobileLandscapeOsmdShrink] = useState(false);

  const activeBand = useMemo(() => {
    const mn = Math.max(1, Math.floor(activeMeasureNumber));
    const b = layout.measureBoundsByNumber[mn];
    if (!b) {
      return null;
    }
    return { left: b.left, width: Math.max(4, b.right - b.left) };
  }, [activeMeasureNumber, layout.measureBoundsByNumber]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(max-height: 500px) and (orientation: landscape)');
    const apply = (): void => {
      setMobileLandscapeOsmdShrink(mq.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
    };
  }, []);

  const renderScore = useCallback(async () => {
    const score = scoreRef.current;
    const wrap = wrapperRef.current;
    if (!score || !musicXmlText) {
      setLayout(EMPTY_LAYOUT);
      if (wrap) {
        wrap.style.width = '';
      }
      attackIndexRef.current = new Map();
      return;
    }

    setIsRendering(true);
    setRenderError(null);
    score.replaceChildren();
    osmdRef.current?.clear();
    osmdRef.current = null;
    attackIndexRef.current = new Map();

    const options: IOSMDOptions = {
      backend: 'svg',
      autoResize: false,
      drawTitle: false,
      drawComposer: false,
      drawLyricist: false,
      drawPartNames: false,
      drawingParameters: 'compacttight',
      renderSingleHorizontalStaffline: true,
      pageFormat: 'Endless',
      defaultColorMusic: '#ffffff',
      defaultColorNotehead: '#ffffff',
      defaultColorStem: '#ffffff',
      defaultColorLabel: '#ffffff',
      defaultColorTitle: '#ffffff',
      defaultColorLyrics: '#ffffff',
    };

    try {
      const osmd = new OpenSheetMusicDisplay(score, options);
      osmdRef.current = osmd;
      await osmd.load(musicXmlText);
      const maxStaff = detectMaxStaffLayersFromMusicXml(musicXmlText);
      const viewportEl = viewportRef.current;
      const viewportHeight = viewportEl?.clientHeight ?? 0;
      const shortScoreViewport = viewportHeight > 0 && viewportHeight <= 320;
      const osmdZoom =
        maxStaff >= 2 && (mobileLandscapeOsmdShrink || shortScoreViewport) ? 2 / 3 : 1;
      (osmd as OpenSheetMusicDisplayZoomable).zoom = osmdZoom;
      if (wrap) {
        wrap.style.transform = 'translate3d(0, -50%, 0) scale(1)';
      }
      osmd.render();
      await waitNextPaint();

      const readSurface = (): { el: HTMLElement | null; height: number } => {
        const el = score.querySelector('svg, canvas');
        if (!el) {
          return { el: null, height: 0 };
        }
        const rect = el.getBoundingClientRect();
        const height = rect.height || (el instanceof HTMLCanvasElement ? el.height : 0);
        return { el: el as HTMLElement, height };
      };

      const aggressiveShrink = maxStaff >= 2;
      const targetHeight = Math.max(48, viewportHeight * (aggressiveShrink ? 0.72 : 0.94));
      const { el: surfaceEl, height: measuredBeforeScale } = readSurface();
      const nextCssScale =
        measuredBeforeScale > targetHeight && measuredBeforeScale > 0
          ? Math.max(0.28, targetHeight / measuredBeforeScale)
          : 1;
      if (wrap) {
        wrap.style.transform = `translate3d(0, -50%, 0) scale(${nextCssScale})`;
      }
      setCssScale(nextCssScale);
      await waitNextPaint();

      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const nextLayout = measureLayoutFromOsmd(osmd, surfaceEl, viewportWidth);
      setLayout(nextLayout);
      if (wrap && nextLayout.scoreWidth > 0) {
        wrap.style.width = `${nextLayout.scoreWidth}px`;
      }

      const attacks = chordOsmdXmlAttacksRef.current;
      if (attacks && attacks.length > 0) {
        attackIndexRef.current = matchOsmdClustersToXmlAttacks(osmd, attacks) as Map<
          string,
          Map<number, GraphicalNoteColorable[]>
        >;
      } else {
        attackIndexRef.current = new Map();
      }
    } catch {
      setRenderError(isEnglishCopy ? 'Could not render MusicXML.' : 'MusicXMLを表示できませんでした');
      setLayout(EMPTY_LAYOUT);
      attackIndexRef.current = new Map();
      if (wrap) {
        wrap.style.width = '';
      }
    } finally {
      setIsRendering(false);
    }
  }, [isEnglishCopy, musicXmlText, mobileLandscapeOsmdShrink]);

  useEffect(() => {
    void renderScore();
    return () => {
      osmdRef.current?.clear();
      osmdRef.current = null;
    };
  }, [renderKeyValue, renderScore]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const wrap = wrapperRef.current;
    if (!viewport || !wrap) {
      return;
    }
    const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
    const byNum = layout.measureCentersByNumber;
    const center = byNum[measureNumber] ?? byNum[1] ?? viewport.clientWidth / 2;
    const effectiveScale = cssScale * userZoom;
    const maxOffset = Math.max(0, layout.scoreWidth * effectiveScale - viewport.clientWidth);
    const offset = Math.max(
      0,
      Math.min(maxOffset, center * effectiveScale - viewport.clientWidth / 2),
    );
    wrap.style.transform = `translate3d(${-offset}px, -50%, 0) scale(${effectiveScale})`;
  }, [activeMeasureNumber, cssScale, layout, userZoom]);

  useEffect(() => {
    if (isRendering) {
      return;
    }
    for (const gn of coloredNotesRef.current) {
      gn.setColor?.('#ffffff', OSMD_NOTE_COLORING);
    }
    coloredNotesRef.current.clear();

    if (!highlightSnapshot || !osmdRef.current) {
      return;
    }

    const index = attackIndexRef.current;
    for (const row of highlightSnapshot.targets) {
      if (row.phase === 'idle' || row.beatOffset === null) {
        continue;
      }
      const key = chordOsmdAttackLookupKey(row.measureNumber, row.beatOffset);
      const byMidi = index.get(key);
      if (!byMidi) {
        continue;
      }
      const totalByMidi = new Map<number, number>();
      for (const { midi, count } of row.midiCounts) {
        totalByMidi.set(midi, count);
      }
      for (const [midi, gnotes] of byMidi) {
        const total = totalByMidi.get(midi) ?? 0;
        const rem = row.remainingByMidi[String(midi)] ?? 0;
        gnotes.forEach((gn, instanceIndex) => {
          const color = earTrainingOsmdNoteColorForMidiInstance(
            row.phase,
            instanceIndex,
            total,
            rem,
          );
          gn.setColor?.(color, OSMD_NOTE_COLORING);
          coloredNotesRef.current.add(gn);
        });
      }
    }
  }, [highlightSnapshot, isRendering, renderKeyValue]);

  const statusText = renderError ?? scoreErrorText;

  return (
    <>
      <div
        ref={viewportRef}
        aria-hidden={hidden}
        className={cn(
          'ear-training-osmd-score pointer-events-none absolute left-1/2 top-[42%] z-10 h-[min(280px,42vh)] w-[min(860px,86vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden',
          hidden && 'invisible',
        )}
      >
        <div
          ref={wrapperRef}
          className={cn(
            'absolute left-0 top-1/2 min-w-full origin-left transition-transform duration-150 ease-out',
          )}
        >
          {!hidden && musicXmlText && activeBand !== null && (
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-[1] rounded-sm bg-[rgba(243,152,0,0.12)]"
              style={{ left: activeBand.left, width: activeBand.width }}
              aria-hidden
            />
          )}
          <div
            ref={scoreRef}
            className={cn(
              'relative z-[2] min-w-full [&_canvas]:!bg-transparent [&_svg]:!bg-transparent',
            )}
          />
        </div>
        {(isRendering || statusText) && (
          <div className="absolute inset-0 z-[5] grid place-items-center text-center text-xs font-semibold text-white/75">
            {statusText ?? (isEnglishCopy ? 'Rendering score...' : '譜面を表示中…')}
          </div>
        )}
      </div>
      {!hidden && musicXmlText && (
        <div
          className={cn(
            'pointer-events-auto fixed right-[max(12px,env(safe-area-inset-right))] top-[42%] z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-md border border-white/15 bg-slate-900/70 py-1 px-1 text-xs font-semibold text-white shadow-sm',
          )}
        >
          <button
            type="button"
            aria-label={isEnglishCopy ? 'Zoom in' : '拡大'}
            disabled={userZoom >= USER_ZOOM_MAX}
            className={cn(
              'flex h-7 min-w-[1.75rem] items-center justify-center rounded border border-white/20 bg-white/10',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'hover:bg-white/20 active:bg-white/25',
            )}
            onClick={() => {
              setUserZoom(previous => clampUserZoom(previous + USER_ZOOM_STEP));
            }}
          >
            +
          </button>
          <span className="min-w-[2.75rem] select-none text-center tabular-nums text-[11px] text-white/90">
            {Math.round(userZoom * 100)}
            %
          </span>
          <button
            type="button"
            aria-label={isEnglishCopy ? 'Zoom out' : '縮小'}
            disabled={userZoom <= USER_ZOOM_MIN}
            className={cn(
              'flex h-7 min-w-[1.75rem] items-center justify-center rounded border border-white/20 bg-white/10',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'hover:bg-white/20 active:bg-white/25',
            )}
            onClick={() => {
              setUserZoom(previous => clampUserZoom(previous - USER_ZOOM_STEP));
            }}
          >
            −
          </button>
        </div>
      )}
    </>
  );
};

export default EarTrainingChordOSMDScore;
