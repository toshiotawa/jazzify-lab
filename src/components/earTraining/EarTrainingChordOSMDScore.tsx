import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OpenSheetMusicDisplay, type IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';
import {
  OSMD_BATTLE_PLAYHEAD_PX,
  clampOsmdManualScrollOffset,
  computeOsmdActiveMeasureHighlight,
  computeOsmdMeasureJumpScrollOffset,
  type OsmdMeasureBounds,
} from '@/utils/earTrainingChordOsmdScoreScroll';
import { detectMaxStaffLayersFromMusicXml } from '@/utils/earTrainingOsmdMusicXmlStaff';
import {
  clampEarTrainingOsmdUserZoom,
  EAR_TRAINING_OSMD_USER_ZOOM_MAX,
  EAR_TRAINING_OSMD_USER_ZOOM_MIN,
  EAR_TRAINING_OSMD_USER_ZOOM_STEP,
  loadEarTrainingOsmdUserZoom,
  saveEarTrainingOsmdUserZoom,
} from '@/utils/earTrainingOsmdScorePreferences';
import { stripLyricsFromMusicXml } from '@/utils/musicXmlMapper';

interface EarTrainingChordOSMDScoreProps {
  musicXmlText: string | null;
  scoreErrorText: string | null;
  activeMeasureNumber: number;
  /** 小節内プレイヘッドが左→右へ流れる時間（秒）。BPM × 拍子から算出。 */
  measureDurationSec: number;
  /** イベント駆動の phrase タイムライン秒。未指定時は小節頭（progress 0）からアニメ。 */
  phraseTimelineSec?: number;
  /** countIn / playingPhrase 中のみ true。未指定時は scrollActive に追随。 */
  playheadAnimating?: boolean;
  scrollActive: boolean;
  renderKeyValue: number;
  isEnglishCopy: boolean;
  /** ロビーやリザルト表示中など、譜面を裏に隠したい場合に true。マウントは維持する。 */
  hidden?: boolean;
  /** ロビー時は Phaser より下（`z-0`）、プレイ中は `z-10` など。 */
  scoreZClassName?: string;
  /** true のときプレイヘッドは ref.syncPlayhead のみで更新（React props/effect 不使用）。 */
  useImperativePlayhead?: boolean;
  /** 親コンテナ（譜面バンド等）いっぱいに描画する。 */
  fillParent?: boolean;
  /** 一時停止中の手動水平スクロール（判定・プレイヘッド位置には影響しない）。 */
  manualScrollEnabled?: boolean;
}

export interface OsmdPlayheadSyncParams {
  phraseTimelineSec: number;
  activeMeasureNumber: number;
  animating: boolean;
}

export interface EarTrainingChordOSMDScoreHandle {
  syncPlayhead: (params: OsmdPlayheadSyncParams) => void;
}

interface ApplyPlayheadDomParams {
  playhead: HTMLDivElement;
  highlightWidthPx: number;
  measureDurationSec: number;
  phraseTimelineSec: number;
  activeMeasureNumber: number;
  animating: boolean;
}

const applyPlayheadDom = ({
  playhead,
  highlightWidthPx,
  measureDurationSec,
  phraseTimelineSec,
  activeMeasureNumber,
  animating,
}: ApplyPlayheadDomParams): void => {
  const safeMeasureDurationSec = Math.max(1e-6, measureDurationSec);
  const timeInMeasure = phraseTimelineSec - (activeMeasureNumber - 1) * safeMeasureDurationSec;
  const progress = Math.max(0, Math.min(1, timeInMeasure / safeMeasureDurationSec));
  const leftPx = progress * highlightWidthPx;

  if (!animating) {
    playhead.style.transition = 'none';
    playhead.style.left = `${leftPx}px`;
    return;
  }

  const remainingMs = Math.max(100, (1 - progress) * safeMeasureDurationSec * 1000);
  playhead.style.transition = 'none';
  playhead.style.left = `${leftPx}px`;
  void playhead.offsetWidth;
  requestAnimationFrame(() => {
    playhead.style.transition = `left ${remainingMs}ms linear`;
    playhead.style.left = `${highlightWidthPx}px`;
  });
};

interface OsmdLayout {
  /** MusicXML の小節番号 → 画面上の近似中心（px、フォールバック用） */
  measureCentersByNumber: Record<number, number>;
  /** MusicXML の小節番号 → 左/右境界（px、連続スクロール用） */
  measureBoundsByNumber: Record<number, OsmdMeasureBounds>;
  scoreWidth: number;
}

const EMPTY_LAYOUT: OsmdLayout = {
  measureCentersByNumber: {},
  measureBoundsByNumber: {},
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

const assignMeasureLayout = (
  measureNumber: number,
  noteMinX: number,
  noteMaxX: number,
  measureMinX: number,
  measureMaxX: number,
  measureCentersByNumber: Record<number, number>,
  measureBoundsByNumber: Record<number, OsmdMeasureBounds>,
): void => {
  const left = Number.isFinite(measureMinX) ? measureMinX : noteMinX;
  const right = Number.isFinite(measureMaxX) ? measureMaxX : noteMaxX;
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return;
  }
  measureCentersByNumber[measureNumber] = (left + right) / 2;
  const boundsEntry: OsmdMeasureBounds = { left, right };
  if (Number.isFinite(noteMinX)) {
    boundsEntry.noteLeft = noteMinX;
  }
  if (Number.isFinite(noteMaxX)) {
    boundsEntry.noteRight = noteMaxX;
  }
  measureBoundsByNumber[measureNumber] = boundsEntry;
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
  const measureBoundsByNumber: Record<number, OsmdMeasureBounds> = {};
  let maxX = 0;

  const measureList = readMeasureList(osmd);
  let measureOrdinal = 0;
  for (let measureIndex = 0; measureIndex < measureList.length; measureIndex += 1) {
    const row = measureList[measureIndex] ?? [];
    const measures = row.filter(Boolean) as OsmdGraphicMeasureLike[];

    if (measures.length === 0) {
      continue;
    }

    for (const measure of measures) {
      measureOrdinal += 1;
      const measureNumber = measureOrdinal;

      let noteMinX = Number.POSITIVE_INFINITY;
      let noteMaxX = Number.NEGATIVE_INFINITY;
      let measureMinX = Number.POSITIVE_INFINITY;
      let measureMaxX = Number.NEGATIVE_INFINITY;

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

      assignMeasureLayout(
        measureNumber,
        noteMinX,
        noteMaxX,
        measureMinX,
        measureMaxX,
        measureCentersByNumber,
        measureBoundsByNumber,
      );
    }
  }

  const scoreWidth = Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2);
  return {
    measureCentersByNumber,
    measureBoundsByNumber,
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
  const measureBoundsByNumber: Record<number, OsmdMeasureBounds> = {};
  for (const [mnStr, b] of Object.entries(byNumberBounds)) {
    assignMeasureLayout(
      Number(mnStr),
      b.nMin,
      b.nMax,
      b.mMin,
      b.mMax,
      measureCentersByNumber,
      measureBoundsByNumber,
    );
  }

  return {
    measureCentersByNumber,
    measureBoundsByNumber,
    scoreWidth: Math.max(viewportWidth, renderedWidth, maxX + viewportWidth / 2),
  };
};

/** OSMD のランタイム設定（型定義に無い `zoom` を安全に触る）。 */
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

/** compacttight の水平圧縮を緩め、1小節目の記号後に音符が押し出されにくくする。 */
const relaxOsmdCompactTightSpacingForBattle = (osmd: OpenSheetMusicDisplay): void => {
  const zoomable = osmd as OpenSheetMusicDisplay & {
    EngravingRules?: {
      ClefRightMargin?: number;
      RhythmRightMargin?: number;
      VoiceSpacingMultiplierVexflow?: number;
      VoiceSpacingAddendVexflow?: number;
      SoftmaxFactorVexFlow?: number;
    };
    rules?: {
      ClefRightMargin?: number;
      RhythmRightMargin?: number;
      VoiceSpacingMultiplierVexflow?: number;
      VoiceSpacingAddendVexflow?: number;
      SoftmaxFactorVexFlow?: number;
    };
  };
  const rules = zoomable.EngravingRules ?? zoomable.rules;
  if (!rules) {
    return;
  }
  rules.ClefRightMargin = 1;
  rules.RhythmRightMargin = 2.5;
  rules.VoiceSpacingMultiplierVexflow = 1;
  rules.VoiceSpacingAddendVexflow = 5;
  if (typeof rules.SoftmaxFactorVexFlow === 'number' && rules.SoftmaxFactorVexFlow < 10) {
    rules.SoftmaxFactorVexFlow = 10;
  }
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

const EarTrainingChordOSMDScore = memo(forwardRef<EarTrainingChordOSMDScoreHandle, EarTrainingChordOSMDScoreProps>(
  function EarTrainingChordOSMDScore({
  musicXmlText,
  scoreErrorText,
  activeMeasureNumber,
  measureDurationSec,
  phraseTimelineSec,
  playheadAnimating,
  scrollActive,
  renderKeyValue,
  isEnglishCopy,
  hidden = false,
  scoreZClassName = 'z-10',
  useImperativePlayhead = false,
  fillParent = false,
  manualScrollEnabled = false,
}, ref) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const measureHighlightRef = useRef<HTMLDivElement | null>(null);
  const measurePlayheadRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [layout, setLayout] = useState<OsmdLayout>(EMPTY_LAYOUT);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [cssScale, setCssScale] = useState(1);
  const [userZoom, setUserZoom] = useState(loadEarTrainingOsmdUserZoom);
  const [scrollOffsetPx, setScrollOffsetPx] = useState(0);
  const scrollOffsetPxRef = useRef(0);
  const manualScrollOffsetPxRef = useRef(0);
  const measureHighlightBaseLeftPxRef = useRef(0);
  const isManualDraggingRef = useRef(false);
  const manualDragStartClientXRef = useRef(0);
  const manualDragStartOffsetPxRef = useRef(0);
  const cssScaleRef = useRef(1);
  const userZoomRef = useRef(loadEarTrainingOsmdUserZoom());
  const layoutRef = useRef<OsmdLayout>(EMPTY_LAYOUT);
  const [mobileLandscapeOsmdShrink, setMobileLandscapeOsmdShrink] = useState(false);
  const pendingPlayheadSyncRef = useRef<OsmdPlayheadSyncParams | null>(null);

  cssScaleRef.current = cssScale;
  userZoomRef.current = userZoom;
  layoutRef.current = layout;

  const applyScoreTransform = useCallback((baseOffsetPx: number, manualOffsetPx: number): void => {
    const score = scoreRef.current;
    if (!score) {
      return;
    }
    const effectiveScale = cssScaleRef.current * userZoomRef.current;
    const totalOffsetPx = baseOffsetPx + manualOffsetPx;
    score.style.transform = `translate3d(${-totalOffsetPx}px, -50%, 0) scale(${effectiveScale})`;
  }, []);

  const applyHighlightLeftWithManual = useCallback((baseLeftPx: number, manualOffsetPx: number): void => {
    const highlight = measureHighlightRef.current;
    if (!highlight) {
      return;
    }
    measureHighlightBaseLeftPxRef.current = baseLeftPx;
    highlight.style.left = `${baseLeftPx - manualOffsetPx}px`;
  }, []);

  const resetManualScroll = useCallback((): void => {
    manualScrollOffsetPxRef.current = 0;
    isManualDraggingRef.current = false;
    applyScoreTransform(scrollOffsetPxRef.current, 0);
    applyHighlightLeftWithManual(measureHighlightBaseLeftPxRef.current, 0);
  }, [applyHighlightLeftWithManual, applyScoreTransform]);

  const applyPlayheadFromParams = useCallback((params: OsmdPlayheadSyncParams): void => {
    const highlight = measureHighlightRef.current;
    const playhead = measurePlayheadRef.current;
    if (!highlight || !playhead || !scrollActive || hidden || !musicXmlText) {
      return;
    }
    const effectiveScale = cssScale * userZoom;
    const measureHighlightNow = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: params.activeMeasureNumber,
      measureBoundsByNumber: layout.measureBoundsByNumber,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale,
      scrollOffsetPx: scrollOffsetPxRef.current,
    });
    if (!measureHighlightNow.visible) {
      return;
    }
    highlight.style.left = `${measureHighlightNow.leftPx - manualScrollOffsetPxRef.current}px`;
    measureHighlightBaseLeftPxRef.current = measureHighlightNow.leftPx;
    highlight.style.width = `${measureHighlightNow.widthPx}px`;
    applyPlayheadDom({
      playhead,
      highlightWidthPx: measureHighlightNow.widthPx,
      measureDurationSec,
      phraseTimelineSec: params.phraseTimelineSec,
      activeMeasureNumber: params.activeMeasureNumber,
      animating: params.animating,
    });
  }, [cssScale, hidden, layout.measureBoundsByNumber, measureDurationSec, musicXmlText, scrollActive, userZoom]);

  useImperativeHandle(ref, () => ({
    syncPlayhead: (params: OsmdPlayheadSyncParams): void => {
      resetManualScroll();
      pendingPlayheadSyncRef.current = params;
      applyPlayheadFromParams(params);
    },
  }), [applyPlayheadFromParams, resetManualScroll]);

  useEffect(() => {
    if (!manualScrollEnabled) {
      resetManualScroll();
    }
  }, [manualScrollEnabled, resetManualScroll]);

  const osmdDisplayMusicXml = useMemo(
    () => (musicXmlText ? stripLyricsFromMusicXml(musicXmlText) : null),
    [musicXmlText],
  );

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

  const refitScoreScale = useCallback(async (): Promise<void> => {
    const score = scoreRef.current;
    const viewportEl = viewportRef.current;
    const osmd = osmdRef.current;
    if (!score || !viewportEl || !osmd || !musicXmlText) {
      return;
    }

    const readSurface = (): { el: HTMLElement | null; height: number } => {
      const el = score.querySelector('svg, canvas');
      if (!el) {
        return { el: null, height: 0 };
      }
      const rect = el.getBoundingClientRect();
      const height = rect.height || (el instanceof HTMLCanvasElement ? el.height : 0);
      return { el: el as HTMLElement, height };
    };

    score.style.transform = 'translate3d(0, -50%, 0) scale(1)';
    await waitNextPaint();

    const maxStaff = detectMaxStaffLayersFromMusicXml(musicXmlText);
    const viewportHeight = viewportEl.clientHeight;
    const aggressiveShrink = maxStaff >= 2;
    const targetHeight = Math.max(48, viewportHeight * (aggressiveShrink ? 0.72 : 0.94));
    const { el: surfaceEl, height: measuredBeforeScale } = readSurface();
    const nextCssScale =
      measuredBeforeScale > targetHeight && measuredBeforeScale > 0
        ? Math.max(0.28, targetHeight / measuredBeforeScale)
        : 1;
    setCssScale(nextCssScale);
    applyScoreTransform(scrollOffsetPxRef.current, manualScrollOffsetPxRef.current);
    await waitNextPaint();

    const viewportWidth = viewportEl.clientWidth;
    setLayout(measureLayoutFromOsmd(osmd, surfaceEl, viewportWidth));
  }, [applyScoreTransform, musicXmlText]);

  const renderScore = useCallback(async () => {
    const score = scoreRef.current;
    if (!score || !musicXmlText || !osmdDisplayMusicXml) {
      setLayout(EMPTY_LAYOUT);
      return;
    }

    setIsRendering(true);
    setRenderError(null);
    setScrollOffsetPx(0);
    scrollOffsetPxRef.current = 0;
    manualScrollOffsetPxRef.current = 0;
    measureHighlightBaseLeftPxRef.current = 0;
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
      drawMeasureNumbers: false,
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
      await osmd.load(osmdDisplayMusicXml);
      relaxOsmdCompactTightSpacingForBattle(osmd);
      const maxStaff = detectMaxStaffLayersFromMusicXml(musicXmlText);
      const viewportEl = viewportRef.current;
      const viewportHeight = viewportEl?.clientHeight ?? 0;
      const shortScoreViewport = viewportHeight > 0 && viewportHeight <= 320;
      const osmdZoom =
        maxStaff >= 2 && (mobileLandscapeOsmdShrink || shortScoreViewport) ? 2 / 3 : 1;
      (osmd as OpenSheetMusicDisplayZoomable).zoom = osmdZoom;
      score.style.transform = 'translate3d(0, -50%, 0) scale(1)';
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
      score.style.transform = `translate3d(0, -50%, 0) scale(${nextCssScale})`;
      setCssScale(nextCssScale);
      await waitNextPaint();

      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      setLayout(measureLayoutFromOsmd(osmd, surfaceEl, viewportWidth));
    } catch {
      setRenderError(isEnglishCopy ? 'Could not render MusicXML.' : 'MusicXMLを表示できませんでした');
      setLayout(EMPTY_LAYOUT);
    } finally {
      setIsRendering(false);
    }
  }, [isEnglishCopy, musicXmlText, mobileLandscapeOsmdShrink, osmdDisplayMusicXml]);

  useEffect(() => {
    if (!fillParent) {
      return;
    }
    const viewportEl = viewportRef.current;
    if (!viewportEl || typeof ResizeObserver === 'undefined') {
      return;
    }
    let pending = false;
    const observer = new ResizeObserver(() => {
      if (pending) {
        return;
      }
      pending = true;
      void refitScoreScale().finally(() => {
        pending = false;
      });
    });
    observer.observe(viewportEl);
    return () => {
      observer.disconnect();
    };
  }, [fillParent, refitScoreScale]);

  const handleManualScrollPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    if (!manualScrollEnabled || event.button !== 0) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }
    isManualDraggingRef.current = true;
    manualDragStartClientXRef.current = event.clientX;
    manualDragStartOffsetPxRef.current = manualScrollOffsetPxRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = 'grabbing';
  }, [manualScrollEnabled]);

  const handleManualScrollPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    if (!isManualDraggingRef.current || !manualScrollEnabled) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const deltaPx = manualDragStartClientXRef.current - event.clientX;
    const effectiveScale = cssScaleRef.current * userZoomRef.current;
    const manualOffsetPx = clampOsmdManualScrollOffset({
      baseOffsetPx: scrollOffsetPxRef.current,
      manualOffsetPx: manualDragStartOffsetPxRef.current + deltaPx,
      scoreWidth: layoutRef.current.scoreWidth,
      effectiveScale,
      viewportWidth: viewport.clientWidth,
    });
    manualScrollOffsetPxRef.current = manualOffsetPx;
    applyScoreTransform(scrollOffsetPxRef.current, manualOffsetPx);
    applyHighlightLeftWithManual(measureHighlightBaseLeftPxRef.current, manualOffsetPx);
  }, [applyHighlightLeftWithManual, applyScoreTransform, manualScrollEnabled]);

  const handleManualScrollPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    if (!isManualDraggingRef.current) {
      return;
    }
    isManualDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.style.cursor = 'grab';
  }, []);

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
    const effectiveScale = cssScale * userZoom;
    resetManualScroll();
    if (!scrollActive) {
      scrollOffsetPxRef.current = 0;
      applyScoreTransform(0, 0);
      setScrollOffsetPx(0);
      return;
    }
    const { offsetPx } = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber,
      measureBoundsByNumber: layout.measureBoundsByNumber,
      measureCentersByNumber: layout.measureCentersByNumber,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale,
      scoreWidth: layout.scoreWidth,
      viewportWidth: viewport.clientWidth,
    });
    scrollOffsetPxRef.current = offsetPx;
    applyScoreTransform(offsetPx, 0);
    setScrollOffsetPx(offsetPx);
    const measureHighlightNow = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber,
      measureBoundsByNumber: layout.measureBoundsByNumber,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale,
      scrollOffsetPx: offsetPx,
    });
    if (measureHighlightNow.visible) {
      applyHighlightLeftWithManual(measureHighlightNow.leftPx, 0);
    }
    const pending = pendingPlayheadSyncRef.current;
    if (pending && useImperativePlayhead) {
      applyPlayheadFromParams(pending);
    }
  }, [
    activeMeasureNumber,
    applyHighlightLeftWithManual,
    applyPlayheadFromParams,
    applyScoreTransform,
    cssScale,
    layout,
    resetManualScroll,
    scrollActive,
    useImperativePlayhead,
    userZoom,
  ]);

  const statusText = renderError ?? scoreErrorText;
  const showPlayhead = scrollActive && !hidden && Boolean(musicXmlText);
  const effectiveScale = cssScale * userZoom;
  const measureHighlight = useMemo(
    () => computeOsmdActiveMeasureHighlight({
      activeMeasureNumber,
      measureBoundsByNumber: layout.measureBoundsByNumber,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale,
      scrollOffsetPx,
    }),
    [activeMeasureNumber, effectiveScale, layout.measureBoundsByNumber, scrollOffsetPx],
  );

  useEffect(() => {
    if (useImperativePlayhead) {
      return;
    }
    const highlight = measureHighlightRef.current;
    const playhead = measurePlayheadRef.current;
    if (!highlight || !playhead || !showPlayhead || !measureHighlight.visible) {
      return;
    }
    applyPlayheadDom({
      playhead,
      highlightWidthPx: measureHighlight.widthPx,
      measureDurationSec,
      phraseTimelineSec: phraseTimelineSec ?? (activeMeasureNumber - 1) * Math.max(1e-6, measureDurationSec),
      activeMeasureNumber,
      animating: playheadAnimating ?? scrollActive,
    });
  }, [
    activeMeasureNumber,
    measureDurationSec,
    measureHighlight.visible,
    measureHighlight.widthPx,
    phraseTimelineSec,
    playheadAnimating,
    scrollActive,
    showPlayhead,
    useImperativePlayhead,
  ]);

  const zoomControls = !hidden && musicXmlText ? (
    <div
      className={cn(
        'pointer-events-auto flex flex-col items-center gap-1 rounded-md border border-white/15 bg-slate-900/70 py-1 px-1 text-xs font-semibold text-white shadow-sm',
        fillParent
          ? 'absolute right-2 top-2 z-20'
          : 'fixed right-[max(12px,env(safe-area-inset-right))] top-[42%] z-20 -translate-y-1/2',
      )}
    >
      <button
        type="button"
        aria-label={isEnglishCopy ? 'Zoom in' : '拡大'}
        disabled={userZoom >= EAR_TRAINING_OSMD_USER_ZOOM_MAX}
        className={cn(
          'flex h-7 min-w-[1.75rem] items-center justify-center rounded border border-white/20 bg-white/10',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'hover:bg-white/20 active:bg-white/25',
        )}
        onClick={() => {
          setUserZoom((previous) => {
            const next = clampEarTrainingOsmdUserZoom(
              previous + EAR_TRAINING_OSMD_USER_ZOOM_STEP,
            );
            saveEarTrainingOsmdUserZoom(next);
            return next;
          });
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
        disabled={userZoom <= EAR_TRAINING_OSMD_USER_ZOOM_MIN}
        className={cn(
          'flex h-7 min-w-[1.75rem] items-center justify-center rounded border border-white/20 bg-white/10',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'hover:bg-white/20 active:bg-white/25',
        )}
        onClick={() => {
          setUserZoom((previous) => {
            const next = clampEarTrainingOsmdUserZoom(
              previous - EAR_TRAINING_OSMD_USER_ZOOM_STEP,
            );
            saveEarTrainingOsmdUserZoom(next);
            return next;
          });
        }}
      >
        −
      </button>
    </div>
  ) : null;

  const scoreViewport = (
    <div
      ref={viewportRef}
      aria-hidden={hidden}
      className={cn(
        'ear-training-osmd-score overflow-hidden',
        fillParent
          ? 'absolute inset-0 h-full w-full'
          : 'pointer-events-none absolute left-1/2 top-[42%] h-[min(280px,42vh)] w-[min(860px,86vw)] -translate-x-1/2 -translate-y-1/2',
        !fillParent && scoreZClassName,
        fillParent && 'z-0 bg-transparent',
        hidden && 'invisible',
      )}
      style={manualScrollEnabled ? { touchAction: 'none', cursor: 'grab' } : undefined}
      onPointerDown={manualScrollEnabled ? handleManualScrollPointerDown : undefined}
      onPointerMove={manualScrollEnabled ? handleManualScrollPointerMove : undefined}
      onPointerUp={manualScrollEnabled ? handleManualScrollPointerUp : undefined}
      onPointerCancel={manualScrollEnabled ? handleManualScrollPointerUp : undefined}
    >
      {showPlayhead && measureHighlight.visible && (
        <div
          ref={measureHighlightRef}
          className="pointer-events-none absolute bottom-0 top-0 z-[9] overflow-hidden"
          style={{
            left: `${measureHighlight.leftPx}px`,
            width: `${measureHighlight.widthPx}px`,
          }}
          aria-hidden
        >
          <div
            ref={measurePlayheadRef}
            className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-red-500/95"
            style={{ left: 0 }}
          />
        </div>
      )}
      <div
        ref={scoreRef}
        className={cn(
          'absolute left-0 top-1/2 min-w-full origin-left',
          '[&_canvas]:!bg-transparent [&_svg]:!bg-transparent',
        )}
      />
      {(isRendering || statusText) && (
        <div className="absolute inset-0 grid place-items-center text-center text-xs font-semibold text-white/75">
          {statusText ?? (isEnglishCopy ? 'Rendering score...' : '譜面を表示中…')}
        </div>
      )}
      {fillParent ? zoomControls : null}
    </div>
  );

  if (fillParent) {
    return (
      <div className={cn('relative h-full w-full', scoreZClassName)}>
        {scoreViewport}
      </div>
    );
  }

  return (
    <>
      {scoreViewport}
      {zoomControls}
    </>
  );
}));

export default EarTrainingChordOSMDScore;
