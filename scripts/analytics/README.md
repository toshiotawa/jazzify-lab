# 週次分析 SQL

Supabase MCP (`execute_sql`) または SQL Editor で実行する。

**期間の正本**: `auth.users.created_at >= now() - interval '7 days'`（登録時刻）。  
プロフィール属性だけ見る場合は `profiles` を JOIN する。

**注意**: MCP は複数ステートメントのとき末尾結果だけ返すことがある。1クエリずつ実行すること。

| ファイル | 内容 |
|---|---|
| `weekly_funnel.sql` | UTM別マイルストーン + 課題開始/クリア + MIDI別 |
| `weekly_funnel_by_platform.sql` | signup_platform 別マイルストーン |
| `weekly_funnel_by_device.sql` | device 別マイルストーン |
| `weekly_members_overview.sql` | 新規会員・有料・端末・地域・UTM |
| `weekly_main_quest_assignments.sql` | 無料枠(block1)クリア・ペイウォール出所・未購入後の復帰・MIDIデバイス |

エージェント向け手順は `.cursor/skills/weekly-members-report/SKILL.md`。  
GA4 CLI は `jazzify-ga-report`（`npm run ga:week`）。

## `weekly_main_quest_assignments.sql` セクション

| 節 | 内容 |
|---|---|
| A–E | 無料枠クリア・課題別 |
| F | 無料完走 → ペイウォール → 課金 |
| G | MIDI 接続（boolean 概要） |
| H | MIDI デバイス詳細（`midi_device_count` / API / input_method × PF） |
| I | paywall 出所別 × PF（checkout / 未購入内訳） |
| J | paywall 到達・未購入のその後（復帰率・出所別） |

正本は Supabase。GA4 の `paywall_view` は補助（未購入コホートとの JOIN 不可）。