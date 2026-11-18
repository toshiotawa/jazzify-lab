---
name: lick-dna-video
description: >-
  Builds "Lick DNA" videos with the Jazz_Licks pipeline: searches the Weimar Jazz
  Database for a user-given lick (solfege / note names + chord), renders Jazzify
  staff slides with the real solo audio, and delivers mp4s to Google Drive. Use
  when the user asks for Jazz Licks / Lick DNA 動画, リック動画, パターン検索して動画,
  or edits to the lick score slides (異名同音, 幹音, 加線, オクターブ).
---

# Lick DNA video (Jazz_Licks)

シリーズ名: **Lick DNA**。コードは `Jazz_Licks/`（Python + `score-render/` の Puppeteer）。
1 リック = WJazzD 内の一致フレーズ全件を、実演奏音源 + 楽譜スライドで連結した動画。

生成物（動画・フレーム・音源・DB）は **gitignore のまま**。リポジトリに入れない。
`Jazz_Licks/.gitignore` が `data/cache/` `data/audio/` `data/wav/` `out/` `node_modules/` を除外している。

## Setup

- Python 3.10+（依存は標準ライブラリのみ）、`ffmpeg`、Node + `google-chrome`（Puppeteer は `channel: "chrome"`）。
- `cd Jazz_Licks/score-render && npm install`（初回のみ）。
- WJazzD は初回に自動 DL（`data/cache/wjazzd.db`）。Supabase や stg の鍵は不要。
- Dig That Lick（hfm-weimar.de）と MusicBrainz / Deezer / Wikipedia（ジャケット）にネット接続が必要。
  ジャケット取得は時々失敗するので、`render_lick_videos.py` が `CoverArtError` で落ちたらそのまま再実行。

## Workflow

### 1. ユーザーのリックを音名にする

- 固定ド: ド=C レ=D ミ=E ファ=F ソ=G ラ=A シ=B、`b/♭`=フラット、`♯`=シャープ。
- **ユーザーの綴りをそのまま使う**（ドb は Cb、B にしない）。これが後の幹音の基準になる。
- オクターブは指示された上下（↑↓, すべて上昇/下降, ジグザグ等）に従う。指示がない所は**最小音程**（近い方）。
- 例: `G7 ソ ファ シb ラb レb ドb ミ レ`（2 音ペアが短 3 度ずつ上昇、↓↑ジグザグ）
  → `G4 F4 Bb4 Ab4 Db5 Cb5 E5 D5`（音程 -2 +5 -2 +5 -2 +5 -2）。

### 2. 検索（音程列のみ。コード機能は無視がデフォルト）

```bash
cd Jazz_Licks
python3 scripts/lickdna_search.py --notes G4 F4 Bb4 Ab4 Db5 Cb5 E5 D5 --chord G7
```

- 一致は **移調不変の音程列（半音・オクターブ込み）** のみで判定。異名同音は同じ。
- `--chord` は「元曲のコードが指定コード機能と一致したか」の参考表示だけで、**絞り込まない**
  （ユーザー指示: コード機能での絞り込みはしない。全一致を収録）。
- 全長で 0 件なら、**一致する最長の連続部分**に自動フォールバックして表示する。
  動画はその部分範囲で作り、どの音からどの音までかを README とレポートに書く
  （例: 12 音の 3 音シークエンスが 0 件 → 先頭 6 音）。
- Dig That Lick は重なったヒット（2 音ずれの連続など）を 1 件にまとめるので、件数はローカル検索以下になる。

### 3. リック JSON を作る（transpose spelling モード）

```bash
python3 scripts/lickdna_make_lick.py --id user_p03 \
  --label "G7 ソ ファ シb ラb レb ドb ミ レ (短3度ジグザグ)" \
  --chord G7 --notes G4 F4 Bb4 Ab4 Db5 Cb5 E5 D5
```

`licks/<id>.json` の主なフィールド:

| key | 意味 |
|---|---|
| `base_note_names` | ユーザー綴りの基準音（部分一致の場合はその部分範囲） |
| `intervals` / `dig_that_lick_pattern` | 検索用の音程列 |
| `reference_pc` / `canonical_midi` | 先頭音の pc / 基準音高（移調 t はこの pc からの上行半音数 0–11） |
| `spelling: "transpose"` | コードからの綴り直しをせず、基準綴りを移調する |
| `transpose_spelling_candidates[t]` | 移調量 t ごとの「文字を保ったまま 1 つの音程で移した綴り」全候補。各 `{row, root, root_fifths}` |
| `reference_chord` | 基準コード（G7, Dm7, CM7, C …）。`root_fifths` の計算に使う |
| `combine_adjacent_motifs` | ユーザーリックは `false` |

### 4. 音源取得 → 動画レンダリング

```bash
python3 scripts/fetch_dig_that_lick.py --lick user_p03      # data/audio/dig_that_lick/<id>/
python3 scripts/render_lick_videos.py --lick user_p03       # out/videos/<id>_{horizontal,vertical,vertical_lower}.mp4
```

- 検索をやり直した場合は `data/audio/dig_that_lick/<id>/` を消してから fetch（`--force` でも可）。
- `out/videos/{horizontal,vertical,frames}/melid_*` は lick 間で共有・上書きされる。最終成果物は `<id>_*.mp4`。
- 確認: `out/videos/frames/melid_<melid>_<pos>_horizontal.png` を開いて楽譜を目視する。

### 5. Drive 納品

- 新規フォルダ（例 `Jazz Licks 動画 YYYY-MM-DD`）に
  `Pnn_<Chord>_{horizontal,vertical,vertical_lower}.mp4`（例 `P04_Dm7_vertical.mp4`）でアップロード。
- `00_一致リスト_README`（Google Doc, Markdown から変換）に各パターンの
  検索音列・音程・全一致/部分一致・収録件数・各ヒット（演奏者 – 曲 (年) melid pos 元コード、✓=コード機能一致の参考）を書く。
- 差し替え時は新ファイルを先に上げてから旧ファイルをゴミ箱へ（ユーザーの指示がある場合）。

## 楽譜の綴り（異名同音・幹音）

ルール（ユーザー確定）:

1. **幹音はユーザーの元の並びと一致させる。** 基準綴りを「文字距離 + 音程の質」で厳密に移調し、
   1 音ずつの綴り直しはしない。重変記号、Cb/Fb/E#/B# は OK。
   例: G F E D Db Cb Bb Ab を全音下（F7）→ F Eb D C Cb Bbb Ab Gb。
2. 移調先のキー（異名同音のどちら側か）は **元録音のキー** に最も近い候補（五度圏距離）を選ぶ。
   例: Donna Lee（Ab major, Db-7）→ Db-7 側 `Gb Fb Ab Cb Eb Db`（C#-7 側にしない）。
   Soultrane（Eb major）/ The Oracle（Bb minor）→ Cb 側 `Bb Ab Gb Eb Db Cb`。
3. 元録音のキーが不明（空, `*-chrom`）なら、そのフレーズのコード（`chord_scale_fifths`）に近い側。
4. コードも不明（NC 等）なら、調号の少ない側（Db7 > C#7）。

実装: `src/jazzlicks/notation.py` の `_pick_row_for_key()` と `written_note_name(..., key_known=...)`、
候補生成は `src/jazzlicks/spellings.py` の `transpose_spelling_candidates()`。
注意: 旧デフォルト（`spelling: "chord"`）はコードスケールで 1 音ずつ綴り直すため Cb→B などが起きる。ユーザーリックでは使わない。

## 楽譜のオクターブ（加線を減らす）

- **原因**: 表示音高は `canonical_midi + t`（t = 先頭音の pc からの 0–11 半音・上行のみ）。
  キーが変わるたびに上へ移るだけで下がらないため、t が大きいとスライドが五線の上に飛び出していた。
  計算済みの 8va/8vb（`octaveShift`）はレンダラーが描画しない。
- **対策**: `entry_to_score_payload()` でスライドごとに全体を **オクターブ単位** でずらし、
  ト音記号の五線 E4–F5 からはみ出す半音量の合計（加線コスト）が最小、同点なら中心が B4 に近い位置を選ぶ。
  音程・輪郭はそのまま。8va/ヘ音記号はレンダラー未対応なので使わない。
- 基準音のオクターブ選び（手順 1）が高すぎても、この補正で表示は五線内に収まる。

## Report

- Drive フォルダ URL、各パターンの一致件数（全一致/部分一致と範囲）、主なヒット（演奏者・曲）。
- 綴りが特殊になるクリップ（重変記号が多いもの、元録音キー優先で選ばれた側）を明記。
