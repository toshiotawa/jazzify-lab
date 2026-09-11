# Discord 有料会員コミュニティ連携 — セットアップ手順

Jazzify の有料会員向け Discord サーバー（日本語 / 海外）を運用するための手動セットアップ手順です。
アプリ側の OAuth 連携・日次キックは Supabase Edge Functions が担当します。

## 必要な Discord プラン

| 項目 | 必要？ |
|------|--------|
| Discord アカウント | 必須（無料） |
| サーバー作成 | 無料 |
| Community サーバー | 無料（推奨） |
| Bot / OAuth2 アプリ | 無料 |
| Server Boost (Nitro) | 任意（音質向上など） |

**Discord 側に月額課金プランは不要**です。

---

## 1. サーバーを 2 つ作成

1. **Jazzify（日本語）** — 日本語 UI ユーザー向け
2. **Jazzify Global（英語）** — 英語 UI ユーザー向け

### 1-1. Community を有効化

各サーバー: **サーバー設定 → Community → Community サーバーとして有効化**

- アナウンスチャンネル
- ルール同意（Rules Screening）
- ウェルカム画面

が使えます。

### 1-2. チャンネル構成

| 日本語 | 英語 | 種類 | 権限 |
|--------|------|------|------|
| `#お知らせ` | `#announcements` | アナウンス | `@everyone` 送信拒否、Admin のみ |
| `#雑談` | `#general` | テキスト | 一般会員可 |
| `#練習日記` | `#practice-log` | テキスト | 一般会員可 |
| `音声` | `Voice` | ボイス | 一般会員可 |

### 1-3. ロール・権限

- `Admin` ロールを作成（運営用）
- 一般会員は `@everyone` のまま（プレミアム / コーチングで権限差なし）
- **`@everyone` の「招待を作成」をオフ** — Bot 経由以外で参加させない
- 既存の招待リンクは削除
- **認証レベル: 低（メール認証済み）** 推奨（「中」以上だと OAuth 参加が失敗しやすい）

### 1-4. サーバー ID を控える

Discord 設定 → 詳細設定 → **開発者モード ON** → サーバー右クリック → **ID をコピー**

- `DISCORD_GUILD_ID_JA` = 日本語サーバー ID
- `DISCORD_GUILD_ID_EN` = 海外サーバー ID

---

## 2. Developer Portal でアプリ作成

https://discord.com/developers/applications

1. **New Application** → 名前「Jazzify」
2. **OAuth2**
   - Client ID / Client Secret を控える
   - **Redirects** に追加:
     ```
     https://<project-ref>.supabase.co/functions/v1/discord-oauth-callback
     ```
3. **Bot**
   - Bot を追加 → Token を控える
   - **Public Bot**: オフ
   - Privileged Gateway Intents: 不要
4. **Bot を両サーバーに招待**
   - OAuth2 → URL Generator
   - Scopes: `bot`
   - Bot Permissions: **Create Instant Invite** + **Kick Members**（整数 `3`）
   - 生成 URL で日本語・海外サーバー両方に追加
5. 両サーバーで Bot ロールが `@everyone` より**上**にあることを確認

---

## 3. Supabase Secrets

Dashboard → **Edge Functions → Secrets** または CLI:

```bash
supabase secrets set \
  DISCORD_CLIENT_ID="..." \
  DISCORD_CLIENT_SECRET="..." \
  DISCORD_BOT_TOKEN="..." \
  DISCORD_GUILD_ID_JA="..." \
  DISCORD_GUILD_ID_EN="..." \
  DISCORD_REDIRECT_URI="https://<project-ref>.supabase.co/functions/v1/discord-oauth-callback" \
  APP_BASE_URL="https://jazzify.jp"
```

| Secret | 説明 |
|--------|------|
| `DISCORD_CLIENT_ID` | OAuth2 Client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 Client Secret |
| `DISCORD_BOT_TOKEN` | Bot Token |
| `DISCORD_GUILD_ID_JA` | 日本語サーバー ID |
| `DISCORD_GUILD_ID_EN` | 海外サーバー ID |
| `DISCORD_REDIRECT_URI` | OAuth callback URL（Portal と一致必須） |
| `APP_BASE_URL` | 連携完了後のリダイレクト先（例: `https://jazzify.jp`） |

---

## 4. Edge Functions のデプロイ

```bash
supabase functions deploy discord-link-start
supabase functions deploy discord-oauth-callback
supabase functions deploy discord-sync-members
```

`supabase/config.toml` で `discord-oauth-callback` は `verify_jwt = false` です。

---

## 5. 日次キック Cron の設定

Supabase Dashboard → **Integrations → Cron**（または Scheduled Functions）

| 項目 | 値 |
|------|-----|
| Function | `discord-sync-members` |
| Schedule | `0 18 * * *`（UTC 18:00 = JST 03:00） |
| Authorization | `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

`profiles.rank = free` かつ `is_admin = false` の連携ユーザーを Discord からキックします。

---

## 6. 動作確認

1. 有料会員でログイン → ダッシュボード「有料会員専用Discordサーバー」→ **参加**
2. Discord 認可 → 対応サーバーに参加していること
3. Rules Screening 有効時はルール同意後に発言可能
4. 管理画面で rank を `free` に変更 → `discord-sync-members` を手動 invoke → キック確認
5. rank を戻して再連携できること

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| 40002 Account verification required | ユーザーの Discord メール認証、サーバー認証レベルを「低」に |
| 403 Missing Permissions | Bot に Kick + Create Instant Invite、ロール順序を確認 |
| OAuth redirect mismatch | `DISCORD_REDIRECT_URI` と Developer Portal の Redirects を完全一致 |
| 参加後に発言できない | Rules Screening のルール同意が必要（pending 状態） |
| iOS で OAuth が開かない | 実機で WKWebView 挙動を確認。必要なら外部ブラウザ導線を検討 |
