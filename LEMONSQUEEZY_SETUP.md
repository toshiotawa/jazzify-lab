# Lemon Squeezy テストモード セットアップガイド

## 概要

Jazz Learning Game の海外ユーザー向け **Standard (Global) プラン** の月額サブスクリプションを、Lemon Squeezy のテストモードで実装するための完全ガイドです。

### 現在の実装状況

| 項目 | 状態 |
|------|------|
| Netlify Functions (Webhook / Portal / Checkout) | 実装済み |
| Supabase マイグレーション (lemon_* カラム) | 実装済み |
| フロントエンド (PricingTable / AccountModal) | 実装済み |
| Lemon Squeezy ダッシュボード設定 | **未完了** |
| 環境変数設定 | **未完了** |
| Webhook エンドポイント登録 | **未完了** |
| テスト検証 | **未完了** |

---

## ロードマップ

```
Phase 1: Lemon Squeezy ダッシュボード設定 (30分)
  ├── Step 1: テストモード有効化 & APIキー発行
  ├── Step 2: ストアID確認
  ├── Step 3: 商品 (Product) 作成
  ├── Step 4: バリアント (Variant) 作成 ×2
  └── Step 5: Webhook エンドポイント設定

Phase 2: 環境変数設定 (15分)
  ├── Step 6: Netlify 環境変数設定
  └── Step 7: .env.example 更新確認

Phase 3: Supabase 確認 (10分)
  └── Step 8: マイグレーション適用確認

Phase 4: デプロイ & テスト (30分)
  ├── Step 9: デプロイ
  ├── Step 10: Webhook 疎通テスト
  └── Step 11: E2E サブスクリプションテスト
```

---

## Phase 1: Lemon Squeezy ダッシュボード設定

### Step 1: テストモード有効化 & APIキー発行

1. **Lemon Squeezy ダッシュボードにログイン**
   - https://app.lemonsqueezy.com にアクセス

2. **テストモードに切り替え**
   - 画面上部のトグルスイッチで **「Test mode」** をONにする
   - 左上のストア名の横にオレンジ色の `TEST` バッジが表示されることを確認

3. **APIキーを発行**
   - 左メニュー: **Settings** → **API**
   - 「+ Create API Key」をクリック
   - 名前: `jazz-learning-game-test` (任意)
   - 生成されたキーを **安全な場所にコピー**（二度と表示されません）
   - キーの形式: `eyJ...` (長いJWTトークン)

> **重要**: テストモードでAPIキーを発行すると、テスト環境専用のキーになります。本番モードでは別のキーを発行してください。

### Step 2: ストアID確認

1. **Settings** → **General** に移動
2. URLバーを確認: `https://app.lemonsqueezy.com/settings/general`
3. **Store ID** を確認する方法:
   - Settings → API → 「Store」セクションに表示される数値
   - または URL: `https://api.lemonsqueezy.com/v1/stores` を API キーで呼び出して確認

```bash
# APIで確認する場合（ターミナルで実行）
curl -s https://api.lemonsqueezy.com/v1/stores \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: application/vnd.api+json" | python3 -m json.tool
```

レスポンスの `data[0].id` がストアIDです（例: `12345`）。

### Step 3: 商品 (Product) を作成

1. 左メニュー: **Store** → **Products**
2. 「+ New Product」をクリック
3. 以下の情報を入力:

| 項目 | 値 |
|------|-----|
| **Product name** | `Standard Global Plan` |
| **Description** | `Jazz Learning Game - Standard (Global) subscription plan for international users` |
| **Status** | Published |
| **Pricing** | ここでは設定しない（バリアントで設定） |

4. 「Save」で保存

### Step 4: バリアント (Variant) を2つ作成

商品を作成したら、**2つのバリアント**を作成します:
- **通常版** (トライアルなし)
- **トライアル版** (7日間無料トライアル付き)

#### バリアント A: 通常版（トライアルなし）

1. 作成した商品ページ → **Variants** タブ
2. デフォルトバリアントを編集、または「+ Add variant」
3. 設定:

| 項目 | 値 |
|------|-----|
| **Variant name** | `Monthly` |
| **Price** | `$9.99` (または任意の月額料金) |
| **Pricing model** | Subscription |
| **Billing period** | Monthly |
| **Free trial** | なし (チェックを外す) |

4. 「Save」で保存
5. **Variant ID をメモ**: URLバーの数値、またはバリアント一覧の ID

#### バリアント B: トライアル版（7日間無料トライアル）

1. 「+ Add variant」で新規バリアントを追加
2. 設定:

| 項目 | 値 |
|------|-----|
| **Variant name** | `Monthly (Trial)` |
| **Price** | `$9.99` (通常版と同額) |
| **Pricing model** | Subscription |
| **Billing period** | Monthly |
| **Free trial** | **7 days** (チェックON、7日に設定) |

3. 「Save」で保存
4. **Variant ID をメモ**

#### Variant IDの確認方法

```bash
# APIでバリアントIDを確認
curl -s "https://api.lemonsqueezy.com/v1/variants?filter[product_id]=YOUR_PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: application/vnd.api+json" | python3 -m json.tool
```

レスポンスの各バリアントの `data[].id` をメモしてください。

### Step 5: Webhook エンドポイント設定

1. 左メニュー: **Settings** → **Webhooks**
2. 「+ Create Webhook」をクリック
3. 設定:

| 項目 | 値 |
|------|-----|
| **Callback URL** | `https://YOUR_SITE.netlify.app/.netlify/functions/lemonsqueezyWebhook` |
| **Signing Secret** | 自動生成される値を **コピーしてメモ** |
| **Events** | 以下を選択 |

**選択するイベント:**
- `subscription_created`
- `subscription_updated`
- `subscription_cancelled`
- `subscription_expired`
- `subscription_resumed`
- `subscription_paused`
- `order_created`
- `order_refunded`

4. 「Save」で保存

> **注意**: テストモードで作成したWebhookはテスト環境専用です。本番移行時に再作成が必要です。

---

## Phase 2: 環境変数設定

### Step 6: Netlify 環境変数設定

**Netlify Dashboard** → **Site configuration** → **Environment variables** で以下を追加:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `LEMONSQUEEZY_API_KEY` | `eyJ...` (Step 1で取得) | テストモードAPIキー |
| `LEMONSQUEEZY_STORE_ID` | `12345` (Step 2で確認) | ストアID |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL` | `67890` (Step 4-Aで取得) | 通常版バリアントID |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL` | `67891` (Step 4-Bで取得) | トライアル版バリアントID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | `whsec_...` (Step 5で取得) | Webhook署名検証用シークレット |

> **既存の環境変数**（以下は設定済みの前提）:
> - `SUPABASE_URL`
> - `SUPABASE_SERVICE_ROLE_KEY`
> - `SITE_URL`

### Step 7: .env.example 更新確認

プロジェクトの `.env.example` にLemon Squeezy関連の項目を追記する必要があります（フロントエンド側の環境変数は不要 — Lemon Squeezyの処理はすべてNetlify Functions経由で行われるため）。

```env
# ===== Lemon Squeezy Configuration (Netlify Functions) =====
# Note: These should be set in Netlify Dashboard, not in .env
# LEMONSQUEEZY_API_KEY=eyJ...
# LEMONSQUEEZY_STORE_ID=12345
# LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL=67890
# LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL=67891
# LEMONSQUEEZY_WEBHOOK_SECRET=whsec_...
```

---

## Phase 3: Supabase 確認

### Step 8: マイグレーション適用確認

以下のマイグレーションが適用されていることを確認してください:

**ファイル**: `supabase/migrations/20250920090000_add_lemonsqueezy_fields.sql`

```sql
-- 追加されるカラム:
-- profiles.lemon_customer_id (text)
-- profiles.lemon_subscription_id (text)
-- profiles.lemon_subscription_status (text)
-- profiles.lemon_trial_used (boolean, default false)
```

**確認方法:**

```bash
# Supabase CLIで確認
npx supabase db push --dry-run

# または Supabase Dashboard → SQL Editor で確認:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'lemon_%';
```

4行のカラムが返ってくればOKです。まだ適用されていない場合:

```bash
npx supabase db push
```

---

## Phase 4: デプロイ & テスト

### Step 9: デプロイ

```bash
git add .
git commit -m "chore: configure Lemon Squeezy environment"
git push
```

Netlifyで自動デプロイされるのを待つか、手動でトリガーしてください。

### Step 10: Webhook 疎通テスト

1. **Lemon Squeezy Dashboard** → **Settings** → **Webhooks**
2. 作成したWebhookの **「Send test」** ボタンをクリック
3. Netlify Functions のログを確認:
   - Netlify Dashboard → **Logs** → **Functions**
   - `lemonsqueezyWebhook` の実行ログを確認
4. ステータスコード `200` が返ることを確認

### Step 11: E2E サブスクリプションテスト

#### 11-1. 新規サブスクリプション（トライアル付き）

1. テスト用のユーザーアカウントを作成（海外ユーザーとして）
   - Supabase で `profiles.country` を `US` に設定
2. `#pricing` ページまたは `#account` ページから「プランを選択」をクリック
3. Lemon Squeezy のチェックアウトページにリダイレクトされることを確認
4. **テストカード** で決済:

| 項目 | 値 |
|------|-----|
| **カード番号** | `4242 4242 4242 4242` |
| **有効期限** | 任意の未来日 (例: `12/30`) |
| **CVC** | 任意の3桁 (例: `123`) |
| **名前** | 任意 |
| **メール** | Supabaseに登録したメールアドレス |

5. 決済完了後、Webhookが発火して以下が更新されることを確認:
   - `profiles.lemon_customer_id` が設定される
   - `profiles.lemon_subscription_id` が設定される
   - `profiles.lemon_subscription_status` = `on_trial` または `active`
   - `profiles.rank` = `standard_global`
   - `profiles.lemon_trial_used` = `true`

#### 11-2. Customer Portal

1. `#account` ページで「プラン確認・変更」ボタンをクリック
2. Lemon Squeezy のカスタマーポータルが開くことを確認
3. ポータルでサブスクリプションの確認・解約ができることを確認

#### 11-3. 解約テスト

1. ポータルからサブスクリプションを解約
2. Webhookが発火して以下が更新されることを確認:
   - `profiles.lemon_subscription_status` = `cancelled`
   - `profiles.rank` = `free`

---

## コード構成（参考）

既に実装済みのファイル一覧:

```
netlify/functions/
├── lemonsqueezyWebhook.ts      # Webhookハンドラー
│   - 署名検証 (HMAC-SHA256)
│   - subscription_created/updated/expired/cancelled 処理
│   - profiles テーブルの rank / lemon_* カラム更新
│
├── lemonsqueezyPortal.ts       # カスタマーポータルURL取得
│   - 認証ユーザーの lemon_customer_id からポータルURLを返す
│
└── lemonsqueezyResolveLink.ts  # チェックアウト/ポータルリンク統合
    - 新規ユーザー → チェックアウトURL生成
    - 既存サブスク → ポータルURL取得
    - トライアル未使用 → トライアル付きバリアントを使用

src/components/
├── subscription/
│   └── PricingTable.tsx        # プラン選択画面
│       - 海外ユーザー → lemonsqueezyResolveLink API呼び出し
│       - 日本ユーザー → Stripe Checkout
│
└── ui/
    └── AccountModal.tsx        # アカウント管理画面
        - プラン表示・管理ボタン
        - 海外ユーザー → lemonsqueezyResolveLink / lemonsqueezyPortal

supabase/migrations/
└── 20250920090000_add_lemonsqueezy_fields.sql
    - lemon_customer_id, lemon_subscription_id,
      lemon_subscription_status, lemon_trial_used カラム追加
```

---

## 環境変数一覧（まとめ）

### Netlify Dashboard で設定する変数

| 変数名 | 本番/テスト | 説明 |
|--------|------------|------|
| `LEMONSQUEEZY_API_KEY` | テストモードキー | API認証 |
| `LEMONSQUEEZY_STORE_ID` | 共通 | ストア識別 |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL` | テスト用バリアントID | 通常月額 |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL` | テスト用バリアントID | トライアル付き月額 |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | テスト用シークレット | Webhook署名検証 |
| `SUPABASE_URL` | 既存 | Supabase接続 |
| `SUPABASE_SERVICE_ROLE_KEY` | 既存 | Supabase管理者権限 |
| `SITE_URL` | 既存 | リダイレクト先URL |

### フロントエンド (.env) で設定する変数

**Lemon Squeezy関連はなし** — すべてサーバーサイド（Netlify Functions）で処理されます。

---

## トラブルシューティング

### Webhookが動作しない

1. **署名が一致しない**
   - `LEMONSQUEEZY_WEBHOOK_SECRET` が正しいか確認
   - Webhook設定のSigning Secretと一致しているか確認

2. **ユーザーが見つからない**
   - Webhookのレスポンスに `"message": "user not found yet"` が返る場合
   - チェックアウト時のメールアドレスがSupabaseの`profiles.email`と一致しているか確認

3. **Netlify Functions のログを確認**
   - Netlify Dashboard → Logs → Functions → `lemonsqueezyWebhook`

### チェックアウトページにリダイレクトされない

1. `LEMONSQUEEZY_API_KEY` が正しいか確認
2. `LEMONSQUEEZY_STORE_ID` が正しいか確認
3. `LEMONSQUEEZY_VARIANT_ID_*` が正しいか確認
4. ブラウザのコンソールでエラーを確認

### ポータルURLが取得できない

1. テストモードでサブスクリプションが作成されているか確認
2. `lemon_customer_id` がprofilesに保存されているか確認
3. Lemon Squeezy APIの応答をNetlify Functionsログで確認

---

## 本番移行チェックリスト

テスト環境で検証が完了したら、以下の手順で本番に移行:

- [ ] Lemon Squeezy ダッシュボードでテストモードをOFFにする
- [ ] **本番用** APIキーを発行
- [ ] **本番用** 商品・バリアントを作成（テスト用とは別）
- [ ] **本番用** Webhookエンドポイントを作成
- [ ] Netlify環境変数を本番用に更新
- [ ] 本番環境でE2Eテストを実施

---

## 参考リンク

- [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)
- [Lemon Squeezy API Docs](https://docs.lemonsqueezy.com/api)
- [Lemon Squeezy Webhooks](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)
- [Lemon Squeezy Test Mode](https://docs.lemonsqueezy.com/guides/developer-guide/testing)
- [テストカード番号一覧](https://docs.lemonsqueezy.com/guides/developer-guide/testing#test-card-numbers)
