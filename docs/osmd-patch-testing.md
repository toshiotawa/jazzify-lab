# OSMD パッチ効果確認ガイド

## 変化が感じられない場合の確認方法

### 1. ブラウザキャッシュをクリア
- **Chrome**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- または開発者ツール → Network → Disable cache にチェック

### 2. デバッグ情報の確認

#### a) 楽譜表示エリアの右上
黄色い文字で以下のような情報が表示されます：
```
Original: 0 fifths (major), Transpose: 0
```

#### b) ブラウザコンソール
F12で開発者ツールを開き、以下のログを確認：
```
🔧 Applying OSMD patches...
✅ encodeNaturals patch applied: {instruments: 1, measures: 1}
🎵 Current key has 0 fifths
✅ Applied enharmonic preference for key with 0 fifths: ["sharp", "sharp", "sharp"] ...
✅ Rendering hooks patched
✅ All OSMD patches applied successfully
```

### 3. 具体的なテストケース

#### テスト1: encodeNaturals問題の確認
1. **デモ曲を読み込む**（現在のデモ曲のキーを確認）
2. **Transposeを変更**: 
   - 例：Gメジャー（1 fifth）の曲なら Transpose を -7 に
   - 例：Dメジャー（2 fifths）の曲なら Transpose を -2 に
3. **確認ポイント**: 
   - Cメジャーに戻った時、白鍵（C,D,E,F,G,A,B）に♮記号が付いていないこと
   - パッチ適用前は全ての白鍵に♮が付いていたはず

#### テスト2: 異名同音の確認
1. **フラット系のキーで確認**:
   - Transpose を -6 に設定（6フラット相当）
   - 黒鍵が♭で表記されることを確認（#ではなく）
2. **シャープ系のキーで確認**:
   - Transpose を +6 に設定（6シャープ相当）
   - F#メジャーではなくGbメジャーとして表記されることを確認

#### テスト3: キー情報の確認
右上のデバッグ表示で：
- Transpose 0: `Original: X fifths (major), Transpose: 0`
- Transpose +1: `Original: X fifths (major), Transpose: 1`
のように変化することを確認

### 4. 効果的なテスト用楽曲

理想的なテスト楽曲の条件：
- **Gメジャー、Dメジャー、Aメジャー**など、シャープ系の調
- 多くの臨時記号を含む
- 移調後にCメジャーに戻せる調

### 5. もし変化が見られない場合

1. **別の楽曲XMLで試す**
   - public/demo-1.xml 以外の楽曲を用意
   - できればGメジャーやDメジャーの楽曲

2. **コンソールエラーを確認**
   ```javascript
   // コンソールで直接確認
   const osmd = document.querySelector('.osmd-canvas').__osmd;
   console.log(osmd.Sheet.Instruments[0].Staves[0].KeyInstructions);
   ```

3. **強制リロード**
   - URLの最後に `?v=2` などを追加してアクセス
   - Service Workerをクリア: Application → Storage → Clear site data

### 6. 視覚的な変化の例

#### Before (パッチなし):
- Gメジャー → Cメジャーに移調: C,D,E,F,G,A,B全てに♮が付く
- F#メジャーの楽譜: F#メジャーとして表示

#### After (パッチあり):
- Gメジャー → Cメジャーに移調: ♮が付かない（Fのみ♮が必要な場合あり）
- F#メジャーの楽譜: Gbメジャーとして表示（6フラット）

## デモ用テストシナリオ

```javascript
// 1. まず現在のキーを確認
// 右上: "Original: 1 fifths (major), Transpose: 0" (Gメジャーの例)

// 2. Transpose を -7 に設定
// 右上: "Original: 1 fifths (major), Transpose: -7"

// 3. 楽譜を確認
// - 白鍵に♮が付いていないこと
// - Fのみ♮が付いている（Gメジャー→Cメジャーの場合）

// 4. Transpose を +6 に設定
// 右上: "Original: 1 fifths (major), Transpose: 6"

// 5. 楽譜を確認
// - フラット記号が使われていること（Gb, Db, Ab など）
```