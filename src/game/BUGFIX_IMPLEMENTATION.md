# バグ修正実装まとめ

## 実装された修正内容

### 1. BGMManager の改善
**ファイル**: `src/utils/BGMManager.ts`

- ✅ `countInBars` を定数として追加（値: 1）
- ✅ `TimePos` インターフェースを追加（bar, beat, tick）
- ✅ `getTimePos()` メソッドで譜面座標を正確に計算
- ✅ `bar` ゲッターでカウントインを除外した小節番号を返す
- ✅ `update()` メソッドでループチェックとイベント発行
- ✅ `emit('loop')` でループイベントを通知
- ✅ EventEmitter機能を自前実装（外部依存なし）

### 2. NoteStore クラス
**ファイル**: `src/stores/NoteStore.ts`

- ✅ ノーツデータの管理
- ✅ `dispose()` メソッドでメモリクリーンアップ
- ✅ `init()` で譜面データから再初期化

### 3. Judge クラス
**ファイル**: `src/judge/Judge.ts`

- ✅ 判定ウィンドウ管理（最大300ms）
- ✅ `reset()` でループ時の状態リセット
- ✅ `hitWindowActive` / `inputAccepted` の管理
- ✅ ウィンドウ外の入力を早期リターン（バッファを貯めない）

### 4. EnemyView クラス
**ファイル**: `src/view/EnemyView.ts`

- ✅ 怒りアイコン表示の責務分離
- ✅ `showDamage()` で常に `showRageIcon()` を呼ぶ（条件分岐削除）
- ✅ `resetLoopState()` でループ時のリセット
- ✅ PIXI.Container の適切な破棄

### 5. NoteLayer クラス
**ファイル**: `src/view/NoteLayer.ts`

- ✅ PIXI.Container を継承
- ✅ `dispose()` で `removeChildren().forEach(c => c.destroy())`
- ✅ メモリリーク対策の徹底

### 6. GameScene クラス
**ファイル**: `src/game/GameScene.ts`

- ✅ BGM `loop` イベントのリスナー設定
- ✅ ループ時の全サブシステムリセット
- ✅ `carryOverSp` 設定によるSPゲージ管理
- ✅ `retry()` でFactory パターンによる再生成
- ✅ `app.ticker.update()` でフレーム欠け防止

### 7. NoteGenerator クラス
**ファイル**: `src/game/NoteGenerator.ts`

- ✅ 基本版（progression）のサポート
- ✅ 拡張版（progressionData）のサポート
- ✅ 2つのモードを自動判別して切り替え

### 8. GameCoordinator クラス
**ファイル**: `src/game/GameCoordinator.ts`

- ✅ Factory パターンで全Store/View管理
- ✅ `retry()` で完全な再生成
- ✅ `returnToStageSelect()` で適切なクリーンアップ

## 修正された問題

### a. カウントイン問題
- BGMManager が `countInBars` を内部で補正
- 譜面1小節目 = bar 1 として明確化

### b. ループ時のリセット不具合
- `hitWindowActive` / `inputAccepted` のリセット
- `currentBar` / `currentBeat` のリセット
- `enemy.attackCoolDown` のリセット

### c. Retry/StageSelectでのノーツ欠落
- Store/View を必ず `dispose()` → `new` で再生成
- Factory パターンによる確実な初期化

### d. 怒りアイコン表示問題
- EnemyView が責任を持って管理
- 条件分岐を削除し、常に `addChild` を実行

## 型安全性とビルド保証

- TypeScript strict モード対応
- ESLint ルール準拠
- PIXI.js のメモリリーク対策
- undefined アクセスの防止

## 使用例

```typescript
// アプリケーション初期化
const app = new PIXI.Application();
const coordinator = new GameCoordinator(app);

// ステージ開始
coordinator.startStage({
  id: 'stage1',
  name: 'Stage 1',
  bpm: 120,
  timeSignature: 4,
  measureCount: 8,
  countIn: 1,
  scoreData: {
    notes: [],
    progression: [['don', 'kat', '', 'don']]
  },
  bgmUrl: '/assets/bgm/stage1.mp3'
});

// ゲームループ
app.ticker.add((delta) => {
  coordinator.update(delta);
});
```