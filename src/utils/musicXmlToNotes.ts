/**
 * MusicXML → NoteData[] パーサー
 *
 * MusicXMLファイルのみから、レジェンドモードで使用できる
 * NoteData 形式のノーツデータを生成する。
 *
 * - テンポ (<sound tempo>)、拍子 (<time>)、divisions 情報から絶対時間を算出
 * - 装飾音符 (grace notes) を展開
 * - トリル / モルデント / ターン等の装飾記号を展開
 * - タイ (tie stop のみ) をスキップ
 * - backup / forward 要素でマルチボイス / マルチスタッフ対応
 * - 和音 (<chord>) ノートを同時刻に配置
 */

import type { NoteData } from '@/types';
import {
  stepAlterOctaveToMidi,
  stepAlterToDisplayName,
  getKeyFifths,
  detectOrnaments,
  expandOrnament,
  isGraceNote,
  collectGraceNotesBefore,
  expandGraceNotes,
} from './musicXmlOrnamentExpander';

// ========== 内部型 ==========

interface RawParsedNote {
  time: number;       // 秒
  pitch: number;      // MIDI
  noteName: string;   // 例 "C4"
  isOrnament: boolean;
}

// ========== 公開API ==========

/**
 * MusicXML文字列を解析して NoteData[] を返す
 * @param xmlText MusicXML テキスト
 * @param songId  ノーツIDプレフィクス (省略可)
 */
export function parseMusicXmlToNoteData(
  xmlText: string,
  songId = 'xml',
): NoteData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  // XML 解析エラーチェック
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`MusicXML解析エラー: ${parseError.textContent}`);
  }

  const keyFifths = getKeyFifths(doc);
  const useFlatNames = keyFifths < 0;
  const measures = Array.from(doc.querySelectorAll('part > measure'));

  // 全体の状態
  let divisionsPerQuarter = 1; // <divisions>
  let tempo = 120;             // BPM (quarter / min)
  let currentTimeBase = 0;     // 小節先頭の絶対時刻 (秒)

  // 拍子計算用
  let beatsPerMeasure = 4;
  let beatType = 4;

  const collected: RawParsedNote[] = [];

  for (const measureEl of measures) {
    // ---- attributes 更新 ----
    const divEl = measureEl.querySelector('attributes > divisions');
    if (divEl?.textContent) {
      const v = parseInt(divEl.textContent, 10);
      if (!isNaN(v) && v > 0) divisionsPerQuarter = v;
    }

    const timeEl = measureEl.querySelector('attributes > time');
    if (timeEl) {
      const b = parseInt(timeEl.querySelector('beats')?.textContent ?? '', 10);
      const bt = parseInt(timeEl.querySelector('beat-type')?.textContent ?? '', 10);
      if (!isNaN(b) && b > 0) beatsPerMeasure = b;
      if (!isNaN(bt) && bt > 0) beatType = bt;
    }

    // ---- sound tempo 更新 ----
    const soundEl = measureEl.querySelector('sound[tempo]');
    if (soundEl) {
      const t = parseFloat(soundEl.getAttribute('tempo') ?? '');
      if (!isNaN(t) && t > 0) tempo = t;
    }

    // 1 division あたりの秒数
    const secondsPerDivision = 60.0 / (tempo * divisionsPerQuarter);

    // 小節の長さ (divisions)
    const measureDivisions = (beatsPerMeasure / beatType) * 4 * divisionsPerQuarter;

    // 小節内の現在位置 (divisions)
    let posInDivisions = 0;

    const elements = Array.from(measureEl.children);

    for (let idx = 0; idx < elements.length; idx++) {
      const el = elements[idx];

      // ---- sound tempo (要素間にも出現しうる) ----
      if (el.tagName === 'sound') {
        const t = parseFloat(el.getAttribute('tempo') ?? '');
        if (!isNaN(t) && t > 0) tempo = t;
        continue;
      }

      // ---- direction 内の sound ----
      if (el.tagName === 'direction') {
        const dirSound = el.querySelector('sound[tempo]');
        if (dirSound) {
          const t = parseFloat(dirSound.getAttribute('tempo') ?? '');
          if (!isNaN(t) && t > 0) tempo = t;
        }
        continue;
      }

      // ---- backup ----
      if (el.tagName === 'backup') {
        const dur = parseInt(el.querySelector('duration')?.textContent ?? '0', 10);
        posInDivisions -= isNaN(dur) ? 0 : dur;
        continue;
      }

      // ---- forward ----
      if (el.tagName === 'forward') {
        const dur = parseInt(el.querySelector('duration')?.textContent ?? '0', 10);
        posInDivisions += isNaN(dur) ? 0 : dur;
        continue;
      }

      // ---- note ----
      if (el.tagName !== 'note') continue;

      const noteEl = el;

      // grace note はここでは先読みしない (主音処理時に collectGraceNotesBefore で処理)
      if (isGraceNote(noteEl)) continue;

      // 休符
      if (noteEl.querySelector('rest')) {
        const dur = parseInt(noteEl.querySelector('duration')?.textContent ?? '0', 10);
        posInDivisions += isNaN(dur) ? 0 : dur;
        continue;
      }

      // 和音 (<chord>) なら位置を戻さない
      const isChord = noteEl.querySelector('chord') !== null;

      // タイ処理: stop のみ(start なし) → スキップ
      const ties = Array.from(noteEl.querySelectorAll('tie'));
      const hasTieStop = ties.some((t) => t.getAttribute('type') === 'stop');
      const hasTieStart = ties.some((t) => t.getAttribute('type') === 'start');
      if (hasTieStop && !hasTieStart) {
        if (!isChord) {
          const dur = parseInt(noteEl.querySelector('duration')?.textContent ?? '0', 10);
          posInDivisions += isNaN(dur) ? 0 : dur;
        }
        continue;
      }

      // ピッチ取得
      const pitchEl = noteEl.querySelector('pitch');
      if (!pitchEl) {
        if (!isChord) {
          const dur = parseInt(noteEl.querySelector('duration')?.textContent ?? '0', 10);
          posInDivisions += isNaN(dur) ? 0 : dur;
        }
        continue;
      }

      const step = pitchEl.querySelector('step')?.textContent ?? 'C';
      const alter = parseInt(pitchEl.querySelector('alter')?.textContent ?? '0', 10);
      const octave = parseInt(pitchEl.querySelector('octave')?.textContent ?? '4', 10);
      const mainPitch = stepAlterOctaveToMidi(step, alter, octave);
      const mainName = stepAlterToDisplayName(step, alter, octave);
      const duration = parseInt(noteEl.querySelector('duration')?.textContent ?? '0', 10);

      // 和音でなければ note の位置を記録
      const notePos = isChord ? posInDivisions : posInDivisions;
      const noteTime = currentTimeBase + notePos * secondsPerDivision;

      // ---- grace notes (主音の直前) ----
      const graceNotes = collectGraceNotesBefore(elements, idx);
      const [graceExpanded, graceDivStolen] = expandGraceNotes(graceNotes, duration);
      const effectiveDuration = Math.max(1, duration - graceDivStolen);

      // grace note を追加
      let graceOffset = 0;
      for (const gn of graceExpanded) {
        collected.push({
          time: noteTime - (graceDivStolen - graceOffset) * secondsPerDivision,
          pitch: gn.pitch,
          noteName: gn.noteName,
          isOrnament: true,
        });
        graceOffset += gn.durationDivisions;
      }

      // ---- 装飾記号 (ornaments) ----
      const ornament = detectOrnaments(noteEl);

      if (ornament) {
        const expanded = expandOrnament(
          ornament,
          mainPitch,
          mainName,
          effectiveDuration,
          keyFifths,
          useFlatNames,
        );
        let offset = 0;
        for (const en of expanded) {
          collected.push({
            time: noteTime + offset * secondsPerDivision,
            pitch: en.pitch,
            noteName: en.noteName,
            isOrnament: en.isOrnament,
          });
          offset += en.durationDivisions;
        }
      } else {
        // 通常ノート
        collected.push({
          time: noteTime,
          pitch: mainPitch,
          noteName: mainName,
          isOrnament: false,
        });
      }

      // 位置を進める (和音でなければ)
      if (!isChord) {
        posInDivisions += duration;
      }
    }

    // 小節終了: 次の小節の開始時刻を計算
    currentTimeBase += measureDivisions * secondsPerDivision;
  }

  // 時間順にソート (同時刻はピッチ昇順)
  collected.sort((a, b) => a.time - b.time || a.pitch - b.pitch);

  // NoteData に変換
  return collected.map((n, i) => ({
    id: `${songId}-${i}`,
    time: Math.max(0, n.time),
    pitch: n.pitch,
    noteName: n.noteName,
  }));
}

/**
 * MusicXMLからテンポ (BPM) を取得
 */
export function extractTempoFromMusicXml(xmlText: string): number {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const soundEl = doc.querySelector('sound[tempo]');
  if (soundEl) {
    const t = parseFloat(soundEl.getAttribute('tempo') ?? '');
    if (!isNaN(t) && t > 0) return t;
  }
  return 120; // デフォルト
}

/**
 * MusicXMLからの曲の推定長さ (秒) を取得
 */
export function estimateDurationFromMusicXml(xmlText: string): number {
  const notes = parseMusicXmlToNoteData(xmlText);
  if (notes.length === 0) return 60;
  const lastNoteTime = notes[notes.length - 1].time;
  // 最後のノートに余裕を持たせる
  return Math.ceil(lastNoteTime + 4);
}
