import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector } from '@/stores/helpers';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { cn } from '@/utils/cn';
import { simplifyMusicXmlForDisplay, stripLyricsFromMusicXml } from '@/utils/musicXmlMapper';
import { log } from '@/utils/logger';

interface SheetMusicDisplayProps {
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

const PLAYHEAD_POSITION_PX = 120;
const WRAPPER_SCROLL_PADDING_PX = 320;
const DEFAULT_WRAPPER_WIDTH_PX = 3000;

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
  const [wrapperWidth, setWrapperWidth] = useState<number | null>(null);
  const scaleFactorRef = useRef<number>(10); // デフォルトは以前のマジックナンバー
  
  // timeMappingはアニメーションループで使うため、useRefで状態の即時反映を保証
  const timeMappingRef = useRef<TimeMappingEntry[]>([]);
  const mappingCursorRef = useRef<number>(0);
  
  // 前回時刻の保持用（巻き戻し検出用）
  const prevTimeRef = useRef(0);
  
  // 一時停止時のスクロール位置保護用タイムスタンプ
  // この時刻から一定時間はcurrentTimeによるスクロール更新をスキップ
  const pauseProtectionTimestampRef = useRef<number>(0);
  // 前回のisPlaying状態を追跡
  const prevIsPlayingRef = useRef(false);
  
  // ホイールスクロール制御用
  const [isHovered, setIsHovered] = useState(false);
  
  // 🚀 パフォーマンス最適化: currentTime を useGameSelector から除外
  // currentTime は毎秒30回更新されるため、React再レンダリングの主要なボトルネック
  // 代わりに rAF ループと直接ストア購読で DOM を更新する
  const { isPlaying, notes, musicXml, settings, currentSong } = useGameSelector((s) => ({
    isPlaying: s.isPlaying,
    notes: s.notes,
    musicXml: s.musicXml,
    settings: s.settings,
    currentSong: s.currentSong,
  }));
  const sheetProfile = useAuthStore((s) => s.profile);
  const sheetGeoCountry = useGeoStore((s) => s.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: sheetProfile?.rank,
    country: sheetProfile?.country ?? sheetGeoCountry,
    preferredLocale: sheetProfile?.preferred_locale,
  });
  // 楽曲の hide_sheet_music が true の場合、ユーザー設定に関係なく楽譜を非表示
  const shouldRenderSheet = settings.showSheetMusic && !currentSong?.hide_sheet_music;
  // リズム譜モード: 楽曲の use_rhythm_notation フラグを取得
  const useRhythmNotation = currentSong?.use_rhythm_notation ?? false;
  const updateWrapperWidth = useCallback(() => {
    if (!shouldRenderSheet) {
      return;
    }
    const containerEl = containerRef.current;
    const scrollContainerEl = scrollContainerRef.current;
    if (!containerEl || !scrollContainerEl) {
      return;
    }
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
    if (measuredWidthCandidates.length === 0) {
      return;
    }
    const measuredWidth = Math.max(...measuredWidthCandidates);
    const viewportWidth = scrollContainerEl.clientWidth || 0;
    const rightPadding = Math.max(viewportWidth - PLAYHEAD_POSITION_PX, 0) + WRAPPER_SCROLL_PADDING_PX;
    const desiredWidth = Math.max(measuredWidth + rightPadding, viewportWidth + WRAPPER_SCROLL_PADDING_PX);
    const nextWidth = Math.ceil(desiredWidth);
    setWrapperWidth((prev) => (prev === nextWidth ? prev : nextWidth));
  }, [shouldRenderSheet]);
  const resolvedWrapperWidthPx = `${wrapperWidth ?? DEFAULT_WRAPPER_WIDTH_PX}px`;
  
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

    const timingAdjustmentSec = (settings.timingAdjustment ?? 0) / 1000;

    // ───────────────────────────────────────────────────────
    // Step 1: OSMD playable notes を収集 (X座標 + 音楽的タイムスタンプ)
    // ───────────────────────────────────────────────────────
    // 2段譜では staffLine ごとに走査されるため、
    // 同じ拍の上下段ノートは同じ musicalTime / 同じ X座標 を持つ。
    // タイムスタンプで重複除去し「ユニークなスコアカラム」を構築することで
    // ノート数の不一致・装飾展開・両手同時打鍵すべてに対応する。

    let firstBeatX: number | null = null;
    let osmdNoteCount = 0;
    let hasAllTimestamps = true;

    const osmdNotes: { xPx: number; mt: number }[] = [];

    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
              const sePos = (staffEntry as any)?.PositionAndShape?.AbsolutePosition?.x;
              if (typeof sePos === 'number' && (firstBeatX === null || sePos < firstBeatX)) {
                firstBeatX = sePos;
              }

              for (const voice of staffEntry.graphicalVoiceEntries) {
                for (const gn of voice.notes) {
                  if (!gn.sourceNote || (gn.sourceNote as any).isRest?.()) continue;
                  if (gn.sourceNote.NoteTie && !gn.sourceNote.NoteTie.StartNote) continue;

                  osmdNoteCount++;

                  // X 座標
                  const ps = gn.PositionAndShape as any;
                  const nhx: number = ps?.AbsolutePosition?.x ?? 0;
                  const bw: number = ps?.BoundingBox?.width ?? 0;
                  const xPx = (nhx + bw / 2) * scaleFactorRef.current;

                  // 音楽的タイムスタンプ (quarter note 単位)
                  let mt = -1;
                  try {
                    const ts = (gn.sourceNote as any).getAbsoluteTimestamp?.();
                    if (ts && typeof ts.RealValue === 'number') {
                      mt = ts.RealValue;
                    }
                  } catch { /* ignore */ }

                  if (mt < 0) hasAllTimestamps = false;
                  osmdNotes.push({ xPx, mt });
                }
              }
            }
          }
        }
      }
    }

    log.info(`📊 OSMD: ${osmdNoteCount} playable notes, ${notes.length} game notes, timestamps: ${hasAllTimestamps ? 'YES' : 'NO'}`);

    // ───────────────────────────────────────────────────────
    // Step 2: ユニークなスコアカラムを構築
    // ───────────────────────────────────────────────────────
    // 同じ拍位置のノート（両手・和音）は同じカラムにまとめる
    // → 時間軸上のユニークな位置のみを残す

    interface ScoreColumn { mt: number; xPx: number }
    const columns: ScoreColumn[] = [];

    if (hasAllTimestamps && osmdNotes.length > 0) {
      // 音楽的タイムスタンプで重複除去
      const mtMap = new Map<string, { mt: number; xPx: number }>();
      for (const n of osmdNotes) {
        const key = n.mt.toFixed(6);
        if (!mtMap.has(key)) {
          mtMap.set(key, { mt: n.mt, xPx: n.xPx });
        }
      }
      for (const v of mtMap.values()) {
        columns.push({ mt: v.mt, xPx: v.xPx });
      }
      columns.sort((a, b) => a.mt - b.mt);
    } else {
      // フォールバック: X座標で重複除去 (タイムスタンプが取れない場合)
      // mt にX座標そのものを使用 → BPM変換ではなく線形マッピングで対応
      const xMap = new Map<number, number>();
      for (const n of osmdNotes) {
        const key = Math.round(n.xPx);
        if (!xMap.has(key)) xMap.set(key, n.xPx);
      }
      const sorted = Array.from(xMap.values()).sort((a, b) => a - b);
      for (const x of sorted) {
        columns.push({ mt: x, xPx: x });
      }
      log.warn('⚠️ OSMD timestamps not available, using X-position fallback');
    }

    log.info(`📐 Score columns (unique beat positions): ${columns.length}`);

    // ───────────────────────────────────────────────────────
    // Step 3: 音楽時間 → 実時間 の変換
    // ───────────────────────────────────────────────────────
    // BPMベースの直接変換を使用 (2点校正の累積誤差を回避)
    //
    // OSMD Fraction は「全音符 = 1.0」単位:
    //   4分音符 = 0.25, 2分音符 = 0.5, 全音符 = 1.0
    //   4/4拍子の1小節 = 1.0
    //
    // 変換式: timeSec = mt × (240 / BPM) + offset
    //   - mt: OSMD timestamp (whole-note units)
    //   - offset: 最初のノートの実時間とのズレ

    // BPM を OSMD Sheet から取得 (なければ musicXml から)
    let bpm = 120;
    try {
      const sheet = (osmdRef.current as any).Sheet;
      if (sheet?.DefaultStartTempoInBpm > 0) {
        bpm = sheet.DefaultStartTempoInBpm;
      }
    } catch { /* ignore */ }

    if (columns.length >= 2 && notes.length >= 2) {
      const mt0 = columns[0].mt;
      const mt1 = columns[columns.length - 1].mt;
      const t0 = notes[0].time;
      const t1 = notes[notes.length - 1].time;
      const mtSpan = mt1 - mt0;
      const tSpan = t1 - t0;

      // タイムスタンプ単位を自動判定 (whole-note vs quarter-note)
      // BPM による変換でどちらが実際の演奏時間に近いかを判定
      const secPerWhole = 240 / bpm;   // 全音符単位の場合
      const secPerQuarter = 60 / bpm;  // 4分音符単位の場合

      const durationAsWhole = mtSpan * secPerWhole;
      const durationAsQuarter = mtSpan * secPerQuarter;

      let secPerUnit: number;
      if (Math.abs(durationAsWhole - tSpan) < Math.abs(durationAsQuarter - tSpan)) {
        secPerUnit = secPerWhole;
        log.info(`🎵 Timestamp unit: whole-notes (BPM=${bpm}, secPerUnit=${secPerUnit.toFixed(4)})`);
      } else {
        secPerUnit = secPerQuarter;
        log.info(`🎵 Timestamp unit: quarter-notes (BPM=${bpm}, secPerUnit=${secPerUnit.toFixed(4)})`);
      }

      // オフセット: 最初のカラムの音楽時間と最初のゲームノーツ時間の差
      const offset = t0 - mt0 * secPerUnit;

      // 診断ログ: 最後のカラムの推定時間 vs 実際の最終ゲームノーツ時間
      const estimatedLast = mt1 * secPerUnit + offset;
      log.info(`🔍 校正診断: mt0=${mt0.toFixed(4)}, mt1=${mt1.toFixed(4)}, t0=${t0.toFixed(4)}, t1=${t1.toFixed(4)}`);
      log.info(`🔍 推定最終=${estimatedLast.toFixed(4)} vs 実際最終=${t1.toFixed(4)} (差=${(estimatedLast - t1).toFixed(4)}s)`);

      for (const col of columns) {
        const timeSec = col.mt * secPerUnit + offset;
        mapping.push({
          timeMs: (timeSec + timingAdjustmentSec) * 1000,
          xPosition: col.xPx,
        });
      }
    } else if (columns.length > 0 && notes.length > 0) {
      mapping.push({
        timeMs: (notes[0].time + timingAdjustmentSec) * 1000,
        xPosition: columns[0].xPx,
      });
    }

    // 0ms アンカーを先頭に追加
    if (firstBeatX !== null && (mapping.length === 0 || mapping[0].timeMs > 0)) {
      mapping.unshift({
        timeMs: 0,
        xPosition: firstBeatX * scaleFactorRef.current,
      });
    }

    // 時間順で安定ソート
    mapping.sort((a, b) => a.timeMs - b.timeMs);

    log.info(`✅ タイムマッピング完成: ${mapping.length} entries (${osmdNoteCount} OSMD notes → ${columns.length} columns → ${mapping.length} mapping entries)`);

    timeMappingRef.current = mapping;
    mappingCursorRef.current = 0;
    lastRenderedIndexRef.current = -1;
    lastScrollXRef.current = 0;
  }, [notes, settings.timingAdjustment]);

  // 非同期レンダリングの競合防止用カウンター
  const renderGenerationRef = useRef(0);

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

    // 世代カウンターをインクリメント: 後続の呼び出しが来たら古い処理を破棄
    const generation = ++renderGenerationRef.current;

    setIsLoading(true);
    setError(null);

      try {
      // 既存のOSMDインスタンスを破棄
      if (osmdRef.current) {
        osmdRef.current.clear();
        osmdRef.current = null;
      }
      // コンテナ内の描画要素（canvas/svg）を完全に除去して五線の多重描画を防止
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      const xmlWithoutLyrics = stripLyricsFromMusicXml(musicXml);
      // 🎯 簡易表示設定に基づいてMusicXMLを前処理
        const processedMusicXml = simplifyMusicXmlForDisplay(xmlWithoutLyrics, {
        simpleDisplayMode: settings.simpleDisplayMode,
        noteNameStyle: settings.noteNameStyle,
        chordsOnly: settings.sheetMusicChordsOnly,
        useRhythmNotation: useRhythmNotation // リズム譜モードを追加
      });
      
      log.info(`🎼 OSMD簡易表示: ${settings.simpleDisplayMode ? 'ON' : 'OFF'}, 音名スタイル: ${settings.noteNameStyle}, リズム譜: ${useRhythmNotation ? 'ON' : 'OFF'}`);
      
      // OSMDインスタンスを毎回新規作成（移調時の確実な反映のため）
      // autoResize: false にして wrapper 幅変更による自動再描画を防止
      // （autoResize だと updateWrapperWidth 後のサブピクセル再描画で五線が二重になる）
        const options: IOSMDOptions = {
          autoResize: false,
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
      const osmd = new OpenSheetMusicDisplay(containerRef.current, options);
      
      // 前処理されたMusicXMLを使用
      await osmd.load(processedMusicXml);

      // await 後に世代チェック: 新しい呼び出しがあれば古い結果を破棄
      if (generation !== renderGenerationRef.current) {
        osmd.clear();
        return;
      }

      osmd.render();
      osmdRef.current = osmd;

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
            updateWrapperWidth();
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
          createTimeMapping,
          updateWrapperWidth,
        useRhythmNotation
    ]); // musicXml更新時にのみ再レンダリング（settings.transposeはmusicXml経由で反映）

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
    if (!shouldRenderSheet) {
      setWrapperWidth(null);
      return;
    }
    updateWrapperWidth();
  }, [shouldRenderSheet, updateWrapperWidth]);

  useEffect(() => {
    if (!shouldRenderSheet || typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      updateWrapperWidth();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldRenderSheet, updateWrapperWidth]);

  useEffect(() => {
    if (!shouldRenderSheet && osmdRef.current) {
      osmdRef.current.clear();
      timeMappingRef.current = [];
      mappingCursorRef.current = 0;
    }
  }, [shouldRenderSheet]);

  // 再生状態に応じてtransform/scrollLeft方式を切り替え
  useEffect(() => {
    // isPlayingが変化したかどうかを検出
    const wasPlayingChanged = prevIsPlayingRef.current !== isPlaying;
    prevIsPlayingRef.current = isPlaying;
    
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
    } else if (wasPlayingChanged) {
      // 一時停止時: transformの現在値からスクロール位置を取得して適用
      // 重要: CSSトランジションを一時的に無効化して即座に位置を確定
      const originalTransition = wrapper.style.transition;
      wrapper.style.transition = 'none';
      
      // transformの実際の値を取得
      const currentTransform = wrapper.style.transform;
      const match = currentTransform.match(/translateX\(-?([\d.]+)px\)/);
      const transformX = match ? parseFloat(match[1]) : 0;
      
      // transformXが有効な場合はその値を使用、そうでなければlastScrollXRefを使用
      const scrollX = transformX > 0 ? transformX : lastScrollXRef.current;
      
      // transformをリセットしてからscrollLeftを設定
      wrapper.style.transform = 'translateX(0px)';
      
      // 強制的にリフローを発生させてトランジション無効化を確定
      void wrapper.offsetHeight;
      
      scrollContainer.scrollLeft = scrollX;
      
      // lastScrollXRefを更新
      lastScrollXRef.current = scrollX;
      
      // 保護タイムスタンプを設定（一定時間currentTimeによる更新をスキップ）
      pauseProtectionTimestampRef.current = performance.now();
      
      // 次のフレームでトランジションを復元
      requestAnimationFrame(() => {
        if (wrapper) {
          wrapper.style.transition = originalTransition;
        }
      });
    }
  }, [isPlaying, shouldRenderSheet]);

  // 🚀 パフォーマンス最適化: スクロール位置更新を React レンダリングから切り離す
  // useEffect(currentTime) の代わりに rAF ループ + 直接ストア購読で DOM を更新
  const scrollRafRef = useRef<number | null>(null);

  const applyScrollPosition = useCallback((currentTime: number, isCurrentlyPlaying: boolean) => {
    const mapping = timeMappingRef.current;
    if (mapping.length === 0 || !scoreWrapperRef.current) {
      prevTimeRef.current = currentTime;
      return;
    }

    const PAUSE_PROTECTION_MS = 200;
    const timeSincePause = performance.now() - pauseProtectionTimestampRef.current;
    if (!isCurrentlyPlaying && timeSincePause < PAUSE_PROTECTION_MS) {
      prevTimeRef.current = currentTime;
      return;
    }

    const currentTimeMs = currentTime * 1000;

    // バイナリサーチ: currentTimeMs 以下の最大 timeMs を持つインデックスを探す
    let low = 0;
    let high = mapping.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (mapping[mid].timeMs <= currentTimeMs) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const activeIndex = Math.max(0, Math.min(low - 1, mapping.length - 1));

    mappingCursorRef.current = activeIndex;

    const targetEntry = mapping[activeIndex];
    if (!targetEntry) return;

    let xPos = targetEntry.xPosition;
    if (activeIndex + 1 < mapping.length) {
      const nextEntry = mapping[activeIndex + 1];
      const span = nextEntry.timeMs - targetEntry.timeMs;
      if (span > 0) {
        const progress = Math.min(1, Math.max(0, (currentTimeMs - targetEntry.timeMs) / span));
        xPos += progress * (nextEntry.xPosition - targetEntry.xPosition);
      }
    }

    const scrollX = Math.max(0, xPos - PLAYHEAD_POSITION_PX);

    const needsIndexUpdate = activeIndex !== lastRenderedIndexRef.current;
    const needsScrollUpdate = Math.abs(scrollX - lastScrollXRef.current) > 0.5;

    const prev = prevTimeRef.current;
    const seekingBack = currentTime < prev - 0.1;
    const forceAtZero = currentTime < 0.02;

    if (isCurrentlyPlaying) {
      lastScrollXRef.current = scrollX;
    }

    if (needsIndexUpdate || seekingBack || forceAtZero || needsScrollUpdate) {
      const wrapper = scoreWrapperRef.current;
      const scrollContainer = scrollContainerRef.current;
      if (isCurrentlyPlaying) {
        if (wrapper) {
          wrapper.style.transform = `translateX(-${scrollX}px)`;
        }
        if (scrollContainer && Math.abs(scrollContainer.scrollLeft) > 0.5) {
          scrollContainer.scrollLeft = 0;
        }
      } else if (scrollContainer) {
        if (wrapper) {
          wrapper.style.transform = 'translateX(0px)';
        }
        if (Math.abs(scrollContainer.scrollLeft - scrollX) > 0.5) {
          scrollContainer.scrollLeft = scrollX;
        }
      }
      lastRenderedIndexRef.current = activeIndex;
      if (!isCurrentlyPlaying) {
        lastScrollXRef.current = scrollX;
      }
    }

    prevTimeRef.current = currentTime;
  }, []);

  // 🚀 rAF ベースのスクロール更新ループ（再生中）/ ストア直接購読（停止中）
  useEffect(() => {
    if (!shouldRenderSheet) return;

    if (isPlaying) {
      // 再生中: requestAnimationFrame でフレームごとに直接 DOM 更新
      // GameEngine から直接 currentTime を取得（AudioContext ベースの60fps精度）
      // ストア経由では 20fps スロットルが掛かり、スクロールが小刻みになるため
      const scrollLoop = () => {
        const store = useGameStore.getState();
        const engine = store.gameEngine;
        const time = engine
          ? engine.getState().currentTime
          : store.currentTime;
        applyScrollPosition(time, true);
        scrollRafRef.current = requestAnimationFrame(scrollLoop);
      };
      scrollRafRef.current = requestAnimationFrame(scrollLoop);

      return () => {
        if (scrollRafRef.current !== null) {
          cancelAnimationFrame(scrollRafRef.current);
          scrollRafRef.current = null;
        }
      };
    }

    // 停止中: ストア購読でシーク操作に即応（React再レンダリングなし）
    applyScrollPosition(useGameStore.getState().currentTime, false);
    const unsubscribe = useGameStore.subscribe(
      (state) => state.currentTime,
      (time) => applyScrollPosition(time, false)
    );
    return unsubscribe;
  }, [isPlaying, shouldRenderSheet, applyScrollPosition]);

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
      return null;
    }

  return (
    <div className={cn('relative', className)}>
      {/* プレイヘッド（赤い縦線） - スクロール位置に影響されないよう外側へ配置 */}
      <div 
        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${PLAYHEAD_POSITION_PX}px` }}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "h-full bg-white text-black pt-6",
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
          {/* 楽譜コンテナ */}
          <div className="relative h-full pt-4 pb-4">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="text-black">
                  {isEnglishCopy ? 'Loading sheet music...' : '楽譜を読み込み中...'}
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="text-red-600">
                  {isEnglishCopy ? 'Error: ' : 'エラー: '}
                  {error}
                </div>
              </div>
            )}
            
            {(!musicXml && !isLoading) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-600">
                  {isEnglishCopy ? 'No sheet music data' : '楽譜データがありません'}
                </div>
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
      </div>
  );
};

export default SheetMusicDisplay;
