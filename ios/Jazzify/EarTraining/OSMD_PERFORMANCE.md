# OSMD バトル パフォーマンス対策

Web(TS) と Swift で実施済みの最適化メモ。

## 実装済み（Swift）

### EarTrainingChordOSMDBattleController.swift

- 正解時 `triggerFeedback(.correct)` を削除（`.correct` は UI 背景変化なし）
- `updateTargetCounters(publish:)` — ホットパスは `publish: false`、フレーズ終了時のみ `@Published` 更新
- `runtimeCompletedTargetCount` / `runtimeFailedTargetCount` でフレーズ正解率を ref ベース集計
- `statusText` は 400ms スロットル
- エフェクトは `scene?.runEffect(command)` の imperative 配送（`lastEmittedEffectId` で dedup）
- 小節最終コードは `parryFinishOnly` で finish ポーズ（Web Canvas 同等）

### EarTrainingBattleScene.swift

- 背景は手続きジャズバー + スポットライト + 楽器プロップ（Web Canvas と同等）
- `osmdHammerReflect` は 1000ms タイムライン（GuardD / finish、花火 spark pool、描画のみ visualSlow、微カメラズーム、1ms ダメージ）
- `osmdHammerReflect` 着弾の `showImpactBurst` を省略（parry ring + slash + spark pool を維持）
- `osmdHammerNodesByEffectId` でハンマー dismiss O(1)
- `showImpactBurst` に `lightSparkCount` オプション（他エフェクト用）

### EarTrainingBattleParrySparkPool.swift

- 128 スロット `SKShapeNode` プールを事前生成（パリィ中のみ `update` で位置更新）
- 連続パリィ（1000ms 以内）は 40 粒子、通常 28 粒子

### 縁取り（rim）

- SpriteKit は `colorBlendFactor` + `.add` で GPU 側合成。毎フレーム CPU 合成は不要のため Web 版の rim キャッシュは未適用。

## 検証

- 9〜10 ハンマー同時表示 + 連続正解で 60fps 維持（実機 iPhone）
- Instruments: Time Profiler / Core Animation
