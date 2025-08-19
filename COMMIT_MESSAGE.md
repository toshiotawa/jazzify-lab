# コミットメッセージ

```
fix(guild): ギルドシステムの不具合修正とUI改善

## 主な修正内容
- 脱退理由入力UIの廃止
- 500エラー（guild_membersのGET）の解消
- 非リーダーメンバーの他メンバー/MVP表示問題修正
- 参加リクエストのボタン切り替えと他申請取り下げ
- 脱退時の各種エラー修正
- 部外者向けメンバー名非表示化
- 満員時の申請抑止と既存申請取り下げ
- disbanded列不足エラー対策
- フェッチ処理の軽量化

## 技術的変更
- RLSポリシーの見直しと修正
- セキュリティ定義子RPCの追加
- フロントエンド状態管理の改善
- 不要なAPI呼び出しの削減

## 影響範囲
- 既存ギルドデータに影響なし
- 後方互換性を保持
- セキュリティを強化
```

# 変更されたファイル一覧

## 新規作成
- `supabase/migrations/20250904010000_guild_policy_and_rpc_fixes.sql`
- `supabase/migrations/20250904010001_guild_helper_rpc.sql`
- `PR_DESCRIPTION.md`
- `COMMIT_MESSAGE.md`

## 修正
- `src/components/guild/GuildDashboard.tsx`
- `src/components/guild/GuildPage.tsx`
- `src/platform/supabaseGuilds.ts`

## 変更内容サマリー

### マイグレーションファイル
1. **20250904010000_guild_policy_and_rpc_fixes.sql**
   - disbanded列の追加
   - guild_membersのRLS再定義
   - 各種RPCの追加・更新

2. **20250904010001_guild_helper_rpc.sql**
   - rpc_get_user_guild_idの追加

### フロントエンドファイル
1. **GuildDashboard.tsx**
   - 脱退理由UI・localStorage処理の削除

2. **GuildPage.tsx**
   - 申請ボタンのトグル実装
   - 満員時の無効化
   - 外部閲覧時の非公開化

3. **supabaseGuilds.ts**
   - getGuildIdOfUserのRPC化
   - 人数取得のRPC化
   - リーダー移譲のRPC利用
   - 参加申請の取得/キャンセルAPI追加

## デプロイ手順
1. Supabaseにマイグレーションを適用
2. フロントエンドを再起動
3. 動作確認を実施

## テスト項目
- [ ] 外部閲覧時のメンバー名非表示
- [ ] メンバー一覧とMVPの正しい表示
- [ ] 申請ボタンのトグル動作
- [ ] 満員時の申請無効化
- [ ] 脱退時のエラー解消
- [ ] 500エラーの解消
- [ ] disbanded列エラーの解消 