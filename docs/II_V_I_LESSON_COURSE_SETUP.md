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

## 課題クリア条件

`lesson_songs.clear_conditions` は **`{"rank":"C","count":1}`**（C 以上・1 回）。

---

## Supabase へのデータ投入

- コース／ステージ／レッスン／`lesson_songs` はマイグレーションまたは MCP `apply_migration` で投入可能。
- `fantasy_stages.music_xml` の大量更新は別途（RPC・バッチ・管理画面）。楽譜はパーサ側で繰り返し展開する場合、DB に生 XML を載せる要件は運用に合わせて決める。

---

## 関連ドキュメント

- [FANTASY_STAGE_SETUP_GUIDE.md](./FANTASY_STAGE_SETUP_GUIDE.md) — R2・ステージ・MusicXML 全般
