# 週次分析 SQL

Supabase MCP (`execute_sql`) または SQL Editor で実行する。

**期間の正本**: `auth.users.created_at >= now() - interval '7 days'`（登録時刻）。  
プロフィール属性だけ見る場合は `profiles` を JOIN する。

**注意**: MCP は複数ステートメントのとき末尾結果だけ返ることがある。1クエリずつ実行すること。

| ファイル | 内容 |
|---|---|
| `weekly_members_overview.sql` | 新規会員・有料・端末・地域・UTM・マイルストーン・opt-in |
| `weekly_main_quest_assignments.sql` | 無料枠(block1)クリア・ペイウォール出所・未購入後の復帰・MIDIデバイス |
| `weekly_soft_landing_marketing.sql` | ソフトランディング・メルマガ送信・paywall/checkout出所・ドとソMIDI |
| `weekly_funnel.sql` | UTM別マイルストーン + 課題開始/クリア + MIDI別 |
| `weekly_funnel_by_platform.sql` | signup_platform 別マイルストーン |
| `weekly_funnel_by_device.sql` | device 別マイルストーン |
| `soft_landing_funnel.sql` | ソフトランディング全体スナップショット（無料ユーザー） |
| `marketing_soft_landing_chord_run_recipients.sql` | SL メール母数確認用 |

エージェント向け手順は `.cursor/skills/weekly-members-report/SKILL.md`。  
GA4 CLI は `jazzify-ga-report`（`npm run ga:week` · コードラン単体は `npm run ga:code-run-demo`）。

## 週次実行順（推奨）

1. `weekly_members_overview.sql`
2. `weekly_main_quest_assignments.sql`（節 H–J 必須）
3. `weekly_soft_landing_marketing.sql`（節 A–H）
4. 任意: `weekly_funnel*.sql` / GA4

## `weekly_main_quest_assignments.sql` セクション

| 節 | 内容 |
|---|---|
| A–E | 無料枠クリア・課題別 |
| F | 無料完走 → ペイウォール → 課金 |
| G | MIDI 接続（boolean 概要） |
| H | MIDI デバイス詳細（`midi_device_count` / API / input_method × PF） |
| I | paywall 出所別 × PF（checkout / 未購入内訳） |
| J | paywall 到達・未購入のその後（復帰率・出所別） |

## `weekly_soft_landing_marketing.sql` セクション

| 節 | 内容 |
|---|---|
| A | SL order=1（コードラン初級 B1）× 7日コホート |
| B | 同ファネル × signup_platform |
| C | SL order=2（中級 B1）× order=1 完了コホート |
| D | paywall 出所 × checkout / trial |
| E | checkout 出所別 |
| F | 7日コホート marketing_email_opt_in |
| G | 直近7日 marketing_email_sends × email_key |
| H | 「ドとソ」クリア vs 開始ログ vs MIDI |

正本は Supabase。GA4 の `soft_landing_offer_*` はオファー UI 転換の補助。
