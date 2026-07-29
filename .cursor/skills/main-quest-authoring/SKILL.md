---
name: main-quest-authoring
description: >-
  Adds Jazzify main-quest chapters/quests (MusicXML, MP3, Voice4 cue, precision,
  Swing, OSMD combat, dialogues, R2, Supabase migration). Use when the user asks
  to メインクエスト追加, MQ章追加, Ch4/Ch5/次章クエスト制作, sozai投入, or
  OSMD quest authoring for the main course.
---

# Main Quest Authoring

メインクエスト（`courses.is_main_course`）に章・クエスト・課題を追加する標準手順。  
雛形: Ch4/Ch5（`mq-b3` / `mq-b4`）と `scripts/generate-mq-block3-ch4-ch5-migration.mjs`。

## Checklist

```
- [ ] 1. 素材棚卸し（XML/MP3・尺・Swing・欠落・流用）
- [ ] 2. public/sozai 配置 + tempo 整合
- [ ] 3. Voice4 cue / 精密 XML 生成
- [ ] 4. R2 アップロード
- [ ] 5. マイグレーション生成（stages/lessons/dialogues）
- [ ] 6. DB 適用 + 検証
- [ ] 7. 結果報告（日本語）
```

## 1. 素材棚卸し

Downloads 等の MusicXML / MP3 を対応表にする。

| 確認 | 判定 |
|------|------|
| `<sound tempo>` vs MP3 尺 | `measures * 4 * 60 / bpm` ≈ MP3 秒。不一致なら XML tempo を音源に合わせる |
| Swing | 裏拍が 0.5（ストレート）→ DB `is_swing=true`（アプリ 2:1）。0.66 記譜や `<swing>` なら `is_swing=false` |
| Voice4 | 無ければ後段で cue 生成。精密は Voice4 削除版 |
| 欠落 MP3 | 同尺の別音源を流用するか、ユーザーに差し替えを依頼 |
| 重複 MD5 | 誤コピーのまま投入しない（例: 4-2-4 が 4-1-4 と同一） |

命名: `mq-b{N}-{sourceId}.mp3|.musicxml`（Ch4=`b3`, Ch5=`b4`…）。UUID NS は章ごとに `a0000000-0000-4000-8000-00000000000N`。

## 2. sozai 配置

```bash
# 例: Downloads → public/sozai/mq-b3-4-1-2.*
# tempo 修正例
sed -i 's/tempo="120"/tempo="100"/g' public/sozai/mq-b3-4-1-2.musicxml
```

- カウントイン: ユーザー指定が「なし」なら `count_in_beats=0`、音源にも prepend しない。譜面先頭の休符小節はそのまま。
- 会話 BGM: `https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3`（`audioTracks.drum_loop`）。

## 3. Voice4 cue / 精密

```bash
node scripts/prepare-mq-b3-b4-assets.mjs
# 中身: build-mq-b1-q1-guide-voice4-musicxml.mjs --cue
#       strip-musicxml-voice4.mjs（精密用）
```

- OSMD 本番 URL: `*-guide-voice4-cue.musicxml`
- 精密: `*-precision.musicxml`（Voice4 なし）、`mode='chord_precision'`
- Voice1 自動 Hide はしない（テストステージ仕様どおり）
- 新規章用に `TARGETS` / `BASES` をスクリプトへ追加する

検証:

```bash
# cue に voice4+cue あり、precision は voice4=0
```

## 4. R2 アップロード

```bash
# 推奨（この環境では wrangler が失敗しやすい）
NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/upload-sozai-main-quest-block3-r2.mjs --s3 --no-retry
```

- 新章: `upload-sozai-main-quest-block2-r2.mjs` をクローンしファイル一覧を更新
- wrangler は `--account-id` を付けない（block2 と同じ local wrangler.js 呼び出し）
- CDN: `https://jazzify-cdn.com/sozai/<file>?v=YYYYMMDDHHMM`

## 5. マイグレーション生成

```bash
node scripts/generate-mq-block3-ch4-ch5-migration.mjs
# → supabase/migrations/YYYYMMDDHHMMSS_mq_block3_....sql
```

新章は generate スクリプトをコピーして `STAGES` / dialogues / lessons を書き換える。

### データ対応

| 種別 | 入れ方 |
|------|--------|
| 会話のみ | `survival_tutorial_scripts` + `lesson_songs.is_survival_tutorial` |
| 会話→OSMD チュートリアル | `ear_training_tutorial_scripts`（`dialogue_only` + `chord_osmd` + `requiredLoops`） |
| OSMD 本番 | `ear_training_stages` `mode=chord_osmd` + phrase |
| 精密 | `mode=chord_precision`、Voice4 無し XML |
| おまけ課題 | `lesson_songs.is_clear_required=false`（default true） |

### OSMD クリア条件（本番）

ターゲット数 N（Voice4 除外の pitch 数）:

- `per_correct_note_damage = 1`
- `good/great/perfect_completion_damage = 0`
- `enemy_hp = N`（満点ちょうど 1 周クリア。足りなければ 2 周）
- `max_loops_per_phrase >= 2`
- `player_hp = 100`, `miss_damage = max(1, round(100 / (0.3 * N)))`
- `fail_damage` ≈ miss 以上
- `bpm=100`（素材に合わせる）, `is_swing=true`（ストレート記譜時）, `count_in_beats=0`, `osmd_targets_from_score=true`

精密: `enemy_hp=1`、戦闘ダメ 0、GOOD 率 ≥70% でクリア（既存 Bluesy 精密）。

### 会話文

じゃじい / ファイ口調で **JA+EN 本番文**（プレースホルダ禁止）。`lineIntervalSeconds: 4`。

### SQL 落とし穴

- `ear_training_phrases.note_count` は **0〜32** → 大きい N は `note_count=0`、実ターゲットは `enemy_hp` 側
- `lesson_songs` に **`updated_at` 列なし** → ON CONFLICT で触らない
- 大きな SQL は `.cursor/*_chunks/*.sql` に分割し、Supabase MCP `execute_sql` で順適用

## 6. DB 適用と検証

```sql
-- 章・課題数
select l.block_number, l.title, count(ls.id) as songs,
  count(*) filter (where ls.is_clear_required = false) as optional_songs
from lessons l
join courses c on c.id = l.course_id
left join lesson_songs ls on ls.lesson_id = l.id
where c.is_main_course and l.block_number in (/* new */)
group by l.id order by l.block_number, l.order_index;

-- ステージ戦闘値
select slug, mode, bpm, is_swing, enemy_hp, miss_damage, count_in_beats
from ear_training_stages
where slug like 'mq-bN-%' order by slug;
```

アプリ側の新規 per-frame ロジックは原則不要（データ投入のみ）。

## 7. 報告フォーマット

- 変更ファイル / R2・DB 適用結果
- Swing・Voice4・クリア条件の要約
- 残リスク（誤コピー音源、流用音源、未適用チャンク）
- Performance: データ追加のみなら「なし」と明記

## 参照スクリプト

| 用途 | パス |
|------|------|
| cue 生成 | `scripts/build-mq-b1-q1-guide-voice4-musicxml.mjs` |
| 精密 strip | `scripts/strip-musicxml-voice4.mjs` |
| 一括 prepare | `scripts/prepare-mq-b3-b4-assets.mjs` |
| SQL 生成 | `scripts/generate-mq-block3-ch4-ch5-migration.mjs` |
| R2 | `scripts/upload-sozai-main-quest-block3-r2.mjs` |
| 旧章雛形 | `scripts/generate-mq-block2-motif-migration.mjs` |
