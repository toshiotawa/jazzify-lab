# Netlify ステージング環境セットアップ手順

## 概要
`stg`ブランチを`stg.jazzify.jp`ドメインにデプロイするための設定手順です。

## 設定手順

### 1. Netlify管理画面での設定

1. [Netlify](https://app.netlify.com/)にログインし、対象のサイトを選択
2. **Site settings** → **Domain management** に移動

### 2. カスタムドメインの追加

1. **Add custom domain** をクリック
2. `stg.jazzify.jp` を入力して **Verify** をクリック
3. ドメインの所有権確認後、**Add domain** をクリック

### 3. DNS設定

DNSプロバイダー（ドメインを管理しているサービス）で以下の設定を行います：

#### CNAMEレコードの追加
- **ホスト名**: `stg`
- **タイプ**: `CNAME`
- **値**: `[your-site-name].netlify.app` （Netlifyで割り当てられたデフォルトドメイン）

例:
```
stg.jazzify.jp. CNAME your-site-name.netlify.app.
```

### 4. ブランチデプロイの設定

1. Netlify管理画面で **Site settings** → **Build & deploy** → **Continuous Deployment** に移動
2. **Branch deploys** セクションで **Edit settings** をクリック
3. 以下の設定を行います：
   - **Branch deploys**: `All` または `Let me add individual branches` を選択
   - 個別設定の場合は `stg` ブランチを追加
   - **Deploy preview** をオンにする（任意）

### 5. ブランチサブドメインの設定

1. **Domain management** → **Branch subdomains** セクションに移動
2. **Add branch subdomain** をクリック
3. 以下を設定：
   - **Branch**: `stg`
   - **Subdomain**: `stg`
4. **Save** をクリック

### 6. SSL証明書の設定

1. **Domain management** → **HTTPS** セクションを確認
2. Netlifyが自動的にSSL証明書を発行します（数分かかる場合があります）
3. 証明書が発行されたら、HTTPSでのアクセスが可能になります

## 環境変数の設定（オプション）

ステージング環境専用の環境変数を設定する場合：

1. **Site settings** → **Environment variables** に移動
2. **Add a variable** をクリック
3. 以下のように設定：
   - **Key**: 環境変数名（例: `API_URL`）
   - **Values**: 
     - **Production**: 本番環境の値
     - **Deploy previews**: プレビュー環境の値
     - **Branch deploys (stg)**: ステージング環境の値

## netlify.tomlの設定

`netlify.toml`には以下の設定が追加済みです：

```toml
# ステージングブランチ用の設定
[context.stg]
  command = "npm ci && npm run build"
  
[context.stg.environment]
  NODE_ENV = "staging"
  VITE_APP_ENV = "staging"
```

## 動作確認

1. `stg`ブランチに変更をプッシュ
2. Netlifyのデプロイログを確認
3. `https://stg.jazzify.jp` にアクセスして動作を確認

## トラブルシューティング

### DNS設定が反映されない場合
- DNS設定の反映には最大48時間かかる場合があります
- `nslookup stg.jazzify.jp` コマンドでDNS設定を確認

### デプロイが失敗する場合
- Netlifyのデプロイログを確認
- `netlify.toml`の設定を確認
- ビルドコマンドが正しいか確認

### SSL証明書が発行されない場合
- DNS設定が正しく完了しているか確認
- Netlify管理画面で手動で証明書の再発行を試みる