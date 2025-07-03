import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import platform from '@/platform';
import { getKeySignature, getCorrectNoteName, getPreferredKey } from '@/utils/musicTheory';

// Verovioモジュールの型定義
declare global {
  interface Window {
    verovio?: any;
  }
}

interface SheetMusicDisplayProps {
  musicXmlUrl?: string;
  className?: string;
}

interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

// Verovioモジュールの動的インポート
const loadVerovioModule = async () => {
  // @ts-ignore
  const verovio = await import('verovio/wasm');
  return verovio.default();
};

/**
 * 楽譜表示コンポーネント
 * Verovioを使用して横スクロール形式の楽譜を表示
 */
const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({ musicXmlUrl, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreWrapperRef = useRef<HTMLDivElement>(null);
  const toolkitRef = useRef<any>(null);
  const verovioModuleRef = useRef<any>(null);
  const musicXmlDataRef = useRef<string>('');
  const animationFrameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeMapping, setTimeMapping] = useState<TimeMappingEntry[]>([]);
  const previousTransposeRef = useRef<number>(0);
  const [svgWidth, setSvgWidth] = useState<number>(0);
  const [isVerovioReady, setIsVerovioReady] = useState(false);
  
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

  // デバッグ用: 現在のキー情報を保持
  const [currentKeyInfo, setCurrentKeyInfo] = useState<string>('');

  // Verovioモジュールの初期化
  useEffect(() => {
    const initializeModule = async () => {
      try {
        console.log('Loading Verovio module...');
        const VerovioModule = await loadVerovioModule();
        verovioModuleRef.current = VerovioModule;
        
        // ESMの場合はVerovioToolkitクラスを使用
        // @ts-ignore
        const { VerovioToolkit } = await import('verovio/esm');
        toolkitRef.current = new VerovioToolkit(VerovioModule);
        
        setIsVerovioReady(true);
        console.log('Verovio module loaded successfully');
      } catch (err) {
        console.error('Failed to load Verovio module:', err);
        setError('Verovio モジュールの読み込みに失敗しました');
      }
    };

    initializeModule();
  }, []);

  // Verovioの初期化と楽譜のレンダリング
  const initializeVerovio = useCallback(async () => {
    if (!containerRef.current || !musicXmlUrl || !isVerovioReady || !toolkitRef.current) return;

    const currentTranspose = transposeRef.current;
    console.log('Initializing Verovio with transpose:', currentTranspose);
    setIsLoading(true);
    setError(null);

    try {
      const tk = toolkitRef.current;

      // MusicXMLデータを取得
      if (!musicXmlDataRef.current) {
        const response = await fetch(musicXmlUrl);
        if (!response.ok) {
          throw new Error(`Failed to load MusicXML: ${response.statusText}`);
        }
        musicXmlDataRef.current = await response.text();
      }

      // MusicXMLを読み込み
      const loadResult = tk.loadData(musicXmlDataRef.current);
      if (!loadResult) {
        throw new Error('Failed to load MusicXML data');
      }

      // Verovioオプション設定（横スクロール用）
      tk.setOptions({
        scale: 35,                    // スケール調整
        pageHeight: 1500,            // 高さを大きくして1行に収める
        pageWidth: 60000,            // 十分な幅を確保
        adjustPageHeight: true,      // 高さを自動調整
        adjustPageWidth: false,      // 幅は固定
        breaks: 'none',              // 改行なし
        systemMaxPerPage: 1,         // 1ページに1システム
        landscape: true,             // 横向き
        header: 'none',              // ヘッダーなし
        footer: 'none',              // フッターなし
        pageMarginTop: 100,          // 上部マージン
        pageMarginBottom: 100,       // 下部マージン
        pageMarginLeft: 50,          // 左マージン
        pageMarginRight: 50,         // 右マージン
        svgBoundingBoxes: true,      // バウンディングボックス情報を含める
        svgViewBox: false,           // viewBoxを使わない
        svgAdditionalAttribute: ['note@pname', 'note@oct', 'note@xml:id'], // 音名情報を含める
        transpose: currentTranspose.toString(), // 移調設定
        transposeToSoundingPitch: false, // 記譜音高で表示
      });

      // レンダリング
      const svg = tk.renderToSVG(1);
      if (!svg) {
        throw new Error('Failed to render SVG');
      }

      // SVGをコンテナに設定
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;

        // SVGのスタイル調整（白色の音符）
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.height = '100%';
          svgElement.style.width = 'auto';
          
          // 全ての要素を白色に
          const allElements = svgElement.querySelectorAll('*');
          allElements.forEach((element) => {
            if (element instanceof SVGElement) {
              element.style.fill = '#ffffff';
              element.style.stroke = '#ffffff';
            }
          });

          // SVGの実際の幅を取得
          const bbox = svgElement.getBBox();
          setSvgWidth(bbox.width + 200); // 余白を追加
        }
      }

      // タイムマッピングと音名情報を作成
      createTimeMappingAndNoteNames();
      
      // キー情報を取得
      updateKeyInfo(currentTranspose);
      
      previousTransposeRef.current = currentTranspose;
      console.log('Verovio initialized successfully');
      
    } catch (err) {
      console.error('楽譜の読み込みエラー:', err);
      setError(err instanceof Error ? err.message : '楽譜の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [musicXmlUrl, isVerovioReady]);

  // キー情報を更新
  const updateKeyInfo = useCallback((transposeValue: number) => {
    try {
      let keyInfo = 'Unknown key';
      
      // MusicXMLから元のキー情報を取得
      if (musicXmlDataRef.current) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(musicXmlDataRef.current, 'text/xml');
        const keyElement = xmlDoc.querySelector('key');
        
        if (keyElement) {
          const fifthsElement = keyElement.querySelector('fifths');
          const modeElement = keyElement.querySelector('mode');
          
          if (fifthsElement) {
            const fifths = parseInt(fifthsElement.textContent || '0');
            const mode = modeElement?.textContent || 'major';
            
            // 移調後の実効的な五度圏位置を計算
            const transposedFifths = fifths + Math.round(transposeValue * 7 / 12);
            
            // 実効的なキーを表示
            let effectiveKey = '';
            if (mode === 'major') {
              const majorKeysByFifths: Record<string, string> = {
                '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F',
                '0': 'C',
                '1': 'G', '2': 'D', '3': 'A', '4': 'E', '5': 'B', '6': 'Gb', '7': 'C#'
              };
              effectiveKey = majorKeysByFifths[transposedFifths.toString()] || '?';
            } else {
              const minorKeysByFifths: Record<string, string> = {
                '-7': 'Ab', '-6': 'Eb', '-5': 'Bb', '-4': 'F', '-3': 'C', '-2': 'G', '-1': 'D',
                '0': 'A',
                '1': 'E', '2': 'B', '3': 'F#', '4': 'C#', '5': 'G#', '6': 'D#', '7': 'A#'
              };
              effectiveKey = minorKeysByFifths[transposedFifths.toString()] || '?';
            }
            
            keyInfo = `Original: ${fifths} fifths, Transposed: ${effectiveKey} ${mode}`;
          }
        }
      }
      
      setCurrentKeyInfo(`${keyInfo}, Transpose: ${transposeValue}`);
    } catch (err) {
      console.error('Error updating key info:', err);
    }
  }, []);

  // 音符の時刻とX座標のマッピングを作成 + 音名情報を抽出
  const createTimeMappingAndNoteNames = useCallback(() => {
    if (!toolkitRef.current || !notes || notes.length === 0 || !containerRef.current) return;

    const tk = toolkitRef.current;
    const mapping: TimeMappingEntry[] = [];
    const noteNamesMap: { [noteId: string]: string } = {};

    // 楽曲のキー情報を取得
    let keySignature = null;
    if (currentSong?.key) {
      keySignature = getPreferredKey(currentSong.key, currentSong.keyType || 'major');
      console.log(`🎼 Song key info: ${currentSong.key} ${currentSong.keyType || 'major'}`);
      console.log(`🎹 Using key signature:`, keySignature);
    }

    // MusicXMLからキー情報を取得（楽曲データにキー情報がない場合）
    if (!keySignature && musicXmlDataRef.current) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(musicXmlDataRef.current, 'text/xml');
        const keyElement = xmlDoc.querySelector('key');
        
        if (keyElement) {
          const fifthsElement = keyElement.querySelector('fifths');
          const modeElement = keyElement.querySelector('mode');
          
          if (fifthsElement) {
            const fifths = parseInt(fifthsElement.textContent || '0');
            const keyMode = modeElement?.textContent || 'major';
            
            // 五度圏の位置から調を決定
            let keyName = '';
            if (keyMode === 'major') {
              const majorKeysByFifths: Record<string, string> = {
                '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F',
                '0': 'C',
                '1': 'G', '2': 'D', '3': 'A', '4': 'E', '5': 'B', '6': 'Gb', '7': 'C#'
              };
              keyName = majorKeysByFifths[fifths.toString()] || 'C';
            } else {
              const minorKeysByFifths: Record<string, string> = {
                '-7': 'Ab', '-6': 'Eb', '-5': 'Bb', '-4': 'F', '-3': 'C', '-2': 'G', '-1': 'D',
                '0': 'A',
                '1': 'E', '2': 'B', '3': 'F#', '4': 'C#', '5': 'G#', '6': 'D#', '7': 'A#'
              };
              keyName = minorKeysByFifths[fifths.toString()] || 'A';
            }
            
            if (keyName) {
              keySignature = getPreferredKey(keyName, keyMode as 'major' | 'minor');
              console.log(`🎵 MusicXML key detected: ${keyName} ${keyMode} (fifths: ${fifths})`);
            }
          }
        }
      } catch (err) {
        console.error('Error parsing key from MusicXML:', err);
      }
    }

    // デフォルトでCメジャー
    if (!keySignature) {
      keySignature = getKeySignature('C', 'major');
      console.log('⚠️ No key signature found, using default: C major');
    }

    try {
      // 各音符の時間情報を使用してマッピングを作成
      notes.forEach((note, index) => {
        // 時間情報を持つ要素を検索
        const timeInMs = note.time * 1000;
        
        // getElementAtTimeを使用して要素を取得
        try {
          const elementsAtTime = tk.getElementsAtTime(timeInMs);
          if (elementsAtTime && elementsAtTime.notes && elementsAtTime.notes.length > 0) {
            const noteElement = elementsAtTime.notes[0];
            
            // バウンディングボックスを取得
            const bbox = tk.getElementBBox(noteElement);
            if (bbox) {
              mapping.push({
                timeMs: timeInMs,
                xPosition: bbox.x
              });
            }
            
            // 音名情報を取得
            const attributes = tk.getElementAttributes(noteElement);
            if (attributes && attributes.pname && attributes.oct) {
              // 音名をMIDIノート番号に変換
              const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
              const noteIndex = noteNames.indexOf(attributes.pname.toUpperCase());
              
              if (noteIndex !== -1) {
                const octave = parseInt(attributes.oct);
                let midiNote = (octave + 1) * 12 + [0, 2, 4, 5, 7, 9, 11][noteIndex];
                
                // 移調を考慮
                midiNote += transposeRef.current;
                
                // 正しい音名を取得
                if (keySignature) {
                  const correctNoteName = getCorrectNoteName(midiNote, keySignature);
                  noteNamesMap[note.id] = correctNoteName;
                }
              }
            }
          }
        } catch (err) {
          // getElementsAtTimeがサポートされていない場合のフォールバック
          console.log('Using fallback method for time mapping');
        }
      });

      // タイムマッピングがない場合は、JSONの時間情報から推定
      if (mapping.length === 0 && notes.length > 0 && svgWidth > 0) {
        console.log('Creating time mapping from JSON timing data');
        const totalDuration = notes[notes.length - 1].time;
        const pixelsPerSecond = svgWidth / totalDuration;
        
        notes.forEach((note, index) => {
          mapping.push({
            timeMs: note.time * 1000,
            xPosition: note.time * pixelsPerSecond
          });
          
          // 音名情報もデフォルトで設定
          const midiNote = note.pitch + transposeRef.current;
          if (keySignature) {
            const correctNoteName = getCorrectNoteName(midiNote, keySignature);
            noteNamesMap[note.id] = correctNoteName;
          }
        });
      }

      // 音名情報をnotesに反映
      if (Object.keys(noteNamesMap).length > 0) {
        gameActions.updateNoteNames(noteNamesMap);
      }
      
      setTimeMapping(mapping);
      console.log(`Created time mapping with ${mapping.length} entries`);
    } catch (err) {
      console.error('Error creating time mapping:', err);
      // フォールバックとして基本的なタイムマッピングを作成
      if (notes.length > 0 && svgWidth > 0) {
        const totalDuration = notes[notes.length - 1].time;
        const pixelsPerSecond = svgWidth / totalDuration;
        
        notes.forEach((note) => {
          mapping.push({
            timeMs: note.time * 1000,
            xPosition: note.time * pixelsPerSecond
          });
          
          const midiNote = note.pitch + transposeRef.current;
          if (keySignature) {
            const correctNoteName = getCorrectNoteName(midiNote, keySignature);
            noteNamesMap[note.id] = correctNoteName;
          }
        });
        
        if (Object.keys(noteNamesMap).length > 0) {
          gameActions.updateNoteNames(noteNamesMap);
        }
        
        setTimeMapping(mapping);
      }
    }
  }, [notes, gameActions, currentSong, svgWidth]);

  // 移調値が変更された時の処理
  useEffect(() => {
    if (toolkitRef.current && transpose !== previousTransposeRef.current && isVerovioReady) {
      console.log('Transpose changed from', previousTransposeRef.current, 'to', transpose);
      
      try {
        const tk = toolkitRef.current;
        
        // 移調オプションを更新
        tk.setOptions({
          transpose: transpose.toString()
        });
        
        // 再レンダリング
        tk.redoLayout();
        const svg = tk.renderToSVG(1);
        
        if (containerRef.current && svg) {
          containerRef.current.innerHTML = svg;
          
          // SVGのスタイル再調整
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.height = '100%';
            svgElement.style.width = 'auto';
            
            const allElements = svgElement.querySelectorAll('*');
            allElements.forEach((element) => {
              if (element instanceof SVGElement) {
                element.style.fill = '#ffffff';
                element.style.stroke = '#ffffff';
              }
            });
            
            const bbox = svgElement.getBBox();
            setSvgWidth(bbox.width + 200);
          }
        }
        
        // タイムマッピングと音名情報を再作成
        createTimeMappingAndNoteNames();
        
        // キー情報を更新
        updateKeyInfo(transpose);
        
        previousTransposeRef.current = transpose;
        console.log('Transpose updated successfully');
        
      } catch (err) {
        console.error('移調エラー:', err);
        // エラーが発生した場合は楽譜を再読み込み
        initializeVerovio();
      }
    }
  }, [transpose, initializeVerovio, createTimeMappingAndNoteNames, updateKeyInfo, isVerovioReady]);

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
    if (isVerovioReady) {
      musicXmlDataRef.current = ''; // キャッシュをクリア
      initializeVerovio();
    }
  }, [musicXmlUrl, initializeVerovio, isVerovioReady]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        platform.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className}`}>
      {/* デバッグ情報表示 */}
      <div className="absolute top-2 right-2 text-xs text-yellow-400 bg-black bg-opacity-50 p-2 rounded z-20">
        {currentKeyInfo}
      </div>
      
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
        
        {/* Verovioレンダリング用コンテナ */}
        <div 
          ref={scoreWrapperRef}
          className="h-full transition-transform duration-100 ease-out"
          style={{ willChange: 'transform' }}
        >
          <div 
            ref={containerRef} 
            className="h-full flex items-center verovio-container"
            style={{ minWidth: `${svgWidth}px` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SheetMusicDisplay;