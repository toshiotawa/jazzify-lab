import { MusicXML, elements } from '@stringsync/musicxml';
import * as Tonal from 'tonal';

/**
 * MusicXMLを移調する
 * @param xmlString 元のMusicXML文字列
 * @param semitones 移調する半音数 (-6〜+6)
 * @returns 移調後のMusicXML文字列
 */
export async function transposeMusicXML(xmlString: string, semitones: number): Promise<string> {
  // 移調しない場合はそのまま返す
  if (semitones === 0) {
    return xmlString;
  }

  // MusicXMLをパース
  const musicXml = MusicXML.parse(xmlString);
  const root = musicXml.getRoot();
  
  // ScorePartwiseの場合のみ処理（ScoreTimewiseは別途対応が必要）
  if (root instanceof elements.ScorePartwise) {
    const parts = root.getParts();
    
    // 各パートを処理
    for (const part of parts) {
      const measures = part.getMeasures();
      
      // 各メジャーを処理
      for (const measure of measures) {
        if (Array.isArray(measure.contents)) {
          for (const content of measure.contents) {
            if (Array.isArray(content)) {
              for (const item of content) {
                // Attributesの処理（調号の更新）
                if (item instanceof elements.Attributes) {
                  updateKeySignature(item, semitones);
                }
                
                // Noteの処理（音高の移調）
                if (item instanceof elements.Note) {
                  transposeNote(item, semitones);
                }
              }
            }
          }
        }
      }
    }
  }

  // シリアライズして返す
  return musicXml.serialize();
}

/**
 * ノートを移調する
 * @param note Noteオブジェクト
 * @param semitones 移調する半音数
 */
function transposeNote(note: elements.Note, semitones: number): void {
  const variation = note.getVariation();
  
  // variationの2番目の要素がPitch, Unpitched, またはRestのいずれか
  if (Array.isArray(variation) && variation.length > 1 && variation[1]) {
    const pitchOrRest = variation[1];
    
    // Pitchオブジェクトの場合のみ処理
    if (pitchOrRest instanceof elements.Pitch) {
      const step = pitchOrRest.getStep();
      const alter = pitchOrRest.getAlter();
      const octave = pitchOrRest.getOctave();
      
      if (!step || !octave) return;
      
      // 現在の音名を作成
      let currentNote = `${step.contents[0]}${octave.contents[0]}`;
      
      // alterがある場合は適用
      if (alter && alter.contents[0]) {
        const alterValue = alter.contents[0];
        if (alterValue === 1) {
          currentNote = `${step.contents[0]}#${octave.contents[0]}`;
        } else if (alterValue === -1) {
          currentNote = `${step.contents[0]}b${octave.contents[0]}`;
        }
      }
      
      // Tonal.jsで移調
      const transposed = Tonal.Note.transpose(currentNote, Tonal.Interval.fromSemitones(semitones));
      
      if (!transposed) return;
      
      // 移調後の音名を解析
      const parsedNote = Tonal.Note.get(transposed);
      
      if (!parsedNote.letter || parsedNote.oct === undefined) return;
      
      // 黒鍵は全て♭系に変換
      let newStep = parsedNote.letter;
      let newAlter = 0;
      
      if (parsedNote.acc) {
        if (parsedNote.acc === '#' || parsedNote.acc === '♯') {
          // ♯を♭に変換（例: C# → Db）
          const enharmonic = Tonal.Note.enharmonic(transposed);
          if (enharmonic && enharmonic.includes('b')) {
            const enhParsed = Tonal.Note.get(enharmonic);
            if (enhParsed.letter && enhParsed.oct !== undefined) {
              newStep = enhParsed.letter;
              newAlter = -1;
            }
          } else {
            newAlter = 1;
          }
        } else if (parsedNote.acc === 'b' || parsedNote.acc === '♭') {
          newAlter = -1;
        }
      }
      
      // 移調後の値を設定
      // Stepを更新
      if (!step) {
        pitchOrRest.setStep(new elements.Step({ contents: [newStep as "A" | "B" | "C" | "D" | "E" | "F" | "G"] }));
      } else {
        step.contents[0] = newStep as "A" | "B" | "C" | "D" | "E" | "F" | "G";
      }
      
      // Alterを更新
      if (newAlter !== 0) {
        if (!alter) {
          pitchOrRest.setAlter(new elements.Alter({ contents: [newAlter] }));
        } else {
          alter.contents[0] = newAlter;
        }
      } else {
        // alterが0の場合は削除
        pitchOrRest.setAlter(null);
      }
      
      // Octaveを更新
      if (octave && parsedNote.oct !== undefined) {
        octave.contents[0] = parsedNote.oct;
      }
    }
  }
}

/**
 * 調号を更新する
 * @param attributes Attributesオブジェクト
 * @param semitones 移調する半音数
 */
function updateKeySignature(attributes: elements.Attributes, semitones: number): void {
  const keys = attributes.getKeys();
  
  if (keys && keys.length > 0) {
    for (const key of keys) {
      const keyValue = key.getValue();
      
      // keyValueは配列で、2番目の要素がFifthsオブジェクト
      if (Array.isArray(keyValue) && keyValue[1]) {
        const fifths = keyValue[1];
        
        if (fifths && 'contents' in fifths && Array.isArray(fifths.contents)) {
          const currentFifths = fifths.contents[0] || 0;
          
          // 五度圏の値を半音数から計算
          // 1半音 = 7五度（完全五度の関係）
          const fifthsChange = Math.round(semitones * 7 / 12);
          let newFifths = currentFifths + fifthsChange;
          
          // -7〜7の範囲に収める
          while (newFifths > 7) newFifths -= 12;
          while (newFifths < -7) newFifths += 12;
          
          // 値を更新
          fifths.contents[0] = newFifths;
        }
      }
    }
  }
  
  // transpose要素があれば削除
  const transpositions = attributes.getTranspositions();
  if (transpositions && transpositions.length > 0) {
    attributes.setTranspositions([]);
  }
}

/**
 * MusicXMLファイルを取得して移調する
 * @param url MusicXMLファイルのURL
 * @param semitones 移調する半音数
 * @returns 移調後のMusicXML文字列
 */
export async function fetchAndTransposeMusicXML(url: string, semitones: number): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch MusicXML: ${response.statusText}`);
  }
  
  const xmlString = await response.text();
  return transposeMusicXML(xmlString, semitones);
}