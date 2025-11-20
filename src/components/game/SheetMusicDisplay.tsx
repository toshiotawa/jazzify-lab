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

/**
 * 楽譜表示コンポーネント
 * OSMDを使用して横スクロール形式の楽譜を表示
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null); // プレイヘッドを直接操作するためのRef
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastScrollXRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
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
      const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;
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
                          timeMs: (note.time + timingAdjustmentSec) * 1000,
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
    
    timeMappingRef.current = mapping; // refを更新
    mappingCursorRef.current = 0;
    lastRenderedIndexRef.current = -1;
    lastScrollXRef.current = 0;
    }, [notes, settings.timingAdjustment]);

  const loadAndRenderSheet = useCallback(async () => {
    if (!shouldRenderSheet) {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
        lastRenderedIndexRef.current = -1;
        lastScrollXRef.current = 0;
      return;
    }

    if (!containerRef.current || !musicXml) {
      // musicXmlがない場合はクリア
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
        lastRenderedIndexRef.current = -1;
        lastScrollXRef.current = 0;
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
          lastRenderedIndexRef.current = -1;
          lastScrollXRef.current = 0;
      
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
      settings.simpleDisplayMode,
      settings.noteNameStyle,
      settings.sheetMusicChordsOnly,
        settings.transpose,
        createTimeMapping
    ]); // 簡易表示設定とトランスポーズを依存関係に追加

    useEffect(() => {
      if (!shouldRenderSheet) {
        return;
      }
      createTimeMapping();
    }, [createTimeMapping, shouldRenderSheet]);

  // musicXmlが変更されたら楽譜を再読み込み・再レンダリング
  useEffect(() => {
    loadAndRenderSheet();
  }, [loadAndRenderSheet]);

  useEffect(() => {
    if (!shouldRenderSheet && osmdRef.current) {
      osmdRef.current.clear();
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
    }
  }, [shouldRenderSheet]);

  // スクロール位置とプレイヘッド位置を同時に計算・制御する
  useEffect(() => {
    const mapping = timeMappingRef.current;
    const scrollContainer = scrollContainerRef.current;
    const playhead = playheadRef.current;

    if (!shouldRenderSheet || mapping.length === 0 || !scrollContainer || !playhead) {
      return;
    }

    const currentTimeMs = currentTime * 1000;
    const FIXED_PLAYHEAD_X = 120; // 基準となるプレイヘッドの位置(px)

    // 1. 現在の再生位置に対応する音符データのインデックスを探す
    const findNextIndex = () => {
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
      return Math.min(low, mapping.length - 1);
    };

    const nextIndex = findNextIndex();
    const activeIndex = Math.max(0, Math.min(nextIndex === 0 ? 0 : nextIndex - 1, mapping.length - 1));
    mappingCursorRef.current = activeIndex;

    const targetEntry = mapping[activeIndex] ?? mapping[mapping.length - 1];
    
    // 音符の絶対座標 (楽譜全体の中でのX座標)
    const noteWorldX = targetEntry.xPosition;

    // 2. 理想的なスクロール位置を計算 (音符が120pxの位置に来るように)
    const idealScrollLeft = noteWorldX - FIXED_PLAYHEAD_X;

    // 3. スクロール可能な最大幅を取得
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    // 4. 実際のスクロール位置を決定 (0 〜 最大幅 の間に収める)
    //    これによって「開始地点」と「終了地点」の挙動が自動的に解決されます
    const finalScrollLeft = Math.max(0, Math.min(idealScrollLeft, maxScrollLeft));

    // 5. プレイヘッドの画面上の表示位置を計算
    //    (音符の絶対座標) - (スクロール量) = (画面上の音符の位置)
    const finalPlayheadLeft = noteWorldX - finalScrollLeft;

    // 再生中、または位置が大きく変わった場合に適用
    const needsScrollUpdate = Math.abs(finalScrollLeft - lastScrollXRef.current) > 0.5;

    if (isPlaying || needsScrollUpdate) {
      // スクロールを適用
      scrollContainer.scrollLeft = finalScrollLeft;
      
      // プレイヘッド位置を適用 (直接DOM操作で高速化)
      playhead.style.left = `${finalPlayheadLeft}px`;

      lastRenderedIndexRef.current = activeIndex;
      lastScrollXRef.current = finalScrollLeft;
    }
  }, [currentTime, isPlaying, notes, shouldRenderSheet]);

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
    // 外枠のコンテナ (プレイヘッドの配置基準)
    <div className={cn("relative h-full", className)}>
      
      {/* プレイヘッド：スクロールコンテナの外に置くことで常に固定位置 */}
      <div 
        ref={playheadRef}
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none transition-all duration-75 ease-linear"
        style={{ left: '120px' }}
      />

      {/* スクロールコンテナ */}
      <div 
        className={cn(
          "relative h-full bg-white text-black",
          // 再生中はスクロール操作をブロックし、計算ロジックに任せる
          isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
          "custom-sheet-scrollbar"
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
          
          {/* OSMDレンダリング用コンテナ (transformは削除) */}
          <div 
            ref={scoreWrapperRef}
            className="h-full"
            style={{ 
              minWidth: '3000px' // 十分な幅を確保
            }}
          >
            <div 
              ref={containerRef} 
              className="h-full flex items-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;
