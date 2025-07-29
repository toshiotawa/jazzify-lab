# ファンタジーモード - リズムモード実装

## 概要

ファンタジーモードに「リズムモード」を追加しました。これは、BGMのリズムに合わせてコードを入力するモードです。

## 実装内容

### 1. データベース拡張

`fantasy_stages`テーブルに以下のカラムを追加：

- `game_mode`: 'quiz' | 'rhythm' - ゲームモード
- `pattern_type`: 'random' | 'progression' - リズムモードのパターン
- `music_meta`: JSONB - BGM情報 `{ bpm, timeSig, bars }`
- `audio_url`: TEXT - BGMファイルのURL

### 2. コア機能

#### LoopingBgmPlayer (`src/utils/LoopingBgmPlayer.ts`)
- 指定された小節数でループ再生
- 100msのクロスフェードでシームレスな再生
- AudioContextベースの正確なタイミング制御

#### Timeline (`src/lib/rhythm/Timeline.ts`)
- 拍の検出とコールバック管理
- 判定タイミング（80%位置±200ms）の検出
- 小節・拍・ループ回数の管理

#### RandomProblemGenerator (`src/lib/rhythm/RandomProblemGenerator.ts`)
- 1小節に1回ランダムにコードを出題
- 直前のコードとの重複を回避

#### ProgressionProblemGenerator (`src/lib/rhythm/ProgressionProblemGenerator.ts`)
- コード進行を順番に出題
- 列数（拍子）に応じた自動オフセット機能
- 無限ループ対応

### 3. UI コンポーネント

#### RhythmGauge (`src/components/fantasy/RhythmGauge.tsx`)
- 小節内の進行を表示するゲージ
- 80%位置に判定マーカー（常時表示）
- 判定タイミングでパルスエフェクト

#### RhythmReady (`src/components/fantasy/RhythmReady.tsx`)
- ゲーム開始前の3秒カウントダウン
- 背景アニメーション付き

### 4. カスタムフック

#### useRhythmMode (`src/hooks/useRhythmMode.ts`)
- リズムモードの統合管理
- BGM、Timeline、問題生成器の初期化と制御
- 状態管理とコールバック処理

### 5. テスト

#### 実装したテストケース
- Timeline: 拍検出、進行率計算、判定タイミング
- RandomProblemGenerator: ランダム出題、重複回避
- ProgressionProblemGenerator: 列オフセット、無限ループ

#### テスト用ステージデータ (`src/data/rhythmTestStages.ts`)
- T-01〜T-07の7つのテストケース
- demo-1.mp3を使用

## 使用方法

### 1. ステージ設定

```typescript
const stage: FantasyStage = {
  // 基本設定
  id: 'rhythm-stage-1',
  stage_number: 'R-01',
  name: 'リズムステージ1',
  
  // リズムモード設定
  game_mode: 'rhythm',
  pattern_type: 'random', // または 'progression'
  music_meta: {
    bpm: 120,
    timeSig: 4,
    bars: 32
  },
  audio_url: '/path/to/bgm.mp3',
  
  // ランダムパターンの場合
  allowed_chords: ['C', 'F', 'G', 'Am'],
  
  // プログレッションパターンの場合
  chord_progression: ['C', 'G', 'Am', 'F']
};
```

### 2. コンポーネントでの使用

```typescript
import { useRhythmMode } from '@/hooks/useRhythmMode';

function RhythmGame({ stage }) {
  const {
    state,
    initialize,
    startReady,
    checkJudgment
  } = useRhythmMode({
    stage,
    onJudgmentWindow: (isInWindow) => {
      if (isInWindow && checkChordComplete()) {
        // 攻撃成功処理
      }
    }
  });
  
  // 初期化
  useEffect(() => {
    initialize();
  }, [stage]);
  
  return (
    <>
      <RhythmReady
        isReady={state.isReady}
        countdown={state.readyCountdown}
      />
      <RhythmGauge
        progress={state.barProgress}
        isJudgmentTiming={state.isJudgmentTiming}
      />
    </>
  );
}
```

## 仕様詳細

### 判定タイミング
- 各小節の80%位置が判定タイミング
- ±200msの判定窓
- 判定窓内でコードが完成すれば攻撃成功

### 列オフセット（プログレッションパターン）
- 列数 = 拍子（3/4→3列、4/4→4列）
- プログレッション長が列数の倍数でない場合、2周目以降は自動でオフセット
- 例：4列6コードの場合
  - 1周目: A=1, B=2, C=3, D=4
  - 2周目: A=5, B=6, C=1, D=2（2列ずれる）

### BGMループ
- 指定小節数でループ
- クロスフェード100msでシームレス再生
- AudioContextで正確なタイミング制御

## テスト実行

```bash
# 全テスト実行
npm test

# UIでテスト確認
npm run test:ui

# カバレッジ確認
npm run test:coverage
```

## 今後の拡張案

1. **拍子の拡張**: 現在は3/4と4/4のみ対応。6/8などへの対応
2. **判定精度の段階化**: Perfect/Good/Missなどの判定
3. **コンボシステム**: 連続成功でボーナス
4. **視覚的フィードバック**: ノーツの落下表示
5. **カスタムBPM変化**: 曲中でのBPM変化対応