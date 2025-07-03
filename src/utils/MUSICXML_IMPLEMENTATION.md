# MusicXML + Tonal 実装ガイド

## 概要

`@stringsync/musicxml` と `tonal` ライブラリを併用した効率的なMusicXML処理の実装です。

### メリット

1. **@stringsync/musicxml**
   - MusicXMLのパース/シリアライズを完全に任せられる
   - 型安全なオブジェクト構造
   - XMLの構造を壊さない

2. **tonal**
   - `transpose()` 関数一つで移調処理が完了
   - `Interval.fromSemitones()` で半音数から音程を生成
   - 音楽理論的に正確な変換

3. **OpenSheetMusicDisplay (OSMD)**
   - 移調後も正しく楽譜を描画
   - 美しい楽譜表示

## 実装の流れ

```typescript
// 1. MusicXMLをパース
const musicXml = MusicXML.parse(xmlString);

// 2. 音符を走査して移調
musicXml.parts.forEach(part => {
  part.measures.forEach(measure => {
    measure.entries.forEach(entry => {
      if (entry.type === 'note' && entry.pitch) {
        // tonal形式の音名に変換
        const noteName = `${step}${alter}${octave}`;
        
        // 移調処理
        const intervalName = Interval.fromSemitones(semitones);
        const transposedNote = transpose(noteName, intervalName);
        
        // 結果を反映
        entry.pitch = parseTransposedNote(transposedNote);
      }
    });
  });
});

// 3. シリアライズして出力
const transposedXml = musicXml.serialize();
```

## 主要な関数

### transposeMusicXml
MusicXMLファイルを指定した半音数だけ移調します。

```typescript
const result = transposeMusicXml(xmlString, { semitones: 3 });
console.log(`${result.notesTransposed}個の音符を移調しました`);
```

### extractSongInfo
MusicXMLから楽曲情報を抽出します。

```typescript
const info = extractSongInfo(xmlString);
// { title, composer, tempo, timeSignature, key }
```

### createOSMDInstance
OpenSheetMusicDisplayのインスタンスを作成して楽譜を描画します。

```typescript
const osmd = await createOSMDInstance(container, xmlString);
```

### extractPlayableNotes
ゲーム用の演奏可能なノートデータを抽出します。

```typescript
const notes = extractPlayableNotes(xmlString, bpm);
// [{ time, duration, pitch, velocity }, ...]
```

## 使用例

```tsx
import { SheetMusicDisplay } from './components/game/SheetMusicDisplay';

<SheetMusicDisplay
  musicXml={xmlContent}
  initialTranspose={0}
  onTransposeChange={(semitones) => {
    console.log('移調:', semitones);
  }}
  onSongInfoChange={(info) => {
    console.log('楽曲情報:', info);
  }}
/>
```

## パフォーマンス

- パース: 大規模なMusicXMLでも高速
- 移調処理: O(n) - 音符数に比例
- シリアライズ: 元の構造を保持するため高速
- 描画: OSMDが最適化を処理

## 注意点

1. **型エラーについて**
   - `@stringsync/musicxml`の型定義が不完全な場合があります
   - 必要に応じて`any`型を使用していますが、実行時は問題ありません

2. **OSMD オプション**
   - 一部のオプションは型定義と実際のAPIが異なる場合があります
   - 実行時エラーを確認しながら調整してください

3. **移調の制限**
   - ±12半音（1オクターブ）までを推奨
   - それ以上の移調も可能ですが、楽譜の読みやすさが低下します

## 今後の拡張

1. **MIDIエクスポート**
   - 移調後のデータをMIDIファイルとして出力

2. **リアルタイム移調**
   - 演奏中の動的な移調対応

3. **パート別移調**
   - 特定のパートのみを移調する機能

4. **調号の自動調整**
   - 移調後に最適な調号を自動選択