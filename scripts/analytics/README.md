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
| `weekly_main_quest_assignments.sql` | 無料枠(block1)クリア・ペイウォール・MIDI |

エージェント向け手順は `.cursor/skills/weekly-members-report/SKILL.md`。  
GA4 CLI は `jazzify-ga-report`（`npm run ga:week`）。
