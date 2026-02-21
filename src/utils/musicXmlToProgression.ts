import { parseChordName, buildChordNotes } from '@/utils/chord-utils';
import type { ChordProgressionDataItem } from '@/components/fantasy/TaikoNoteSystem';
import { note as parseNote } from 'tonal';
import { isGraceNote, getTieTypes } from './musicXmlOrnamentExpander';

/**
 * MusicXML文字列から progression_timing 用の JSON 配列へ変換
 * 
 * 重要な概念:
 * - chord/notes: 実際の音符情報（MusicXMLのpitch要素から取得、正解判定に使用）
 * - lyricDisplay: 歌詞(lyric)から取得した表示用テキスト（太鼓ノーツのラベルに使用）
 *   → 歌詞が見つかった位置から次の歌詞が出現するまで継続
 * - text: <harmony>要素から取得したコードシンボル（オーバーレイ表示用のみ、太鼓ノーツには影響しない）
 * 
 * groupSimultaneousNotes: true の場合、同タイミングの複数ノーツを1つのエントリにまとめる
 * （Progression_Timing用：同時に鳴る音を1つの正解ノーツとして扱う）
 * 
 * skipHarmony: true の場合、<harmony>要素を無視する（オーバーレイテキストを生成しない）
 */
export function convertMusicXmlToProgressionData(
  xmlText: string, 
  options?: { groupSimultaneousNotes?: boolean; skipHarmony?: boolean }
): ChordProgressionDataItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const measures = Array.from(doc.querySelectorAll('measure'));

  const result: ChordProgressionDataItem[] = [];

  // Utilities
  const stepAlterToName = (step: string, alter: number): string => {
    if (!step) return 'C';
    if (alter > 0) return step + '#'.repeat(alter);
    if (alter < 0) return step + 'b'.repeat(-alter);
    return step;
  };

  /**
   * 白鍵の異名同音を正規化（B#→C, E#→F, Cb→B, Fb→E）
   * @returns { name, octaveAdjust } octaveAdjust: B#→C で +1, Cb→B で -1
   */
  const simplifyEnharmonic = (name: string, octave: number): { name: string; octave: number } => {
    const map: Record<string, { name: string; octaveAdj: number }> = {
      'B#': { name: 'C', octaveAdj: 1 },
      'E#': { name: 'F', octaveAdj: 0 },
      'Cb': { name: 'B', octaveAdj: -1 },
      'Fb': { name: 'E', octaveAdj: 0 },
    };
    const entry = map[name];
    if (entry) return { name: entry.name, octave: octave + entry.octaveAdj };
    return { name, octave };
  };

  const toBeats = (positionInDivs: number, divisionsPerQuarter: number): number => {
    // 1拍 = quarter 音符
    const beatOffset = divisionsPerQuarter > 0 ? positionInDivs / divisionsPerQuarter : 0;
    return 1 + beatOffset;
  };

  // divisions は最初の小節で定義され、以降の小節に継承される
  let divisionsPerQuarter = 1;
  
  // 歌詞の継続表示用：一度見つかった歌詞は次の歌詞が出現するまで継続
  let currentLyricDisplay: string | null = null;

  // 進行
  measures.forEach((measureEl) => {
    const bar = parseInt(measureEl.getAttribute('number') || '1', 10);
    // divisions が定義されていれば更新（小節間で継承される）
    const attrDiv = measureEl.querySelector('attributes divisions');
    if (attrDiv && attrDiv.textContent) {
      const d = parseInt(attrDiv.textContent, 10);
      if (!isNaN(d) && d > 0) divisionsPerQuarter = d;
    }

    let currentPos = 0; // division 単位

    // Harmony は要素順に出るので、position は note ベースで進める
    const elements = Array.from(measureEl.children);
    for (let idx = 0; idx < elements.length; idx++) {
      const el = elements[idx] as Element;

      if (el.tagName === 'harmony') {
        // Overlay テキスト用に text を作る（オプション）
        // 注: progression_timing モードでは歌詞(lyric)を優先するため、
        // harmony要素はオーバーレイ表示用のみに使用し、lyricDisplayには影響しない
        const rootStep = el.querySelector('root root-step')?.textContent || '';
        const rootAlter = parseInt(el.querySelector('root root-alter')?.textContent || '0', 10);
        const kindTextAttr = el.querySelector('kind')?.getAttribute('text') || '';
        const rootName = stepAlterToName(rootStep, rootAlter);
        const display = `${rootName}${kindTextAttr}`.trim();
        // harmonyからはオーバーレイテキストのみを生成（太鼓ノーツには影響しない）
        // lyricDisplayは更新しない
        result.push({
          bar,
          beats: toBeats(currentPos, divisionsPerQuarter),
          chord: 'N.C.',
          text: display
        });
        continue;
      }

      if (el.tagName === 'note') {
        const noteEl = el;

        // 装飾音符 (grace note) はスキップ (duration なし)
        if (isGraceNote(noteEl)) {
          continue;
        }

        // 休符はスキップ（位置は進める）
        if (noteEl.querySelector('rest')) {
          const dur = parseInt(noteEl.querySelector('duration')?.textContent || '0', 10);
          currentPos += isNaN(dur) ? 0 : dur;
          continue;
        }

        // 和音グループを収集（先頭は <chord> を持たない）
        const group: Element[] = [noteEl];
        let lookaheadIndex = idx + 1;
        while (lookaheadIndex < elements.length && elements[lookaheadIndex].tagName === 'note' && elements[lookaheadIndex].querySelector('chord')) {
          group.push(elements[lookaheadIndex]);
          lookaheadIndex++;
        }

        // タイ処理: グループの先頭ノートが tie-stop を持つ場合、
        // タイで繋がれた後続音符なのでスキップする（位置は進める）
        // tie-start + tie-stop の両方を持つ中間ノーツもスキップ対象
        const { hasStop: hasTieStop } = getTieTypes(noteEl);
        if (hasTieStop) {
          const dur = parseInt(noteEl.querySelector('duration')?.textContent || '0', 10);
          currentPos += isNaN(dur) ? 0 : dur;
          idx = lookaheadIndex - 1;
          continue;
        }

        // 歌詞からコード名を取得（グループ内を走査）
        // 新しい歌詞が見つかった場合、currentLyricDisplayを更新
        let foundNewLyric = false;
        for (const g of group) {
          const lyricText = g.querySelector('lyric text')?.textContent?.trim();
          if (lyricText) {
            currentLyricDisplay = lyricText;
            foundNewLyric = true;
            break;
          }
        }

        // 最低音（ベース）を推定
        const pitches = group
          .map((g) => {
            const p = g.querySelector('pitch');
            if (!p) return null;
            const step = p.querySelector('step')?.textContent || 'C';
            const alter = parseInt(p.querySelector('alter')?.textContent || '0', 10);
            const rawOctave = parseInt(p.querySelector('octave')?.textContent || '4', 10);
            const rawName = stepAlterToName(step, alter);
            const { name, octave } = simplifyEnharmonic(rawName, rawOctave);
            const tonal = parseNote(name.replace(/x/g, '##') + String(octave));
            const midi = tonal && typeof tonal.midi === 'number' ? tonal.midi : null;
            return midi !== null ? { step: name, octave, midi } : null;
          })
          .filter((v): v is { step: string; octave: number; midi: number } => !!v)
          .sort((a, b) => a.midi - b.midi);

        const bass = pitches[0] || null;

        // 出力アイテムを作成
        // 実際の音符情報をchord/notesに設定し、lyricDisplayは表示用のみ
        if (pitches.length > 1) {
          // 複数音（和音として扱う）
          const noteNames = pitches.map(p => p.step);
          result.push({
            bar,
            beats: toBeats(currentPos, divisionsPerQuarter),
            chord: noteNames.join(''), // 例: "CEG" - 実際の音符
            octave: bass ? bass.octave : 4,
            inversion: 0,
            notes: noteNames, // 個別の音名配列（正解判定用）
            type: 'chord',
            lyricDisplay: currentLyricDisplay || undefined // 表示用歌詞テキスト
          } as ChordProgressionDataItem);
        } else {
          // 単音扱い
          const single = bass ? bass : pitches[0] || null;
          if (single) {
            result.push({
              bar,
              beats: toBeats(currentPos, divisionsPerQuarter),
              chord: single.step, // 音名のみ（例: 'G', 'F#'）- 実際の音符
              octave: single.octave,
              inversion: 0,
              type: 'note',
              lyricDisplay: currentLyricDisplay || undefined // 表示用歌詞テキスト
            } as ChordProgressionDataItem);
          }
        }

        // 位置を進める（先頭ノートの duration を使用）
        const dur = parseInt(noteEl.querySelector('duration')?.textContent || '0', 10);
        currentPos += isNaN(dur) ? 0 : dur;

        // グループ分をスキップ
        idx = lookaheadIndex - 1;
        continue;
      }

      // その他要素は無視
    }
  });

  // 時間順にソート
  result.sort((a, b) => a.bar === b.bar ? a.beats - b.beats : a.bar - b.bar);
  
  // groupSimultaneousNotes が有効な場合、同タイミングのノーツをまとめる
  if (options?.groupSimultaneousNotes) {
    return groupSimultaneousNotesInResult(result);
  }
  
  return result;
}

/**
 * 同タイミングの複数ノーツを1つのエントリにまとめる
 * - 同じ bar と beats を持つノーツをグループ化
 * - notes配列に全ての音名を格納
 * - N.C.（harmony）と同じタイミングのノートがある場合、ノートにtextをマージ
 */
function groupSimultaneousNotesInResult(items: ChordProgressionDataItem[]): ChordProgressionDataItem[] {
  const grouped: ChordProgressionDataItem[] = [];
  const noteMap = new Map<string, ChordProgressionDataItem[]>();
  const harmonyMap = new Map<string, ChordProgressionDataItem>();
  
  // 同じタイミングのノーツをグループ化
  for (const item of items) {
    const key = `${item.bar}_${item.beats}`;
    
    // N.C.やテキストのみのアイテム（harmony）は別途保存
    if (!item.chord || item.chord.toUpperCase() === 'N.C.' || item.chord.trim() === '') {
      // 同じタイミングにharmonyが複数ある場合は最初のものを使用
      if (!harmonyMap.has(key)) {
        harmonyMap.set(key, item);
      }
      continue;
    }
    
    // ノートはnoteMapに追加
    const existing = noteMap.get(key);
    if (existing) {
      existing.push(item);
    } else {
      noteMap.set(key, [item]);
    }
  }
  
  // グループ化されたノーツを処理
  for (const [key, noteItems] of noteMap) {
    // 同じタイミングのharmonyからtextを取得
    const harmony = harmonyMap.get(key);
    const harmonyText = harmony?.text;
    
    if (noteItems.length === 1) {
      // 単一ノーツ: harmonyのtextをマージ
      const note = { ...noteItems[0] };
      if (harmonyText && !note.text) {
        note.text = harmonyText;
      }
      grouped.push(note);
    } else {
      // 複数ノーツをまとめる
      const firstItem = noteItems[0];
      const allNotes: string[] = [];
      let lowestOctave = 9;
      let lowestMidi = Infinity;
      let itemText: string | undefined = harmonyText;
      let itemLyricDisplay: string | undefined = undefined;
      
      for (const item of noteItems) {
        // textが設定されているアイテムからテキストを取得
        if (item.text && !itemText) {
          itemText = item.text;
        }
        
        // lyricDisplayを取得（最初に見つかったものを使用）
        if (item.lyricDisplay && !itemLyricDisplay) {
          itemLyricDisplay = item.lyricDisplay;
        }
        
        // コード名から音名を抽出
        if (item.chord) {
          // 単音の場合（type: 'note' or 'chord'）はそのまま使用
          if ((item as any).type === 'note' || (item as any).type === 'chord') {
            // notes配列がある場合はそれを使用
            if ((item as any).notes && Array.isArray((item as any).notes)) {
              allNotes.push(...(item as any).notes);
            } else {
              allNotes.push(item.chord);
            }
            // オクターブを抽出
            const match = item.chord.match(/([A-G][#b]?)(\d+)?/);
            if (match) {
              const oct = match[2] ? parseInt(match[2], 10) : (item.octave ?? 4);
              if (oct < lowestOctave) {
                lowestOctave = oct;
              }
              const noteParsed = parseNote(match[1] + String(oct));
              if (noteParsed && typeof noteParsed.midi === 'number' && noteParsed.midi < lowestMidi) {
                lowestMidi = noteParsed.midi;
              }
            }
          } else {
            // コードの場合
            allNotes.push(item.chord);
            if (item.octave && item.octave < lowestOctave) {
              lowestOctave = item.octave;
            }
          }
        }
      }
      
      // 音名を低い順にソート
      allNotes.sort((a, b) => {
        const aParsed = parseNote(a.replace(/\d+$/, '') + '4');
        const bParsed = parseNote(b.replace(/\d+$/, '') + '4');
        const aMidi = aParsed?.midi ?? 0;
        const bMidi = bParsed?.midi ?? 0;
        return aMidi - bMidi;
      });
      
      grouped.push({
        bar: firstItem.bar,
        beats: firstItem.beats,
        chord: allNotes.join(''), // 例: "CEG"
        octave: lowestOctave < 9 ? lowestOctave : 4,
        inversion: 0,
        text: itemText,
        // 新規フィールド: 個別の音名配列
        notes: allNotes,
        // 歌詞表示用テキスト（継続表示）
        lyricDisplay: itemLyricDisplay
      } as ChordProgressionDataItem & { notes?: string[] });
    }
  }
  
  // ノートがないタイミングのharmonyのみを追加（テキスト表示用）
  for (const [key, harmony] of harmonyMap) {
    if (!noteMap.has(key)) {
      grouped.push(harmony);
    }
  }
  
  // 再度時間順にソート
  grouped.sort((a, b) => a.bar === b.bar ? a.beats - b.beats : a.bar - b.bar);
  return grouped;
}

