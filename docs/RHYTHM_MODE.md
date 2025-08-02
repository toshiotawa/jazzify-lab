# リズムモード実装ドキュメント

## 概要

リズムモードは、既存のクイズモードに加えて実装された新しいゲームモードです。太鼓の達人風のノーツUIを採用し、タイミングベースの判定システムを実装しています。

## 機能仕様

### ゲームモード
- **mode="rhythm"** : リズムモード本体
- **rhythmMode** : サブモード
  - `"random"` : ランダム出題（各小節に1つのノーツ、allowed_chords からランダム選択）
  - `"progression"` : コード進行出題（chord_progression_data の順序通りに出題）

### 判定システム
- **判定ウィンドウ**: ±200ms
- **成功判定**: タイミングとコードが両方合致した場合
- **失敗判定**: 判定時刻を200ms以上過ぎた場合、自動的に失敗

### UI仕様
- **ノーツレーン**: 右から左へスクロール（3秒間）
- **判定ライン**: 画面左から20%の位置
- **ノーツ表示**: 円形でコード名を表示、色分け
- **既存UIとの統合**: 
  - リズムモードではモンスターのコード表示を非表示
  - NEXT コード表示も非表示

## 技術実装

### 主要コンポーネント

#### 1. 状態管理 (Zustand)
- `rhythmStore.ts`: リズムモード専用の状態管理
- `timeStore.ts`: 既存の時間管理にisCountInを追加

#### 2. ロジック
- `noteScheduler.ts`: ノーツの生成タイミング管理
- `rhythmJudge.ts`: 判定ロジック（タイミング＋コード）

#### 3. UI コンポーネント
- `RhythmLane.tsx`: ノーツレーンの描画（Canvas使用）

#### 4. 統合
- `FantasyGameScreen.tsx`: リズムモード判定とバトルシステムの接続

### データベーススキーマ

```sql
-- fantasy_stages テーブルに追加されたカラム
rhythm_mode TEXT CHECK (rhythm_mode IN ('random', 'progression'))
bpm INTEGER DEFAULT 120
measure_count INTEGER DEFAULT 8
time_signature INTEGER DEFAULT 4
count_in_measures INTEGER DEFAULT 0
chord_progression_data JSONB
```

### コード進行データフォーマット

```json
[
  {"measure": 1, "beat": 1, "chord": "C"},
  {"measure": 2, "beat": 1, "chord": "F"},
  {"measure": 3, "beat": 1, "chord": "G"},
  {"measure": 4, "beat": 1, "chord": "C"}
]
```

## テスト

### ユニットテスト
- `src/logic/__tests__/rhythmJudge.test.ts`: 判定ロジックのテスト
  - タイミング判定
  - 最近接ノーツ検索
  - 自動失敗判定

### 動作確認手順
1. ファンタジーモードでステージ選択画面を開く
2. "R-1" または "R-2" のステージを選択
3. ノーツが右から左へ流れてくることを確認
4. 判定ラインでタイミング良くコードを演奏
5. 成功時はプレイヤーが攻撃、失敗時は敵が攻撃することを確認

## 今後の拡張案
- ノーツの速度調整オプション
- 判定精度の段階評価（Perfect/Good/Miss）
- コンボシステム
- スコアリング
- エフェクトの追加（判定時のビジュアルフィードバック）