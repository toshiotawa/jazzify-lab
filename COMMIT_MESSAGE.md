# コミットメッセージ

```

feat(guild): シーズンを時間単位へ、クエスト閾値を1000、定員を1に一時変更（検証用）

## 変更点
- シーズン集計の粒度を「月」→「時間」へ移行するため、`guild_xp_contributions` に `hour_bucket` 列を追加、書き込みトリガーとランキングRPCを時間バケットに対応
- チャレンジギルドのクエスト条件を「前月100万XP未満で解散」→「直前1時間1000XP未満で解散」に変更
- メンバー定員チェックを 5 → 1 に変更（招待/申請/承認の各RPC）
- UI文言と進捗バー、ランキング画面、MVP表示を時間バケットに合わせて更新

## 注意
- すべて検証のための一時的な設定です。後で元に戻す予定です。
```

# 変更されたファイル一覧

## 新規作成
- `supabase/migrations/20250904010007_hourly_season_and_limits.sql`

## 修正
- `supabase/migrations/20250901090000_add_guild_type_column.sql`
- `src/platform/supabaseGuilds.ts`
- `src/components/guild/GuildDashboard.tsx`
- `src/components/guild/GuildPage.tsx`
- `src/components/guild/GuildHistory.tsx`
- `src/components/ranking/GuildRanking.tsx`
