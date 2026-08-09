---
name: weekly-members-report
description: >-
  Runs Jazzify's weekly members and growth review: new signups, paid growth,
  main-quest and assignment clears, device/region/MIDI, UTM acquisition, GA4
  traffic. Use when the user asks for 週次会員, 新規会員, 有料会員増加,
  メインクエストクリア, 課題クリア, MIDI接続, 導線, UTM, or GA+MCP weekly review.
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
| 課題開始・MIDI | `user_assignment_starts`（カバレッジ不足あり、特に iOS） |
| 登録後ファネル | `user_milestones` |
| 流入・端末（訪問） | GA4 Data API |

期間デフォルト: **直近7日 rolling**（`now() - interval '7 days'`）。JST で日付表示。

## Workflow

Copy and track:

```
- [ ] 1. Read SQL packs under scripts/analytics/
- [ ] 2. Run Supabase MCP execute_sql (one statement at a time)
- [ ] 3. Run GA: cd jazzify-ga-report && npm run ga:week
- [ ] 4. Interpret caveats (paid vs rank, MIDI coverage, UTM gaps)
- [ ] 5. Write canvas + short Japanese chat summary
```

### 1. SQL（リポジトリ管理）

実行順:

1. `scripts/analytics/weekly_members_overview.sql` — 会員・有料・端末・地域・UTM・マイルストーン
2. `scripts/analytics/weekly_main_quest_assignments.sql` — 無料枠(block1)クリア・ペイウォール出所・未購入後の復帰・MIDIデバイス
3. 必要なら既存の `weekly_funnel.sql` / `weekly_funnel_by_platform.sql`

`weekly_main_quest_assignments.sql` の追加節（必ず実行）:

- **H** MIDI デバイス詳細（`midi_connected` / `midi_device_count` / API / `input_method` × PF）
- **I** paywall 出所別 × PF（checkout / 未購入内訳。`subscription_sheet` 等）
- **J** paywall 到達・未購入のその後（復帰なし / 1日以内 / 1–7日 / 7日超、出所別）

**MCP 注意**: 複数ステートメントは末尾結果だけ返ることがある。コメント区切りの **1 SELECT ずつ**実行する。

### 2. GA4

```bash
cd jazzify-ga-report
npm run ga:week
```

前提: `.env` の `GA_PROPERTY_ID`（Jazzify）、ADC（`gcloud auth application-default login`）。  
期間は `7daysAgo`〜`yesterday`（当日なし）。  
Jazz Piano Days（`GA_PROPERTY_ID_JAZZPIANODAYS` / `ga:jpd:*`）は週次に含めない。

### 3. 定義（毎回同じ解釈）

- **無料メインクエスト** = `block_number <= 1` のみ（`src/utils/mainQuestFreeTier.ts` の `MAIN_QUEST_FREE_MAX_BLOCK_NUMBER = 1`）。第2ブロック以降は有料ロック
- **無料枠クリア** = block 1 内の **いずれか1課題** クリア（現状は「1-1. ドとソをまねしよう」1本）
- **課題クリア** = `lesson_songs` 単位の `is_completed`
- **無料ファネルの次段** = 無料枠クリア → `free_tier_wall_view` → checkout / trial / paid。**block 2+ クリアは無料離脱指標に使わない**（有料会員の進捗）
- **有効サブスク増加** = 期間内に作られた `subscriptions` で `status in ('active','trial','grace','billing_retry')`。補助: `entitlement_state in ('active','payment_issue_with_access','cancelled_but_active_until_end')`（Apple 解約予約中で `status=canceled` でも期間内はこちらでカウント）
- **新規からの課金定着** = 期間内 `auth.users` かつ有効サブスク/paid milestone
- **MIDI**: 開始ログがあるユーザーのみ信頼。ログなしは「不明」。週次では `midi_connected` に加え `midi_device_count`（1台以上か）・`midi_api_available`・`input_method` を PF 別に出す
- **paywall 出所**: `user_milestones.free_tier_wall_view_source`（初回のみ）。未購入 = trial/paid milestone なし かつ有効 entitlement なし。`subscription_sheet` は iOS デフォルト入口
- **未購入後の復帰**: ペイウォール到達時刻より後の `user_lesson_progress` / `user_assignment_starts` / `fantasy_stage_clears` の有無

課題タイトル固定のクエリはマスタ変更時に SQL を更新する。

### 4. 出力

1. **Canvas**（必須）: `~/.cursor/projects/<workspace>/canvases/weekly-members-ga-report.canvas.tsx`  
   - 会員 / 有料 / クエスト / **課題別クリア** / 端末・地域 / **MIDIデバイス** / **paywall出所・未購入後** / 導線 / GA
   - `cursor/canvas` のみ。空セクション禁止。チャートは `xAxis`/`yAxis` props なし（caption で軸を説明）
2. **チャット要約**（日本語・簡潔）: 新規人数、有料増減、課題離脱の山、paywall 出所の山、MIDI 接続率、導線の要点

## Caveats to always mention

- `profiles.rank` と `subscriptions.status` がズレることがある（例: Apple 解約予約中は `rank=standard` かつ `status=canceled`）。利用可否の正本は `entitlement_state`
- iOS は `first_touch_*` / `user_assignment_starts` が薄いことが多い（`signup_device_*` はネイティブ登録で保存する）。iOS DL 経路の投稿別比較は ASC Campaign Link 集計（個別ユーザー紐づけ不可）
- GA `sign_up` 帰属の `(not set)` と DB UTM `(none)` は別物。混同しない
- GA `platform` は現状 web 中心。ネイティブ登録は Supabase `signup_platform` で見る
- `midi_connected` / `quest_*` が GA で 0 でも DB クリアは存在する
- paywall 出所・未購入後の復帰は **Supabase 正本**。GA `paywall_view` はイベント件数の補助で、未購入コホートとの JOIN はしない
- iOS `subscription_sheet` は StoreKit 画面のデフォルト入口。checkout クリック 0 でも paywall 到達にはカウントされる

## Related docs

- `docs/analytics-minimal.md`
- `scripts/analytics/README.md`
- `growth/funnel.sql`（出所別・未購入後・MIDI デバイスの growth 用）
- `jazzify-ga-report/README.md`
