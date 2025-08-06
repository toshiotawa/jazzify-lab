# Cloudflare R2 認証情報の確認方法

## 1. CLOUDFLARE_ACCOUNT_ID の確認方法

### 方法1: ダッシュボードから確認
1. [Cloudflareダッシュボード](https://dash.cloudflare.com/)にログイン
2. 右上のアカウント名をクリック
3. 「Account Home」を選択
4. 右側のサイドバーに「Account ID」が表示されています
   - 例: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 方法2: R2ページから確認
1. Cloudflareダッシュボードで「R2」をクリック
2. URLを確認: `https://dash.cloudflare.com/[ここがAccount ID]/r2`

## 2. R2_PUBLIC_URL の確認方法

### R2バケット作成後に確認
1. **R2バケットを作成**
   - Cloudflareダッシュボード > R2
   - 「Create bucket」をクリック
   - バケット名: `jazzify-assets`
   - Location: Asia Pacific (APAC)

2. **パブリックアクセスを有効化**
   - 作成したバケットをクリック
   - 「Settings」タブを選択
   - 「Public Access」セクションで「Allow public access」を有効化
   - 確認画面で「Allow」をクリック

3. **Public R2.dev URLを確認**
   - パブリックアクセスを有効にすると表示される
   - 形式: `https://pub-[ランダムな文字列].r2.dev`
   - 例: `https://pub-a1b2c3d4e5f6g7h8i9j0.r2.dev`

## 3. APIトークンの作成（ACCESS_KEY_IDとSECRET_ACCESS_KEY）

1. **R2 > Manage R2 API tokens**
2. **「Create API token」をクリック**
3. **トークンの設定**
   ```
   Token name: jazzify-r2-token
   Permissions: Object Read & Write
   Specify bucket: jazzify-assets
   TTL: 無期限（または必要に応じて設定）
   ```

4. **「Create API Token」をクリック**
5. **認証情報が表示される**
   ```
   Access Key ID: xxxxxxxxxxxxxxxxxxxxx
   Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   
   ⚠️ **重要**: Secret Access Keyは一度しか表示されません！必ず安全な場所に保存してください。

## 4. 環境変数の設定例

取得した値を使って環境変数を設定：

```env
# Cloudflare R2
VITE_CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
VITE_CLOUDFLARE_ACCESS_KEY_ID=1234567890abcdef1234567890abcdef
VITE_CLOUDFLARE_SECRET_ACCESS_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
VITE_R2_BUCKET_NAME=jazzify-assets
VITE_R2_PUBLIC_URL=https://pub-a1b2c3d4e5f6g7h8i9j0.r2.dev
```

## 5. 確認のタイミング

| 項目 | いつ確認できるか |
|------|-----------------|
| Account ID | Cloudflareアカウント作成後すぐ |
| R2 Public URL | R2バケット作成＆パブリックアクセス有効化後 |
| Access Key ID/Secret | APIトークン作成時 |

## トラブルシューティング

### Public URLが表示されない場合
- バケットの「Public Access」が有効になっているか確認
- 設定変更後、少し時間を置いてページを更新

### Account IDが見つからない場合
- アカウントホームページを確認
- R2ページのURLから確認

### APIトークンを忘れた場合
- 既存のトークンは再表示不可
- 新しいトークンを作成する必要があります