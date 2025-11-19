import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector } from '@/stores/helpers';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

const PLAYHEAD_OFFSET = 120;

  /**
   * 楽譜表示コンポーネント
   * OSMDを使用して横スクロール形式の楽譜を表示
   */
  const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
    const timeMappingRef = useRef<TimeMappingEntry[]>([]);
    const autoScrollTargetRef = useRef(0);
    const userScrollOffsetRef = useRef(0);
    const programmaticScrollRef = useRef(false);
    const firstNoteTimeRef = useRef(0);
    const resetScrollToStart = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }
      programmaticScrollRef.current = true;
      container.scrollLeft = 0;
    }, []);
    
      const { currentTime, notes, musicXml, settings } = useGameSelector((s) => ({
      currentTime: s.currentTime,
      notes: s.notes,
      musicXml: s.musicXml,
      settings: s.settings, // 簡易表示設定を取得
    }));
    const shouldRenderSheet = settings.showSheetMusic;
    
    const createTimeMapping = useCallback(() => {
      if (!osmdRef.current || !notes || notes.length === 0) {
        log.warn('タイムマッピング作成スキップ: OSMD未初期化またはノートデータなし');
        return;
      }

      const mapping: TimeMappingEntry[] = [];
      const graphicSheet = osmdRef.current.GraphicSheet;
      
      if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
        log.warn('楽譜のグラフィック情報が取得できません');
        return;
      }

      let noteIndex = 0;
      let osmdPlayableNoteCount = 0;
      
      log.info(`📊 OSMD Note Extraction Starting: ${notes.length} JSON notes to match`);
      
      // 全ての音符を走査して演奏可能なノートのみを抽出
      const osmdPlayableNotes = [];
      for (const page of graphicSheet.MusicPages) {
        for (const system of page.MusicSystems) {
          for (const staffLine of system.StaffLines) {
            for (const measure of staffLine.Measures) {
              for (const staffEntry of measure.staffEntries) {
                for (const voice of staffEntry.graphicalVoiceEntries) {
                  for (const graphicNote of voice.notes) {
                    // isRest() が true、または sourceNote がない場合は休符と見なす
                    if (!graphicNote.sourceNote || (graphicNote.sourceNote as any).isRest?.()) {
                      continue;
                    }
                    
                    // タイで結ばれた後続音符はスキップ (OSMDの公式な方法)
                    if (graphicNote.sourceNote.NoteTie && !graphicNote.sourceNote.NoteTie.StartNote) {
                      continue;
                    }
                    
                    osmdPlayableNotes.push(graphicNote);
                  }
                }
              }
            }
          }
        }
      }
      
      osmdPlayableNoteCount = osmdPlayableNotes.length;

      // マッピングを作成
      for (const graphicNote of osmdPlayableNotes) {
                    if (noteIndex < notes.length) {
                      const note = notes[noteIndex];
                      // 音符の中心X座標を計算
                      const positionAndShape = graphicNote.PositionAndShape as any;
                      const noteHeadX = positionAndShape?.AbsolutePosition?.x;

                      if (noteHeadX !== undefined) {
                        let centerX = noteHeadX;
                        // BoundingBox が存在し、widthが定義されている場合のみ幅を考慮して中心を計算
                        if (positionAndShape?.BoundingBox?.width !== undefined) {
                          const noteHeadWidth = positionAndShape.BoundingBox.width;
                          centerX += noteHeadWidth / 2;
                        }

                        mapping.push({
                          timeMs: note.time * 1000, // 秒をミリ秒に変換
                          // 動的に計算したスケール係数を使用
                          xPosition: centerX * scaleFactorRef.current
                        });
                      }
                      noteIndex++;
        }
      }
      
      log.info(`📊 OSMD Note Extraction Summary:
      OSMD playable notes: ${osmdPlayableNoteCount}
      JSON notes count: ${notes.length}
      Mapped notes: ${mapping.length}
      Match status: ${osmdPlayableNoteCount === notes.length ? '✅ Perfect match!' : '❌ Mismatch!'}`);
      
      if (osmdPlayableNoteCount !== notes.length) {
        log.error(`ノート数の不一致: OSMD(${osmdPlayableNoteCount}) vs JSON(${notes.length}). プレイヘッドがずれる可能性があります。`);
      }
      
      timeMappingRef.current = mapping;
      firstNoteTimeRef.current = mapping[0]?.timeMs ?? 0;
      autoScrollTargetRef.current = 0;
      userScrollOffsetRef.current = 0;
      resetScrollToStart();
    }, [notes, resetScrollToStart]);
    
    // OSMDの初期化とレンダリング
    const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      autoScrollTargetRef.current = 0;
        userScrollOffsetRef.current = 0;
        resetScrollToStart();
      return;
    }

    if (!containerRef.current || !musicXml) {
      // musicXmlがない場合はクリア
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      autoScrollTargetRef.current = 0;
        userScrollOffsetRef.current = 0;
        resetScrollToStart();
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
      
      log.info(`🎼 OSMD簡易表示: ${settings.simpleDisplayMode ? 'ON' : 'OFF'}, 音名スタイル: ${settings.noteNameStyle}`);
      
      // OSMDインスタンスを毎回新規作成（移調時の確実な反映のため）
      const options: IOSMDOptions = {
        autoResize: true,
        backend: 'svg',
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
          createTimeMapping();
          autoScrollTargetRef.current = 0;
          userScrollOffsetRef.current = 0;
          resetScrollToStart();
        const noteCount = notes?.length ?? 0;
        log.info(`✅ OSMD initialized and rendered successfully (transpose=${settings.transpose}, notes=${noteCount})`);
      
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
      settings.transpose,
      createTimeMapping,
      resetScrollToStart
    ]);

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      const target = autoScrollTargetRef.current;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const rawOffset = container.scrollLeft - target;
      const minOffset = -target;
      const maxOffset = maxScroll - target;
      userScrollOffsetRef.current = Math.max(minOffset, Math.min(maxOffset, rawOffset));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

    useEffect(() => {
      if (!shouldRenderSheet && osmdRef.current) {
        osmdRef.current.clear();
        timeMappingRef.current = [];
      }
    }, [shouldRenderSheet]);

    // currentTimeが変更されるたびにスクロール位置を更新
    useEffect(() => {
      const mapping = timeMappingRef.current;
      const container = scrollContainerRef.current;
      if (!shouldRenderSheet || mapping.length === 0 || !container) {
        return;
      }

      const currentTimeMs = currentTime * 1000;
        const playheadPosition = PLAYHEAD_OFFSET;
      const firstNoteTime = firstNoteTimeRef.current;

      const findInsertionPoint = () => {
        let low = 0;
        let high = mapping.length - 1;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (mapping[mid].timeMs <= currentTimeMs) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        return low;
      };

      let targetScrollX = 0;
      if (mapping.length > 0 && currentTimeMs >= firstNoteTime) {
        const insertionPoint = findInsertionPoint();
        const activeIndex = Math.max(0, Math.min(insertionPoint === 0 ? 0 : insertionPoint - 1, mapping.length - 1));
        const targetEntry = mapping[activeIndex] ?? mapping[mapping.length - 1];
        targetScrollX = Math.max(0, targetEntry.xPosition - playheadPosition);
      }

      autoScrollTargetRef.current = targetScrollX;
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const desiredScroll = Math.max(0, Math.min(maxScroll, targetScrollX + userScrollOffsetRef.current));

      if (Math.abs(container.scrollLeft - desiredScroll) > 0.5) {
        programmaticScrollRef.current = true;
        container.scrollLeft = desiredScroll;
      }
    }, [currentTime, notes, shouldRenderSheet]);

  // クリーンアップ
    useEffect(() => {
      return () => {
        if (osmdRef.current) {
          osmdRef.current.clear();
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
    <div className={cn('relative', className)}>
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
        style={{ left: `${PLAYHEAD_OFFSET}px` }}
      />
      <div 
        className="bg-white text-black overflow-x-auto overflow-y-hidden custom-sheet-scrollbar"
        ref={scrollContainerRef}
        style={{
          '--scrollbar-width': '8px',
          '--scrollbar-track-color': '#f3f4f6',
          '--scrollbar-thumb-color': '#9ca3af',
          '--scrollbar-thumb-hover-color': '#6b7280'
        } as React.CSSProperties}
      >
        {/* 楽譜コンテナ - 上部に余白を追加 */}
        <div className="relative h-full pt-8 pb-4 min-w-[3000px]">
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
            ref={containerRef} 
            className="h-full flex items-center select-none"
          />
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;
