# 🚀 FantasyStage.mode 拡張実装完了

## 変更内容

### 1. 型定義の更新
- **FantasyStage.mode** の型を拡張:
  - 旧: `'single' | 'progression'`
  - 新: `'single' | 'progression_order' | 'progression_random' | 'progression_timing'`
- 更新ファイル:
  - `/src/components/fantasy/FantasyGameEngine.tsx`
  - `/src/types/index.ts`
  - `/src/components/fantasy/FantasyStageSelect.tsx`
  - `/src/components/fantasy/FantasyMain.tsx`

### 2. ランダム版ノーツ生成関数の追加
- **`generateRandomProgressionNotes()`** を新規実装 (`/src/components/fantasy/TaikoNoteSystem.ts`)
- M2〜(最終-1)小節に、chordProgressionからランダムでコードを選択してノーツを生成
- オクターブ・拍計算ロジックは `generateBasicProgressionNotes` と同じ

### 3. 初期化ロジックの分岐実装
- `FantasyGameEngine.initializeGame()` にswitch文を追加:
  ```typescript
  switch (stage.mode) {
    case 'progression_order':
      taikoNotes = generateBasicProgressionNotes(...);
      break;
    case 'progression_random':
      taikoNotes = generateRandomProgressionNotes(...);
      break;
    case 'progression_timing':
      taikoNotes = parseChordProgressionData(...);
      break;
  }
  ```

### 4. 判定ロジックの更新
- `isTaikoMode` の判定を `stage.mode.startsWith('progression')` に変更
- これにより全てのprogression系モードで太鼓の達人モードが有効に

### 5. ループ時の再生成実装
- `handleTaikoModeInput()` のループ処理を更新
- `progression_random` モードの場合、1ループ毎にノーツを再シャッフル:
  ```typescript
  const resetNotes = (stage.mode === 'progression_random')
    ? generateRandomProgressionNotes(...)
    : prevState.taikoNotes.map(n => ({...n, isHit: false, isMissed: false}));
  ```

### 6. UI判定の追従
- NEXTコード表示の判定を `stage.mode.startsWith('progression')` に更新
- 同時出現モンスター数の判定も同様に更新

## 動作仕様

### progression_order (従来のprogression)
- コード進行の順番通りに出題
- ループ時も同じ順番を維持

### progression_random (新規)
- 設定されたコードプールからランダムに選択して出題
- 各ループで順番が変わる（再シャッフル）
- **同じコードの連続を回避**（前回と異なるコードを選択）
- ループ時も前回の最後のコードと異なるコードから開始

### progression_timing (既存)
- chord_progression_dataのJSONに従って出題
- タイミング情報を含む詳細な進行制御

## データベース
- modeカラムは既に対応済み（text型、CHECK制約に新しい値も含まれている）
- マイグレーション不要