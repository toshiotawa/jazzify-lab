# OSMD バトル パフォーマンス対策

Web(TS) と Swift で実施済みの最適化メモ。

## 実装済み（Swift）

### EarTrainingChordOSMDBattleController.swift

- 正解時 `triggerFeedback(.correct)` を削除（`.correct` は UI 背景変化なし）
- `updateTargetCounters(publish:)` — ホットパスは `publish: false`、フレーズ終了時のみ `@Published` 更新
- `runtimeCompletedTargetCount` / `runtimeFailedTargetCount` でフレーズ正解率を ref ベース集計
- `statusText` は 400ms スロットル
- エフェクトは `scene?.runEffect(command)` の imperative 配送（`lastEmittedEffectId` で dedup）

### EarTrainingBattleScene.swift

- `osmdHammerReflect` 着弾の `showImpactBurst` を省略（parry ring + slash を維持）
- `showPreciseParryRing`: `activePreciseParryRingCount` + `thinRingStackMax = 3`
- `osmdHammerNodesByEffectId` でハンマー dismiss O(1)
- `showImpactBurst` に `lightSparkCount` オプション（他エフェクト用）

### 縁取り（rim）

- SpriteKit は `colorBlendFactor` + `.add` で GPU 側合成。毎フレーム CPU 合成は不要のため Web 版の rim キャッシュは未適用。

## 検証

- 9〜10 ハンマー同時表示 + 連続正解で 60fps 維持（実機 iPhone）
- Instruments: Time Profiler / Core Animation
