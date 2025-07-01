import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import platform from '@/platform';

interface SheetMusicDisplayProps {
  musicXmlUrl?: string;
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
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ musicXmlUrl, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeMapping, setTimeMapping] = useState<TimeMappingEntry[]>([]);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  
  const { currentTime, isPlaying, notes, transpose } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    transpose: s.settings.transpose || 0
  }));
  
  const gameActions = useGameActions();

  // OSMDの初期化
  const initializeOSMD = useCallback(async () => {
    if (!containerRef.current || !musicXmlUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      // 既存のOSMDインスタンスをクリーンアップ
      if (osmdRef.current) {
        osmdRef.current.clear();
      }

      // OSMDオプション設定
      const options: IOSMDOptions = {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        drawComposer: false,
        drawLyricist: false,
        drawPartNames: false,
        drawingParameters: 'compacttight',
        renderSingleHorizontalStaffline: true, // 横1行モード
        stretchLastSystemLine: false,
        pageFormat: 'Endless', // エンドレス（横長）フォーマット
        pageBackgroundColor: '#00000000', // 透明背景
        defaultColorNotehead: '#ffffff',
        defaultColorStem: '#ffffff',
        defaultColorRest: '#ffffff',
        defaultColorLabel: '#ffffff',
        defaultColorTitle: '#ffffff'
      };

      // OSMDインスタンスを作成
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, options);
      
      // MusicXMLを読み込み
      await osmdRef.current.load(musicXmlUrl);
      
      // 移調設定
      if (transpose !== 0) {
        osmdRef.current.Sheet.Transpose = transpose;
      }
      
      // レンダリング
      osmdRef.current.render();
      
      // タイムマッピングを作成
      createTimeMapping();
      
    } catch (err) {
      console.error('楽譜の読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXmlUrl, transpose]);

  // MIDIノート番号から音名を取得（臨時記号考慮）
  const getMidiNoteName = (midiNote: number, preferFlat: boolean = false): { step: string; alter: number } => {
    const noteNames = preferFlat ? 
      ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] :
      ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const noteIndex = midiNote % 12;
    const noteName = noteNames[noteIndex];
    
    // 音名と臨時記号を分離
    let step = noteName[0];
    let alter = 0;
    
    if (noteName.length > 1) {
      if (noteName[1] === '#') {
        alter = 1;
      } else if (noteName[1] === 'b') {
        alter = -1;
      }
    }
    
    return { step, alter };
  };

  // 音符の時刻とX座標のマッピングを作成 + 音名情報を抽出 + 整合性チェック
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) return;

    const mapping: TimeMappingEntry[] = [];
    const noteNamesMap: { [noteId: string]: string } = {};
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      console.warn('楽譜のグラフィック情報が取得できません');
      return;
    }

    let noteIndex = 0;
    const xmlNotes: { pitch: number; noteName: string }[] = [];
    
    // 全ての音符を走査
    for (const page of graphicSheet.MusicPages) {
      for (const system of page.MusicSystems) {
        for (const staffLine of system.StaffLines) {
          for (const measure of staffLine.Measures) {
            for (const staffEntry of measure.staffEntries) {
              for (const voice of staffEntry.graphicalVoiceEntries) {
                for (const graphicNote of voice.notes) {
                  // タイで結ばれた後続音符はスキップ
                  if (graphicNote.sourceNote.NoteTie && !graphicNote.sourceNote.NoteTie.StartNote) {
                    continue;
                  }
                  
                  // MusicXMLの音符情報を取得
                  const sourceNote = graphicNote.sourceNote;
                  if (sourceNote && sourceNote.Pitch) {
                    const pitch = sourceNote.Pitch;
                    const midiNote = pitch.getHalfTone() + 60; // C4 = 60を基準に計算
                    
                    // 音名を取得（MusicXMLの表記を優先）
                    let noteName = pitch.FundamentalNote.toString();
                    
                    // 臨時記号の処理
                    if (pitch.Accidental !== undefined && pitch.Accidental !== null && pitch.Accidental !== 0) {
                      switch (pitch.Accidental) {
                        case 1: noteName += '#'; break;
                        case -1: noteName += 'b'; break;
                        case 2: noteName += 'x'; break; // ダブルシャープ
                        case -2: noteName += 'bb'; break; // ダブルフラット
                      }
                    }
                    
                    xmlNotes.push({ pitch: midiNote, noteName });
                    
                    // JSONのノートとマッピング
                    if (noteIndex < notes.length) {
                      const note = notes[noteIndex];
                      const absX = graphicNote.PositionAndShape.AbsolutePosition.x;
                      
                      if (absX !== undefined) {
                        mapping.push({
                          timeMs: note.time * 1000, // 秒をミリ秒に変換
                          xPosition: absX * 10 // OSMDの単位系からピクセルへ変換（概算）
                        });
                      }
                      
                      // MusicXMLの音名をJSONノートに関連付け
                      noteNamesMap[note.id] = noteName;
                      noteIndex++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 整合性チェック
    const errors: string[] = [];
    
    // 1. 音符数のチェック
    if (xmlNotes.length !== notes.length) {
      errors.push(`音符数の不一致: JSON=${notes.length}個, MusicXML=${xmlNotes.length}個（タイ除外後）`);
    }
    
    // 2. 各音符のピッチチェック
    const checkLength = Math.min(xmlNotes.length, notes.length);
    for (let i = 0; i < checkLength; i++) {
      const jsonNote = notes[i];
      const xmlNote = xmlNotes[i];
      
      if (jsonNote.pitch !== xmlNote.pitch) {
        errors.push(`${i + 1}番目の音符のピッチ不一致: JSON=${jsonNote.pitch} (MIDI), MusicXML=${xmlNote.pitch} (MIDI)`);
      }
    }
    
    // 検証結果を保存
    setValidationResult({
      valid: errors.length === 0,
      errors
    });
    
    if (errors.length > 0) {
      console.warn('🎵 JSONとMusicXMLの整合性チェック結果:');
      errors.forEach(error => console.warn(`  - ${error}`));
    } else {
      console.log('✅ JSONとMusicXMLの整合性チェック: OK');
    }
    
    // 音名情報をnotesに反映
    if (Object.keys(noteNamesMap).length > 0) {
      gameActions.updateNoteNames(noteNamesMap);
    }
    
    setTimeMapping(mapping);
  }, [notes, gameActions]);

  // スクロールアニメーション
  const updateScroll = useCallback(() => {
    if (!scoreWrapperRef.current || timeMapping.length === 0) return;
    
    const currentTimeMs = currentTime * 1000;
    
    // 現在時刻に最も近い音符を見つける
    let targetX = 0;
    for (let i = timeMapping.length - 1; i >= 0; i--) {
      if (timeMapping[i].timeMs <= currentTimeMs) {
        targetX = timeMapping[i].xPosition;
        
        // 次の音符との間を補間
        if (i < timeMapping.length - 1) {
          const nextEntry = timeMapping[i + 1];
          const prevEntry = timeMapping[i];
          const progress = (currentTimeMs - prevEntry.timeMs) / (nextEntry.timeMs - prevEntry.timeMs);
          targetX = prevEntry.xPosition + (nextEntry.xPosition - prevEntry.xPosition) * progress;
        }
        break;
      }
    }
    
    // プレイヘッドの位置（画面左から100px）
    const playheadPosition = 100;
    const scrollX = targetX - playheadPosition;
    
    // スクロール適用
    scoreWrapperRef.current.style.transform = `translateX(-${scrollX}px)`;
    
    if (isPlaying) {
      animationFrameRef.current = platform.requestAnimationFrame(updateScroll);
    }
  }, [currentTime, isPlaying, timeMapping]);

  // 再生状態が変わったらアニメーションを開始/停止
  useEffect(() => {
    if (isPlaying) {
      updateScroll();
    } else if (animationFrameRef.current) {
      platform.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        platform.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateScroll]);

  // MusicXMLが変更されたら再初期化
  useEffect(() => {
    initializeOSMD();
  }, [initializeOSMD]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
      }
      if (animationFrameRef.current) {
        platform.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className}`}>
      {/* プレイヘッド（赤い縦線） */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: '100px' }}
      />
      
      {/* 整合性チェック結果の表示 */}
      {validationResult && !validationResult.valid && (
        <div className="absolute top-2 right-2 bg-yellow-900 bg-opacity-90 text-yellow-200 text-xs p-2 rounded max-w-xs z-20">
          <div className="font-semibold mb-1">⚠️ 整合性チェック警告</div>
          <ul className="list-disc list-inside">
            {validationResult.errors.slice(0, 3).map((error: string, index: number) => (
              <li key={index} className="truncate">{error}</li>
            ))}
            {validationResult.errors.length > 3 && (
              <li>他 {validationResult.errors.length - 3} 件のエラー</li>
            )}
          </ul>
        </div>
      )}
      
      {/* 楽譜コンテナ */}
      <div className="relative h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-white">楽譜を読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-red-400">エラー: {error}</div>
          </div>
        )}
        
        {!musicXmlUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">楽譜データがありません</div>
          </div>
        )}
        
        {/* OSMDレンダリング用コンテナ */}
        <div 
          ref={scoreWrapperRef}
          className="h-full transition-transform duration-100 ease-out"
          style={{ willChange: 'transform' }}
        >
          <div 
            ref={containerRef} 
            className="h-full"
            style={{ minWidth: '3000px' }} // 十分な幅を確保
          />
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;