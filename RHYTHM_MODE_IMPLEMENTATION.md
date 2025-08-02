# Rhythm Mode Implementation Summary

## Overview
リズムモードがファンタジーモードに追加されました。このモードでは、BGMのリズムに合わせて正確なタイミングでコードを入力する必要があります。

## Database Changes

### Migration File
`supabase/migrations/20250801000000_add_rhythm_mode_to_fantasy_stages.sql`

新しいカラムが追加されました：
- `mode`: 'quiz' (クイズモード) | 'rhythm' (リズムモード)
- `bpm`: テンポ (Beats Per Minute)
- `measure_count`: 小節数
- `time_signature`: 拍子 (4=4/4拍子, 3=3/4拍子)
- `count_in_measures`: カウントイン小節数
- `mp3_url`: BGMファイルのURL
- `chord_progression_data`: コード進行データ (JSONフォーマット)

## Type Updates

### FantasyStage Interface
`src/types/index.ts`および`src/components/fantasy/FantasyGameEngine.tsx`

- `mode`フィールドを追加（'quiz' | 'rhythm'）
- `chord_progression_data`フィールドを追加（コード進行パターン用）

## Game Engine Updates

### FantasyGameEngine (`src/components/fantasy/FantasyGameEngine.tsx`)

1. **ステート管理の追加**
   - `isRhythmMode`: リズムモードかどうか
   - `currentRhythmChord`: 現在のリズムモードのコード
   - `rhythmChordQueue`: コード進行キュー
   - `lastProcessedMeasure/Beat`: 最後に処理した小節/拍

2. **タイミング判定の実装**
   - 判定ウィンドウ：前後200ms
   - タイミングが外れた場合は敵の攻撃として処理
   - 自動的に次のコードへ進む

3. **リズムモード特有の処理**
   - 通常の敵ゲージ更新を無効化
   - 小節ごとにコードを自動更新（ランダムパターン）
   - JSONデータに基づくコード進行（プログレッションパターン）
   - 同時出現モンスター数を1に固定

## UI Updates

### FantasyGameScreen (`src/components/fantasy/FantasyGameScreen.tsx`)
- BGM再生で`mp3_url`フィールドを優先的に使用
- リズムモードインジケーターを追加（紫色のバッジ）

### FantasyStageSelect (`src/components/fantasy/FantasyStageSelect.tsx`)
- ステージカードにリズムモード表示を追加
- ランダムパターン/コード進行パターンの区別表示

## BGM Manager
`src/utils/BGMManager.ts`
- 既存の実装で対応（ループ機能が実装済み）
- カウントイン後の位置からループ

## Game Flow

### ランダムパターン
1. 各小節の1拍目で新しいコードを出題
2. 判定ウィンドウ内でコードを完成させる必要がある
3. タイミングを逃すと敵の攻撃となる

### コード進行パターン
1. JSONデータに基づいて特定の拍でコードを出題
2. 楽曲の終わりに達したら最初に戻って継続（無限リピート）
3. 全ての敵を倒すまでゲームは終わらない

## Sample Data
マイグレーションファイルに2つのサンプルステージが含まれています：
- Stage 4-1: リズムの洞窟（ランダムパターン）
- Stage 4-2: コード進行の森（プログレッションパターン）