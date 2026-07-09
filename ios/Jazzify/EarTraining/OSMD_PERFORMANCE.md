# OSMD バトル パフォーマンス対策

Web(TS) と Swift で実施済みの最適化メモ。

## 実装済み（Swift）

### EarTrainingChordOSMDBattleController.swift

- 正解時 `triggerFeedback(.correct)` を削除（`.correct` は UI 背景変化なし）
- `updateTargetCounters(publish:)` — ホットパスは `publish: false`、フレーズ終了時のみ `@Published` 更新
- `runtimeCompletedTargetCount` / `runtimeFailedTargetCount` でフレーズ正解率を ref ベース集計
- `statusText` は 400ms スロットル
- エフェクトは `scene?.runEffect(command)` の imperative 配送（`lastEmittedEffectId` で dedup）
- ハンマー lead は `hammer_lead_measures × beats_per_measure`（Web 同等）
- OSU! アプローチ円は 1 拍前 spawn、正解 burst / ミス dismiss、timing adjustment 時 resync
- パリィ span（`resolveChordOsmdParrySpanState`）で finish / extendVisualSlow / sustain

### EarTrainingBattleScene.swift

- 背景は手続きジャズバー + スポットライト + 楽器プロップ（Web Canvas と同等）
- `osmdHammerReflect` は beat-sync visualSlow + 1000ms タイムライン（GuardD / finish、花火 spark pool、微カメラズーム、1ms ダメージ）
- **オレンジリング拡大は削除**（火花のみでパリィ演出）
- `osmdHammerReflect` 着弾の `showImpactBurst` を省略（slash + spark pool を維持）
- `osmdHammerFlightsByEffectId` でハンマー dismiss O(1)
- OSMD ハンマーは `getVisualNow` で毎フレーム位置更新（パリィ visualSlow 終了時に Web と同様キャッチアップ。着弾は実時間）
- OSU! アプローチ円プール（16 スロット）+ shatter（14 破片、420ms）。**visualSlow 非影響**（wall clock）
- `showImpactBurst` に `lightSparkCount` オプション（他エフェクト用）

### EarTrainingBattleParrySparkPool.swift

- 128 スロット `SKShapeNode` プールを事前生成（パリィ中のみ `update` で位置更新）
- 連続パリィ（1000ms 以内）は 40 粒子、通常 28 粒子（Web 逆移植後と同等）
- beat-sync タイムラインをスロットに凍結して半径拡大

### 新規 per-frame ロジック

- アクティブな OSU! 円（最大 16）と shatter の位置更新のみ
- 非アクティブ時はスキップ（`hasActiveCircles` / `hasActiveFragments` ガード）
- ハンマー投擲・円 spawn は audio time tick（イベント駆動）のまま

### 縁取り（rim）

- SpriteKit は `colorBlendFactor` + `.add` で GPU 側合成。毎フレーム CPU 合成は不要のため Web 版の rim キャッシュは未適用。

## 実装済み（Web Canvas — 火花 iOS 逆移植）

- 火花粒子数: 28 / 40（連鎖）
- 単層円描画（glow/core 3 層を廃止）
- `PARRY_MERGE_RADIUS_PX`: 34
- 半径タイムライン: slowPhase 内 merge → ringExpand 内 max → 維持

## 検証

- 9〜10 ハンマー同時表示 + 連続正解で 60fps 維持（実機 iPhone）
- Instruments: Time Profiler / Core Animation
