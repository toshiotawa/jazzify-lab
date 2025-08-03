# ファンタジーモード プログレッションパターン拡張

## 概要

ファンタジーモードのプログレッションパターンに以下の機能を拡張しました：

1. **出題タイミング制御**: 4拍子の場合、4.5拍目から問題が出現
2. **判定受付終了タイミング**: 4拍子の場合、4.49拍目まで判定を受付
3. **NULL期間**: 正解後、次の出題タイミングまでのNULL期間
4. **自動進行**: 判定受付終了時に未完成の場合、自動的に次の問題へ進行
5. **高度なタイミング制御**: `chord_progression_data` JSONによる細かいタイミング指定

## 実装詳細

### 1. タイミング管理ユーティリティ (`/src/utils/progression-timing.ts`)

#### 主要な関数

- `getCurrentBeatPosition()`: 現在のビート位置を計算（小数点含む）
- `getAbsoluteBeatPosition()`: 絶対ビート位置を計算
- `parseProgressionData()`: chord_progression_dataからタイミング情報を解析
- `parseProgressionText()`: テキスト形式のコード進行データをパース

### 2. ゲームエンジンの拡張 (`/src/components/fantasy/FantasyGameEngine.tsx`)

#### 新しいステート

```typescript
interface FantasyGameState {
  // ... 既存のフィールド
  progressionStartTime?: number; // プログレッション開始時刻
  lastProgressionIndex?: number; // 最後に処理したプログレッションインデックス
  isInNullPeriod?: boolean; // NULL期間中かどうか
}
```

#### タイミングチェック機能

- `checkProgressionTiming()`: 50ms間隔でタイミングをチェック
- `handleProgressionAutoAdvance()`: 自動進行処理

### 3. データベース構造

`fantasy_stages` テーブルに `chord_progression_data` カラムを使用：

```json
[
  { "bar": 1, "beats": 3, "chord": "C" },
  { "bar": 2, "beats": 1, "chord": "F" },
  { "bar": 2, "beats": 3, "chord": null }
]
```

### 4. UI表示 (`/src/components/fantasy/FantasyGameScreen.tsx`)

`ProgressionTimingIndicator` コンポーネントで以下を表示：
- 現在のビート位置（黄色のライン）
- 判定受付終了タイミング（赤色のライン）
- 出題タイミング（緑色のライン）
- 現在の状態（INPUT OK / WAIT / NULL PERIOD）

## 使用方法

### 1. デフォルトのタイミング（chord_progression_dataがnullの場合）

4拍子の場合：
- 4.5拍目: 問題出現
- 4.49拍目: 判定受付終了
- 4.5拍目〜次の4.49拍目: 次の問題の判定期間

### 2. カスタムタイミング（chord_progression_dataを使用）

```sql
UPDATE fantasy_stages 
SET chord_progression_data = '[
  {"bar": 1, "beats": 2.5, "chord": null},
  {"bar": 1, "beats": 3, "chord": "C"},
  {"bar": 2, "beats": 1, "chord": "F"},
  {"bar": 2, "beats": 3, "chord": "G"},
  {"bar": 3, "beats": 1, "chord": null}
]'
WHERE id = 'your-stage-id';
```

## 注意事項

1. **シングルモードへの影響なし**: プログレッションモード（`mode = 'progression'`）のみで動作
2. **後方互換性**: 既存のプログレッションパターンは従来通り動作
3. **パフォーマンス**: タイミングチェックは50ms間隔で実行されるため、精度は±50ms

## テスト

```typescript
// テストコード例
import { parseProgressionData } from '@/utils/progression-timing';

const progressionData = [
  { bar: 1, beats: 1, chord: 'C' },
  { bar: 2, beats: 1, chord: 'F' }
];

const result = parseProgressionData(progressionData, 1, 4.6, 4);
console.log(result.isAcceptingInput); // false (判定受付終了)
```