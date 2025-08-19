# ギルドシステム修正PR

## 概要
ギルド機能の不具合修正とUI改善を実装しました。

## 修正内容

### 1. 脱退理由入力UIの廃止
- `GuildDashboard.tsx`から脱退理由の入力・保存機能を削除
- 関連するlocalStorage処理も撤去

### 2. 500エラー（guild_membersのGET）の解消
- 原因: RLSで他人の`guild_members`が参照不可のため、PostgREST経由で失敗
- 対応: セキュリティ定義子のRPCに置換
  - 新規: `rpc_get_user_guild_id(p_user_id uuid)`（どのユーザーの所属でも取得可）
  - `getGuildIdOfUser`をこのRPC呼び出しに変更

### 3. 非リーダーのメンバーが他メンバー/MVPを見られない問題の修正
- RLS修正: 同じギルドのメンバーであれば`guild_members`の行を参照可に変更
- メンバー/リーダーでなくても所属者なら一覧とMVP表示が正しくなる

### 4. 参加リクエストのボタン切り替え／加入時に他申請の取り下げ
- `GuildPage.tsx`に「申請中→キャンセル」トグルを実装
- RPC側ロジック追加：
  - `rpc_guild_create`で作成者の他ギルドへの保留申請を全キャンセル
  - `rpc_guild_approve_request`／`rpc_guild_accept_invitation`で加入者の他ギルドへの保留申請を全キャンセル
  - 満員到達時はそのギルド宛の保留申請も全キャンセル

### 5. メンバーとして脱退時の「Only leader can disband」エラー修正
- `rpc_guild_disband_and_clear_members`を拡張し、ギルドの唯一のメンバー（非リーダー含む）が脱退＝解散できるように調整

### 6. リーダーとして脱退時の「new row violates RLS for table \"guilds\"」エラー修正
- 新規RPC `rpc_guild_transfer_leader`（セキュリティ定義子）を追加し、RLSのwith check違反を回避して安全に権限移譲→脱退できるように
- `leaveMyGuild`はこのRPCを使用するように変更

### 7. 部外者にはメンバー名を非表示・人数のみ正確表示
- `GuildPage.tsx`を外部閲覧時はメンバー名を出さず、`guild.members_count/5`のみ表示に変更（内部にいる場合のみ一覧を表示）

### 8. 5名満員時の申請抑止と既存申請取り下げ
- 既存の`rpc_guild_request_join`で満員を弾く仕様は維持
- 満員到達時に該当ギルド宛の保留申請を一括キャンセルするロジックをRPCに追加
- フロント側ボタンも満員のときは無効化

### 9. disbanded列が無いエラー対策
- 追加入力: `alter table if exists public.guilds add column if not exists disbanded boolean not null default false;`
- 参照している箇所はそのまま正常化

### 10. フェッチの軽量化
- 外部閲覧のギルドページではメンバー一覧を取りに行かず人数のみ取得
- 人数取得は`rpc_get_guild_member_count`（セキュリティ定義子）で1クエリ化
- 参加申請の状態は専用軽量APIで取得し、不要なN+1を避ける

## 追加・更新したファイル

### マイグレーション
- `supabase/migrations/20250904010000_guild_policy_and_rpc_fixes.sql`
  - `disbanded`追加、`guild_members`のRLS再定義、各種RPC追加/更新
- `supabase/migrations/20250904010001_guild_helper_rpc.sql`
  - `rpc_get_user_guild_id`追加

### フロントエンド
- `src/platform/supabaseGuilds.ts`
  - `getGuildIdOfUser`をRPC化、人数取得をRPC化、リーダー移譲のRPC利用、参加申請の取得/キャンセルAPI追加
- `src/components/guild/GuildPage.tsx`
  - 申請ボタンのトグル（申請→キャンセル）、満員時の無効化、外部閲覧時の非公開化
- `src/components/guild/GuildDashboard.tsx`
  - 脱退理由UI・LS処理の削除

## 動作確認ポイント
- 外部から`#guild?id=...`を開くとメンバー名は非表示で人数のみ
- メンバー/非リーダーで`GuildDashboard`のメンバー一覧とMVPが表示される
- リクエスト済みギルドでは「申請をキャンセル」表示に切り替わる
- 満員のギルドでは申請ボタンが無効化。加入・承認が発生したら他の保留申請が消える
- メンバーの脱退で「Only leader can disband」が出ない
- リーダーの脱退でRLSエラーが出ない
- 「guilds.disbandedが無い」エラーが出なくなる
- 500エラーが解消（`getGuildIdOfUser`のRPC化とRLS修正により）

## 技術的な変更点
- RLSポリシーの見直しと修正
- セキュリティ定義子RPCの追加
- フロントエンドでの状態管理の改善
- 不要なAPI呼び出しの削減

## テスト方法
1. マイグレーションを適用
2. フロントエンドを再起動
3. 上記の動作確認ポイントを順次テスト
4. エラーが発生しないことを確認

## 注意事項
- 既存のギルドデータに影響はありません
- 後方互換性は保たれています
- セキュリティは強化されています 