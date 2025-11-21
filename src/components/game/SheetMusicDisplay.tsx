import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
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
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastScrollXRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  
  // 前回時刻の保持用（巻き戻し検出用）
  const prevTimeRef = useRef(0);
  
  // 譜面幅とプレイヘッド位置の管理
  const sheetWidthRef = useRef<number>(0);
  const [playheadLeft, setPlayheadLeft] = useState<number>(120);
  const PLAYHEAD_BASE_X = 120;
  
  // ホイールスクロール制御用
  const [isHovered, setIsHovered] = useState(false);
  
  const { currentTime, isPlaying, notes, musicXml, settings, abRepeat, mode, currentSong } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings, // 簡易表示設定を取得
    abRepeat: s.abRepeat,
    mode: s.mode,
    currentSong: s.currentSong
  }));
  const shouldRenderSheet = settings.showSheetMusic;
  const { setABRepeatStart, setABRepeatEnd } = useGameActions();
  
  // time(ms) → x(px)
  const getXForTime = useCallback((timeMs: number): number => {
    const mapping = timeMappingRef.current;
    if (!mapping || mapping.length === 0) return 0;
    const sheetWidth = sheetWidthRef.current || (scoreWrapperRef.current?.scrollWidth || 0);

    if (timeMs <= mapping[0].timeMs) return mapping[0].xPosition;

    const last = mapping[mapping.length - 1];
    if (timeMs >= last.timeMs) {
      const songDurationMs = (currentSong?.duration || 0) * 1000;
      const tailTime = Math.max(0, songDurationMs - last.timeMs);
      const tailWidth = Math.max(0, sheetWidth - last.xPosition);
      if (tailTime <= 0 || tailWidth <= 0) return Math.min(sheetWidth, last.xPosition);
      const ratio = Math.min(1, (timeMs - last.timeMs) / tailTime);
      return Math.min(sheetWidth, last.xPosition + ratio * tailWidth);
    }

    // 二分探索
    let low = 0;
    let high = mapping.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (mapping[mid].timeMs <= timeMs) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const i = Math.max(0, Math.min(mapping.length - 2, low - 1));
    const a = mapping[i];
    const b = mapping[i + 1];
    const t = (timeMs - a.timeMs) / Math.max(1, (b.timeMs - a.timeMs));
    return a.xPosition + t * (b.xPosition - a.xPosition);
  }, [currentSong]);

  // x(px) → time(s)
  const getTimeForX = useCallback((xPos: number): number => {
    const mapping = timeMappingRef.current;
    if (!mapping || mapping.length === 0) return 0;
    const sheetWidth = sheetWidthRef.current || (scoreWrapperRef.current?.scrollWidth || 0);

    const x = Math.max(0, Math.min(xPos, sheetWidth));

    if (x <= mapping[0].xPosition) return mapping[0].timeMs / 1000;

    const last = mapping[mapping.length - 1];
    if (x >= last.xPosition) {
      const songDurationMs = (currentSong?.duration || 0) * 1000;
      const tailWidth = Math.max(0, sheetWidth - last.xPosition);
      if (tailWidth <= 0) return last.timeMs / 1000;
      const ratio = Math.min(1, (x - last.xPosition) / tailWidth);
      return (last.timeMs + ratio * Math.max(0, songDurationMs - last.timeMs)) / 1000;
    }

    // xで二分探索
    let low = 0;
    let high = mapping.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (mapping[mid].xPosition <= x) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const i = Math.max(0, Math.min(mapping.length - 2, low - 1));
    const a = mapping[i];
    const b = mapping[i + 1];
    const ratio = (x - a.xPosition) / Math.max(1, (b.xPosition - a.xPosition));
    const timeMs = a.timeMs + ratio * (b.timeMs - a.timeMs);
    return timeMs / 1000;
  }, [currentSong]);
  
  // 時間フォーマット関数
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
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
    let firstBeatX: number | null = null; // 最初の小節1拍目のX座標
    
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
              // 最初に見つかった StaffEntry のX座標（実質1小節目1拍目）を拾う
              const sePos = (staffEntry as any)?.PositionAndShape?.AbsolutePosition?.x;
              if (typeof sePos === 'number') {
                if (firstBeatX === null || sePos < firstBeatX) {
                  firstBeatX = sePos;
                }
              }
              
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
    
    // 0ms → 1小節目1拍目（小節頭）のアンカーを先頭に追加
    if (firstBeatX !== null) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current
      });
      log.info(`✅ 小節頭アンカー追加: 0ms → X=${firstBeatX * scaleFactorRef.current}px`);
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
        const renderSurface = containerRef.current.querySelector('svg, canvas');
        const boundingBox = (osmdRef.current.GraphicSheet as any).BoundingBox;

        if (renderSurface && boundingBox && boundingBox.width > 0) {
          // SVG/Canvas いずれのバックエンドでも実際の描画幅を取得
          const rectWidth = renderSurface.getBoundingClientRect().width;
          let renderedWidth = rectWidth;
          if (!renderedWidth && renderSurface instanceof SVGSVGElement) {
            renderedWidth = renderSurface.width.baseVal.value;
          } else if (!renderedWidth && renderSurface instanceof HTMLCanvasElement) {
            renderedWidth = renderSurface.width;
          }

          if (renderedWidth > 0) {
            const osmdWidth = boundingBox.width;
            scaleFactorRef.current = renderedWidth / osmdWidth;
            log.info(`✅ OSMD scale factor calculated: ${scaleFactorRef.current} (Rendered: ${renderedWidth}px, BBox: ${osmdWidth})`);
            
            // 譜面全体の幅を保存
            sheetWidthRef.current = boundingBox.width * scaleFactorRef.current;
            if (scoreWrapperRef.current && sheetWidthRef.current > 0) {
              (scoreWrapperRef.current as HTMLDivElement).style.width = `${sheetWidthRef.current}px`;
            }
          } else {
            log.warn('⚠️ Could not determine rendered width, falling back to default 10.');
            scaleFactorRef.current = 10;
          }
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

  // 再生状態に応じてtransform/scrollLeft方式を切り替え
  useEffect(() => {
    if (!shouldRenderSheet) {
      return;
    }
    const wrapper = scoreWrapperRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!wrapper || !scrollContainer) {
      return;
    }
    if (isPlaying) {
      scrollContainer.scrollLeft = 0;
      wrapper.style.transform = `translateX(-${lastScrollXRef.current}px)`;
    } else {
      wrapper.style.transform = 'translateX(0px)';
      scrollContainer.scrollLeft = lastScrollXRef.current;
    }
  }, [isPlaying, shouldRenderSheet]);

  // 音符の時刻とX座標のマッピングを作成
    // 注: 以下のコードは transform 方式のスクロールでは効果が薄く、意図しないジャンプの原因になるためコメントアウト
    // useEffect(() => {
    //   if (isPlaying && scrollContainerRef.current) {
    //     scrollContainerRef.current.scrollLeft = 0;
    //     log.info('🎵 楽譜スクロールを開始位置にリセット');
    //   }
    // }, [isPlaying]);

    // currentTimeが変更されるたびにスクロール位置を更新（音符単位でジャンプ）
    useEffect(() => {
      const mapping = timeMappingRef.current;
      if (!shouldRenderSheet || !scoreWrapperRef.current || !scrollContainerRef.current) {
        prevTimeRef.current = currentTime;
        return;
      }
      const container = scrollContainerRef.current;
      const wrapper = scoreWrapperRef.current;

      const x = getXForTime(currentTime * 1000);
      const viewport = container.clientWidth || 0;
      const sheetWidth = sheetWidthRef.current || wrapper.scrollWidth || 0;
      const maxScrollX = Math.max(0, sheetWidth - viewport);

      // コンテンツを左に動かすための必要スクロール量
      const targetScrollX = Math.max(0, x - PLAYHEAD_BASE_X);

      // 余剰=譜面終端に当たって以降はプレイヘッドを右へ動かす
      const extra = Math.max(0, targetScrollX - maxScrollX);
      const nextPlayheadLeft = Math.min(viewport - 2, PLAYHEAD_BASE_X + extra);

      const needsUpdate =
        Math.abs(nextPlayheadLeft - playheadLeft) > 0.5 ||
        Math.abs(targetScrollX - lastScrollXRef.current) > 0.5;

      if (needsUpdate) {
        if (isPlaying) {
          wrapper.style.transform = `translateX(-${Math.min(targetScrollX, maxScrollX)}px)`;
          if (Math.abs(container.scrollLeft) > 0.5) {
            container.scrollLeft = 0;
          }
        } else {
          wrapper.style.transform = `translateX(0px)`;
          container.scrollLeft = Math.min(targetScrollX, maxScrollX);
        }
        lastScrollXRef.current = Math.min(targetScrollX, maxScrollX);
        setPlayheadLeft(nextPlayheadLeft);
      }

      prevTimeRef.current = currentTime;
    }, [currentTime, isPlaying, shouldRenderSheet, getXForTime, playheadLeft, PLAYHEAD_BASE_X]);

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
    <div className={cn('relative', className)}>
      {/* プレイヘッド（赤い縦線） - スクロール位置に影響されないよう外側へ配置 */}
      <div 
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
        style={{ left: `${playheadLeft}px` }}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "h-full bg-white text-black",
          // 再生中は横スクロール無効、停止中は横スクロール有効
          isPlaying ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden",
          // カスタムスクロールバースタイルを適用
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
            
            {/* OSMDレンダリング用コンテナ */}
            <div 
              ref={scoreWrapperRef}
              className={cn(
                "h-full relative",
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
              
              {/* ABマーカーオーバーレイ（練習モードのみ） */}
              {mode === 'practice' && (abRepeat.startTime !== null || abRepeat.endTime !== null) && sheetWidthRef.current > 0 && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* 範囲塗り（ON時強調） */}
                  {abRepeat.startTime !== null && abRepeat.endTime !== null && (() => {
                    const xA = getXForTime(abRepeat.startTime * 1000);
                    const xB = getXForTime(abRepeat.endTime * 1000);
                    const left = Math.min(xA, xB);
                    const width = Math.abs(xB - xA);
                    return (
                      <div
                        className={`${abRepeat.enabled ? 'bg-emerald-400/20 border border-emerald-400/40' : 'bg-slate-400/20'} absolute top-0 bottom-0 rounded-sm`}
                        style={{ left, width }}
                      />
                    );
                  })()}

                  {/* A線 */}
                  {abRepeat.startTime !== null && (() => {
                    const xA = getXForTime(abRepeat.startTime * 1000);
                    return (
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-emerald-400 shadow pointer-events-auto cursor-ew-resize"
                        style={{ left: xA - 1 }}
                        title={`A: ${formatTime(abRepeat.startTime)}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const onMove = (ev: MouseEvent) => {
                            const rect = scoreWrapperRef.current?.getBoundingClientRect();
                            const x = ev.clientX - (rect?.left ?? 0);
                            const t = getTimeForX(x);
                            setABRepeatStart(Math.min(t, abRepeat.endTime ?? (currentSong?.duration ?? t)));
                          };
                          const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                          };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}
                      />
                    );
                  })()}

                  {/* B線 */}
                  {abRepeat.endTime !== null && (() => {
                    const xB = getXForTime(abRepeat.endTime * 1000);
                    return (
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-rose-400 shadow pointer-events-auto cursor-ew-resize"
                        style={{ left: xB - 1 }}
                        title={`B: ${formatTime(abRepeat.endTime)}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const onMove = (ev: MouseEvent) => {
                            const rect = scoreWrapperRef.current?.getBoundingClientRect();
                            const x = ev.clientX - (rect?.left ?? 0);
                            const t = getTimeForX(x);
                            setABRepeatEnd(Math.max(t, abRepeat.startTime ?? 0));
                          };
                          const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                          };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}
                      />
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default SheetMusicDisplay;
