import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay, IOSMDOptions, TransposeCalculator } from 'opensheetmusicdisplay';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import platform from '@/platform';
import { getKeySignature, getCorrectNoteName, getPreferredKey } from '@/utils/musicTheory';

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
  const previousTransposeRef = useRef<number>(0);
  
  const { currentTime, isPlaying, notes, transpose, currentSong } = useGameSelector((s) => ({
    currentTime: s.currentTime,
    isPlaying: s.isPlaying,
    notes: s.notes,
    transpose: s.settings.transpose || 0,
    currentSong: s.currentSong
  }));
  
  const gameActions = useGameActions();
  
  // 最新のtranspose値を保持
  const transposeRef = useRef(transpose);
  transposeRef.current = transpose;

  // OSMDの初期化
  const initializeOSMD = useCallback(async () => {
    if (!containerRef.current || !musicXmlUrl) return;

    const currentTranspose = transposeRef.current;
    console.log('Initializing OSMD with transpose:', currentTranspose);
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
      
      // TransposeCalculatorをインスタンス化して設定
      osmdRef.current.TransposeCalculator = new TransposeCalculator();
      
      // MusicXMLを読み込み
      await osmdRef.current.load(musicXmlUrl);
      
      // 移調設定
      if (currentTranspose !== 0) {
        osmdRef.current.Sheet.Transpose = currentTranspose;
      }
      
      // レイアウト更新とレンダリング
      osmdRef.current.updateGraphic();
      osmdRef.current.render();
      
      // タイムマッピングを作成
      createTimeMapping();
      
      previousTransposeRef.current = currentTranspose;
      console.log('OSMD initialized successfully');
      
    } catch (err) {
      console.error('楽譜の読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXmlUrl]); // transposeを依存配列から削除

  // 移調値が変更された時の処理
  useEffect(() => {
    if (osmdRef.current && transpose !== previousTransposeRef.current) {
      // 移調値が変更された場合
      console.log('Transpose changed from', previousTransposeRef.current, 'to', transpose);
      
      try {
        // 楽譜の移調値を更新
        osmdRef.current.Sheet.Transpose = transpose;
        
        // レイアウト更新と再レンダリング
        osmdRef.current.updateGraphic();
        osmdRef.current.render();
        
        // タイムマッピングを再作成
        createTimeMapping();
        
        previousTransposeRef.current = transpose;
        console.log('Transpose updated successfully');
      } catch (err) {
        console.error('移調エラー:', err);
        // エラーが発生した場合は楽譜を再読み込み
        initializeOSMD();
      }
    }
  }, [transpose, initializeOSMD]);

  // 音符の時刻とX座標のマッピングを作成 + 音名情報を抽出
  const createTimeMapping = useCallback(() => {
    if (!osmdRef.current || !notes || notes.length === 0) return;

    const mapping: TimeMappingEntry[] = [];
    const noteNamesMap: { [noteId: string]: string } = {};
    const graphicSheet = osmdRef.current.GraphicSheet;
    
    if (!graphicSheet || !graphicSheet.MusicPages || graphicSheet.MusicPages.length === 0) {
      console.warn('楽譜のグラフィック情報が取得できません');
      return;
    }

    // 楽曲のキー情報を取得（F#メジャーの場合はGbメジャーに変換）
    let keySignature = null;
    if (currentSong?.key) {
      keySignature = getPreferredKey(currentSong.key, currentSong.keyType || 'major');
    }
    
    // MusicXMLからキー情報を取得（楽曲データにキー情報がない場合）
    if (!keySignature && osmdRef.current.Sheet && osmdRef.current.Sheet.SourceMeasures.length > 0) {
      const firstMeasure = osmdRef.current.Sheet.SourceMeasures[0];
      if (firstMeasure && firstMeasure.Rules) {
        for (const rule of firstMeasure.Rules) {
          if (rule.Key) {
            // MusicXMLのキー情報から調を判定
            const keyMode = rule.Key.Mode === 1 ? 'minor' : 'major';
            const fifths = rule.Key.Fifths;
            
            // 五度圏の位置から調を決定
            let keyName = '';
            if (keyMode === 'major') {
              // メジャーキー: 五度圏順
              const majorKeysByFifths: Record<string, string> = {
                '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F',
                '0': 'C',
                '1': 'G', '2': 'D', '3': 'A', '4': 'E', '5': 'B', '6': 'Gb', '7': 'C#'  // F#はGbとして扱う
              };
              keyName = majorKeysByFifths[fifths.toString()] || 'C';
            } else {
              // マイナーキー: 五度圏順
              const minorKeysByFifths: Record<string, string> = {
                '-7': 'Ab', '-6': 'Eb', '-5': 'Bb', '-4': 'F', '-3': 'C', '-2': 'G', '-1': 'D',
                '0': 'A',
                '1': 'E', '2': 'B', '3': 'F#', '4': 'C#', '5': 'G#', '6': 'D#', '7': 'A#'
              };
              keyName = minorKeysByFifths[fifths.toString()] || 'A';
            }
            
            if (keyName) {
              keySignature = getPreferredKey(keyName, keyMode);
              break;
            }
          }
        }
      }
    }

    let noteIndex = 0;
    
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
                  
                  if (noteIndex < notes.length) {
                    const note = notes[noteIndex];
                    const absX = graphicNote.PositionAndShape.AbsolutePosition.x;
                    
                    if (absX !== undefined) {
                      mapping.push({
                        timeMs: note.time * 1000, // 秒をミリ秒に変換
                        xPosition: absX * 10 // OSMDの単位系からピクセルへ変換（概算）
                      });
                    }
                    
                    // 音名情報を抽出
                    const sourceNote = graphicNote.sourceNote;
                    if (sourceNote) {
                      // TransposedPitchがある場合はそちらを優先
                      const pitch = sourceNote.TransposedPitch || sourceNote.Pitch;
                      if (pitch) {
                        // キー情報がある場合は正しい音名を計算
                        if (keySignature) {
                          // MIDIノート番号を計算
                          const octave = pitch.Octave;
                          const noteIndex = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(pitch.FundamentalNote.toString());
                          let midiNote = (octave + 1) * 12 + [0, 2, 4, 5, 7, 9, 11][noteIndex];
                          
                          // 臨時記号による調整
                          if (pitch.Accidental) {
                            midiNote += pitch.Accidental;
                          }
                          
                          // 正しい音名を取得
                          const correctNoteName = getCorrectNoteName(midiNote, keySignature);
                          noteNamesMap[note.id] = correctNoteName;
                        } else {
                          // キー情報がない場合は従来の処理
                          let noteName = pitch.FundamentalNote.toString();
                          
                          // 臨時記号の処理
                          if (pitch.Accidental) {
                            switch (pitch.Accidental) {
                              case 1: noteName += '#'; break;
                              case -1: noteName += 'b'; break;
                              case 2: noteName += 'x'; break; // ダブルシャープ
                              case -2: noteName += 'bb'; break; // ダブルフラット
                            }
                          }
                          
                          noteNamesMap[note.id] = noteName;
                        }
                      }
                    }
                    
                    noteIndex++;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // 音名情報をnotesに反映
    if (Object.keys(noteNamesMap).length > 0) {
      gameActions.updateNoteNames(noteNamesMap);
    }
    
    setTimeMapping(mapping);
  }, [notes, gameActions, currentSong]);

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
  }, [musicXmlUrl]); // transposeは別のuseEffectで処理

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
      
      {/* 楽譜コンテナ - 上部に余白を追加 */}
      <div className="relative h-full pt-8 pb-4">
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
            className="h-full flex items-center"
            style={{ minWidth: '3000px' }} // 十分な幅を確保
          />
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;