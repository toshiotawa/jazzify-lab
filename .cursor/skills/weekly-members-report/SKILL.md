---
name: weekly-members-report
description: >-
  Runs Jazzify's weekly members and growth review: new signups, paid growth,
  main-quest and assignment clears, device/region/MIDI, UTM acquisition, soft
  landing, marketing emails, paywall sources, GA4 traffic. Use when the user
  asks for 週次会員, 新規会員, 有料会員増加, メインクエストクリア,
  課題クリア, MIDI接続, ソフトランディング, メルマガ, paywall, 導線,
  UTM, or GA+MCP weekly review.
---

# Weekly Members Report

Jazzify の週次会員・導線レビュー。**正本は Supabase**、GA4 は入口の補助。

## Sources of truth

| 指標 | 正本 |
|---|---|
| 新規登録 | `auth.users.created_at` |
| プロフィール属性（PF/国/UTM） | `profiles`（`auth.users` JOIN） |
| 有料 | `subscriptions.entitlement_state`（`status` と `profiles.rank` は補助。解約予約中は `status=canceled` でも期間内は entitlement 有効） |
| クエスト/課題クリア | `user_lesson_requirements_progress.is_completed` |
| ソフトランディング進捗 | `courses.soft_landing_order` + `user_lesson_progress.completed`（block1 無料） |
| 課題開始・MIDI | `user_assignment_starts`（カバレッジ不足あり、修正後は Web/iOS 改善中） |
| 登録後ファネル | `user_milestones` |
| メルマガ opt-in | `profiles.marketing_email_opt_in` |
| メルマガ送信 | `marketing_email_sends`（`email_key`, `sent_at`） |
| 流入・端末（訪問） | GA4 Data API |
| オファー UI 転換（補助） | GA4 `soft_landing_offer_viewed/accepted/dismissed` |

期間デフォルト: **直近7日 rolling**（`now() - interval '7 days'`）。JST で日付表示。

## Workflow

Copy and track:

```
- [ ] 1. Read SQL packs under scripts/analytics/
- [ ] 2. Run Supabase MCP execute_sql (one statement at a time)
- [ ] 3. Run GA: cd jazzify-ga-report && npm run ga:week（末尾に LP/ブログコードラン）
- [ ] 4. Interpret caveats (paid vs rank, MIDI coverage, UTM gaps, SL offer vs DB)
- [ ] 5. Write canvas + short Japanese chat summary
```

### 1. SQL（リポジトリ管理）

実行順:

1. `scripts/analytics/weekly_members_overview.sql` — 会員・有料・端末・地域・UTM・マイルストーン・opt-in
2. `scripts/analytics/weekly_main_quest_assignments.sql` — 無料枠(block1)クリア・ペイウォール出所・未購入後の復帰・MIDIデバイス
3. `scripts/analytics/weekly_soft_landing_marketing.sql` — ソフトランディング・メルマガ・paywall/checkout出所・ドとソMIDI
4. 必要なら既存の `weekly_funnel.sql` / `weekly_funnel_by_platform.sql`
5. 全体 SL スナップショット: `soft_landing_funnel.sql`（任意）

`weekly_main_quest_assignments.sql` の追加節（必ず実行）:

- **H** MIDI デバイス詳細（`midi_connected` / `midi_device_count` / API / `input_method` × PF）
- **I** paywall 出所別 × PF（checkout / 未購入内訳。`subscription_sheet` / `soft_landing` 等）
- **J** paywall 到達・未購入のその後（復帰なし / 1日以内 / 1–7日 / 7日超、出所別）

`weekly_soft_landing_marketing.sql` の節（必ず実行）:

- **A–C** ソフトランディング（order=1/2）× 7日コホート
- **D–E** paywall / checkout 出所
- **F–G** メルマガ opt-in・送信
- **H** 「ドとソ」クリア vs 開始ログ vs MIDI

**MCP 注意**: 複数ステートメントは末尾結果だけ返ることがある。コメント区切りの **1 SELECT ずつ**実行する。

### 2. GA4

```bash
cd jazzify-ga-report
npm run ga:week
```

前提: `.env` の `GA_PROPERTY_ID`（Jazzify）、ADC（`gcloud auth application-default login`）。  
期間は `7daysAgo`〜`yesterday`（当日なし）。  
Jazz Piano Days（`GA_PROPERTY_ID_JAZZPIANODAYS` / `ga:jpd:*`）は週次に含めない。

**LP / ブログ / 埋め込みコードラン**（GA4 キーイベント）:

| イベント | 意味 |
|---|---|
| `lp_chord_run_demo_open` | LP サムネクリック（iframe 読込前） |
| `code_run_demo_play` | スタート成功 |
| `code_run_demo_clear` | ゴール到達 |

出所ラベル `embed_from`: `lp_ja` / `lp_en` / `en_blog` / `jazzpianodays`（iframe `?from=`）。  
週次 CLI は `pagePathPlusQueryString` + `hostName` から推定（`customEvent:embed_from` 未登録時）。単体: `npm run ga:code-run-demo`。

ソフトランディングオファー（補助）: `soft_landing_offer_viewed`, `soft_landing_offer_accepted`, `soft_landing_offer_dismissed`（params: `entry`, `sequence_index`）。

### 3. 定義（毎回同じ解釈）

- **無料メインクエスト** = `block_number <= 1` のみ（`src/utils/mainQuestFreeTier.ts` の `MAIN_QUEST_FREE_MAX_BLOCK_NUMBER = 1`）。第2ブロック以降は有料ロック
- **無料枠クリア** = block 1 内の **いずれか1課題** クリア（現状は「1-1. ドとソをまねしよう」1本）
- **課題クリア** = `lesson_songs` 単位の `is_completed`
- **ソフトランディング** = `courses.soft_landing_order IS NOT NULL` のコース。無料は block 1 のみ（`SOFT_LANDING_FREE_MAX_BLOCK_NUMBER = 1`）。進捗は `user_lesson_progress.completed`
- **SL order=1** = コードラン初級、`order=2` = 中級
- **無料ファネルの次段** = 無料枠クリア → `free_tier_wall_view` → checkout / trial / paid。**block 2+ クリアは無料離脱指標に使わない**（有料会員の進捗）
- **有効サブスク増加** = 期間内に作られた `subscriptions` で `status in ('active','trial','grace','billing_retry')`。補助: `entitlement_state in ('active','payment_issue_with_access','cancelled_but_active_until_end')`
- **新規からの課金定着** = 期間内 `auth.users` かつ有効サブスク/paid milestone
- **MIDI**: 開始ログがあるユーザーのみ信頼。ログなしは「不明」。週次では `midi_connected` に加え `midi_device_count`・`midi_api_available`・`input_method` を PF 別に出す
- **paywall 出所**: `user_milestones.free_tier_wall_view_source`（初回のみ）。`soft_landing` = SL コース内 block2+ ロック。`chapter_complete` = MQ 章完了後
- **checkout 出所**: `user_milestones.checkout_click_source`（なければ paywall source を補助表示）
- **未購入後の復帰**: ペイウォール到達時刻より後の `user_lesson_progress` / `user_assignment_starts` / `fantasy_stage_clears` の有無
- **メルマガ送信**: `marketing_email_sends.email_key`（day0〜day30 / trial_start / paywall_nudge / dormant_14d / never_played_5d / soft_landing_chord_run 等）

課題タイトル固定のクエリはマスタ変更時に SQL を更新する。

### 4. 出力

1. **Canvas**（必須）: `~/.cursor/projects/<workspace>/canvases/weekly-members-ga-report.canvas.tsx`  
   - 会員 / 有料 / クエスト / **課題別クリア** / 端末・地域 / **MIDIデバイス** / **paywall出所・未購入後** / **ソフトランディング** / **メルマガ** / **LP・ブログコードラン** / 導線 / GA
   - `cursor/canvas` のみ。空セクション禁止。チャートは `xAxis`/`yAxis` props なし（caption で軸を説明）
2. **チャット要約**（日本語・簡潔）: 新規人数、有料増減、課題離脱の山、paywall 出所の山、SL 開始率、MIDI 接続率、メルマガ、**LP/ブログコードラン play/clear**、導線の要点

## Caveats to always mention

- `profiles.rank` と `subscriptions.status` がズレることがある。利用可否の正本は `entitlement_state`
- iOS `first_touch`: 新ビルドは `app_store/organic`。旧登録は `(none)` が多い。投稿別は ASC Campaign Link（個別ユーザー紐づけ不可）
- GA `sign_up` 帰属の `(not set)` と DB UTM `(none)` は別物
- GA `platform` は web 中心。ネイティブ登録は `signup_platform` で見る
- `midi_connected` / `quest_*` が GA で 0 でも DB クリアは存在する
- paywall 出所・未購入後の復帰は **Supabase 正本**。GA `paywall_view` は補助
- iOS `subscription_sheet` は StoreKit デフォルト入口。checkout 0 でも paywall 到達にカウント
- ソフトランディングオファー（modal）は GA のみ。DB 進捗は `user_lesson_progress` で見る
- LP/ブログコードランの出所別 UU は GA4 で `embed_from` カスタム次元未登録のため、週次はイベント数ベース（`pagePathPlusQueryString` 推定）

## Related docs

- `docs/analytics-minimal.md`
- `scripts/analytics/README.md`
- `growth/funnel.sql`（出所別・未購入後・MIDI デバイスの growth 用）
- `jazzify-ga-report/README.md`
