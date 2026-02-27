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

import type { NoteData, NoteHand } from '@/types';
import {
  stepAlterOctaveToMidi,
  stepAlterToDisplayName,
  getKeyFifths,
  detectOrnaments,
  expandOrnament,
  isGraceNote,
  collectGraceNotesBefore,
  expandGraceNotes,
  getTieTypes,
} from './musicXmlOrnamentExpander';

// ========== テンポマップ ==========

interface TempoEvent {
  /** 楽譜上の絶対位置（divisions の累積値） */
  absDivisions: number;
  /** テンポ (BPM) */
  tempo: number;
}

interface RitRegion {
  /** 減速開始位置（divisions の累積値） */
  startDiv: number;
  /** 減速終了位置（divisions の累積値） */
  endDiv: number;
  /** 開始時テンポ */
  startTempo: number;
  /** 終了時テンポ */
  endTempo: number;
}

/**
 * パス1: MusicXML を走査してテンポイベント + rit/rall 減速区間を収集する。
 * 即時テンポ変更（<sound tempo>）とテキスト指示（"rit." "rall."）の両方を扱う。
 */
function buildTempoMap(measures: Element[]): { tempoEvents: TempoEvent[]; ritRegions: RitRegion[] } {
  const tempoEvents: TempoEvent[] = [];
  const ritRegions: RitRegion[] = [];
  let divisionsPerQuarter = 1;
  let beatsPerMeasure = 4;
  let beatType = 4;
  let currentTempo = 120;
  let absDivisions = 0;
  let ritStartDiv: number | null = null;
  let ritStartTempo = 0;

  const RIT_RE = /\b(rit|rall|ritard|rallent)/i;
  const ATEMPO_RE = /\ba\s*tempo\b/i;

  for (const measureEl of measures) {
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

    const measureDivisions = (beatsPerMeasure / beatType) * 4 * divisionsPerQuarter;
    let posInDivisions = 0;

    for (const el of measureEl.children) {
      const absPos = absDivisions + posInDivisions;

      if (el.tagName === 'sound') {
        const t = parseFloat(el.getAttribute('tempo') ?? '');
        if (!isNaN(t) && t > 0) {
          if (ritStartDiv !== null) {
            ritRegions.push({ startDiv: ritStartDiv, endDiv: absPos, startTempo: ritStartTempo, endTempo: t });
            ritStartDiv = null;
          }
          currentTempo = t;
          tempoEvents.push({ absDivisions: absPos, tempo: t });
        }
        continue;
      }

      if (el.tagName === 'direction') {
        const dirSound = el.querySelector('sound[tempo]');
        if (dirSound) {
          const t = parseFloat(dirSound.getAttribute('tempo') ?? '');
          if (!isNaN(t) && t > 0) {
            if (ritStartDiv !== null) {
              ritRegions.push({ startDiv: ritStartDiv, endDiv: absPos, startTempo: ritStartTempo, endTempo: t });
              ritStartDiv = null;
            }
            currentTempo = t;
            tempoEvents.push({ absDivisions: absPos, tempo: t });
          }
        }
        const wordsEls = el.querySelectorAll('direction-type words');
        for (const w of wordsEls) {
          const text = w.textContent ?? '';
          if (ATEMPO_RE.test(text)) {
            if (ritStartDiv !== null) {
              ritRegions.push({ startDiv: ritStartDiv, endDiv: absPos, startTempo: ritStartTempo, endTempo: currentTempo });
              ritStartDiv = null;
            }
          } else if (RIT_RE.test(text) && ritStartDiv === null) {
            ritStartDiv = absPos;
            ritStartTempo = currentTempo;
          }
        }
        continue;
      }

      if (el.tagName === 'backup') {
        const dur = parseInt(el.querySelector('duration')?.textContent ?? '0', 10);
        posInDivisions -= isNaN(dur) ? 0 : dur;
        continue;
      }
      if (el.tagName === 'forward') {
        const dur = parseInt(el.querySelector('duration')?.textContent ?? '0', 10);
        posInDivisions += isNaN(dur) ? 0 : dur;
        continue;
      }
      if (el.tagName === 'note' && !el.querySelector('chord')) {
        if (!isGraceNote(el)) {
          const dur = parseInt(el.querySelector('duration')?.textContent ?? '0', 10);
          posInDivisions += isNaN(dur) ? 0 : dur;
        }
      }
    }

    absDivisions += measureDivisions;
  }

  // 未閉の rit 区間: 小節末まで70%に減速
  if (ritStartDiv !== null) {
    ritRegions.push({
      startDiv: ritStartDiv,
      endDiv: absDivisions,
      startTempo: ritStartTempo,
      endTempo: ritStartTempo * 0.7,
    });
  }

  return { tempoEvents, ritRegions };
}

/**
 * 指定位置のテンポを取得する。rit/rall 区間内なら線形補間を行う。
 */
function getTempoAtPosition(
  absDiv: number,
  baseTempo: number,
  ritRegions: RitRegion[],
): number {
  for (const r of ritRegions) {
    if (absDiv >= r.startDiv && absDiv <= r.endDiv) {
      const span = r.endDiv - r.startDiv;
      if (span <= 0) return r.endTempo;
      const progress = (absDiv - r.startDiv) / span;
      return r.startTempo + (r.endTempo - r.startTempo) * progress;
    }
  }
  return baseTempo;
}

// ========== 内部型 ==========

interface RawParsedNote {
  time: number;       // 秒
  pitch: number;      // MIDI
  noteName: string;   // 例 "C4"
  isOrnament: boolean;
  staff: number;      // MusicXML staff番号 (1=右手, 2=左手)
  durationSec: number; // 秒単位の音価
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

  // パス1: テンポマップ構築（rit/rall 減速区間を含む）
  const { ritRegions } = buildTempoMap(measures);

  // 全体の状態
  let divisionsPerQuarter = 1; // <divisions>
  let tempo = 120;             // BPM (quarter / min)
  let currentTimeBase = 0;     // 小節先頭の絶対時刻 (秒)
  let absDivisionsBase = 0;    // 小節先頭の絶対 division 位置

  // 拍子計算用
  let beatsPerMeasure = 4;
  let beatType = 4;

  /**
   * 絶対 division 位置から秒数を算出する。
   * rit/rall 区間内では線形補間したテンポを使い、1-division ステップで積分する。
   * 区間外は一定テンポで一括計算する。
   */
  const divisionsToSeconds = (startAbsDiv: number, count: number, baseTempo: number, dpq: number): number => {
    if (count <= 0) return 0;
    // rit 区間に掛かるか簡易チェック
    let inRit = false;
    for (const r of ritRegions) {
      if (startAbsDiv + count > r.startDiv && startAbsDiv < r.endDiv) {
        inRit = true;
        break;
      }
    }
    if (!inRit) {
      return count * (60.0 / (baseTempo * dpq));
    }
    // rit 区間を含むので 1-division ステップで積分
    let seconds = 0;
    for (let d = 0; d < count; d += 1) {
      const pos = startAbsDiv + d;
      const localTempo = getTempoAtPosition(pos, baseTempo, ritRegions);
      seconds += 60.0 / (localTempo * dpq);
    }
    return seconds;
  };

  const collected: RawParsedNote[] = [];

  // タイチェーン追跡: 先頭ノートの duration を累積するためのマップ
  // key = "pitch:voice:staff", value = collected 配列のインデックス
  const activeTies = new Map<string, number>();

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

    // 1 division あたりの秒数（rit 区間外のフォールバック用）
    const secondsPerDivision = 60.0 / (tempo * divisionsPerQuarter);

    // 小節の長さ (divisions)
    const measureDivisions = (beatsPerMeasure / beatType) * 4 * divisionsPerQuarter;

    // 小節内の現在位置 (divisions)
    let posInDivisions = 0;
    // 和音用: 直前の非和音ノートの開始位置を記録
    let lastNonChordPos = 0;

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

      // タイ処理: tie-stop を持つノートはすべてスキップ（中間ノート含む）
      // 先頭ノートの durationSec に累積する
      const { hasStart: hasTieStart, hasStop: hasTieStop } = getTieTypes(noteEl);
      if (hasTieStop) {
        const dur = parseInt(noteEl.querySelector('duration')?.textContent ?? '0', 10);
        if (!isChord) {
          posInDivisions += isNaN(dur) ? 0 : dur;
        }

        // ピッチ取得して先頭ノートの duration を累積
        const tPitchEl = noteEl.querySelector('pitch');
        if (tPitchEl) {
          const tStep = tPitchEl.querySelector('step')?.textContent ?? 'C';
          const tAlter = parseInt(tPitchEl.querySelector('alter')?.textContent ?? '0', 10);
          const tOctave = parseInt(tPitchEl.querySelector('octave')?.textContent ?? '4', 10);
          const tPitch = stepAlterOctaveToMidi(tStep, tAlter, tOctave);
          const tVoice = parseInt(noteEl.querySelector('voice')?.textContent ?? '1', 10);
          const tStaffNum = parseInt(noteEl.querySelector('staff')?.textContent ?? '0', 10);
          const tStaff = tStaffNum > 0 ? tStaffNum : (tVoice <= 1 ? 1 : 2);
          const tieKey = `${tPitch}:${tVoice}:${tStaff}`;

          const origIdx = activeTies.get(tieKey);
          if (origIdx !== undefined && origIdx < collected.length) {
            const tieNotePos = isChord ? lastNonChordPos : (posInDivisions - (isNaN(dur) ? 0 : dur));
            const addedSec = divisionsToSeconds(absDivisionsBase + tieNotePos, dur, tempo, divisionsPerQuarter);
            collected[origIdx].durationSec += addedSec;
          }

          if (hasTieStart) {
            // チェーン継続: 同じ先頭ノートを追跡し続ける
          } else {
            activeTies.delete(tieKey);
          }
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

      // スタッフ番号 (1=右手, 2=左手, なければ voice で推定)
      const staffNum = parseInt(noteEl.querySelector('staff')?.textContent ?? '0', 10);
      const voiceNum = parseInt(noteEl.querySelector('voice')?.textContent ?? '1', 10);
      const noteStaff = staffNum > 0 ? staffNum : (voiceNum <= 1 ? 1 : 2);

      // 和音ノートは直前の非和音ノートと同じ位置（同時発音）
      const notePos = isChord ? lastNonChordPos : posInDivisions;
      if (!isChord) {
        lastNonChordPos = posInDivisions;
      }
      const noteTime = currentTimeBase + divisionsToSeconds(absDivisionsBase, notePos, tempo, divisionsPerQuarter);

      // ---- grace notes ----
      const graceNotes = collectGraceNotesBefore(elements, idx);
      const isDotted = noteEl.querySelector('dot') !== null;
      const [graceExpanded, graceDivStolen, isLongAppoggiatura] = expandGraceNotes(graceNotes, duration, isDotted);
      const effectiveDuration = Math.max(1, duration - graceDivStolen);

      // grace note の時間差 (秒)
      const graceStolenSec = graceDivStolen > 0
        ? divisionsToSeconds(absDivisionsBase + notePos, graceDivStolen, tempo, divisionsPerQuarter)
        : 0;

      // grace notes を追加
      let graceOffset = 0;
      for (const gn of graceExpanded) {
        let graceTime: number;
        if (isLongAppoggiatura) {
          // 長前打音: 拍の上 (on-beat) に配置
          graceTime = noteTime + divisionsToSeconds(absDivisionsBase + notePos, graceOffset, tempo, divisionsPerQuarter);
        } else {
          // 短前打音: 拍の前 (before-beat) に配置
          const graceAbsDiv = absDivisionsBase + notePos - graceDivStolen + graceOffset;
          graceTime = noteTime - divisionsToSeconds(graceAbsDiv, graceDivStolen - graceOffset, tempo, divisionsPerQuarter);
        }
        collected.push({
          time: graceTime,
          pitch: gn.pitch,
          noteName: gn.noteName,
          isOrnament: true,
          staff: noteStaff,
          durationSec: divisionsToSeconds(
            absDivisionsBase + notePos + graceOffset,
            gn.durationDivisions,
            tempo,
            divisionsPerQuarter,
          ),
        });
        graceOffset += gn.durationDivisions;
      }

      // 長前打音の場合、主音の開始時刻を前打音の後ろにずらす
      const mainNoteTime = isLongAppoggiatura ? noteTime + graceStolenSec : noteTime;

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
          divisionsPerQuarter,
        );
        let offset = 0;
        for (const en of expanded) {
          collected.push({
            time: mainNoteTime + divisionsToSeconds(absDivisionsBase + notePos + graceDivStolen, offset, tempo, divisionsPerQuarter),
            pitch: en.pitch,
            noteName: en.noteName,
            isOrnament: en.isOrnament,
            staff: noteStaff,
            durationSec: divisionsToSeconds(absDivisionsBase + notePos + graceDivStolen + offset, en.durationDivisions, tempo, divisionsPerQuarter),
          });
          offset += en.durationDivisions;
        }
      } else {
        // 通常ノート
        collected.push({
          time: mainNoteTime,
          pitch: mainPitch,
          noteName: mainName,
          isOrnament: false,
          staff: noteStaff,
          durationSec: divisionsToSeconds(absDivisionsBase + notePos + graceDivStolen, effectiveDuration, tempo, divisionsPerQuarter),
        });
      }

      // タイ開始ノートを追跡（先頭ノートの duration 累積用）
      if (hasTieStart && !hasTieStop) {
        const tieKey = `${mainPitch}:${voiceNum}:${noteStaff}`;
        activeTies.set(tieKey, collected.length - 1);
      }

      // 位置を進める (和音でなければ)
      if (!isChord) {
        posInDivisions += duration;
      }
    }

    // 小節終了: 次の小節の開始時刻を計算（rit 区間を考慮）
    currentTimeBase += divisionsToSeconds(absDivisionsBase, measureDivisions, tempo, divisionsPerQuarter);
    absDivisionsBase += measureDivisions;
  }

  // 時間順にソート (同時刻はピッチ昇順)
  collected.sort((a, b) => a.time - b.time || a.pitch - b.pitch);

  // ユニゾン検出: 同時刻 + 同ピッチ で異なるスタッフ → 'both'
  // まず (time, pitch) → Set<staff> のマップを構築
  const unisonMap = new Map<string, Set<number>>();
  for (const n of collected) {
    const key = `${n.time.toFixed(6)}:${n.pitch}`;
    let staffSet = unisonMap.get(key);
    if (!staffSet) {
      staffSet = new Set();
      unisonMap.set(key, staffSet);
    }
    staffSet.add(n.staff);
  }

  // hand 判定
  const toHand = (n: RawParsedNote): NoteHand => {
    const key = `${n.time.toFixed(6)}:${n.pitch}`;
    const staffSet = unisonMap.get(key);
    if (staffSet && staffSet.size > 1) return 'both';
    return n.staff <= 1 ? 'right' : 'left';
  };

  // NoteData に変換
  return collected.map((n, i) => ({
    id: `${songId}-${i}`,
    time: Math.max(0, n.time),
    pitch: n.pitch,
    duration: n.durationSec > 0 ? n.durationSec : undefined,
    noteName: n.noteName,
    hand: toHand(n),
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
 * MusicXML内の全ての <sound tempo="..."> を指定BPMに書き換える。
 * song.bpm が設定されている場合にXMLパース前に呼び出すことで、
 * ノーツ時間・範囲計算・譜面スクロール全てが新BPMで統一される。
 */
export function overrideMusicXmlTempo(xmlText: string, newBpm: number): string {
  return xmlText.replace(
    /(<sound\b[^>]*\btempo\s*=\s*")([^"]+)(")/g,
    (_match, pre, _oldTempo, post) => `${pre}${newBpm}${post}`
  );
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
