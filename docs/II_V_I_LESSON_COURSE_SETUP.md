# II-V-I レッスンコース（セットアップメモ）

コース名（日英）:

- **II-V-Iフレーズ基礎** / **II-V-I Phrase Basics**

12 調（C → F → B♭ → … → G）× 10 セグメント（フレーズ 1–5, 6–10, … 46–50）＝ **120 レッスン**。各レッスンはファンタジー `progression_timing`、BGM は **5 フレーズまとめ・各フレーズ 2 回**、**BPM 160**。

---

## リポジトリ内の参照

| 用途 | パス |
|---|---|
| マイグレーション生成 | `scripts/generate-ii-v-i-migration.mjs` |
| 分割 SQL（手動適用用） | `supabase/migrations/20260324140000_ii_v_i_lesson_course_part1.sql` ～ `part3.sql` |
| `order_index` 修正（1 始まり→0 始まり） | `supabase/migrations/20260325120000_fix_ii_v_i_lesson_order_index_zero_based.sql` |
| 繰り返し記号の MusicXML 展開 | `src/utils/musicXmlRepeatExpand.ts`（`musicXmlToProgression` から利用） |
| 音源・楽譜（ローカル） | `public/II-V-I_1-50/` |

---

## アプリ表示と `lessons.order_index`

一覧・ナビは **`order_index` を 0 始まり**とみなし、表示で `+1` する（例: `CoursePage.tsx`, `lessonNavigation.ts`）。

DB に **1～120** で入れると先頭が「レッスン 2」になるため、**0～119** で揃える。既に 1 始まりで入っている環境では `20260325120000_fix_ii_v_i_lesson_order_index_zero_based.sql` を適用する。

---

## BGM（R2）一括アップロード

手順の詳細は [FANTASY_STAGE_SETUP_GUIDE.md の 2.1](./FANTASY_STAGE_SETUP_GUIDE.md#21-ii-v-i-レッスンコース-bgm-一括アップロードcli) を参照。

要約:

1. `.env.r2` に `CF_ACCOUNT_ID`（必須）、必要なら `R2_BUCKET`
2. `npx wrangler login`
3. `npm install` 後、`node scripts/upload-ii-v-i-mp3-to-r2.mjs`（`--dry-run` / `--s3` はスクリプトヘッダー参照）
4. Windows で `npx` が見えない場合は、ローカルの `node_modules/wrangler` を `node` 直起動する実装済み

**DB の URL 形式**（`fantasy_stages.bgm_url`）:

`https://jazzify-cdn.com/fantasy-bgm/ii-v-i-{範囲}-{slug}.mp3`

---

## カウントインと音源・楽譜の同期（重要）

マイグレーションでは各ステージに **`count_in_measures = 1`** が入っている。アプリの BGM は **`count_in_measures` 小節分の「カウントイン区間」が MP3 の先頭にある**前提で、そこから **`(60/BPM)×拍子` 秒後**を楽譜の M1・ノーツの先頭と一致させる。

- **楽譜・ノーツ**は MusicXML の小節 1 から。カウントイン用の小節は XML に無くてよい（「休符がない」のは正しい）。
- **MP3 が本編だけ**（先頭からいきなり M1）だと、上記の前提と合わず **約 1 小節ズレる**。

**推奨:** 音源の先頭に **1 小節分**（BPM 160・4/4 なら 1.5 秒）の無音またはクリックを付けてから R2 に載せる。

```bash
node scripts/prepend-count-in-to-ii-v-i-mp3.mjs --dry-run
# バックアップを取ったうえで
node scripts/prepend-count-in-to-ii-v-i-mp3.mjs --in-place
# その後、upload-ii-v-i-mp3-to-r2.mjs で再アップロード
```

理屈と代替案（`count_in_measures = 0` にする場合など）は [FANTASY_STAGE_SETUP_GUIDE.md の 2.2](./FANTASY_STAGE_SETUP_GUIDE.md#22-ii-v-i-カウントインと音源楽譜の同期) を参照。

---

## バトルバランス設定

| パラメータ | 値 | 備考 |
|---|---|---|
| プレイヤーHP (`max_hp`) | **30** | 全ステージ固定 |
| ダメージ (`min_damage` / `max_damage`) | **50 / 100** | 正解ごとにランダムで 50〜100 ダメージ |
| 敵HP (`enemy_hp`) | **`question_count × 150`** | `question_count × 2周 × 平均ダメージ75` |

設計意図: 全問正解で **約2周分** 演奏するとゲームクリアになるバランス。ダメージに幅（50〜100）を持たせることで演出にメリハリを出す。

### セグメント別の敵HP

| セグメント | 音符数 (`question_count`) | 敵HP |
|---|---|---|
| フレーズ 1-5 | 512 | 76,800 |
| フレーズ 6-10 | 448 | 67,200 |
| フレーズ 11-15 | 504 | 75,600 |
| フレーズ 16-20 | 516 | 77,400 |
| フレーズ 21-25 | 484 | 72,600 |
| フレーズ 26-30 | 436 | 65,400 |
| フレーズ 31-35 | 412 | 61,800 |
| フレーズ 36-40 | 532 | 79,800 |
| フレーズ 41-45 | 544 | 81,600 |
| フレーズ 46-50 | 528 | 79,200 |

---

## 課題クリア条件

`lesson_songs.clear_conditions` は **`{"rank":"C","count":1}`**（C 以上・1 回）。

---

## Supabase へのデータ投入

- コース／ステージ／レッスン／`lesson_songs` はマイグレーションまたは MCP `apply_migration` で投入可能。
- `fantasy_stages.music_xml` の大量更新は別途（RPC・バッチ・管理画面）。楽譜はパーサ側で繰り返し展開する場合、DB に生 XML を載せる要件は運用に合わせて決める。

---

## 関連ドキュメント

- [FANTASY_STAGE_SETUP_GUIDE.md](./FANTASY_STAGE_SETUP_GUIDE.md) — R2・ステージ・MusicXML 全般
