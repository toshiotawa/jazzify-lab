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
  OSMD_SCROLL_LAYOUT_BATTLE_DEFAULT,
  clampOsmdManualScrollOffset,
  computeOsmdActiveMeasureHighlight,
  computeOsmdEffectiveScaleForMeasure,
  computeOsmdMeasureJumpScrollOffset,
  computeOsmdMeasurePlayheadProgress,
  computeOsmdReachEndJumpScrollOffset,
  computeOsmdWindowFitScale,
  computeOsmdWindowJumpScrollOffset,
  type OsmdMeasureBounds,
  type OsmdScrollLayout,
} from '@/utils/earTrainingChordOsmdScoreScroll';
import { measureLayoutFromOsmd } from '@/utils/earTrainingOsmdMeasureLayout';
import {
  enableEarTrainingOsmdWordsLayoutRules,
  installEarTrainingOsmdWordsLayout,
} from '@/utils/earTrainingOsmdWordsLayout';
import { detectMaxStaffLayersFromMusicXml } from '@/utils/earTrainingOsmdMusicXmlStaff';
import { readBetweenStaffDistanceStaffHeightsFromMusicXml } from '@/utils/earTrainingChordOsmd';
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
  /** カウントイン長（秒）。0 のとき負タイムライン中はプレイヘッドを小節 1 左端に固定。 */
  countInDurationSec?: number;
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
  /** true のとき OSMD 標準の歌詞を譜面に描画する（false=歌詞を除去してノーツ部テキストのみ）。 */
  showScoreLyrics?: boolean;
  /** スクロールのアンカー・1小節フィット設定。省略時はリズムバトル既定。 */
  scrollLayout?: OsmdScrollLayout;
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
  countInDurationSec: number;
  phraseTimelineSec: number;
  activeMeasureNumber: number;
  animating: boolean;
}

const applyPlayheadDom = ({
  playhead,
  highlightWidthPx,
  measureDurationSec,
  countInDurationSec,
  phraseTimelineSec,
  activeMeasureNumber,
  animating,
}: ApplyPlayheadDomParams): void => {
  const progress = computeOsmdMeasurePlayheadProgress({
    phraseTimelineSec,
    activeMeasureNumber,
    measureDurationSec,
    countInDurationSec,
  });
  const leftPx = progress * highlightWidthPx;
  const inCountInPhase = phraseTimelineSec < 0;

  if (!animating || inCountInPhase) {
    playhead.style.transition = 'none';
    playhead.style.left = `${leftPx}px`;
    return;
  }

  const safeMeasureDurationSec = Math.max(1e-6, measureDurationSec);
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
const relaxOsmdCompactTightSpacingForBattle = (
  osmd: OpenSheetMusicDisplay,
  musicXmlText?: string | null,
): void => {
  const zoomable = osmd as OpenSheetMusicDisplay & {
    EngravingRules?: {
      ClefRightMargin?: number;
      RhythmRightMargin?: number;
      VoiceSpacingMultiplierVexflow?: number;
      VoiceSpacingAddendVexflow?: number;
      SoftmaxFactorVexFlow?: number;
      BetweenStaffDistance?: number;
      MinSkyBottomDistBetweenStaves?: number;
    };
    rules?: {
      ClefRightMargin?: number;
      RhythmRightMargin?: number;
      VoiceSpacingMultiplierVexflow?: number;
      VoiceSpacingAddendVexflow?: number;
      SoftmaxFactorVexFlow?: number;
      BetweenStaffDistance?: number;
      MinSkyBottomDistBetweenStaves?: number;
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
  if (musicXmlText) {
    const betweenStaff = readBetweenStaffDistanceStaffHeightsFromMusicXml(musicXmlText);
    if (betweenStaff !== null && typeof rules.BetweenStaffDistance === 'number') {
      rules.BetweenStaffDistance = betweenStaff;
      if (typeof rules.MinSkyBottomDistBetweenStaves === 'number') {
        rules.MinSkyBottomDistBetweenStaves = Math.min(rules.MinSkyBottomDistBetweenStaves, betweenStaff);
      }
    }
  }
};

const EarTrainingChordOSMDScore = memo(forwardRef<EarTrainingChordOSMDScoreHandle, EarTrainingChordOSMDScoreProps>(
  function EarTrainingChordOSMDScore({
  musicXmlText,
  scoreErrorText,
  activeMeasureNumber,
  measureDurationSec,
  countInDurationSec = 0,
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
  showScoreLyrics = false,
  scrollLayout = OSMD_SCROLL_LAYOUT_BATTLE_DEFAULT,
}, ref) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scoreContentRef = useRef<HTMLDivElement | null>(null);
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
  const isTwoFingerTouchRef = useRef(false);
  const manualDragStartClientXRef = useRef(0);
  const manualDragStartOffsetPxRef = useRef(0);
  const twoFingerTouchStartCenterXRef = useRef(0);
  const twoFingerTouchStartOffsetPxRef = useRef(0);
  const cssScaleRef = useRef(1);
  const effectiveScaleRef = useRef(1);
  const maxMeasureNumberRef = useRef(1);
  const userZoomRef = useRef(loadEarTrainingOsmdUserZoom());
  const layoutRef = useRef<OsmdLayout>(EMPTY_LAYOUT);
  const [mobileLandscapeOsmdShrink, setMobileLandscapeOsmdShrink] = useState(false);
  const pendingPlayheadSyncRef = useRef<OsmdPlayheadSyncParams | null>(null);
  const precisionWindowStartRef = useRef(1);

  const activeMeasureBounds = layout.measureBoundsByNumber[Math.max(1, Math.floor(activeMeasureNumber))]
    ?? layout.measureBoundsByNumber[1];
  const maxMeasureNumber = useMemo(() => {
    let max = 1;
    for (const key in layout.measureBoundsByNumber) {
      const n = Number(key);
      if (n > max) {
        max = n;
      }
    }
    return max;
  }, [layout]);
  const viewportWidthPx = viewportRef.current?.clientWidth ?? 0;
  const cssScaleForLayout = fillParent ? cssScale * userZoom : cssScale;
  const effectiveScale = scrollLayout.fitWindow
    ? computeOsmdWindowFitScale({
      cssScale: cssScaleForLayout,
      measureBoundsByNumber: layout.measureBoundsByNumber,
      maxMeasureNumber,
      viewportWidth: viewportWidthPx,
      minVisibleMeasures: scrollLayout.fitWindow.minVisibleMeasures,
    })
    : computeOsmdEffectiveScaleForMeasure({
      cssScale: cssScaleForLayout,
      bounds: activeMeasureBounds,
      viewportWidth: viewportWidthPx,
      fitActiveMeasureWidth: scrollLayout.fitActiveMeasureWidth,
    });

  cssScaleRef.current = cssScale;
  userZoomRef.current = userZoom;
  effectiveScaleRef.current = effectiveScale;
  maxMeasureNumberRef.current = maxMeasureNumber;
  layoutRef.current = layout;

  const applyScoreTransform = useCallback((baseOffsetPx: number, manualOffsetPx: number): void => {
    const scoreContent = scoreContentRef.current;
    if (!scoreContent) {
      return;
    }
    const totalOffsetPx = baseOffsetPx + manualOffsetPx;
    scoreContent.style.transform = `translate3d(${-totalOffsetPx}px, -50%, 0) scale(${effectiveScaleRef.current})`;
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
    isTwoFingerTouchRef.current = false;
    applyScoreTransform(scrollOffsetPxRef.current, 0);
    applyHighlightLeftWithManual(measureHighlightBaseLeftPxRef.current, 0);
  }, [applyHighlightLeftWithManual, applyScoreTransform]);

  const applyManualScrollOffset = useCallback((manualOffsetPx: number): void => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const clampedOffsetPx = clampOsmdManualScrollOffset({
      baseOffsetPx: scrollOffsetPxRef.current,
      manualOffsetPx,
      scoreWidth: layoutRef.current.scoreWidth,
      effectiveScale: effectiveScaleRef.current,
      viewportWidth: viewport.clientWidth,
    });
    manualScrollOffsetPxRef.current = clampedOffsetPx;
    applyScoreTransform(scrollOffsetPxRef.current, clampedOffsetPx);
    applyHighlightLeftWithManual(measureHighlightBaseLeftPxRef.current, clampedOffsetPx);
  }, [applyHighlightLeftWithManual, applyScoreTransform]);

  const applyPlayheadFromParams = useCallback((params: OsmdPlayheadSyncParams): void => {
    const highlight = measureHighlightRef.current;
    const playhead = measurePlayheadRef.current;
    if (!highlight || !playhead || !scrollActive || hidden || !musicXmlText) {
      return;
    }

    const measureHighlightNow = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: params.activeMeasureNumber,
      measureBoundsByNumber: layoutRef.current.measureBoundsByNumber,
      playheadPx: scrollLayout.playheadPx,
      effectiveScale: effectiveScaleRef.current,
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
      countInDurationSec,
      phraseTimelineSec: params.phraseTimelineSec,
      activeMeasureNumber: params.activeMeasureNumber,
      animating: params.animating,
    });
  }, [applyScoreTransform, countInDurationSec, hidden, measureDurationSec, musicXmlText, scrollActive, scrollLayout]);

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

  useEffect(() => {
    if (!manualScrollEnabled) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const onWheel = (event: WheelEvent): void => {
      const deltaX = event.deltaX !== 0 ? event.deltaX : (event.shiftKey ? event.deltaY : 0);
      if (deltaX === 0) {
        return;
      }
      event.preventDefault();
      applyManualScrollOffset(manualScrollOffsetPxRef.current + deltaX);
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', onWheel);
    };
  }, [applyManualScrollOffset, manualScrollEnabled]);

  useEffect(() => {
    if (!manualScrollEnabled) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const touchCenterX = (touches: TouchList): number => (
      (touches[0].clientX + touches[1].clientX) / 2
    );
    const onTouchStart = (event: TouchEvent): void => {
      if (event.touches.length !== 2) {
        return;
      }
      isTwoFingerTouchRef.current = true;
      isManualDraggingRef.current = false;
      twoFingerTouchStartCenterXRef.current = touchCenterX(event.touches);
      twoFingerTouchStartOffsetPxRef.current = manualScrollOffsetPxRef.current;
    };
    const onTouchMove = (event: TouchEvent): void => {
      if (!isTwoFingerTouchRef.current || event.touches.length !== 2) {
        return;
      }
      event.preventDefault();
      const deltaPx = twoFingerTouchStartCenterXRef.current - touchCenterX(event.touches);
      applyManualScrollOffset(twoFingerTouchStartOffsetPxRef.current + deltaPx);
    };
    const onTouchEnd = (event: TouchEvent): void => {
      if (event.touches.length < 2) {
        isTwoFingerTouchRef.current = false;
      }
    };
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [applyManualScrollOffset, manualScrollEnabled]);

  const osmdDisplayMusicXml = useMemo(
    () => {
      if (!musicXmlText) {
        return null;
      }
      return showScoreLyrics ? musicXmlText : stripLyricsFromMusicXml(musicXmlText);
    },
    [musicXmlText, showScoreLyrics],
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
    const scoreContent = scoreContentRef.current;
    const viewportEl = viewportRef.current;
    const osmd = osmdRef.current;
    if (!score || !scoreContent || !viewportEl || !osmd || !musicXmlText) {
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

    scoreContent.style.transform = 'translate3d(0, -50%, 0) scale(1)';
    await waitNextPaint();

    const maxStaff = detectMaxStaffLayersFromMusicXml(musicXmlText);
    const viewportHeight = viewportEl.clientHeight;
    const aggressiveShrink = maxStaff >= 2;
    const targetHeight = Math.max(48, viewportHeight * (aggressiveShrink ? 0.78 : 0.98));
    const { el: surfaceEl, height: measuredBeforeScale } = readSurface();
    const nextCssScale =
      measuredBeforeScale > targetHeight && measuredBeforeScale > 0
        ? Math.max(0.28, targetHeight / measuredBeforeScale)
        : 1;
    setCssScale(nextCssScale);
    applyScoreTransform(scrollOffsetPxRef.current, manualScrollOffsetPxRef.current);
    await waitNextPaint();

    const viewportWidth = viewportEl.clientWidth;
    const nextLayout = measureLayoutFromOsmd(osmd, surfaceEl, viewportWidth);
    setLayout(nextLayout);
  }, [applyScoreTransform, musicXmlText]);

  const renderScore = useCallback(async () => {
    const score = scoreRef.current;
    const scoreContent = scoreContentRef.current;
    if (!score || !scoreContent || !musicXmlText || !osmdDisplayMusicXml) {
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
      enableEarTrainingOsmdWordsLayoutRules(osmd);
      await osmd.load(osmdDisplayMusicXml);
      const maxStaff = detectMaxStaffLayersFromMusicXml(musicXmlText);
      const viewportEl = viewportRef.current;
      const viewportHeight = viewportEl?.clientHeight ?? 0;
      const shortScoreViewport = viewportHeight > 0 && viewportHeight <= 320;
      const osmdZoom =
        maxStaff >= 2 && (mobileLandscapeOsmdShrink || shortScoreViewport) ? 2 / 3 : 1;
      relaxOsmdCompactTightSpacingForBattle(osmd, musicXmlText);
      (osmd as OpenSheetMusicDisplayZoomable).zoom = osmdZoom;
      installEarTrainingOsmdWordsLayout(osmd);
      scoreContent.style.transform = 'translate3d(0, -50%, 0) scale(1)';
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
      const targetHeight = Math.max(48, viewportHeight * (aggressiveShrink ? 0.78 : 0.98));
      const { el: surfaceEl, height: measuredBeforeScale } = readSurface();
      const nextCssScale =
        measuredBeforeScale > targetHeight && measuredBeforeScale > 0
          ? Math.max(0.28, targetHeight / measuredBeforeScale)
          : 1;
      scoreContent.style.transform = `translate3d(0, -50%, 0) scale(${nextCssScale})`;
      setCssScale(nextCssScale);
      await waitNextPaint();

      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const nextLayout = measureLayoutFromOsmd(osmd, surfaceEl, viewportWidth);
      setLayout(nextLayout);
    } catch {
      setRenderError(isEnglishCopy ? 'Could not render MusicXML.' : 'MusicXMLを表示できませんでした');
      setLayout(EMPTY_LAYOUT);
    } finally {
      setIsRendering(false);
    }
  }, [
    isEnglishCopy,
    musicXmlText,
    mobileLandscapeOsmdShrink,
    osmdDisplayMusicXml,
  ]);

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
    if (!manualScrollEnabled || event.button !== 0 || isTwoFingerTouchRef.current) {
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
    if (!isManualDraggingRef.current || !manualScrollEnabled || isTwoFingerTouchRef.current) {
      return;
    }
    const deltaPx = manualDragStartClientXRef.current - event.clientX;
    applyManualScrollOffset(manualDragStartOffsetPxRef.current + deltaPx);
  }, [applyManualScrollOffset, manualScrollEnabled]);

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
    precisionWindowStartRef.current = 1;
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
    resetManualScroll();
    let offsetPx = 0;
    if (scrollLayout.fitWindow) {
      ({ offsetPx } = computeOsmdWindowJumpScrollOffset({
        activeMeasureNumber,
        measureBoundsByNumber: layout.measureBoundsByNumber,
        measureCentersByNumber: layout.measureCentersByNumber,
        effectiveScale,
        scoreWidth: layout.scoreWidth,
        viewportWidth: viewport.clientWidth,
        visibleMeasures: scrollLayout.fitWindow.minVisibleMeasures,
      }));
    } else if (scrollLayout.fitActiveMeasureWidth) {
      const reachEnd = computeOsmdReachEndJumpScrollOffset({
        activeMeasureNumber,
        previousWindowStart: precisionWindowStartRef.current,
        measureBoundsByNumber: layout.measureBoundsByNumber,
        measureCentersByNumber: layout.measureCentersByNumber,
        cssScale: cssScaleForLayout,
        playheadPx: scrollLayout.playheadPx,
        scoreWidth: layout.scoreWidth,
        viewportWidth: viewport.clientWidth,
        maxMeasureNumber,
      });
      precisionWindowStartRef.current = reachEnd.windowStartMeasure;
      offsetPx = reachEnd.offsetPx;
    } else {
      ({ offsetPx } = computeOsmdMeasureJumpScrollOffset({
        activeMeasureNumber,
        measureBoundsByNumber: layout.measureBoundsByNumber,
        measureCentersByNumber: layout.measureCentersByNumber,
        playheadPx: scrollLayout.playheadPx,
        effectiveScale,
        scoreWidth: layout.scoreWidth,
        viewportWidth: viewport.clientWidth,
        anchorToMeasureLeft: scrollLayout.anchorToMeasureLeft,
      }));
    }
    scrollOffsetPxRef.current = offsetPx;
    applyScoreTransform(offsetPx, 0);
    setScrollOffsetPx(offsetPx);
    if (!scrollActive) {
      return;
    }
    const measureHighlightNow = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber,
      measureBoundsByNumber: layout.measureBoundsByNumber,
      playheadPx: scrollLayout.playheadPx,
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
    effectiveScale,
    layout,
    resetManualScroll,
    scrollActive,
    scrollLayout,
    useImperativePlayhead,
    cssScaleForLayout,
    maxMeasureNumber,
  ]);

  const statusText = renderError ?? scoreErrorText;
  const showPlayhead = scrollActive && !hidden && Boolean(musicXmlText);
  const measureHighlight = useMemo(
    () => computeOsmdActiveMeasureHighlight({
      activeMeasureNumber,
      measureBoundsByNumber: layout.measureBoundsByNumber,
      playheadPx: scrollLayout.playheadPx,
      effectiveScale,
      scrollOffsetPx,
    }),
    [activeMeasureNumber, effectiveScale, layout.measureBoundsByNumber, scrollLayout.playheadPx, scrollOffsetPx],
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
      countInDurationSec,
      phraseTimelineSec: phraseTimelineSec ?? (activeMeasureNumber - 1) * Math.max(1e-6, measureDurationSec),
      activeMeasureNumber,
      animating: playheadAnimating ?? scrollActive,
    });
  }, [
    activeMeasureNumber,
    countInDurationSec,
    measureDurationSec,
    measureHighlight.visible,
    measureHighlight.widthPx,
    phraseTimelineSec,
    playheadAnimating,
    scrollActive,
    showPlayhead,
    useImperativePlayhead,
  ]);

  const zoomControls = fillParent && !hidden && musicXmlText ? (
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
          : 'pointer-events-none absolute left-1/2 top-[36%] h-[min(360px,52vh)] w-[98vw] max-w-[98vw] -translate-x-1/2 -translate-y-1/2',
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
        ref={scoreContentRef}
        className="absolute left-0 top-1/2 min-w-full origin-left"
      >
        <div
          ref={scoreRef}
          className={cn(
            'relative min-w-full',
            '[&_canvas]:!bg-transparent [&_svg]:!bg-transparent',
          )}
        />
      </div>
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

  return scoreViewport;
}));

export default EarTrainingChordOSMDScore;
