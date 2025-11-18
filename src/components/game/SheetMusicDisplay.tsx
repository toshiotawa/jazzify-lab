import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import platform from '@/platform';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay, buildMeasureTimeline, type MeasureTimelineEntry } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

interface MeasureScrollEntry {
  measureNumber: number;
  startTimeMs: number;
  endTimeMs: number;
  xStart: number;
}

/**
 * 楽譜表示コンポーネント
 * OSMDを使用して横スクロール形式の楽譜を表示
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const scrollLoopRef = useRef<number | null>(null);
  const targetScrollXRef = useRef(0);
  const currentScrollXRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const measureTimelineRef = useRef<MeasureTimelineEntry[]>([]);
  const measureScrollMapRef = useRef<MeasureScrollEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  
  // ホイールスクロール制御用
  const [isHovered, setIsHovered] = useState(false);
  
  const { currentTime, isPlaying, notes, musicXml, settings } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings, // 簡易表示設定を取得
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  
  // const gameActions = useGameActions(); // 現在未使用
  
  // OSMDの初期化とレンダリング
  const loadAndRenderSheet = useCallback(async () => {
      if (!shouldRenderSheet) {
        if (osmdRef.current) {
          osmdRef.current.clear();
        }
        measureTimelineRef.current = [];
        measureScrollMapRef.current = [];
        mappingCursorRef.current = 0;
        return;
      }

      if (!containerRef.current || !musicXml) {
        // musicXmlがない場合はクリア
        if (osmdRef.current) {
          osmdRef.current.clear();
        }
        measureTimelineRef.current = [];
        measureScrollMapRef.current = [];
        mappingCursorRef.current = 0;
        setError(musicXml === '' ? '楽譜データがありません' : null);
        return;
      }

    setIsLoading(true);
    setError(null);

    try {
      // 既存のOSMDインスタンスをクリア（移調時の即時反映のため）
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      
        // 🎯 簡易表示設定に基づいてMusicXMLを前処理
        const processedMusicXml = simplifyMusicXmlForDisplay(musicXml, {
          simpleDisplayMode: settings.simpleDisplayMode,
          noteNameStyle: settings.noteNameStyle,
          chordsOnly: settings.sheetMusicChordsOnly
        });
        const safeNotes = notes ?? [];
        measureTimelineRef.current = buildMeasureTimeline(processedMusicXml, safeNotes);
      
      log.info(`🎼 OSMD簡易表示: ${settings.simpleDisplayMode ? 'ON' : 'OFF'}, 音名スタイル: ${settings.noteNameStyle}`);
      
        // OSMDインスタンスを毎回新規作成（移調時の確実な反映のため）
        const options: IOSMDOptions = {
          autoResize: true,
          backend: 'svg',
          drawingParameters: 'compacttight',
          renderSingleHorizontalStaffline: true,
          pageFormat: 'Endless',
          pageBackgroundColor: '#ffffff',
          defaultColorMusic: '#000000',
          defaultColorNotehead: '#000000',
          defaultColorStem: '#000000',
          defaultColorRest: '#000000',
          defaultColorLabel: '#000000',
          defaultColorTitle: '#000000',
          disableCursor: true,
          followCursor: false,
          drawCredits: false,
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMeasureNumbers: false,
          drawMetronomeMarks: false,
          drawFingerings: false,
          drawLyrics: false,
          drawSlurs: false,
          autoBeam: false,
          tupletsBracketed: false,
          tripletsBracketed: false,
          setWantedStemDirectionByXml: false,
          stretchLastSystemLine: false,
          spacingFactorSoftmax: 2.5,
          alignRests: 2,
          coloringEnabled: false,
          colorStemsLikeNoteheads: false,
          autoGenerateMultipleRestMeasuresFromRestMeasures: false
        };
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      
      // 前処理されたMusicXMLを使用
      await osmdRef.current.load(processedMusicXml);
      osmdRef.current.render();

      if (settings.sheetMusicChordsOnly) {
        const noteEls = containerRef.current.querySelectorAll('[class*=notehead], [class*=rest], [class*=stem]');
        noteEls.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      }
      
      // レンダリング後に正確なスケールファクターを計算
      const svgElement = containerRef.current.querySelector('svg');
      const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

      if (svgElement && boundingBox && boundingBox.width > 0) {
        // レンダリングされたSVGの実際のピクセル幅とOSMDの内部的な幅からスケールを算出
        const svgWidth = svgElement.width.baseVal.value;
        const osmdWidth = boundingBox.width;
        scaleFactorRef.current = svgWidth / osmdWidth;
        log.info(`✅ OSMD scale factor calculated: ${scaleFactorRef.current} (SVG: ${svgWidth}px, BBox: ${osmdWidth})`);
      } else {
        log.warn('⚠️ Could not calculate OSMD scale factor, falling back to default 10.');
        scaleFactorRef.current = 10;
      }
      
        // タイムマッピングを作成
        createMeasureScrollMapping();
      
      log.info(`✅ OSMD initialized and rendered successfully - transpose reflected`);
      
    } catch (err) {
      log.error('楽譜の読み込みまたはレンダリングエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
    }, [
      shouldRenderSheet,
    musicXml,
    notes,
    settings.simpleDisplayMode,
    settings.noteNameStyle,
    settings.sheetMusicChordsOnly,
    settings.transpose
  ]); // 簡易表示設定とトランスポーズを依存関係に追加

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

    useEffect(() => {
      if (!shouldRenderSheet && osmdRef.current) {
        osmdRef.current.clear();
        measureTimelineRef.current = [];
        measureScrollMapRef.current = [];
        mappingCursorRef.current = 0;
      }
    }, [shouldRenderSheet]);

    // 小節単位のスクロールマッピングを作成
    const createMeasureScrollMapping = useCallback(() => {
      if (!osmdRef.current) {
        log.warn('小節マッピング作成スキップ: OSMD未初期化');
        return;
      }

      const timeline = measureTimelineRef.current;
      if (timeline.length === 0) {
        log.warn('小節タイムラインが空のためスクロールマップを生成できません');
        measureScrollMapRef.current = [];
        return;
      }

      const graphicSheet = osmdRef.current.GraphicSheet;
      if (!graphicSheet || !graphicSheet.MusicPages?.length) {
        log.warn('楽譜のグラフィック情報が取得できません');
        return;
      }

      const measurePositions = new Map<number, number>();

      for (const page of graphicSheet.MusicPages) {
        for (const system of page.MusicSystems ?? []) {
          for (const staffLine of system.StaffLines ?? []) {
            for (const measure of staffLine.Measures ?? []) {
              const measureNumber =
                measure.MeasureNumber ??
                measure.parentSourceMeasure?.MeasureNumber ??
                measure.parentSourceMeasure?.measureListIndex;

              if (typeof measureNumber !== 'number' || measurePositions.has(measureNumber)) {
                continue;
              }

              const boundingBox = measure.PositionAndShape;
              const absoluteX = boundingBox?.AbsolutePosition?.x ?? boundingBox?.RelativePosition?.x;
              if (typeof absoluteX !== 'number') {
                continue;
              }

              measurePositions.set(measureNumber, absoluteX * scaleFactorRef.current);
            }
          }
        }
      }

      const mapping: MeasureScrollEntry[] = timeline
        .map((measureInfo) => {
          const xStart = measurePositions.get(measureInfo.measureNumber);
          if (xStart === undefined) {
            return null;
          }
          return {
            measureNumber: measureInfo.measureNumber,
            startTimeMs: measureInfo.startTime * 1000,
            endTimeMs: measureInfo.endTime * 1000,
            xStart
          };
        })
        .filter((entry): entry is MeasureScrollEntry => entry !== null);

      if (mapping.length === 0) {
        log.warn('小節スクロールマップを作成できませんでした');
        measureScrollMapRef.current = [];
        return;
      }

      measureScrollMapRef.current = mapping;
      mappingCursorRef.current = 0;
      log.info(`📏 小節スクロールマップ作成完了: ${mapping.length} entries`);
    }, []);

  // 再生開始時に楽譜スクロールを強制的に左側にジャンプ
  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      // 再生開始時に即座にスクロール位置を0にリセット
      scrollContainerRef.current.scrollLeft = 0;
      log.info('🎵 楽譜スクロールを開始位置にリセット');
    }
  }, [isPlaying]);

    // currentTimeが変更されるたびにスクロール目標位置を更新
    useEffect(() => {
      const mapping = measureScrollMapRef.current;
      if (!shouldRenderSheet || mapping.length === 0 || !scoreWrapperRef.current) {
        return;
      }

      const currentTimeMs = currentTime * 1000;

      const findCursorIndex = () => {
        let low = 0;
        let high = mapping.length - 1;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (currentTimeMs >= mapping[mid].endTimeMs) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        return Math.min(low, mapping.length - 1);
      };

      const cursor = findCursorIndex();
      mappingCursorRef.current = cursor;

      const entry = mapping[cursor] ?? mapping[mapping.length - 1];
      const playheadPosition = 120;
      const scrollX = Math.max(0, entry.xStart - playheadPosition);

      targetScrollXRef.current = scrollX;

      if (!isPlaying && scoreWrapperRef.current) {
        currentScrollXRef.current = scrollX;
        scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
      }
    }, [currentTime, isPlaying, shouldRenderSheet]);

    useEffect(() => {
      if (!shouldRenderSheet) {
        if (scrollLoopRef.current !== null) {
          platform.cancelAnimationFrame(scrollLoopRef.current);
          scrollLoopRef.current = null;
        }
        return;
      }

      if (!isPlaying) {
        if (scrollLoopRef.current !== null) {
          platform.cancelAnimationFrame(scrollLoopRef.current);
          scrollLoopRef.current = null;
        }
        if (scoreWrapperRef.current) {
          const target = targetScrollXRef.current;
          currentScrollXRef.current = target;
          scoreWrapperRef.current.style.transform = `translateX(-${target}px)`;
        }
        return;
      }

      const animate = () => {
        if (!scoreWrapperRef.current) {
          scrollLoopRef.current = null;
          return;
        }

        const target = targetScrollXRef.current;
        const current = currentScrollXRef.current;
        const delta = target - current;

        if (Math.abs(delta) < 0.4) {
          currentScrollXRef.current = target;
        } else {
          currentScrollXRef.current = current + delta * 0.2;
        }

        scoreWrapperRef.current.style.transform = `translateX(-${currentScrollXRef.current}px)`;
        scrollLoopRef.current = platform.requestAnimationFrame(animate);
      };

      if (scrollLoopRef.current === null) {
        scrollLoopRef.current = platform.requestAnimationFrame(animate);
      }

      return () => {
        if (scrollLoopRef.current !== null) {
          platform.cancelAnimationFrame(scrollLoopRef.current);
          scrollLoopRef.current = null;
        }
      };
    }, [isPlaying, shouldRenderSheet]);

    // ホイールスクロール制御
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 楽譜エリアにマウスがホバーしていない、または再生中の場合はスクロールを無効化
      if (!isHovered || isPlaying) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        scrollContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isHovered, isPlaying]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      if (scrollLoopRef.current) {
        platform.cancelAnimationFrame(scrollLoopRef.current);
        scrollLoopRef.current = null;
      }
    };
  }, []);

  if (!shouldRenderSheet) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-900 text-gray-400',
          className
        )}
        aria-label="楽譜表示オフ"
      >
        楽譜表示はオフになっています
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative bg-white text-black",
        // 再生中は横スクロール無効、停止中は横スクロール有効
        isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
        // カスタムスクロールバースタイルを適用
        "custom-sheet-scrollbar",
        className
      )}
      ref={scrollContainerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        // WebKit系ブラウザ用のカスタムスクロールバー
        ...(!isPlaying && {
          '--scrollbar-width': '8px',
          '--scrollbar-track-color': '#f3f4f6',
          '--scrollbar-thumb-color': '#9ca3af',
          '--scrollbar-thumb-hover-color': '#6b7280'
        })
      } as React.CSSProperties}
    >
      {/* プレイヘッド（赤い縦線） */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: '120px' }}
      />
      
      {/* 楽譜コンテナ - 上部に余白を追加 */}
      <div className="relative h-full pt-8 pb-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-black">楽譜を読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-red-600">エラー: {error}</div>
          </div>
        )}
        
        {(!musicXml && !isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-600">楽譜データがありません</div>
          </div>
        )}
        
        {/* OSMDレンダリング用コンテナ */}
          <div 
            ref={scoreWrapperRef}
            className={cn(
              "h-full",
              // 停止中は手動スクロール時の移動を滑らかにする
              !isPlaying ? "transition-transform duration-100 ease-out" : ""
            )}
            style={{ 
              willChange: isPlaying ? 'transform' : 'auto',
              minWidth: '3000px' // 十分な幅を確保
            }}
          >
          <div 
            ref={containerRef} 
            className="h-full flex items-center"
          />
        </div>
      </div>
      
      {/* カスタムスクロールバー用のスタイル - CSS外部化により削除 */}
    </div>
  );
};

export default SheetMusicDisplay;
