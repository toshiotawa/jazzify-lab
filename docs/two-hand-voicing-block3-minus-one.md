# 両手ヴォイシング中級 Block3 マイナスワン MP3 生成

引き継ぎ用メモ（2026-06 時点）。  
Block3 `chord_voicing` 進行タイプ向けのオフライン backing MP3 を CLI で生成する。

---

## 目的

- 両手ヴォイシング中級コースの **コードヴォイシング課題（progression タイプ）** 用マイナスワン
- 試作完了: **Block3 M7 / p1**（`CM7-FM7-BbM7-EbM7`）
- 未着手: 全 Block3 進行の一括生成、Supabase `audio_url` 更新

---

## 試聴ファイル（最新）

| ファイル | 内容 |
|---------|------|
| `public/sozai/thvi-b3-m7-p1-minus-one.mp3` | ヴォイシング = 帯域制限三角波 |
| `public/sozai/thvi-b3-m7-p1-minus-one-sine.mp3` | ヴォイシング = 正弦波 |

---

## 音源構成（確定）

| レイヤー | 音源 | 備考 |
|---------|------|------|
| ドラム | `public/sozai/Cblues_24bars_100BPM_Drum.mp3` | 57.6s（100BPM・4小節×6ループ）そのまま |
| ヴォイシング参考 | 薄い合成音（`triangle` / `sine`） | voicingA / voicingB。コードガイド（シェル）は **なし** |
| ベース | `public/FingerBassYR 20190930.sf2` | サバイバル正解ルート音（`FantasySoundManager.codeRunRootPlayer` と同じ SF2） |

### ベース

- **ルートのみ**（5th なし）
- **全音符**（1コード = 1小節 = 4拍）
- 音程: **`root2`**（例: CM7→C2=36, FM7→F2=41, BbM7→Bb2=46, EbM7→Eb2=39）
- SF2 ゾーン読込: サバイバルと同じ **C2〜B2 の12音**（`survivalCodeRunRootMidiNotes()`）
- SF2 が弱い/無い場合: 正弦波フォールバック + SF2 成功時も薄い正弦波を重ねる

### ヴォイシング（シンセ）

- Block3 テーブルの `voicingA` / `voicingB` をそのまま使用
- **2拍目のスウィング表裏**で演奏（後述）
- `triangle`: フーリエ級数の帯域制限三角波（エイリアシング抑制）
- `sine`: 純正弦波

---

## タイミング（BPM 100）

```
1拍 = 0.6s
1小節 = 2.4s
1ループ = 4小節 = 9.6s
全体 = 6ループ = 57.6s
```

### ヴォイシング（各コード・各小節）

スウィング8分: **表 = 2/3拍、裏 = 1/3拍**

| イベント | 開始 | 音価 | アーティキュレーション |
|---------|------|------|------------------------|
| voicingA（表） | 2拍目頭（小節開始 + 0.6s） | 0.4s（= 2/3拍） | `sustain`（やや伸ばす） |
| voicingB（裏） | 2拍目スウィング裏（小節開始 + 1.0s） | 0.18s（= 1/3拍 × 0.9） | `staccato` |

定数:

- `MINUS_ONE_SWING_LONG_RATIO = 2/3`
- `MINUS_ONE_VOICING_SWING_ONBEAT_SEC = BEAT * 2/3`
- `MINUS_ONE_VOICING_SWING_OFFBEAT_SEC = BEAT * 1/3 * 0.9`

### ベース

- 小節頭から **全音符**（2.4s）

### ゲーム本編との差

- **ゲーム入力タイミング**: `beatOffset` 1拍目 / 3拍目（`twoHandVoicingBlock3Course.ts`）
- **マイナスワン**: 意図的に **2拍目スウィング表裏**（グルーヴ用）
- プレイヤー向け課題タイミングとマイナスワンの聴感は一致しない点に注意

---

## 音量・ミックス（現行値）

調整は主に `twoHandVoicingMinusOneSchedule.ts` の定数 + `twoHandVoicingMinusOneCliEntry.ts` のミックス。

| 定数 / 処理 | 値 | ファイル |
|------------|-----|---------|
| `MINUS_ONE_VOICING_GAIN` | **0.32** | schedule |
| ヴォイシング正規化 | **0.94** | cli |
| `MINUS_ONE_BASS_GAIN` | **0.5**（= サバイバル `bassVolume` デフォルト） | schedule |
| SF2 再生ブースト | **×1.35**（`Sf2RootNotePlayer` 同等） | offlineSf2Mix |
| SF2 ピーク上限 | **1.8** | offlineSf2Mix |
| `MINUS_ONE_BASS_LAYER_SCALE` | **0.95** | schedule → cli |
| ミックス上限 `limitFloat32Peak` | **0.95** | cli |
| ffmpeg | `[0:a][1:a]amix=inputs=2`（ドラム + シンセ/ベース WAV） | cli |

**ミックス方針**

1. ヴォイシングレイヤーだけ `normalizeFloat32Peak(0.94)`
2. ベースレイヤーを `scaleFloat32Buffer(MINUS_ONE_BASS_LAYER_SCALE)`
3. 合成後 `limitFloat32Peak(0.95)`（持ち上げない・クリップのみ防止）

---

## 生成コマンド

```bash
# デフォルト: b3-m7 / p1 → thvi-b3-m7-p1-minus-one.mp3
node scripts/build-two-hand-voicing-minus-one-mp3.mjs

# 進行指定
node scripts/build-two-hand-voicing-minus-one-mp3.mjs --lesson b3-m7 --progression p1

# triangle + sine 両方
node scripts/build-two-hand-voicing-minus-one-mp3.mjs --lesson b3-m7 --progression p1 --also-sine

# ヴォイシング音色のみ sine
node scripts/build-two-hand-voicing-minus-one-mp3.mjs --synth-variant sine

# 出力先 / ベース SF2 / ドラム
node scripts/build-two-hand-voicing-minus-one-mp3.mjs \
  --out-dir ./public/sozai \
  --bass-sf2 ./public/FingerBassYR\ 20190930.sf2 \
  --drum ./public/sozai/Cblues_24bars_100BPM_Drum.mp3
```

**前提**: `ffmpeg` が PATH にあること。

**出力名規則**: `thvi-{lessonKey}-{progressionKey}-minus-one.mp3`  
sine 版は `-sine` サフィックス。

---

## ソースファイル

| ファイル | 役割 |
|---------|------|
| `scripts/build-two-hand-voicing-minus-one-mp3.mjs` | esbuild bundle → CLI 実行 |
| `src/utils/twoHandVoicingMinusOneCliEntry.ts` | MP3 生成エントリ（ffmpeg） |
| `src/utils/twoHandVoicingMinusOneSchedule.ts` | Block3 進行 → ノートスケジュール |
| `src/utils/offlineSf2Mix.ts` | オフライン合成（SF2 / シンセ / WAV / ミックス） |
| `src/utils/sf2RootNotePlayer.ts` | SF2 パース・ゾーン選択・`loadOfflineSf2ZonesForSurvivalCodeRunRoots` |
| `src/utils/twoHandVoicingBlock3Course.ts` | Block3 ヴォイシングテーブル・進行定義 |

### テスト

```bash
npm test -- src/utils/__tests__/twoHandVoicingMinusOneSchedule.test.ts
npm test -- src/utils/__tests__/offlineSf2Mix.test.ts
```

---

## 処理フロー

```
buildBlock3MinusOneEvents(lesson, progression)
  → voicingGuide / bass イベント（6ループ分）

renderOfflineSimpleSynthEvents(voicing, variant)
  → normalizeFloat32Peak(0.94)

loadOfflineSurvivalBassSf2FromFile(FingerBass.sf2)
renderOfflineSf2BassEvents(zones, bass)
  → scaleFloat32Buffer(0.95)

mixFloat32Buffers → limitFloat32Peak(0.95) → WAV
ffmpeg: drum.mp3 + WAV → MP3
```

---

## 経緯メモ（音量・音色）

試行錯誤の要点:

1. 初版: UprightPiano SF2 + FingerBass + コードガイド → コードガイド削除、ヴォイシングは合成音へ
2. FingerBass 単体はオフラインだと無音/弱音 → UprightPiano ベースへ → 倍音問題 → 合成音ベース
3. Salamander（UprightPiano）ベース → ユーザー要望で FingerBass（サバイバル正解音）に戻す
4. サバイバル同等ゲイン（0.5 × 1.35）+ C2〜B2 ゾーン読込 + 正弦波補強で聴こえるように調整
5. ベース: 2分音符 R/5th → **ルート全音符**
6. ヴォイシング: beat3 2分音符 → **2拍目スウィング表裏**（表=スウィング8分長、裏=スタッカート）
7. 音量: ベース・コードとも「もう少し大きく」→ 現行ゲイン（上表）

---

## 未完了タスク

- [ ] Block3 全レッスン × 全 progression の MP3 一括生成
- [ ] Supabase 側 `audio_url`（または相当カラム）への反映
- [ ] ゲームタイミング（1拍/3拍）とマイナスワン（2拍目表裏）の整合を取るかどうかの product 判断
- [ ] `ts-prune` で未使用 export の整理（`bassMidiForRootAndFifth` 等は 5th 用に残存）

---

## 音量を変えたいとき

| 目的 | 触る場所 |
|------|---------|
| コード全体 | `MINUS_ONE_VOICING_GAIN`、cli の `normalizeFloat32Peak(voicing, …)` |
| ベース全体 | `MINUS_ONE_BASS_LAYER_SCALE`、`MINUS_ONE_BASS_GAIN` |
| ベース SF2 単体 | `offlineSf2Mix` の `SURVIVAL_BASS_PLAYBACK_BOOST` / 正弦波補強比率（0.5） |
| 最終クリップ | cli の `limitFloat32Peak(mixed, …)` |

変更後:

```bash
node scripts/build-two-hand-voicing-minus-one-mp3.mjs --lesson b3-m7 --progression p1 --also-sine
npm test -- src/utils/__tests__/twoHandVoicingMinusOneSchedule.test.ts src/utils/__tests__/offlineSf2Mix.test.ts
```

---

## パフォーマンス

- **ゲームランタイムへの変更なし**（ビルド時オフライン生成のみ）
- 新規 per-frame / timer / React state なし
