import { parseChordName, buildChordNotes } from '@/utils/chord-utils';
import type { ChordProgressionDataItem } from '@/components/fantasy/TaikoNoteSystem';
import { note as parseNote } from 'tonal';

/**
 * MusicXML文字列から progression_timing 用の JSON 配列へ変換
 * - chord: 歌詞(lyric)からコード名を取得（基本ルール）
 * - octave/inversion: 同時発音ノーツの最低音から推定（なければデフォルト octave=4, inversion=0）
 * - text: <harmony> の表記をそのまま格納（オーバーレイ表示用）
 * - 単音ノーツで lyric が無い場合は、単音として { type: 'note', chord: 'G' } のように出力
 */
export function convertMusicXmlToProgressionData(xmlText: string): ChordProgressionDataItem[] {
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

  const toBeats = (positionInDivs: number, divisionsPerQuarter: number): number => {
    // 1拍 = quarter 音符
    const beatOffset = divisionsPerQuarter > 0 ? positionInDivs / divisionsPerQuarter : 0;
    return 1 + beatOffset;
  };

  // 進行
  measures.forEach((measureEl) => {
    const bar = parseInt(measureEl.getAttribute('number') || '1', 10);
    let divisionsPerQuarter = 1;
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
        // Overlay テキスト用に text を作る
        const rootStep = el.querySelector('root root-step')?.textContent || '';
        const rootAlter = parseInt(el.querySelector('root root-alter')?.textContent || '0', 10);
        const kindTextAttr = el.querySelector('kind')?.getAttribute('text') || '';
        const rootName = stepAlterToName(rootStep, rootAlter);
        const display = `${rootName}${kindTextAttr}`.trim();
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

        // 歌詞からコード名を取得（グループ内を走査）
        let chordText: string | null = null;
        for (const g of group) {
          const lyricText = g.querySelector('lyric text')?.textContent?.trim();
          if (lyricText) {
            chordText = lyricText;
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
            const octave = parseInt(p.querySelector('octave')?.textContent || '4', 10);
            const name = stepAlterToName(step, alter);
            const tonal = parseNote(name.replace(/x/g, '##') + String(octave));
            const midi = tonal && typeof tonal.midi === 'number' ? tonal.midi : null;
            return midi !== null ? { step: name, octave, midi } : null;
          })
          .filter((v): v is { step: string; octave: number; midi: number } => !!v)
          .sort((a, b) => a.midi - b.midi);

        const bass = pitches[0] || null;

        // inversion 推定（ベース音の pitch class がコード構成音の何番目か）
        let inversion: number | null = null;
        if (chordText && bass) {
          const parsed = parseChordName(chordText);
          if (parsed) {
            const chordNotes = buildChordNotes(parsed.root, parsed.quality, bass.octave);
            const toPc = (name: string): number => {
              const midi = parseNote(name.replace(/x/g, '##') + String(bass.octave))?.midi;
              return typeof midi === 'number' ? (midi % 12) : 0;
            };
            const bassPc = bass.midi % 12;
            const pcs = chordNotes.map(toPc);
            const foundIndex = pcs.findIndex((pc) => pc === bassPc);
            inversion = foundIndex >= 0 ? foundIndex : 0;
          }
        }

        // 出力アイテムを作成
        if (chordText) {
          result.push({
            bar,
            beats: toBeats(currentPos, divisionsPerQuarter),
            chord: chordText,
            inversion: inversion ?? 0,
            octave: bass ? bass.octave : 4
          });
        } else {
          // 単音扱い（lyric なし）
          const single = bass ? bass : pitches[0] || null;
          if (single) {
            result.push({
              bar,
              beats: toBeats(currentPos, divisionsPerQuarter),
              chord: single.step, // 音名のみ（例: 'G', 'F#'）
              octave: single.octave,
              inversion: 0,
              type: 'note'
            });
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
  return result;
}

