import type { NoteData, ChordSymbol, ChordInfo } from '@/types';
import { Note, Interval, transpose, note as parseNote } from 'tonal';
import { transposeKey } from './chord-utils';
import { toDisplayName, type DisplayOpts } from './display-note';

/**
 * Extract playable note names from transposed MusicXML document.
 * Skips rests and tie-stop notes to match JSON note structure.
 */
export function extractPlayableNoteNames(doc: Document): string[] {
  const names: string[] = [];
  let totalNotes = 0;
  let skippedRests = 0;
  let skippedTies = 0;
  
  doc.querySelectorAll('note').forEach((noteEl) => {
    totalNotes++;
    
    // Skip rest notes
    if (noteEl.querySelector('rest')) {
      skippedRests++;
      // console.log(`⏸️ Skipping rest at position ${totalNotes}`);
      return;
    }
    
    // Skip tie stop (後ろ側)
    const ties = Array.from(noteEl.querySelectorAll('tie'));
    if (ties.some(t => t.getAttribute('type') === 'stop' && !ties.some(t2 => t2.getAttribute('type') === 'start'))) {
      skippedTies++;
      // console.log(`🔗 Skipping tie-stop at position ${totalNotes}`);
      return;
    }

    const pitchEl = noteEl.querySelector('pitch');
    if (!pitchEl) {
      // console.warn(`⚠️ Note without pitch at position ${totalNotes}`);
      return;
    }

    const step = pitchEl.querySelector('step')?.textContent ?? 'C';
    const alter = parseInt(pitchEl.querySelector('alter')?.textContent ?? '0', 10);
    const octave = parseInt(pitchEl.querySelector('octave')?.textContent ?? '4', 10);

    // Generate accidental string: 0=natural, 1=#, 2=##, -1=b, -2=bb
    let accidental = '';
    if (alter > 0) {
      accidental = '#'.repeat(alter);
    } else if (alter < 0) {
      accidental = 'b'.repeat(-alter);
    }

    const noteName = `${step}${accidental}${octave}`;
    names.push(noteName);
    // console.log(`🎵 Extracted note ${names.length}: ${noteName} (position ${totalNotes})`);
  });
  
  // console.log(`📊 MusicXML Note Extraction Summary:
  //   Total notes in XML: ${totalNotes}
  //   Skipped rests: ${skippedRests}
  //   Skipped ties: ${skippedTies}
    Extracted playable notes: ${names.length}`);
  
  return names;
}

/**
 * Merge JSON note data with MusicXML note names.
 * Assumes both arrays are in the same order (time-sequential).
 */
export function mergeJsonWithNames(jsonNotes: NoteData[], noteNames: string[]): NoteData[] {
  // console.log(`🔄 Merging ${jsonNotes.length} JSON notes with ${noteNames.length} XML note names`);
  
  if (jsonNotes.length !== noteNames.length) {
    // console.error(`❌ Note count mismatch: JSON=${jsonNotes.length}, XML=${noteNames.length}`);
    // console.log('First 5 JSON notes:', jsonNotes.slice(0, 5).map(n => ({ time: n.time, pitch: n.pitch })));
    // console.log('First 5 XML names:', noteNames.slice(0, 5));
  }

  const merged = jsonNotes.map((note, index) => {
    const noteName = noteNames[index] ?? `Unknown${index}`;
    // console.log(`   Note ${index}: time=${note.time.toFixed(2)}s, pitch=${note.pitch}, name=${noteName}`);
    return {
      ...note,
      noteName
    };
  });
  
  // console.log(`✅ Merged ${merged.length} notes with names`);
  return merged;
}

/**
 * MusicXML内のノーツとコードの位置情報を抽出
 */
interface MusicXmlNotePosition {
  measureNumber: number;
  positionInMeasure: number; // divisionベースの位置
  step: string;
  alter: number;
  octave: number;
}

interface MusicXmlChordPosition {
  measureNumber: number;
  positionInMeasure: number; // divisionベースの位置
  symbol: ChordSymbol;
}

/**
 * MusicXMLからノーツ位置情報を抽出（時間同期用）
 */
function extractNotePositions(doc: Document): MusicXmlNotePosition[] {
  const positions: MusicXmlNotePosition[] = [];
  const measures = doc.querySelectorAll('measure');
  
  measures.forEach((measure) => {
    const measureNumber = parseInt(measure.getAttribute('number') || '1', 10);
    let currentPosition = 0;
    
    measure.querySelectorAll('note').forEach((noteEl) => {
      // Skip rest notes
      if (noteEl.querySelector('rest')) {
        // 休符でも位置は進める
        const durationEl = noteEl.querySelector('duration');
        if (durationEl) {
          currentPosition += parseInt(durationEl.textContent || '0', 10);
        }
        return;
      }
      
      // Skip tie stop (後ろ側)
      const ties = Array.from(noteEl.querySelectorAll('tie'));
      if (ties.some(t => t.getAttribute('type') === 'stop' && !ties.some(t2 => t2.getAttribute('type') === 'start'))) {
        // タイの後ろ側でも位置は進める
        const durationEl = noteEl.querySelector('duration');
        if (durationEl) {
          currentPosition += parseInt(durationEl.textContent || '0', 10);
        }
        return;
      }

      const pitchEl = noteEl.querySelector('pitch');
      if (!pitchEl) return;

      const step = pitchEl.querySelector('step')?.textContent ?? 'C';
      const alter = parseInt(pitchEl.querySelector('alter')?.textContent ?? '0', 10);
      const octave = parseInt(pitchEl.querySelector('octave')?.textContent ?? '4', 10);

      positions.push({
        measureNumber,
        positionInMeasure: currentPosition,
        step,
        alter,
        octave
      });
      
      // 音符の長さ分だけ位置を進める
      const durationEl = noteEl.querySelector('duration');
      if (durationEl) {
        currentPosition += parseInt(durationEl.textContent || '0', 10);
      }
    });
  });
  
  return positions;
}

/**
 * MusicXMLからコード位置情報を抽出
 */
function extractChordPositions(doc: Document): MusicXmlChordPosition[] {
  const positions: MusicXmlChordPosition[] = [];
  const measures = doc.querySelectorAll('measure');
  
  measures.forEach((measure) => {
    const measureNumber = parseInt(measure.getAttribute('number') || '1', 10);
    let currentPosition = 0;
    
    // 小節内の全要素を順番にチェック
    const elements = Array.from(measure.children);
    
    elements.forEach((element, elementIndex) => {
      if (element.tagName === 'harmony') {
        try {
          // ルート音名を取得
          const rootElement = element.querySelector('root root-step');
          const rootAlterElement = element.querySelector('root root-alter');
          
          if (!rootElement?.textContent) {
            // console.warn(`⚠️ ルート音名が見つかりません: measure ${measureNumber}`);
            return;
          }
          
          const rootStep = rootElement.textContent;
          const rootAlter = parseInt(rootAlterElement?.textContent || '0', 10);
          
          // ルート音名を構築（C, C#, Bb など）
          let root = rootStep;
          if (rootAlter > 0) {
            root += '#'.repeat(rootAlter);
          } else if (rootAlter < 0) {
            root += 'b'.repeat(-rootAlter);
          }
          
          // コードタイプを取得
          const kindElement = element.querySelector('kind');
          const kindText = kindElement?.getAttribute('text') || '';
          const kind = kindElement?.textContent || 'major';
          
          // 表示用テキストを作成
          const displayText = root + kindText;
          
          const chordSymbol: ChordSymbol = {
            id: `chord-${measureNumber}-${elementIndex}`,
            root,
            kind,
            displayText,
            measureNumber,
            timeOffset: 0 // 後で計算
          };
          
          positions.push({
            measureNumber,
            positionInMeasure: currentPosition,
            symbol: chordSymbol
          });
          
        } catch (error) {
          // console.error(`❌ コード抽出エラー (measure ${measureNumber}):`, error);
        }
      } else if (element.tagName === 'note') {
        // ノーツの長さ分だけ位置を進める
        const durationEl = element.querySelector('duration');
        if (durationEl) {
          currentPosition += parseInt(durationEl.textContent || '0', 10);
        }
      }
    });
  });
  
  return positions;
}

/**
 * 小節の時間情報
 */
interface MeasureTimeInfo {
  measureNumber: number;
  startTime: number;
  duration: number;
  totalDivisions: number; // その小節の総division数
}

/**
 * JSONノーツから小節の時間情報を推定
 */
function estimateMeasureTimeInfo(notePositions: MusicXmlNotePosition[], jsonNotes: NoteData[]): MeasureTimeInfo[] {
  const measures: MeasureTimeInfo[] = [];
  const measureNumbers = [...new Set(notePositions.map(pos => pos.measureNumber))].sort((a, b) => a - b);
  
  // console.log(`📐 小節時間推定開始: ${measureNumbers.length}小節`);
  
  for (let i = 0; i < measureNumbers.length; i++) {
    const measureNumber = measureNumbers[i];
    const measureNotes = notePositions
      .map((pos, index) => ({ ...pos, jsonIndex: index }))
      .filter(pos => pos.measureNumber === measureNumber && pos.jsonIndex < jsonNotes.length)
      .sort((a, b) => a.positionInMeasure - b.positionInMeasure);
    
    let startTime: number;
    let duration: number;
    let totalDivisions: number;
    
    if (measureNotes.length > 0) {
      // 音符がある小節：最初の音符の位置から開始時間を逆算
      const firstNote = measureNotes[0];
      const firstNoteTime = jsonNotes[firstNote.jsonIndex].time;
      
      // 小節内の最大position（総division数）を取得
      totalDivisions = Math.max(...measureNotes.map(note => note.positionInMeasure)) || 1000;
      
      // 小節の開始時間を逆算
      if (firstNote.positionInMeasure > 0) {
        // 最初の音符が小節の途中から始まる場合
        if (measureNotes.length > 1) {
          // 複数の音符から小節の長さを推定
          const lastNote = measureNotes[measureNotes.length - 1];
          const lastNoteTime = jsonNotes[lastNote.jsonIndex].time;
          const notesTimeSpan = lastNoteTime - firstNoteTime;
          const notesDivisionSpan = lastNote.positionInMeasure - firstNote.positionInMeasure;
          
          if (notesDivisionSpan > 0) {
            const divisionPerSecond = notesDivisionSpan / notesTimeSpan;
            duration = totalDivisions / divisionPerSecond;
            startTime = firstNoteTime - (firstNote.positionInMeasure / divisionPerSecond);
          } else {
            // フォールバック：前の小節から推定
            duration = estimateDurationFromPrevious(measures);
            startTime = firstNoteTime - (firstNote.positionInMeasure / totalDivisions) * duration;
          }
        } else {
          // 1つの音符のみ：前の小節から推定
          duration = estimateDurationFromPrevious(measures);
          startTime = firstNoteTime - (firstNote.positionInMeasure / totalDivisions) * duration;
        }
      } else {
        // 最初の音符が小節の開始位置にある場合
        startTime = firstNoteTime;
        if (measureNotes.length > 1) {
          // 複数の音符から小節の長さを計算
          const timeSpan = jsonNotes[measureNotes[measureNotes.length - 1].jsonIndex].time - firstNoteTime;
          const divisionSpan = measureNotes[measureNotes.length - 1].positionInMeasure;
          duration = divisionSpan > 0 ? (timeSpan * totalDivisions) / divisionSpan : estimateDurationFromPrevious(measures);
        } else {
          duration = estimateDurationFromPrevious(measures);
        }
      }
    } else {
      // 音符がない小節：前後の小節から推定
      totalDivisions = 1000; // 標準的なdivision数と仮定
      duration = estimateDurationFromPrevious(measures);
      
      if (measures.length > 0) {
        // 前の小節の終了時間から開始
        const prevMeasure = measures[measures.length - 1];
        startTime = prevMeasure.startTime + prevMeasure.duration;
      } else {
        startTime = 0; // 最初の小節
      }
    }
    
    measures.push({
      measureNumber,
      startTime,
      duration,
      totalDivisions
    });
    
    // console.log(`📏 小節${measureNumber}: ${startTime.toFixed(2)}s - ${(startTime + duration).toFixed(2)}s (${duration.toFixed(2)}s, ${totalDivisions}div)`);
  }
  
  return measures;
}

/**
 * 前の小節から小節の長さを推定
 */
function estimateDurationFromPrevious(measures: MeasureTimeInfo[]): number {
  if (measures.length === 0) {
    return 4.0; // デフォルト：4秒（BPM60の4/4拍子）
  }
  
  if (measures.length === 1) {
    return measures[0].duration;
  }
  
  // 過去2-3小節の平均を使用
  const recentMeasures = measures.slice(-2);
  const averageDuration = recentMeasures.reduce((sum, m) => sum + m.duration, 0) / recentMeasures.length;
  return averageDuration;
}

/**
 * JSONノーツの時間情報を使ってコードネームの時間を計算（改善版）
 * @param doc MusicXMLのDOMDocument
 * @param jsonNotes JSONノーツデータ（時間情報付き）
 * @returns コードネーム情報の配列
 */
export function extractChordProgressions(doc: Document, jsonNotes: NoteData[]): ChordInfo[] {
  // console.log(`🎵 コードネーム時間同期開始: ${jsonNotes.length} JSONノーツ`);
  
  // MusicXMLからノーツとコードの位置情報を抽出
  const notePositions = extractNotePositions(doc);
  const chordPositions = extractChordPositions(doc);
  
  // console.log(`📍 MusicXML位置情報: ${notePositions.length}ノーツ, ${chordPositions.length}コード`);
  
  if (notePositions.length !== jsonNotes.length) {
    // console.warn(`⚠️ ノーツ数不一致: MusicXML=${notePositions.length}, JSON=${jsonNotes.length}`);
  }
  
  // 小節の時間情報を推定
  const measureTimeInfo = estimateMeasureTimeInfo(notePositions, jsonNotes);
  
  // コードの時間を計算
  const chords: ChordInfo[] = [];
  
  chordPositions.forEach((chordPos) => {
    const { measureNumber, positionInMeasure, symbol } = chordPos;
    
    // 該当する小節の時間情報を取得
    const measureInfo = measureTimeInfo.find(m => m.measureNumber === measureNumber);
    
    let startTime: number;
    
    if (measureInfo) {
      // 小節の時間情報から正確に計算
      const relativePosition = positionInMeasure / measureInfo.totalDivisions;
      startTime = measureInfo.startTime + (relativePosition * measureInfo.duration);
      // console.log(`🎯 小節ベース計算: コード "${symbol.displayText}" = ${startTime.toFixed(2)}s (小節${measureNumber}, 位置${positionInMeasure}/${measureInfo.totalDivisions})`);
    } else {
      // フォールバック：従来の補間計算
      startTime = interpolateChordTime(chordPos, notePositions, jsonNotes);
      // console.warn(`📐 フォールバック補間: コード "${symbol.displayText}" = ${startTime.toFixed(2)}s`);
    }
    
    const chordInfo: ChordInfo = {
      startTime: Math.max(0, startTime), // 負の値を防ぐ
      symbol: {
        ...symbol,
        timeOffset: positionInMeasure / (measureInfo?.totalDivisions || 1000)
      },
      originalSymbol: { ...symbol }
    };
    
    chords.push(chordInfo);
  });
  
  // 終了時間を設定（次のコードの開始時間）
  for (let i = 0; i < chords.length - 1; i++) {
    chords[i].endTime = chords[i + 1].startTime;
  }
  
  // 最後のコードの終了時間
  if (chords.length > 0) {
    const lastChord = chords[chords.length - 1];
    const lastNoteTime = jsonNotes[jsonNotes.length - 1]?.time || lastChord.startTime;
    lastChord.endTime = Math.max(lastNoteTime + 4.0, lastChord.startTime + 2.0); // 最低2秒は表示
  }
  
  // console.log(`✅ コードネーム時間同期完了: ${chords.length}コード`);
  return chords;
}

/**
 * コードの時間を前後のノーツから補間計算
 */
function interpolateChordTime(
  chordPos: MusicXmlChordPosition, 
  notePositions: MusicXmlNotePosition[], 
  jsonNotes: NoteData[]
): number {
  const { measureNumber, positionInMeasure } = chordPos;
  
  // 同じ小節内の前後のノーツを探す
  const measureNotes = notePositions
    .map((notePos, index) => ({ ...notePos, jsonIndex: index }))
    .filter(notePos => notePos.measureNumber === measureNumber && notePos.jsonIndex < jsonNotes.length)
    .sort((a, b) => a.positionInMeasure - b.positionInMeasure);
  
  if (measureNotes.length === 0) {
    // 小節内にノーツがない場合、前の小節の最後のノーツを基準
    const prevMeasureNotes = notePositions
      .map((notePos, index) => ({ ...notePos, jsonIndex: index }))
      .filter(notePos => notePos.measureNumber < measureNumber && notePos.jsonIndex < jsonNotes.length);
    
    if (prevMeasureNotes.length > 0) {
      const lastPrevNote = prevMeasureNotes[prevMeasureNotes.length - 1];
      return jsonNotes[lastPrevNote.jsonIndex].time + 1.0; // 1秒後と仮定
    } else {
      return 0; // フォールバック
    }
  }
  
  // コード位置より前のノーツ
  const beforeNotes = measureNotes.filter(note => note.positionInMeasure <= positionInMeasure);
  // コード位置より後のノーツ
  const afterNotes = measureNotes.filter(note => note.positionInMeasure > positionInMeasure);
  
  if (beforeNotes.length > 0 && afterNotes.length > 0) {
    // 前後のノーツから線形補間
    const beforeNote = beforeNotes[beforeNotes.length - 1];
    const afterNote = afterNotes[0];
    
    const beforeTime = jsonNotes[beforeNote.jsonIndex].time;
    const afterTime = jsonNotes[afterNote.jsonIndex].time;
    
    const totalDistance = afterNote.positionInMeasure - beforeNote.positionInMeasure;
    const chordDistance = positionInMeasure - beforeNote.positionInMeasure;
    
    if (totalDistance > 0) {
      const ratio = chordDistance / totalDistance;
      return beforeTime + (afterTime - beforeTime) * ratio;
    } else {
      return beforeTime;
    }
  } else if (beforeNotes.length > 0) {
    // 後のノーツがない場合、最後のノーツの時間を使用
    const lastNote = beforeNotes[beforeNotes.length - 1];
    return jsonNotes[lastNote.jsonIndex].time;
  } else if (afterNotes.length > 0) {
    // 前のノーツがない場合、最初のノーツの時間を使用
    const firstNote = afterNotes[0];
    return jsonNotes[firstNote.jsonIndex].time;
  } else {
    // フォールバック
    return 0;
  }
}

/**
 * コードネーム専用の移調関数
 * tonal.jsを使用した音楽理論的に正しい移調
 * @param root 元のルート音名（例: "C", "F#", "Bb"）
 * @param semitones 移調量（半音）
 * @returns 移調後のルート音名
 */
export function transposeChordRoot(root: string, semitones: number): string {
  if (semitones === 0) return root;
  
  try {
    // transposeKey関数を使用（chord-utilsから）
    const transposedRoot = transposeKey(root, semitones);
    
    // console.log(`🎼 コード移調: ${root} + ${semitones}半音 → ${transposedRoot}`);
    return transposedRoot;
    
  } catch (error) {
    // console.error(`❌ コード移調エラー: ${root}`, error);
    return root;
  }
}

/**
 * コードネーム配列全体を移調
 * @param chords 元のコードネーム配列
 * @param semitones 移調量（半音）
 * @returns 移調後のコードネーム配列
 */
export function transposeChordProgression(chords: ChordInfo[], semitones: number): ChordInfo[] {
  if (semitones === 0) return chords;
  
  return chords.map(chord => {
    const transposedRoot = transposeChordRoot(chord.originalSymbol.root, semitones);
    const transposedDisplayText = chord.originalSymbol.displayText.replace(
      chord.originalSymbol.root,
      transposedRoot
    );
    
    return {
      ...chord,
      symbol: {
        ...chord.symbol,
        root: transposedRoot,
        displayText: transposedDisplayText
      }
    };
  });
}

/**
 * ノーツの時間を小節ベースで再計算する
 * @param doc MusicXMLのDOMDocument
 * @param jsonNotes 元のJSONノーツデータ
 * @returns 小節ベース時間で調整されたノーツデータ
 */
export function recalculateNotesWithMeasureTime(doc: Document, jsonNotes: NoteData[]): NoteData[] {
  // console.log(`🎯 ノーツ時間再計算開始: ${jsonNotes.length}ノーツ`);
  
  // MusicXMLからノーツ位置情報を抽出
  const notePositions = extractNotePositions(doc);
  
  if (notePositions.length !== jsonNotes.length) {
    // console.warn(`⚠️ ノーツ数不一致: MusicXML=${notePositions.length}, JSON=${jsonNotes.length}`);
    return jsonNotes; // 不一致の場合は元のデータを返す
  }
  
  // 小節の時間情報を推定
  const measureTimeInfo = estimateMeasureTimeInfo(notePositions, jsonNotes);
  
  // 各ノーツの時間を小節ベースで再計算
  const recalculatedNotes: NoteData[] = jsonNotes.map((note, index) => {
    const position = notePositions[index];
    if (!position) return note;
    
    const measureInfo = measureTimeInfo.find(m => m.measureNumber === position.measureNumber);
    if (!measureInfo) return note;
    
    // 小節内の相対位置から正確な時間を計算
    const relativePosition = position.positionInMeasure / measureInfo.totalDivisions;
    const recalculatedTime = measureInfo.startTime + (relativePosition * measureInfo.duration);
    
    // 元の時間との差分をログ
    const timeDiff = Math.abs(recalculatedTime - note.time);
    if (timeDiff > 0.1) { // 100ms以上の差がある場合のみログ
      // console.log(`🎯 ノーツ${index} 時間調整: ${note.time.toFixed(2)}s → ${recalculatedTime.toFixed(2)}s (差分${timeDiff.toFixed(2)}s)`);
    }
    
    return {
      ...note,
      time: recalculatedTime
    };
  });
  
  // console.log(`✅ ノーツ時間再計算完了: ${recalculatedNotes.length}ノーツ`);
  return recalculatedNotes;
}

/**
 * 時間ベースのプレイヘッド位置を小節情報から計算
 * @param doc MusicXMLのDOMDocument
 * @param jsonNotes 元のJSONノーツデータ
 * @param currentTime 現在時刻
 * @returns より正確なプレイヘッド情報 { measureNumber: number, positionInMeasure: number, relativePosition: number }
 */
export function calculatePlayheadPosition(doc: Document, jsonNotes: NoteData[], currentTime: number): {
  measureNumber: number;
  positionInMeasure: number;
  relativePosition: number; // 0-1の小節内相対位置
} | null {
  if (jsonNotes.length === 0) return null;
  
  // MusicXMLからノーツ位置情報を抽出
  const notePositions = extractNotePositions(doc);
  
  if (notePositions.length !== jsonNotes.length) {
    return null; // 不一致の場合は計算できない
  }
  
  // 小節の時間情報を推定
  const measureTimeInfo = estimateMeasureTimeInfo(notePositions, jsonNotes);
  
  // 現在時刻が含まれる小節を探す
  for (const measureInfo of measureTimeInfo) {
    const measureStart = measureInfo.startTime;
    const measureEnd = measureInfo.startTime + measureInfo.duration;
    
    if (currentTime >= measureStart && currentTime < measureEnd) {
      // 小節内の相対位置を計算
      const relativePosition = (currentTime - measureStart) / measureInfo.duration;
      const positionInMeasure = relativePosition * measureInfo.totalDivisions;
      
      return {
        measureNumber: measureInfo.measureNumber,
        positionInMeasure,
        relativePosition
      };
    }
  }
  
  // 見つからない場合、最も近い小節を推定
  if (currentTime < measureTimeInfo[0]?.startTime) {
    // 最初の小節より前
    return {
      measureNumber: measureTimeInfo[0]?.measureNumber || 1,
      positionInMeasure: 0,
      relativePosition: 0
    };
  } else {
    // 最後の小節より後
    const lastMeasure = measureTimeInfo[measureTimeInfo.length - 1];
    if (lastMeasure) {
      return {
        measureNumber: lastMeasure.measureNumber,
        positionInMeasure: lastMeasure.totalDivisions,
        relativePosition: 1.0
      };
    }
  }
  
  return null;
}

/**
 * MusicXMLの簡易表示処理: コードネームと音名を簡易化
 * gameStore の設定に基づいてMusicXMLを前処理
 */
export function simplifyMusicXmlForDisplay(
  musicXmlText: string,
  settings: {
    simpleDisplayMode: boolean;
    noteNameStyle: 'off' | 'abc' | 'solfege';
    chordsOnly?: boolean;
  }
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(musicXmlText, 'text/xml');

    // 新しいシステムでは、表示時に動的に変換するため、
    // XMLを直接書き換える必要は最小限に
    
    // 簡易表示ONの場合のみ、複雑な臨時記号の最小限の簡易化を実行
    if (settings.simpleDisplayMode) {
      simplifyAccidentalsMinimal(doc);
    }
    
    // コードネームは互換性のため残す（将来的に削除予定）
    simplifyChordNames(doc, settings);

    // コードのみ表示の場合、全てのnote要素を非表示に
    if (settings.chordsOnly) {
      const noteElements = doc.querySelectorAll('note');
      noteElements.forEach((note) => {
        note.setAttribute('print-object', 'no');
      });
    }

    // 変更されたXMLを文字列として返す
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (error) {
    // console.warn('⚠️ MusicXML簡易表示処理でエラーが発生しました:', error);
    return musicXmlText; // エラー時は元のXMLを返す
  }
}

/**
 * コードネームの簡易化
 */
function simplifyChordNames(doc: Document, settings: { noteNameStyle: 'off' | 'abc' | 'solfege' }): void {
  const harmonyElements = doc.querySelectorAll('harmony');
  
  harmonyElements.forEach((harmony) => {
    // ルート音名の簡易化
    const rootStep = harmony.querySelector('root root-step')?.textContent;
    const rootAlter = harmony.querySelector('root root-alter')?.textContent;
    
    if (rootStep) {
      const simplifiedRoot = simplifyRootNote(rootStep, rootAlter ? parseInt(rootAlter) : 0, settings);
      const rootStepElement = harmony.querySelector('root root-step');
      if (rootStepElement) {
        rootStepElement.textContent = simplifiedRoot.step;
      }
      
      // 変更されたalterがある場合は更新
      const rootAlterElement = harmony.querySelector('root root-alter');
      if (simplifiedRoot.alter !== (rootAlter ? parseInt(rootAlter) : 0)) {
        if (rootAlterElement) {
          rootAlterElement.textContent = simplifiedRoot.alter.toString();
        } else if (simplifiedRoot.alter !== 0) {
          // alter要素が存在しない場合は作成
          const rootElement = harmony.querySelector('root');
          if (rootElement) {
            const newAlter = doc.createElement('root-alter');
            newAlter.textContent = simplifiedRoot.alter.toString();
            rootElement.appendChild(newAlter);
          }
        }
      }
    }

    // コードタイプの簡易化（必要に応じて）
    const kindElement = harmony.querySelector('kind');
    if (kindElement) {
      const kindText = kindElement.getAttribute('text');
      if (kindText) {
        const simplifiedKindText = simplifyChordKind(kindText);
        kindElement.setAttribute('text', simplifiedKindText);
      }
    }
  });
}

/**
 * 音名（臨時記号）の簡易化
 */
function simplifyAccidentals(doc: Document, settings: { noteNameStyle: 'off' | 'abc' | 'solfege' }): void {
  const noteElements = doc.querySelectorAll('note');
  
  noteElements.forEach((note) => {
    const pitch = note.querySelector('pitch');
    if (!pitch) return; // 休符の場合はスキップ

    const step = pitch.querySelector('step')?.textContent;
    const alter = pitch.querySelector('alter')?.textContent;
    const octave = pitch.querySelector('octave')?.textContent;

    if (step) {
      const originalAlter = alter ? parseInt(alter) : 0;
      const originalOctave = octave ? parseInt(octave) : 4;
      const simplified = simplifyNoteAccidental(step, originalAlter, originalOctave, settings);

      // ステップを更新
      const stepElement = pitch.querySelector('step');
      if (stepElement) {
        stepElement.textContent = simplified.step;
      }

      // alterを更新
      const alterElement = pitch.querySelector('alter');
      if (simplified.alter !== originalAlter) {
        if (alterElement) {
          if (simplified.alter === 0) {
            alterElement.remove(); // alterが0になった場合は削除
          } else {
            alterElement.textContent = simplified.alter.toString();
          }
        } else if (simplified.alter !== 0) {
          // alter要素が存在しない場合は作成
          const newAlter = doc.createElement('alter');
          newAlter.textContent = simplified.alter.toString();
          pitch.appendChild(newAlter);
        }
      }

      // オクターブを更新
      const octaveElement = pitch.querySelector('octave');
      if (octaveElement && simplified.octave !== originalOctave) {
        octaveElement.textContent = simplified.octave.toString();
      }

      // 表示用の臨時記号（accidental要素）も更新
      const accidentalElement = note.querySelector('accidental');
      if (accidentalElement) {
        const newAccidental = getAccidentalText(simplified.alter);
        if (newAccidental) {
          accidentalElement.textContent = newAccidental;
        } else {
          accidentalElement.remove(); // 臨時記号が不要になった場合は削除
        }
      }
    }
  });
}

/**
 * 臨時記号の最小限の簡易化（互換性のため）
 * ダブルシャープ・ダブルフラットのみ処理
 */
function simplifyAccidentalsMinimal(doc: Document): void {
  const notes = doc.querySelectorAll('note');
  
  notes.forEach(note => {
    const alterElement = note.querySelector('alter');
    if (!alterElement) return;
    
    const alter = parseInt(alterElement.textContent || '0');
    
    // ダブルシャープ・ダブルフラットのみ処理
    if (Math.abs(alter) > 1) {
      const stepElement = note.querySelector('pitch step');
      const octaveElement = note.querySelector('pitch octave');
      
      if (!stepElement || !octaveElement) return;
      
      const step = stepElement.textContent || '';
      const octave = parseInt(octaveElement.textContent || '4');
      
      // tonal.jsを使って簡易化
      const currentNote = `${step}${alter > 0 ? 'x'.repeat(alter/2) : 'b'.repeat(-alter/2)}${octave}`;
      const simpleNote = parseNote(currentNote);
      
      if (simpleNote && !simpleNote.empty) {
        // Note.enharmonic()を使用
        const enharmonicName = Note.enharmonic(simpleNote.name);
        if (enharmonicName && enharmonicName !== simpleNote.name) {
          const enharmonicNote = parseNote(enharmonicName + octave);
          if (enharmonicNote && !enharmonicNote.empty) {
            stepElement.textContent = enharmonicNote.letter;
            alterElement.textContent = enharmonicNote.alt.toString();
            if (enharmonicNote.oct !== undefined && enharmonicNote.oct !== octave) {
              octaveElement.textContent = enharmonicNote.oct.toString();
            }
          }
        }
      }
    }
  });
}

/**
 * ルート音名の簡易化（PIXIの簡易表示ロジックを活用）
 * オクターブ調整なし版（コードネーム用）
 */
function simplifyRootNote(step: string, alter: number, settings: { noteNameStyle: 'off' | 'abc' | 'solfege' }): { step: string; alter: number } {
  // 複雑な音名を基本音名に変換するマッピング
  const complexToSimpleMap: { [key: string]: { step: string; alter: number } } = {
    // 異名同音（白鍵）
    'B#': { step: 'C', alter: 0 },
    'E#': { step: 'F', alter: 0 },
    'Cb': { step: 'B', alter: 0 },
    'Fb': { step: 'E', alter: 0 },
    // ダブルシャープ → 基本的な音名
    'Ax': { step: 'B', alter: 0 },
    'Bx': { step: 'C', alter: 1 },
    'Cx': { step: 'D', alter: 0 },
    'Dx': { step: 'E', alter: 0 },
    'Ex': { step: 'F', alter: 1 },
    'Fx': { step: 'G', alter: 0 },
    'Gx': { step: 'A', alter: 0 },
    // ダブルフラット → 基本的な音名
    'Abb': { step: 'G', alter: 0 },
    'Bbb': { step: 'A', alter: 0 },
    'Cbb': { step: 'B', alter: 0 },
    'Dbb': { step: 'C', alter: 0 },
    'Ebb': { step: 'D', alter: 0 },
    'Fbb': { step: 'E', alter: 0 },
    'Gbb': { step: 'F', alter: 0 },
  };

  // 現在の音名を構築
  let currentNoteName = step;
  if (alter === 2) {
    currentNoteName += 'x'; // ダブルシャープ
  } else if (alter === 1) {
    currentNoteName += '#'; // シャープ
  } else if (alter === -1) {
    currentNoteName += 'b'; // フラット
  } else if (alter === -2) {
    currentNoteName += 'bb'; // ダブルフラット
  }

  // 簡易化マッピングをチェック
  const simplified = complexToSimpleMap[currentNoteName];
  if (simplified) {
    // console.log(`🎼 コード音名簡易化: ${currentNoteName} → ${simplified.step}${simplified.alter === 1 ? '#' : simplified.alter === -1 ? 'b' : ''}`);
    return simplified;
  }

  // マッピングにない場合はそのまま返す
  return { step, alter };
}

/**
 * 音名臨時記号の簡易化（オクターブ調整付き）
 */
function simplifyNoteAccidental(step: string, alter: number, octave: number, settings: { noteNameStyle: 'off' | 'abc' | 'solfege' }): { step: string; alter: number; octave: number } {
  // 複雑な音名を基本音名に変換するマッピング（オクターブ調整付き）
  const complexToSimpleWithOctaveMap: { [key: string]: { step: string; alter: number; octaveAdjustment: number } } = {
    // 異名同音（白鍵）- オクターブ境界を跨ぐもの
    'B#': { step: 'C', alter: 0, octaveAdjustment: 1 },  // B#4 → C5
    'Cb': { step: 'B', alter: 0, octaveAdjustment: -1 }, // Cb5 → B4
    // 異名同音（白鍵）- 同じオクターブ内
    'E#': { step: 'F', alter: 0, octaveAdjustment: 0 },  // E#4 → F4
    'Fb': { step: 'E', alter: 0, octaveAdjustment: 0 },  // Fb4 → E4
    
    // ダブルシャープ → 基本的な音名
    'Ax': { step: 'B', alter: 0, octaveAdjustment: 0 },  // Ax4 → B4
    'Bx': { step: 'C', alter: 1, octaveAdjustment: 1 },  // Bx4 → C#5
    'Cx': { step: 'D', alter: 0, octaveAdjustment: 0 },  // Cx4 → D4
    'Dx': { step: 'E', alter: 0, octaveAdjustment: 0 },  // Dx4 → E4
    'Ex': { step: 'F', alter: 1, octaveAdjustment: 0 },  // Ex4 → F#4
    'Fx': { step: 'G', alter: 0, octaveAdjustment: 0 },  // Fx4 → G4
    'Gx': { step: 'A', alter: 0, octaveAdjustment: 0 },  // Gx4 → A4
    
    // ダブルフラット → 基本的な音名
    'Abb': { step: 'G', alter: 0, octaveAdjustment: 0 }, // Abb4 → G4
    'Bbb': { step: 'A', alter: 0, octaveAdjustment: 0 }, // Bbb4 → A4
    'Cbb': { step: 'B', alter: 0, octaveAdjustment: -1 }, // Cbb5 → B4
    'Dbb': { step: 'C', alter: 0, octaveAdjustment: 0 }, // Dbb4 → C4
    'Ebb': { step: 'D', alter: 0, octaveAdjustment: 0 }, // Ebb4 → D4
    'Fbb': { step: 'E', alter: 0, octaveAdjustment: 0 }, // Fbb4 → E4
    'Gbb': { step: 'F', alter: 0, octaveAdjustment: 0 }, // Gbb4 → F4
  };

  // 現在の音名を構築
  let currentNoteName = step;
  if (alter === 2) {
    currentNoteName += 'x'; // ダブルシャープ
  } else if (alter === 1) {
    currentNoteName += '#'; // シャープ
  } else if (alter === -1) {
    currentNoteName += 'b'; // フラット
  } else if (alter === -2) {
    currentNoteName += 'bb'; // ダブルフラット
  }

  // 簡易化マッピングをチェック
  const simplified = complexToSimpleWithOctaveMap[currentNoteName];
  if (simplified) {
    const newOctave = octave + simplified.octaveAdjustment;
    // console.log(`🎼 音符簡易化: ${currentNoteName}${octave} → ${simplified.step}${simplified.alter === 1 ? '#' : simplified.alter === -1 ? 'b' : ''}${newOctave}`);
    return { 
      step: simplified.step, 
      alter: simplified.alter, 
      octave: newOctave 
    };
  }

  // マッピングにない場合はそのまま返す
  return { step, alter, octave };
}

/**
 * コード種類の簡易化
 */
function simplifyChordKind(kindText: string): string {
  // 複雑なコード表記を簡易化するマッピング
  const kindSimplificationMap: { [key: string]: string } = {
    'maj7': 'M7',
    'major-seventh': 'M7',
    'min7': 'm7', 
    'minor-seventh': 'm7',
    'dominant-seventh': '7',
    'major-ninth': 'M9',
    'minor-ninth': 'm9',
    'augmented': 'aug',
    'diminished': 'dim',
    'half-diminished': 'm7♭5',
    // 必要に応じて追加
  };

  return kindSimplificationMap[kindText] || kindText;
}

/**
 * alter値から臨時記号テキストを取得
 */
function getAccidentalText(alter: number): string | null {
  switch (alter) {
    case 2: return 'double-sharp';
    case 1: return 'sharp';
    case 0: return null;
    case -1: return 'flat';
    case -2: return 'double-flat';
    default: return null;
  }
}

// 小節時間情報推定関数を公開（他でも使用可能に）
export { estimateMeasureTimeInfo }; 