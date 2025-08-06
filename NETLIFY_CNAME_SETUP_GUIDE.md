# NetlifyでCNAMEレコードを追加する詳細手順

## 📍 現在の状況
- ドメイン（jazzify.jp）はNetlifyで管理中
- R2バケット（jazzify-assets）は作成済み

## ステップ1: Netlifyダッシュボードにアクセス

1. **Netlifyにログイン**
   - https://app.netlify.com/

2. **あなたのサイトを選択**
   - jazzify.jpが設定されているサイトをクリック

## ステップ2: DNS設定画面に移動

1. **上部メニューから「Domain settings」をクリック**
   
   ![Domain settings location]
   ```
   Site overview | Deploys | Domain settings | ...
                                ↑ ここをクリック
   ```

2. **「Domain management」セクションを確認**
   - Primary domain: jazzify.jp と表示されているはず

3. **「Go to DNS panel」ボタンをクリック**
   ```
   Domain management
   Primary domain: jazzify.jp
   [Go to DNS panel] ← このボタンをクリック
   ```

## ステップ3: CNAMEレコードを追加

1. **DNS panel画面で「Add new record」をクリック**
   ```
   DNS settings for jazzify.jp
   
   [Add new record] ← このボタンをクリック
   ```

2. **以下の情報を入力**

   | フィールド | 入力する値 |
   |-----------|-----------|
   | Record type | CNAME（ドロップダウンから選択） |
   | Name | cdn |
   | Value | jazzify-assets.r2.dev |
   | TTL | 3600（デフォルトのままでOK） |

   ⚠️ **重要**: 
   - Nameには「cdn」のみ（.jazzify.jpは不要）
   - Valueには「あなたのR2バケット名.r2.dev」

3. **「Save」をクリック**

## ステップ4: 設定の確認

追加後、DNS recordsリストに以下が表示されます：

```
Type    Name    Value                    TTL
CNAME   cdn     jazzify-assets.r2.dev    3600
```

## よくある間違いと対処法

### ❌ 間違い例
```
Name: cdn.jazzify.jp  ← .jazzify.jpは不要！
Value: https://jazzify-assets.r2.dev  ← https://は不要！
```

### ✅ 正しい例
```
Name: cdn
Value: jazzify-assets.r2.dev
```

## 次のステップ

CNAMEレコードを追加したら：

1. **5-10分待つ**（DNS反映のため）

2. **Cloudflare R2でカスタムドメインを設定**
   - R2ダッシュボード → バケット → Settings → Custom Domains
   - 「cdn.jazzify.jp」を追加

## 確認方法

ターミナルやコマンドプロンプトで：
```bash
nslookup cdn.jazzify.jp
```

成功すると以下のような結果が表示されます：
```
cdn.jazzify.jp  canonical name = jazzify-assets.r2.dev
```

## トラブルシューティング

### 「Add new record」ボタンが見つからない
→ 「Go to DNS panel」をクリックしているか確認

### レコードが保存できない
→ Name欄に余分な文字（スペースなど）が入っていないか確認

### R2で「Custom domain is not pointing」エラー
→ DNS反映まで最大48時間かかる場合があります

## 画面が違う場合

Netlifyは時々UIを更新します。基本的な流れ：
1. Site settings または Domain settings
2. DNS configuration/DNS panel
3. Add record/Add new record
4. CNAMEレコードを追加

これで設定完了です！