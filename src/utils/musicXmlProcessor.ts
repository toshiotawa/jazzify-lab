import { MusicXML } from '@stringsync/musicxml';
import { transpose, Interval } from 'tonal';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

/**
 * MusicXMLの移調処理インターフェース
 */
interface TransposeOptions {
  /** 移調する半音数（正の値で上へ、負の値で下へ） */
  semitones: number;
}

/**
 * 音符の移調処理結果
 */
interface TransposeResult {
  /** 移調後のMusicXML文字列 */
  xml: string;
  /** 処理された音符の数 */
  notesTransposed: number;
}

/**
 * MusicXMLファイルをパースして移調処理を行う
 * @param xmlString MusicXML形式の文字列
 * @param options 移調オプション
 * @returns 移調後のMusicXML
 */
export const transposeMusicXml = (xmlString: string, options: TransposeOptions): TransposeResult => {
  // MusicXMLをパース
  const musicXml = MusicXML.parse(xmlString);
  let notesTransposed = 0;

  // 移調処理のためのヘルパー関数
  const transposeNotes = (doc: any): void => {
    // パートごとに処理
    if (doc.parts) {
      doc.parts.forEach((part: any) => {
        if (part.measures) {
          part.measures.forEach((measure: any) => {
            if (measure.entries) {
              measure.entries.forEach((entry: any) => {
                if (entry.type === 'note' && entry.pitch) {
                  // 音高を取得
                  const { step, octave, alter = 0 } = entry.pitch;
                  
                  // tonal形式の音名に変換（C4, D#5など）
                  const noteName = `${step}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${octave}`;
                  
                  // 移調処理（半音数から音程名を生成）
                  const intervalName = Interval.fromSemitones(options.semitones);
                  const transposedNote = transpose(noteName, intervalName);
                  
                  if (transposedNote) {
                    // 移調後の音高情報を解析
                    const match = transposedNote.match(/^([A-G])(#{1,2}|b{1,2})?(\d+)$/);
                    if (match) {
                      const [, newStep, accidental, newOctave] = match;
                      
                      // MusicXMLの音高情報を更新
                      entry.pitch.step = newStep;
                      entry.pitch.octave = parseInt(newOctave);
                      entry.pitch.alter = accidental ? (accidental.includes('#') ? accidental.length : -accidental.length) : 0;
                      
                      notesTransposed++;
                    }
                  }
                }
              });
            }
          });
        }
      });
    }
  };

  // MusicXMLオブジェクトの構造を処理
  transposeNotes(musicXml);

  // 移調後のMusicXMLをシリアライズ
  const transposedXml = musicXml.serialize();

  return {
    xml: transposedXml,
    notesTransposed
  };
};

/**
 * MusicXMLから楽曲情報を抽出
 */
export interface SongInfo {
  title?: string;
  composer?: string;
  tempo?: number;
  timeSignature?: {
    beats: number;
    beatType: number;
  };
  key?: string;
}

/**
 * MusicXMLから楽曲情報を抽出する
 * @param xmlString MusicXML形式の文字列
 * @returns 楽曲情報
 */
export const extractSongInfo = (xmlString: string): SongInfo => {
  const musicXml = MusicXML.parse(xmlString);
  const info: SongInfo = {};

  // タイトルとコンポーザーを取得
  const identification = musicXml.partwise?.movementTitle || musicXml.partwise?.work?.workTitle;
  if (identification) {
    info.title = identification;
  }

  const creator = musicXml.partwise?.identification?.creators?.find(c => c.type === 'composer');
  if (creator) {
    info.composer = creator.value;
  }

  // 最初の小節から情報を取得
  const firstMeasure = musicXml.partwise?.parts?.[0]?.measures?.[0];
  if (firstMeasure) {
    // テンポ情報
    const tempoEntry = firstMeasure.entries?.find(e => e.type === 'direction' && e.sound?.tempo);
    if (tempoEntry?.sound?.tempo) {
      info.tempo = tempoEntry.sound.tempo;
    }

    // 拍子記号
    const timeEntry = firstMeasure.entries?.find(e => e.type === 'attributes' && e.time);
    if (timeEntry?.time) {
      info.timeSignature = {
        beats: timeEntry.time.beats,
        beatType: timeEntry.time.beatType
      };
    }

    // 調号
    const keyEntry = firstMeasure.entries?.find(e => e.type === 'attributes' && e.key);
    if (keyEntry?.key) {
      const fifths = keyEntry.key.fifths;
      // 五度圏から調を判定
      const keys = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
      const keyIndex = fifths + 7; // Cが中心（インデックス7）
      if (keyIndex >= 0 && keyIndex < keys.length) {
        info.key = keys[keyIndex];
      }
    }
  }

  return info;
};

/**
 * OpenSheetMusicDisplay (OSMD) のインスタンスを作成
 * @param container 楽譜を表示するDOM要素
 * @param xmlString MusicXML形式の文字列
 * @returns OSMDインスタンス
 */
export const createOSMDInstance = async (container: HTMLElement, xmlString: string): Promise<OpenSheetMusicDisplay> => {
  // OSMDのオプション設定
  const osmd = new OpenSheetMusicDisplay(container, {
    autoResize: true,
    backend: 'svg',
    drawTitle: true,
    drawComposer: true,
    drawLyricist: false,
    drawMeasureNumbers: true,
    drawPartNames: true,
    drawSlurs: true,
    drawTimeSignatures: true,
    drawingParameters: 'compacttight',
    renderSingleHorizontalStaffline: false
  });

  // MusicXMLを読み込んで描画
  await osmd.load(xmlString);
  osmd.render();

  return osmd;
};

/**
 * MusicXMLから演奏用のノートデータを抽出
 */
export interface PlayableNote {
  time: number;      // 開始時間（秒）
  duration: number;  // 持続時間（秒）
  pitch: number;     // MIDI番号
  velocity: number;  // ベロシティ（0-127）
}

/**
 * MusicXMLから演奏可能なノートデータを抽出
 * @param xmlString MusicXML形式の文字列
 * @param bpm テンポ（省略時は120）
 * @returns 演奏用ノートデータの配列
 */
export const extractPlayableNotes = (xmlString: string, bpm: number = 120): PlayableNote[] => {
  const musicXml = MusicXML.parse(xmlString);
  const notes: PlayableNote[] = [];
  
  // 四分音符の長さ（秒）
  const quarterNoteDuration = 60 / bpm;
  
  musicXml.partwise?.parts?.forEach((part) => {
    let currentTime = 0;
    
    part.measures?.forEach((measure) => {
      measure.entries?.forEach((entry) => {
        if (entry.type === 'note' && entry.pitch && !entry.rest) {
          // MIDI番号を計算
          const { step, octave, alter = 0 } = entry.pitch;
          const noteName = `${step}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${octave}`;
          const midiNumber = getMidiNumber(noteName);
          
          if (midiNumber !== null) {
            // 音符の長さを計算
            const duration = (entry.duration || 1) * quarterNoteDuration / (entry.divisions || 1);
            
            notes.push({
              time: currentTime,
              duration,
              pitch: midiNumber,
              velocity: 80 // デフォルトベロシティ
            });
          }
        }
        
        // 時間を進める（休符も含む）
        if (entry.type === 'note') {
          currentTime += (entry.duration || 1) * quarterNoteDuration / (entry.divisions || 1);
        }
      });
    });
  });
  
  return notes;
};

/**
 * 音名からMIDI番号を取得
 * @param noteName 音名（例: "C4", "F#5"）
 * @returns MIDI番号（0-127）、変換できない場合はnull
 */
const getMidiNumber = (noteName: string): number | null => {
  // 音名とオクターブを分離
  const match = noteName.match(/^([A-G])(#{1,2}|b{1,2})?(-?\d+)$/);
  if (!match) return null;
  
  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr);
  
  // 基準となるMIDI番号（C-1 = 0）
  const noteOffsets: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };
  
  let midiNumber = (octave + 1) * 12 + noteOffsets[note];
  
  // 変化記号の処理
  if (accidental) {
    if (accidental.includes('#')) {
      midiNumber += accidental.length;
    } else {
      midiNumber -= accidental.length;
    }
  }
  
  // MIDI番号の範囲チェック
  return (midiNumber >= 0 && midiNumber <= 127) ? midiNumber : null;
};