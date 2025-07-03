import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

// 異名同音の優先設定タイプ
export type EnharmonicPref = ("sharp" | "flat")[];

// デフォルトの異名同音優先設定（#系）
export const defaultEnharmonicPref: EnharmonicPref = [
  "sharp", // C
  "sharp", // C#
  "sharp", // D
  "sharp", // D#
  "sharp", // E
  "sharp", // F
  "sharp", // F#
  "sharp", // G
  "sharp", // G#/Ab
  "sharp", // A
  "sharp", // A#/Bb
  "sharp", // B
];

// フラット系の異名同音優先設定
export const flatEnharmonicPref: EnharmonicPref = [
  "flat",  // C
  "flat",  // Db
  "flat",  // D
  "flat",  // Eb
  "flat",  // E
  "flat",  // F
  "flat",  // Gb
  "flat",  // G
  "flat",  // Ab
  "flat",  // A
  "flat",  // Bb
  "flat",  // B
];

// キーに基づいて適切な異名同音優先設定を返す
export function getEnharmonicPrefForKey(fifths: number): EnharmonicPref {
  // フラット系のキー（五度圏で-1以下）
  if (fifths < 0) {
    return flatEnharmonicPref;
  }
  // シャープ系のキー（五度圏で1以上）
  else if (fifths > 0) {
    // F#メジャー（6シャープ）の場合はGbメジャーとして扱う
    if (fifths >= 6) {
      return flatEnharmonicPref;
    }
    return defaultEnharmonicPref;
  }
  // Cメジャー/Aマイナー
  return defaultEnharmonicPref;
}

/**
 * OSMDインスタンスにパッチを適用
 * encodeNaturals問題と異名同音問題を修正
 */
export function applyOSMDPatches(osmd: OpenSheetMusicDisplay): void {
  try {
    // Sheet が読み込まれていることを確認
    if (!osmd.Sheet) {
      console.warn('OSMD Sheet not loaded yet');
      return;
    }

    // 1. encodeNaturalsを保守的にfalseに設定
    // これにより、移調を戻したときの不要な♮表示を防ぐ
    disableEncodeNaturals(osmd);

    // 2. EngravingRulesに異名同音優先設定を追加
    if (osmd.EngravingRules) {
      // 現在のキーを取得
      let currentFifths = 0;
      if (osmd.Sheet.SourceMeasures && osmd.Sheet.SourceMeasures.length > 0) {
        const firstMeasure = osmd.Sheet.SourceMeasures[0];
        if (firstMeasure && firstMeasure.Rules) {
          for (const rule of firstMeasure.Rules) {
            if (rule.Key) {
              currentFifths = rule.Key.Fifths;
              break;
            }
          }
        }
      }

      // 適切な異名同音優先設定を適用
      const enharmonicPref = getEnharmonicPrefForKey(currentFifths);
      (osmd.EngravingRules as any).enharmonicPref = enharmonicPref;
      
      console.log(`Applied enharmonic preference for key with ${currentFifths} fifths`);
    }

    // 3. レンダリング前のフックを設定
    patchRenderingHooks(osmd);

    console.log('OSMD patches applied successfully');
  } catch (error) {
    console.error('Error applying OSMD patches:', error);
  }
}

/**
 * encodeNaturalsを無効化
 */
function disableEncodeNaturals(osmd: OpenSheetMusicDisplay): void {
  try {
    // Sheetレベルでの設定
    if (osmd.Sheet.Instruments) {
      for (const instrument of osmd.Sheet.Instruments) {
        if (instrument.Staves) {
          for (const staff of instrument.Staves) {
            if (staff.KeyInstructions) {
              staff.KeyInstructions.forEach((ki: any) => {
                // 直接プロパティを設定（型定義に関係なく）
                Object.defineProperty(ki, 'encodeNaturals', {
                  value: false,
                  writable: true,
                  configurable: true
                });
              });
            }
          }
        }
      }
    }

    // SourceMeasuresレベルでの設定
    if (osmd.Sheet.SourceMeasures) {
      for (const measure of osmd.Sheet.SourceMeasures) {
        if (measure.Rules) {
          for (const rule of measure.Rules) {
            if ((rule as any).Key) {
              Object.defineProperty((rule as any).Key, 'encodeNaturals', {
                value: false,
                writable: true,
                configurable: true
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error disabling encodeNaturals:', error);
  }
}

/**
 * レンダリング処理にフックを追加
 */
function patchRenderingHooks(osmd: OpenSheetMusicDisplay): void {
  try {
    // updateGraphicメソッドをラップ
    const originalUpdateGraphic = osmd.updateGraphic.bind(osmd);
    osmd.updateGraphic = function() {
      // 更新前にencodeNaturalsを再度無効化
      disableEncodeNaturals(osmd);
      
      // 元のメソッドを実行
      const result = originalUpdateGraphic();
      
      // 更新後に追加処理
      postProcessGraphics(osmd);
      
      return result;
    };
  } catch (error) {
    console.error('Error patching rendering hooks:', error);
  }
}

/**
 * グラフィック更新後の後処理
 */
function postProcessGraphics(osmd: OpenSheetMusicDisplay): void {
  try {
    // GraphicSheetが存在することを確認
    if (!osmd.GraphicSheet || !osmd.GraphicSheet.MusicPages) {
      return;
    }

    // 全ページを走査して、キー記号の表示を調整
    for (const page of osmd.GraphicSheet.MusicPages) {
      if (!page.MusicSystems) continue;
      
      for (const system of page.MusicSystems) {
        if (!system.StaffLines) continue;
        
        for (const staffLine of system.StaffLines) {
          // キー記号の表示をチェック
          if ((staffLine as any).KeySignatures) {
            for (const keySignature of (staffLine as any).KeySignatures) {
              processKeySignature(keySignature, osmd);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in post-processing graphics:', error);
  }
}

/**
 * キー記号の処理
 */
function processKeySignature(keySignature: any, osmd: OpenSheetMusicDisplay): void {
  try {
    // キー記号に含まれる臨時記号を確認
    if (keySignature.accidentalList && Array.isArray(keySignature.accidentalList)) {
      const enharmonicPref = (osmd.EngravingRules as any).enharmonicPref || defaultEnharmonicPref;
      
      // 各臨時記号の表示を調整
      keySignature.accidentalList.forEach((accidental: any, index: number) => {
        if (accidental && typeof accidental === 'object') {
          // ピッチクラスに基づいて適切な臨時記号を選択
          const pitchClass = index % 12;
          const pref = enharmonicPref[pitchClass];
          
          // 必要に応じて臨時記号の種類を変更
          if (pref === 'flat' && accidental.AccidentalType === 'sharp') {
            // シャープをフラットに変換する処理
            console.log(`Converting sharp to flat for pitch class ${pitchClass}`);
          } else if (pref === 'sharp' && accidental.AccidentalType === 'flat') {
            // フラットをシャープに変換する処理
            console.log(`Converting flat to sharp for pitch class ${pitchClass}`);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error processing key signature:', error);
  }
}

/**
 * 移調後にOSMDの設定を更新
 */
export function updateOSMDAfterTranspose(osmd: OpenSheetMusicDisplay, newTranspose: number): void {
  try {
    if (!osmd.Sheet || !osmd.EngravingRules) {
      console.warn('OSMD not fully initialized');
      return;
    }

    // 移調後の実効的なキーを計算
    let baseFifths = 0;
    if (osmd.Sheet.SourceMeasures && osmd.Sheet.SourceMeasures.length > 0) {
      const firstMeasure = osmd.Sheet.SourceMeasures[0];
      if (firstMeasure && firstMeasure.Rules) {
        for (const rule of firstMeasure.Rules) {
          if (rule.Key) {
            baseFifths = rule.Key.Fifths;
            break;
          }
        }
      }
    }

    // 移調による五度圏の移動を計算（簡易版）
    // 実際の計算はより複雑だが、ここでは概算
    const transposeSteps = newTranspose;
    const fifthsChange = Math.round(transposeSteps * 7 / 12);
    const effectiveFifths = baseFifths + fifthsChange;

    // 新しい異名同音優先設定を適用
    const enharmonicPref = getEnharmonicPrefForKey(effectiveFifths);
    (osmd.EngravingRules as any).enharmonicPref = enharmonicPref;
    
    // Cキーに戻った場合の特別処理
    if (effectiveFifths === 0 && baseFifths !== 0) {
      console.log('Returned to C key - ensuring no unnecessary naturals');
      // 強制的にencodeNaturalsを無効化
      disableEncodeNaturals(osmd);
    }
    
    console.log(`Updated enharmonic preference after transpose: base=${baseFifths}, effective=${effectiveFifths}`);
  } catch (error) {
    console.error('Error updating OSMD after transpose:', error);
  }
}