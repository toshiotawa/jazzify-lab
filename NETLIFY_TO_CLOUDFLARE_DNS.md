# NetlifyからCloudflareへのDNS移管手順

## ⚠️ 注意事項
DNS移管は慎重に行う必要があります。手順を間違えるとサイトにアクセスできなくなる可能性があります。

## 事前準備

### 1. 現在のDNS設定を記録
Netlifyダッシュボードで現在の設定を確認：
- Aレコード
- CNAMEレコード
- その他のレコード

### 2. Cloudflareでドメインを追加
1. Cloudflareで「Add site」
2. プランを選択（Free planでOK）
3. DNS設定のインポート

## 移管手順

### ステップ1: CloudflareでDNSレコードを設定

#### 必須レコード
```
# NetlifyのIPアドレス（例）
A     @     75.2.60.5
CNAME www   [your-site].netlify.app
```

#### Netlify DNS設定の確認方法
1. Netlifyダッシュボード > Domain settings
2. DNS panel で現在の設定を確認
3. すべてのレコードをメモ

### ステップ2: ネームサーバーの変更

1. **ドメインレジストラにログイン**
   - お名前.com、ムームードメインなど

2. **ネームサーバーを変更**
   ```
   削除:
   dns1.p07.nsone.net
   dns2.p07.nsone.net
   dns3.p07.nsone.net
   dns4.p07.nsone.net
   
   追加:
   clara.ns.cloudflare.com
   walt.ns.cloudflare.com
   ```

3. **変更を保存**

### ステップ3: 移行後の設定

#### Netlify側の設定
1. Netlify > Domain settings
2. 「Configure external DNS」を選択
3. カスタムドメインはそのまま維持

#### Cloudflare側の設定
1. SSL/TLS設定を「Full」に
2. 必要に応じてページルールを設定

## 移行のタイミング

### 推奨時間帯
- アクセスが少ない深夜～早朝
- DNS伝播に24-48時間かかる場合がある

### 移行中の影響
- 一時的にサイトにアクセスできない可能性
- メールが届かない可能性（MXレコードも移行する場合）

## トラブルシューティング

### サイトにアクセスできない場合
1. DNSレコードが正しく設定されているか確認
2. SSL証明書の設定を確認
3. Cloudflareのプロキシ設定を確認

### 元に戻す方法
ネームサーバーを元のNetlify（nsone.net）に戻す

## 代替案の再確認

**本当にDNS移管が必要ですか？**

Cloudflare R2だけを使用する場合、DNS移管は不要です。
- R2は独立したストレージサービス
- NetlifyのDNS管理で問題なし
- 将来必要になったら移管すればOK