# ファンタジーモード プログレッションパターン拡張 実装完了

## 実装内容

### 1. 新規作成ファイル
- `/src/utils/progression-timing.ts` - プログレッションタイミング管理ユーティリティ
- `/tests/progression-timing.test.ts` - ユニットテスト
- `/docs/progression-pattern-extension.md` - 詳細ドキュメント

### 2. 更新したファイル

#### `/src/types/index.ts`
- `FantasyStage` インターフェースに `chord_progression_data?: any` を追加

#### `/src/components/fantasy/FantasyGameEngine.tsx`
- `FantasyStage` インターフェースに `chordProgressionData?: any` を追加
- `FantasyGameState` に以下のフィールドを追加:
  - `progressionStartTime?: number`
  - `lastProgressionIndex?: number`
  - `isInNullPeriod?: boolean`
- 新しい関数を追加:
  - `checkProgressionTiming()` - タイミングチェック処理
  - `handleProgressionAutoAdvance()` - 自動進行処理
- プログレッションタイマー管理を追加（50ms間隔）
- `handleNoteInput` にNULL期間チェックを追加

#### `/src/components/fantasy/FantasyGameScreen.tsx`
- `ProgressionTimingIndicator` コンポーネントを追加
- タイミング可視化UI（ビート位置、判定期間、状態表示）

#### `/src/components/fantasy/FantasyMain.tsx`
- ステージデータ変換時に `chordProgressionData` を含めるよう更新

#### `/src/components/fantasy/FantasyStageSelect.tsx`
- ステージデータ変換時に `chordProgressionData` を含めるよう更新

## 主要機能

### 1. 出題タイミング制御
- 4拍子の場合: 4.5拍目から問題が出現
- `chord_progression_data` で細かいタイミング指定可能

### 2. 判定受付終了タイミング
- 4拍子の場合: 4.49拍目まで判定受付
- 次のコードの0.5拍前で判定終了

### 3. NULL期間
- 正解後、次の出題タイミングまでNULL状態
- NULL期間中は入力を受け付けない

### 4. 自動進行
- 判定受付終了時に未完成の問題は自動的に次へ進む
- ゲージリセット付き

### 5. 高度なタイミング制御（chord_progression_data）
```json
[
  {"bar": 1, "beats": 3, "chord": "C"},
  {"bar": 2, "beats": 1, "chord": "F"},
  {"bar": 2, "beats": 3, "chord": null}
]
```

## 重要な設計判断

1. **シングルモードへの影響なし**: `mode === 'progression'` の場合のみ動作
2. **後方互換性維持**: 既存のプログレッションパターンは従来通り動作
3. **パフォーマンス考慮**: タイミングチェックは50ms間隔（十分な精度）
4. **視覚的フィードバック**: ProgressionTimingIndicatorで状態を可視化

## テスト方法

1. プログレッションモードのステージでゲーム開始
2. タイミングインジケーターで以下を確認:
   - 黄色のライン（現在のビート位置）が正しく移動
   - 赤いライン（判定終了）の位置
   - 状態表示（INPUT OK/WAIT/NULL PERIOD）
3. 判定終了タイミングで自動進行することを確認
4. NULL期間中に入力が無視されることを確認

## データベース設定例

```sql
-- chord_progression_dataを使用した高度な設定
UPDATE fantasy_stages 
SET chord_progression_data = '[
  {"bar": 1, "beats": 2.5, "chord": null},
  {"bar": 1, "beats": 3, "chord": "C"},
  {"bar": 2, "beats": 1, "chord": "F"}
]'
WHERE mode = 'progression';
```