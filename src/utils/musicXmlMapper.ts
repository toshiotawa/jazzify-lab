import type { NoteData, ChordSymbol, ChordInfo } from '@/types';
import { Note, Interval, transpose, note as parseNote } from 'tonal';
import { transposeKey } from './chord-utils';
import { toDisplayName, type DisplayOpts } from './display-note';
import {
  detectOrnaments,
  expandOrnament,
  isGraceNote,
  collectGraceNotesBefore,
  getKeyFifths,
  stepAlterOctaveToMidi,
  stepAlterToDisplayName,
  getTieTypes,
} from './musicXmlOrnamentExpander';

/**
 * Extract playable note names from transposed MusicXML document.
 * Skips rests, tie-stop notes, and grace notes to match JSON note structure.
 * 装飾記号 (ornaments) は展開せずスキップし、JSON側のノーツ数と一致させる。
 */
export function extractPlayableNoteNames(doc: Document): string[] {
  const names: string[] = [];
  let totalNotes = 0;
  let skippedRests = 0;
  let skippedTies = 0;
  let skippedGrace = 0;
  
  doc.querySelectorAll('note').forEach((noteEl) => {
    totalNotes++;

    // Skip grace notes (装飾音符はJSON側に含まれないため)
    if (isGraceNote(noteEl)) {
      skippedGrace++;
      return;
    }
    
    // Skip rest notes
    if (noteEl.querySelector('rest')) {
      skippedRests++;
      return;
    }
    
    // Skip tie stop (後ろ側 + チェーン中間ノート)
    const { hasStop: tieStop } = getTieTypes(noteEl);
    if (tieStop) {
      skippedTies++;
      return;
    }

    const pitchEl = noteEl.querySelector('pitch');
    if (!pitchEl) {
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
  });
  
  return names;
}

/**
 * Extract playable note names WITH ornament expansion.
 * Used for MusicXML-only flow where notes are generated from XML.
 * 装飾記号を展開し、全てのノーツの音名を返す。
 */
export function extractPlayableNoteNamesWithOrnaments(doc: Document): string[] {
  const keyFifths = getKeyFifths(doc);
  const useFlatNames = keyFifths < 0;
  const divisionsEl = doc.querySelector('part > measure > attributes > divisions');
  const divisionsPerQuarter = divisionsEl ? parseInt(divisionsEl.textContent ?? '1', 10) : 1;
  const names: string[] = [];

  const measures = doc.querySelectorAll('part > measure');
  measures.forEach((measureEl) => {
    const elements = Array.from(measureEl.children);
    for (let idx = 0; idx < elements.length; idx++) {
      const el = elements[idx];
      if (el.tagName !== 'note') continue;

      // Skip grace notes (handled via collectGraceNotesBefore)
      if (isGraceNote(el)) continue;

      // Skip rests
      if (el.querySelector('rest')) continue;

      // Skip tie-stop (チェーン中間ノート含む)
      const { hasStop: tStop } = getTieTypes(el);
      if (tStop) {
        continue;
      }

      const pitchEl = el.querySelector('pitch');
      if (!pitchEl) continue;

      const step = pitchEl.querySelector('step')?.textContent ?? 'C';
      const alter = parseInt(pitchEl.querySelector('alter')?.textContent ?? '0', 10);
      const octave = parseInt(pitchEl.querySelector('octave')?.textContent ?? '4', 10);
      const mainPitch = stepAlterOctaveToMidi(step, alter, octave);
      const mainName = stepAlterToDisplayName(step, alter, octave);
      const duration = parseInt(el.querySelector('duration')?.textContent ?? '4', 10);

      // Grace notes before this note
      const graceNotes = collectGraceNotesBefore(elements, idx);
      for (const gn of graceNotes) {
        names.push(gn.noteName);
      }

      // Ornament expansion
      const ornament = detectOrnaments(el);
      if (ornament) {
        const expanded = expandOrnament(ornament, mainPitch, mainName, duration, keyFifths, useFlatNames, divisionsPerQuarter);
        for (const en of expanded) {
          names.push(en.noteName);
        }
      } else {
        names.push(mainName);
      }
    }
  });

  return names;
}

/**
 * Merge JSON note data with MusicXML note names.
 * Assumes both arrays are in the same order (time-sequential).
 */
export function mergeJsonWithNames(jsonNotes: NoteData[], noteNames: string[]): NoteData[] {
  console.log(`🔄 Merging ${jsonNotes.length} JSON notes with ${noteNames.length} XML note names`);
  
  if (jsonNotes.length !== noteNames.length) {
    console.error(`❌ Note count mismatch: JSON=${jsonNotes.length}, XML=${noteNames.length}`);
    console.log('First 5 JSON notes:', jsonNotes.slice(0, 5).map(n => ({ time: n.time, pitch: n.pitch })));
    console.log('First 5 XML names:', noteNames.slice(0, 5));
  }

  const merged = jsonNotes.map((note, index) => {
    const noteName = noteNames[index] ?? `Unknown${index}`;
    console.log(`   Note ${index}: time=${note.time.toFixed(2)}s, pitch=${note.pitch}, name=${noteName}`);
    return {
      ...note,
      noteName
    };
  });
  
  console.log(`✅ Merged ${merged.length} notes with names`);
  return merged;
}

/**
 * JSONノーツの time / pitch はそのまま使い、MusicXML由来の再生メタデータ
 * （duration / noteName / hand）だけを上書きする。
 *
 * parseMusicXmlToNoteData() は装飾音を展開するため、単純な index マージだと
 * JSON 側と件数がズレることがある。そこで、順序を保ったまま time+pitch で
 * 前方探索して最も近い XML ノートを採用する。
 */
export function mergeJsonWithMusicXmlPlaybackMeta(
  jsonNotes: NoteData[],
  xmlNotes: NoteData[],
): NoteData[] {
  if (jsonNotes.length === 0 || xmlNotes.length === 0) {
    return jsonNotes;
  }

  const usedXmlIndices = new Set<number>();
  let xmlCursor = 0;
  const LOOKAHEAD = 12;
  const TIME_TOLERANCE_SEC = 0.12;

  return jsonNotes.map((jsonNote) => {
    let bestIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let i = xmlCursor; i < Math.min(xmlNotes.length, xmlCursor + LOOKAHEAD); i += 1) {
      if (usedXmlIndices.has(i)) continue;
      const xmlNote = xmlNotes[i];
      if (!xmlNote) continue;

      // pitch が違う候補は採用しない
      if (xmlNote.pitch !== jsonNote.pitch) continue;

      const timeDiff = Math.abs((xmlNote.time ?? 0) - (jsonNote.time ?? 0));
      if (timeDiff > TIME_TOLERANCE_SEC) continue;

      if (timeDiff < bestScore) {
        bestScore = timeDiff;
        bestIndex = i;
        if (timeDiff === 0) break;
      }
    }

    if (bestIndex === -1) {
      for (let i = xmlCursor; i < Math.min(xmlNotes.length, xmlCursor + LOOKAHEAD); i += 1) {
        if (usedXmlIndices.has(i)) continue;
        const xmlNote = xmlNotes[i];
        if (!xmlNote) continue;

        const timeDiff = Math.abs((xmlNote.time ?? 0) - (jsonNote.time ?? 0));
        const pitchDiff = Math.abs((xmlNote.pitch ?? 0) - (jsonNote.pitch ?? 0));
        const score = (pitchDiff * 10) + timeDiff;

        if (score < bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
    }

    if (bestIndex === -1) {
      return jsonNote;
    }

    usedXmlIndices.add(bestIndex);
    xmlCursor = bestIndex + 1;

    const xmlNote = xmlNotes[bestIndex];
    return {
      ...jsonNote,
      duration: xmlNote.duration ?? jsonNote.duration,
      noteName: xmlNote.noteName ?? jsonNote.noteName,
      hand: xmlNote.hand ?? jsonNote.hand,
    };
  });
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
      
      // Skip tie stop (後ろ側 + チェーン中間ノート)
      const { hasStop: npTieStop } = getTieTypes(noteEl);
      if (npTieStop) {
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
            console.warn(`⚠️ ルート音名が見つかりません: measure ${measureNumber}`);
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
          console.error(`❌ コード抽出エラー (measure ${measureNumber}):`, error);
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
  
  console.log(`📐 小節時間推定開始: ${measureNumbers.length}小節`);
  
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
    
    console.log(`📏 小節${measureNumber}: ${startTime.toFixed(2)}s - ${(startTime + duration).toFixed(2)}s (${duration.toFixed(2)}s, ${totalDivisions}div)`);
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
  console.log(`🎵 コードネーム時間同期開始: ${jsonNotes.length} JSONノーツ`);
  
  // MusicXMLからノーツとコードの位置情報を抽出
  const notePositions = extractNotePositions(doc);
  const chordPositions = extractChordPositions(doc);
  
  console.log(`📍 MusicXML位置情報: ${notePositions.length}ノーツ, ${chordPositions.length}コード`);
  
  if (notePositions.length !== jsonNotes.length) {
    console.warn(`⚠️ ノーツ数不一致: MusicXML=${notePositions.length}, JSON=${jsonNotes.length}`);
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
      console.log(`🎯 小節ベース計算: コード "${symbol.displayText}" = ${startTime.toFixed(2)}s (小節${measureNumber}, 位置${positionInMeasure}/${measureInfo.totalDivisions})`);
    } else {
      // フォールバック：従来の補間計算
      startTime = interpolateChordTime(chordPos, notePositions, jsonNotes);
      console.warn(`📐 フォールバック補間: コード "${symbol.displayText}" = ${startTime.toFixed(2)}s`);
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
  
  console.log(`✅ コードネーム時間同期完了: ${chords.length}コード`);
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
    
    console.log(`🎼 コード移調: ${root} + ${semitones}半音 → ${transposedRoot}`);
    return transposedRoot;
    
  } catch (error) {
    console.error(`❌ コード移調エラー: ${root}`, error);
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
  console.log(`🎯 ノーツ時間再計算開始: ${jsonNotes.length}ノーツ`);
  
  // MusicXMLからノーツ位置情報を抽出
  const notePositions = extractNotePositions(doc);
  
  if (notePositions.length !== jsonNotes.length) {
    console.warn(`⚠️ ノーツ数不一致: MusicXML=${notePositions.length}, JSON=${jsonNotes.length}`);
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
      console.log(`🎯 ノーツ${index} 時間調整: ${note.time.toFixed(2)}s → ${recalculatedTime.toFixed(2)}s (差分${timeDiff.toFixed(2)}s)`);
    }
    
    return {
      ...note,
      time: recalculatedTime
    };
  });
  
  console.log(`✅ ノーツ時間再計算完了: ${recalculatedNotes.length}ノーツ`);
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
 * 楽譜表示用にMusicXMLの歌詞要素を除去
 */
export function stripLyricsFromMusicXml(musicXmlText: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(musicXmlText, 'text/xml');
    const lyricElements = doc.querySelectorAll('lyric');
    lyricElements.forEach((lyric) => {
      lyric.remove();
    });
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch {
    return musicXmlText;
  }
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
    /** リズム譜モード - 符頭の高さを一定にして表示 */
    useRhythmNotation?: boolean;
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

    // リズム譜モード: 符頭の高さを一定にする
    if (settings.useRhythmNotation) {
      convertToRhythmNotation(doc);
    }

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
    console.warn('⚠️ MusicXML簡易表示処理でエラーが発生しました:', error);
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
 * 臨時記号の簡易化（簡易表示モード用）
 * ダブルシャープ・ダブルフラット、および理論的異名同音（B#, E#, Cb, Fb）を処理
 * オクターブ境界を跨ぐケースを正しく処理
 */
function simplifyAccidentalsMinimal(doc: Document): void {
  // 臨時記号の簡易化マッピング
  // キー: step + alter値, 値: { step, alter, octaveAdjustment }
  const accidentalSimplifyMap: Record<string, { step: string; alter: number; octaveAdjust: number }> = {
    // === 理論的異名同音（シングルシャープ・フラット） ===
    // B# → C (オクターブ上がる)
    'B1': { step: 'C', alter: 0, octaveAdjust: 1 },
    // E# → F (オクターブそのまま)
    'E1': { step: 'F', alter: 0, octaveAdjust: 0 },
    // Cb → B (オクターブ下がる)
    'C-1': { step: 'B', alter: 0, octaveAdjust: -1 },
    // Fb → E (オクターブそのまま)
    'F-1': { step: 'E', alter: 0, octaveAdjust: 0 },
    
    // === ダブルシャープ（alter = 2） ===
    'A2': { step: 'B', alter: 0, octaveAdjust: 0 },    // Ax → B
    'B2': { step: 'C', alter: 1, octaveAdjust: 1 },    // Bx → C# (オクターブ上がる)
    'C2': { step: 'D', alter: 0, octaveAdjust: 0 },    // Cx → D
    'D2': { step: 'E', alter: 0, octaveAdjust: 0 },    // Dx → E
    'E2': { step: 'F', alter: 1, octaveAdjust: 0 },    // Ex → F#
    'F2': { step: 'G', alter: 0, octaveAdjust: 0 },    // Fx → G
    'G2': { step: 'A', alter: 0, octaveAdjust: 0 },    // Gx → A
    
    // === ダブルフラット（alter = -2） ===
    'A-2': { step: 'G', alter: 0, octaveAdjust: 0 },   // Abb → G
    'B-2': { step: 'A', alter: 0, octaveAdjust: 0 },   // Bbb → A
    'C-2': { step: 'B', alter: -1, octaveAdjust: -1 }, // Cbb → Bb (オクターブ下がる)
    'D-2': { step: 'C', alter: 0, octaveAdjust: 0 },   // Dbb → C
    'E-2': { step: 'D', alter: 0, octaveAdjust: 0 },   // Ebb → D
    'F-2': { step: 'E', alter: -1, octaveAdjust: 0 },  // Fbb → Eb
    'G-2': { step: 'F', alter: 0, octaveAdjust: 0 },   // Gbb → F
  };
  
  const notes = doc.querySelectorAll('note');
  
  notes.forEach(note => {
    const alterElement = note.querySelector('alter');
    if (!alterElement) return;
    
    const alter = parseInt(alterElement.textContent || '0');
    if (alter === 0) return;
    
    const stepElement = note.querySelector('pitch step');
    const octaveElement = note.querySelector('pitch octave');
    
    if (!stepElement || !octaveElement) return;
    
    const step = stepElement.textContent || '';
    const octave = parseInt(octaveElement.textContent || '4');
    
    // マッピングを使用して簡易化
    const mapKey = `${step}${alter}`;
    const simplified = accidentalSimplifyMap[mapKey];
    
    if (simplified) {
      stepElement.textContent = simplified.step;
      
      // alter値を更新（0の場合はalter要素を削除）
      if (simplified.alter === 0) {
        alterElement.remove();
      } else {
        alterElement.textContent = simplified.alter.toString();
      }
      
      // オクターブ調整
      const newOctave = octave + simplified.octaveAdjust;
      octaveElement.textContent = newOctave.toString();
      
      // 臨時記号の表示要素（accidental）も更新
      const accidentalElement = note.querySelector('accidental');
      if (accidentalElement) {
        if (simplified.alter === 0) {
          accidentalElement.remove();
        } else if (simplified.alter === 1) {
          accidentalElement.textContent = 'sharp';
        } else if (simplified.alter === -1) {
          accidentalElement.textContent = 'flat';
        }
      }
      
      // ログ出力
      const originalAcc = alter === 2 ? 'x' : alter === 1 ? '#' : alter === -1 ? 'b' : 'bb';
      const newAcc = simplified.alter === 1 ? '#' : simplified.alter === -1 ? 'b' : '';
      console.log(`🎼 臨時記号簡易化: ${step}${originalAcc}${octave} → ${simplified.step}${newAcc}${newOctave}`);
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
    console.log(`🎼 コード音名簡易化: ${currentNoteName} → ${simplified.step}${simplified.alter === 1 ? '#' : simplified.alter === -1 ? 'b' : ''}`);
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
    console.log(`🎼 音符簡易化: ${currentNoteName}${octave} → ${simplified.step}${simplified.alter === 1 ? '#' : simplified.alter === -1 ? 'b' : ''}${newOctave}`);
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

/**
 * 指定小節範囲の音符をジャズ風スラッシュ表記に変換する（C&Rリスニング小節用）
 * 小節内の音符を削除し、ステムなしスラッシュ符頭の4分音符4つで置き換える。
 * 2段譜の場合は各段に配置する。
 */
export function convertMeasuresToRests(doc: Document, startBar: number, endBar: number): void {
  const measures = doc.querySelectorAll('measure');
  let lastDivisions = 4;

  measures.forEach((measure) => {
    const numAttr = measure.getAttribute('number');
    const measureNum = numAttr ? parseInt(numAttr, 10) : 0;
    if (measureNum < startBar || measureNum > endBar) return;

    const attrDivisions = measure.querySelector('attributes divisions');
    if (attrDivisions) {
      lastDivisions = parseInt(attrDivisions.textContent || '4', 10);
    }
    const divisions = lastDivisions;
    const quarterDuration = divisions;

    const notes = Array.from(measure.querySelectorAll('note'));
    const hasStaff2 = notes.some((n) => {
      const s = n.querySelector('staff');
      return s && parseInt(s.textContent || '1', 10) >= 2;
    });
    const stavesToFill = hasStaff2 ? [1, 2] : [1];

    notes.forEach((n) => n.remove());

    for (const staffNum of stavesToFill) {
      const pitchStep = staffNum >= 2 ? 'G' : 'B';
      const pitchOctave = staffNum >= 2 ? '3' : '4';

      for (let i = 0; i < 4; i++) {
        const noteEl = doc.createElement('note');
        const pitch = doc.createElement('pitch');
        pitch.appendChild(doc.createElement('step')).textContent = pitchStep;
        pitch.appendChild(doc.createElement('octave')).textContent = pitchOctave;
        noteEl.appendChild(pitch);

        const durationEl = doc.createElement('duration');
        durationEl.textContent = String(quarterDuration);
        noteEl.appendChild(durationEl);

        const typeEl = doc.createElement('type');
        typeEl.textContent = 'quarter';
        noteEl.appendChild(typeEl);

        const stemEl = doc.createElement('stem');
        stemEl.textContent = 'none';
        noteEl.appendChild(stemEl);

        const notehead = doc.createElement('notehead');
        notehead.textContent = 'slash';
        noteEl.appendChild(notehead);

        if (stavesToFill.length > 1) {
          const staffEl = doc.createElement('staff');
          staffEl.textContent = String(staffNum);
          noteEl.appendChild(staffEl);
        }

        measure.appendChild(noteEl);
      }
    }
  });
}

/**
 * リズム譜変換: 符頭をスラッシュに統一し、高さを一定にして表示
 * - 右手（staff 1 / トレブル）: B4
 * - 左手（staff 2 / バス）: G3（真ん中のドの少し下のソ）
 * - 全ての音符にスラッシュ符頭を適用（白玉・旗付きも含む）
 * - 和音（<chord/>タグ付き）の重複音は除去し、1つの符頭にまとめる
 * @param doc MusicXMLのDOMDocument
 */
export function convertToRhythmNotation(doc: Document): void {
  const TREBLE_PITCH = { step: 'B', octave: '4' };
  const BASS_PITCH = { step: 'G', octave: '3' };

  const measures = doc.querySelectorAll('measure');
  measures.forEach((measure) => {
    const notes = Array.from(measure.querySelectorAll('note'));

    // 和音の重複音（<chord/>タグ付き）を除去
    const chordNotes = notes.filter(n => n.querySelector('chord') !== null);
    chordNotes.forEach(n => n.remove());

    // 残った音符（和音の先頭音＋単音）を変換
    const remainingNotes = Array.from(measure.querySelectorAll('note'));
    remainingNotes.forEach((note) => {
      const pitch = note.querySelector('pitch');
      if (!pitch) return;

      const staffEl = note.querySelector('staff');
      const staffNum = staffEl ? parseInt(staffEl.textContent || '1', 10) : 1;
      const targetPitch = staffNum >= 2 ? BASS_PITCH : TREBLE_PITCH;

      const stepElement = pitch.querySelector('step');
      if (stepElement) {
        stepElement.textContent = targetPitch.step;
      }

      const octaveElement = pitch.querySelector('octave');
      if (octaveElement) {
        octaveElement.textContent = targetPitch.octave;
      }

      const alterElement = pitch.querySelector('alter');
      if (alterElement) {
        alterElement.remove();
      }

      const accidentalElement = note.querySelector('accidental');
      if (accidentalElement) {
        accidentalElement.remove();
      }

      const existingNotehead = note.querySelector('notehead');
      if (existingNotehead) {
        existingNotehead.remove();
      }

      const notehead = doc.createElement('notehead');
      notehead.textContent = 'slash';
      note.appendChild(notehead);
    });
  });
}

/**
 * MusicXMLから表示段数（staves）を判定する
 * パートが2つ以上あるか、単一パートで<staves>2</staves>の場合は2段譜と判定
 */
export function countMusicXmlStaves(musicXmlText: string): number {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(musicXmlText, 'text/xml');

    const parts = doc.querySelectorAll('part');
    if (parts.length >= 2) return 2;

    const stavesEl = doc.querySelector('attributes staves');
    if (stavesEl) {
      const staves = parseInt(stavesEl.textContent || '1', 10);
      if (staves >= 2) return staves;
    }

    return 1;
  } catch {
    return 1;
  }
}