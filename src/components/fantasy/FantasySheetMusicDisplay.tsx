/**
 * ファンタジーモード用楽譜表示コンポーネント
 * OSMDを使用して横スクロール形式の楽譜を表示し、BGMと同期
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';
import { bgmManager } from '@/utils/BGMManager';
import { devLog } from '@/utils/logger';

interface FantasySheetMusicDisplayProps {
  /** MusicXML文字列 */
  musicXml: string | null;
  /** 表示の高さ（px） */
  height?: number;
  /** 追加のCSSクラス */
  className?: string;
  /** ゲームがアクティブかどうか */
  isGameActive?: boolean;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

const PLAYHEAD_POSITION_PX = 100;
const WRAPPER_SCROLL_PADDING_PX = 200;
const DEFAULT_WRAPPER_WIDTH_PX = 2000;

/**
 * ファンタジーモード用楽譜表示
 * BGMManagerの時間と同期してスクロール
 */
const FantasySheetMusicDisplay: React.FC<FantasySheetMusicDisplayProps> = ({
  musicXml,
  height = 100,
  className = '',
  isGameActive = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastScrollXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState<number | null>(null);

  const scaleFactorRef = useRef<number>(10);
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);

  const resolvedWrapperWidthPx = `${wrapperWidth ?? DEFAULT_WRAPPER_WIDTH_PX}px`;

  // ラッパー幅の更新
  const updateWrapperWidth = useCallback(() => {
    const containerEl = containerRef.current;
    const scrollContainerEl = scrollContainerRef.current;
    if (!containerEl || !scrollContainerEl) return;

    const renderSurface = containerEl.querySelector('svg, canvas');
    const rectWidth = renderSurface?.getBoundingClientRect().width ?? 0;
    const intrinsicWidth =
      renderSurface instanceof SVGSVGElement
        ? renderSurface.width.baseVal.value
        : renderSurface instanceof HTMLCanvasElement
          ? renderSurface.width
          : 0;

    const measuredWidthCandidates = [
      containerEl.scrollWidth,
      containerEl.getBoundingClientRect().width,
      rectWidth,
      intrinsicWidth
    ].filter((value) => typeof value === 'number' && Number.isFinite(value) && value > 0);

    if (measuredWidthCandidates.length === 0) return;

    const measuredWidth = Math.max(...measuredWidthCandidates);
    const viewportWidth = scrollContainerEl.clientWidth || 0;
    const rightPadding = Math.max(viewportWidth - PLAYHEAD_POSITION_PX, 0) + WRAPPER_SCROLL_PADDING_PX;
    const desiredWidth = Math.max(measuredWidth + rightPadding, viewportWidth + WRAPPER_SCROLL_PADDING_PX);
    const nextWidth = Math.ceil(desiredWidth);
    setWrapperWidth((prev) => (prev === nextWidth ? prev : nextWidth));
  }, []);

  // 時間マッピングの作成
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current) {
      devLog.debug('⏳ タイムマッピング作成スキップ: OSMD未初期化');
      return;
    }

    const mapping: TimeMappingEntry[] = [];
    const graphicSheet = osmdRef.current.GraphicSheet;

    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      devLog.debug('⚠️ 楽譜のグラフィック情報が取得できません');
      return;
    }

    // BPMと拍子を取得（デフォルト値を使用）
    const bpm = bgmManager.getBPM() || 120;
    const timeSignature = 4; // デフォルト4拍子
    const secPerBeat = 60 / bpm;
    const secPerMeasure = secPerBeat * timeSignature;

    let firstBeatX: number | null = null;
    let measureIndex = 0;

    // 全ての小節を走査
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            const measureStartX = (measure as any)?.PositionAndShape?.AbsolutePosition?.x;
            if (typeof measureStartX === 'number') {
              if (firstBeatX === null) {
                firstBeatX = measureStartX;
              }

              // 小節の開始時間を計算
              const measureStartTimeMs = measureIndex * secPerMeasure * 1000;
              mapping.push({
                timeMs: measureStartTimeMs,
                xPosition: measureStartX * scaleFactorRef.current
              });
            }
            measureIndex++;
          }
        }
      }
    }

    // 0ms のアンカーを追加
    if (firstBeatX !== null && (mapping.length === 0 || mapping[0].timeMs !== 0)) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current
      });
    }

    devLog.debug(`✅ ファンタジー楽譜タイムマッピング作成: ${mapping.length}エントリ`);
    timeMappingRef.current = mapping;
  }, []);

  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
    if (!containerRef.current || !musicXml) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      setError(musicXml === '' ? '楽譜データがありません' : null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }

      const options: IOSMDOptions = {
        autoResize: true,
        backend: 'canvas',
        drawTitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,
        drawingParameters: 'compacttight',
        renderSingleHorizontalStaffline: true,
        pageFormat: 'Endless',
        pageBackgroundColor: '#ffffff',
        defaultColorNotehead: '#000000',
        defaultColorStem: '#000000',
        defaultColorRest: '#000000',
        defaultColorLabel: '#000000',
        defaultColorTitle: '#000000'
      };

      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      await osmdRef.current.load(musicXml);
      osmdRef.current.render();

      // スケールファクターを計算
      const renderSurface = containerRef.current.querySelector('svg, canvas');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

      if (renderSurface && boundingBox && boundingBox.width > 0) {
        const rectWidth = renderSurface.getBoundingClientRect().width;
        let renderedWidth = rectWidth;
        if (!renderedWidth && renderSurface instanceof SVGSVGElement) {
          renderedWidth = renderSurface.width.baseVal.value;
        } else if (!renderedWidth && renderSurface instanceof HTMLCanvasElement) {
          renderedWidth = renderSurface.width;
        }

        if (renderedWidth > 0) {
          scaleFactorRef.current = renderedWidth / boundingBox.width;
          devLog.debug(`✅ ファンタジーOSMD scale factor: ${scaleFactorRef.current}`);
        }
      }

      createTimeMapping();
      updateWrapperWidth();

      devLog.debug('✅ ファンタジー楽譜表示初期化完了');
    } catch (err) {
      devLog.debug('❌ 楽譜読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXml, createTimeMapping, updateWrapperWidth]);

  // musicXml変更時に再読み込み
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  // アニメーションループ（BGMと同期）
  useEffect(() => {
    if (!isGameActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateScroll = () => {
      const mapping = timeMappingRef.current;
      const wrapper = scoreWrapperRef.current;
      const scrollContainer = scrollContainerRef.current;

      if (mapping.length === 0 || !wrapper || !scrollContainer) {
        animationFrameRef.current = requestAnimationFrame(updateScroll);
        return;
      }

      const currentTimeMs = bgmManager.getCurrentMusicTime() * 1000;

      // 現在の時間に最も近いマッピングエントリを探す
      let activeIndex = 0;
      for (let i = 0; i < mapping.length; i++) {
        if (mapping[i].timeMs <= currentTimeMs) {
          activeIndex = i;
        } else {
          break;
        }
      }

      const currentEntry = mapping[activeIndex];
      const nextEntry = mapping[activeIndex + 1];

      // 補間を使用してスムーズなスクロール
      let xPosition = currentEntry.xPosition;
      if (nextEntry) {
        const timeDiff = nextEntry.timeMs - currentEntry.timeMs;
        const progress = timeDiff > 0 ? (currentTimeMs - currentEntry.timeMs) / timeDiff : 0;
        xPosition = currentEntry.xPosition + (nextEntry.xPosition - currentEntry.xPosition) * Math.min(progress, 1);
      }

      const scrollX = Math.max(0, xPosition - PLAYHEAD_POSITION_PX);

      // スクロール位置を更新（transform使用でスムーズに）
      if (Math.abs(scrollX - lastScrollXRef.current) > 0.5) {
        wrapper.style.transform = `translateX(-${scrollX}px)`;
        lastScrollXRef.current = scrollX;
      }

      animationFrameRef.current = requestAnimationFrame(updateScroll);
    };

    animationFrameRef.current = requestAnimationFrame(updateScroll);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isGameActive]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!musicXml) {
    return null;
  }

  return (
    <div
      className={cn('relative bg-white rounded-lg overflow-hidden', className)}
      style={{ height: `${height}px` }}
    >
      {/* プレイヘッド（赤い縦線） */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
        style={{ left: `${PLAYHEAD_POSITION_PX}px` }}
        aria-hidden="true"
      />

      {/* スクロールコンテナ */}
      <div
        ref={scrollContainerRef}
        className="h-full overflow-hidden"
      >
        {/* ローディング表示 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
            <div className="text-black text-sm">楽譜を読み込み中...</div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
            <div className="text-red-600 text-sm">エラー: {error}</div>
          </div>
        )}

        {/* 楽譜コンテナ */}
        <div
          ref={scoreWrapperRef}
          className="h-full"
          style={{
            willChange: isGameActive ? 'transform' : 'auto',
            minWidth: resolvedWrapperWidthPx,
            width: resolvedWrapperWidthPx
          }}
        >
          <div
            ref={containerRef}
            className="h-full flex items-center"
          />
        </div>
      </div>
    </div>
  );
};

export default FantasySheetMusicDisplay;
