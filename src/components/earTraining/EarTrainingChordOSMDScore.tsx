import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay, type IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';

interface EarTrainingChordOSMDScoreProps {
  musicXmlText: string | null;
  scoreErrorText: string | null;
  activeMeasureNumber: number;
  renderKeyValue: number;
  isEnglishCopy: boolean;
  /** ロビーやリザルト表示中など、譜面を裏に隠したい場合に true。マウントは維持する。 */
  hidden?: boolean;
}

interface OsmdLayout {
  /** MusicXML の小節番号 → 画面上の近似中心（px、譜表スクロール用） */
  measureCentersByNumber: Record<number, number>;
  scoreWidth: number;
}

const EMPTY_LAYOUT: OsmdLayout = {
  measureCentersByNumber: {},
  scoreWidth: 0,
};

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
  let maxX = 0;

  const measureList = readMeasureList(osmd);
  for (let measureIndex = 0; measureIndex < measureList.length; measureIndex += 1) {
    const row = measureList[measureIndex] ?? [];
    const measures = row.filter(Boolean) as OsmdGraphicMeasureLike[];

    if (measures.length === 0) {
      continue;
    }

    // OSMD の MeasureNumber プロパティが MusicXML の `<measure number=>` と一致しないため、
    // 表示用のキーは MusicXML の出現順 (1-indexed) を強制する。`activeMeasureNumber` も 1-indexed なのでこれで整合する。
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
    } else if (Number.isFinite(measureMinX) && Number.isFinite(measureMaxX)) {
      measureCentersByNumber[measureNumber] = (measureMinX + measureMaxX) / 2;
    }
  }

  const scoreWidth = Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2);
  return {
    measureCentersByNumber,
    scoreWidth,
  };
};

/** MeasureList が使えない OSMD／描画状態向けフォールバック（全 StaffLine の同一小節番号でノート X を統合）。 */
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
          // MeasureNumber プロパティは信用せず、StaffLines を横断した出現順 (1-indexed) を採用する。
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
  for (const [mnStr, b] of Object.entries(byNumberBounds)) {
    const mn = Number(mnStr);
    if (Number.isFinite(b.nMin) && Number.isFinite(b.nMax)) {
      measureCentersByNumber[mn] = (b.nMin + b.nMax) / 2;
    } else if (Number.isFinite(b.mMin) && Number.isFinite(b.mMax)) {
      measureCentersByNumber[mn] = (b.mMin + b.mMax) / 2;
    }
  }

  return {
    measureCentersByNumber,
    scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
  };
};

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

const EarTrainingChordOSMDScore: React.FC<EarTrainingChordOSMDScoreProps> = ({
  musicXmlText,
  scoreErrorText,
  activeMeasureNumber,
  renderKeyValue,
  isEnglishCopy,
  hidden = false,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [layout, setLayout] = useState<OsmdLayout>(EMPTY_LAYOUT);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const renderScore = useCallback(async () => {
    const score = scoreRef.current;
    if (!score || !musicXmlText) {
      setLayout(EMPTY_LAYOUT);
      return;
    }

    setIsRendering(true);
    setRenderError(null);
    score.replaceChildren();
    osmdRef.current?.clear();
    osmdRef.current = null;

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
      osmd.render();
      const surface = score.querySelector('svg, canvas');
      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const nextLayout = measureLayoutFromOsmd(osmd, surface, viewportWidth);
      setLayout(nextLayout);
    } catch {
      setRenderError(isEnglishCopy ? 'Could not render MusicXML.' : 'MusicXMLを表示できませんでした');
      setLayout(EMPTY_LAYOUT);
    } finally {
      setIsRendering(false);
    }
  }, [isEnglishCopy, musicXmlText]);

  useEffect(() => {
    void renderScore();
    return () => {
      osmdRef.current?.clear();
      osmdRef.current = null;
    };
  }, [renderKeyValue, renderScore]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const score = scoreRef.current;
    if (!viewport || !score) {
      return;
    }
    const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
    const byNum = layout.measureCentersByNumber;
    const center = byNum[measureNumber] ?? byNum[1] ?? viewport.clientWidth / 2;
    const maxOffset = Math.max(0, layout.scoreWidth - viewport.clientWidth);
    const offset = Math.max(0, Math.min(maxOffset, center - viewport.clientWidth / 2));
    score.style.transform = `translate3d(${-offset}px, -50%, 0)`;
  }, [activeMeasureNumber, layout]);

  const statusText = renderError ?? scoreErrorText;

  return (
    <div
      ref={viewportRef}
      aria-hidden={hidden}
      className={cn(
        'ear-training-osmd-score pointer-events-none absolute left-1/2 top-[42%] z-10 h-[min(280px,42vh)] w-[min(860px,86vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden',
        hidden && 'invisible',
      )}
    >
      <div
        ref={scoreRef}
        className={cn(
          'absolute left-0 top-1/2 min-w-full origin-left transition-transform duration-150 ease-out',
          '[&_canvas]:!bg-transparent [&_svg]:!bg-transparent',
        )}
      />
      {(isRendering || statusText) && (
        <div className="absolute inset-0 grid place-items-center text-center text-xs font-semibold text-white/75">
          {statusText ?? (isEnglishCopy ? 'Rendering score...' : '譜面を表示中…')}
        </div>
      )}
    </div>
  );
};

export default EarTrainingChordOSMDScore;
