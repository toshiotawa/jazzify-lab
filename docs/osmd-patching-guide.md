# OpenSheetMusicDisplay 移調問題パッチガイド

## 概要

このドキュメントでは、OpenSheetMusicDisplay (OSMD) v1.9.0における以下の問題の解決方法を説明します：

1. **encodeNaturals問題**: デフォルトキーCに戻ると白鍵に全て♮がついてしまう
2. **異名同音問題**: F♯メジャーよりG♭メジャーを使用したい
3. **度数ベースの移調**: 正しい異名同音の移調を実現

## 現在の実装

### 1. 実行時パッチ (`src/utils/osmdPatches.ts`)

現在は実行時にOSMDインスタンスにパッチを適用する方法を採用しています：

```typescript
// OSMDの初期化後に適用
applyOSMDPatches(osmd);

// 移調後に適用
updateOSMDAfterTranspose(osmd, newTranspose);
```

この方法の利点：
- npmパッケージを直接変更しない
- 即座に適用可能
- デバッグが容易

欠点：
- OSMDの内部実装に依存
- バージョンアップで動作しない可能性

### 2. 実装内容

#### encodeNaturals問題の修正
```javascript
// KeyInstructionのencodeNaturalsプロパティを強制的にfalseに設定
Object.defineProperty(ki, 'encodeNaturals', {
  value: false,
  writable: true,
  configurable: true
});
```

#### 異名同音優先設定
```javascript
// フラット系のキーでは♭を優先
const flatEnharmonicPref = ["flat", "flat", "flat", ...];

// F#メジャー（6シャープ）はGbメジャーとして扱う
if (fifths >= 6) {
  return flatEnharmonicPref;
}
```

## より確実な修正方法

### 方法1: patch-package を使用

1. patch-packageをインストール：
```bash
npm install --save-dev patch-package
```

2. package.jsonにpostinstallスクリプトを追加：
```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

3. OSMDのソースを直接編集：
```bash
# node_modules内のOSMDファイルを編集
vim node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.js
```

4. パッチファイルを生成：
```bash
npx patch-package opensheetmusicdisplay
```

### 方法2: カスタムビルド

1. OSMDをフォーク
2. 以下の変更を適用：

**src/MusicalScore/Graphical/GraphicalMusicSheet.ts**
```typescript
// KeyInstructionのencodeNaturalsデフォルト値を変更
constructor(...) {
  this.encodeNaturals = false; // true → false
}
```

**src/MusicalScore/Graphical/GraphicalKeyInstruction.ts**
```typescript
// 異名同音マップを追加
private getEnharmonicPreference(pitchClass: number): "sharp" | "flat" {
  const pref = this.rules.enharmonicPref[pitchClass];
  return pref || "sharp";
}
```

3. カスタムビルドを公開：
```bash
npm run build
npm publish --tag custom
```

### 方法3: Webpack エイリアス

webpack.config.jsで特定のファイルを置き換え：

```javascript
module.exports = {
  resolve: {
    alias: {
      'opensheetmusicdisplay/build/opensheetmusicdisplay':
        path.resolve(__dirname, 'src/patches/osmd-patched.js')
    }
  }
};
```

## テスト方法

### 1. encodeNaturals問題のテスト
```typescript
// 1. 楽譜をロード（例：Gメジャー）
await osmd.load(gMajorXml);

// 2. トランスポーズ
osmd.Sheet.Transpose = -7; // Cメジャーに

// 3. 再レンダリング
osmd.updateGraphic();
osmd.render();

// 4. 白鍵に♮が付いていないことを確認
```

### 2. 異名同音問題のテスト
```typescript
// F#メジャーの楽譜をロード
await osmd.load(fSharpMajorXml);

// キー記号がGbメジャーとして表示されることを確認
const keySignature = osmd.Sheet.SourceMeasures[0].Rules[0].Key;
console.log(keySignature); // Gb major (6 flats)
```

## トラブルシューティング

### 問題: パッチが適用されない
- OSMDのバージョンを確認（v1.9.0対応）
- ビルドプロセスでパッチが上書きされていないか確認
- ブラウザキャッシュをクリア

### 問題: 移調後に音名が正しくない
- `getPreferredKey`関数が正しく動作しているか確認
- `updateOSMDAfterTranspose`が呼ばれているか確認

## 今後の展望

1. **OSMD本体へのPR送信**
   - encodeNaturalsのデフォルト値変更
   - 異名同音優先設定APIの追加

2. **より柔軟な設定API**
   ```typescript
   osmd.setEnharmonicPreference("prefer-flats");
   osmd.setEncodeNaturals(false);
   ```

3. **移調計算の改善**
   - 度数ベースの正確な移調
   - コンテキストを考慮した異名同音選択