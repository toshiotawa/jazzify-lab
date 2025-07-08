# Docker Desktop セットアップガイド

**作成日時**: 2025年07月08日  
**対象**: Jazz Learning Game 開発者  
**前提条件**: Windows 11、WSL2環境

## 📋 概要

このガイドでは、Jazz Learning Game プロジェクトでSupabase CLIを使用するために必要なDocker Desktop環境の構築手順を説明します。

## 🔍 現在の環境確認

**WSL2環境**: ✅ 確認済み
- Linux version 6.6.87.1-microsoft-standard-WSL2
- WSL2環境は正常に動作しています

## 🛠️ Docker Desktop インストール手順

### 1. システム要件確認

**Windows 11の要件**:
- Windows 11 64ビット（Home または Pro バージョン 21H2以上）
- Enterprise または Education バージョン 21H2以上
- WSL2機能が有効化されている（✅ 確認済み）

### 2. Docker Desktop ダウンロード

1. [Docker公式サイト](https://www.docker.com/products/docker-desktop/)にアクセス
2. 「Download Docker Desktop」をクリック
3. 「Docker Desktop for Windows」をダウンロード

### 3. インストール実行

1. ダウンロードした `Docker Desktop Installer.exe` をダブルクリック
2. インストーラーが起動したら設定を確認：
   - ✅ **Use WSL 2 instead of Hyper-V (recommended)**
   - ✅ **Add shortcut to desktop**
3. 「OK」をクリックしてインストール開始
4. インストール完了後、再起動が必要な場合があります

### 4. 初期設定

1. Docker Desktop を起動
2. **Settings** → **General** で以下を確認：
   - ✅ **Use WSL 2 based engine**
3. **Settings** → **Resources** → **WSL Integration** で：
   - ✅ **Enable integration with my default WSL distro**
   - ✅ **Ubuntu** (使用中のディストリビューション)

### 5. 動作確認

**WSL2環境で以下コマンドを実行**:

```bash
# Docker バージョン確認
docker --version

# Docker Compose バージョン確認
docker-compose --version

# Docker 動作テスト
docker run hello-world
```

## 🚀 Supabase CLI 統合テスト

Docker Desktop の準備が完了したら、以下のコマンドでSupabase CLIをテストします：

```bash
# プロジェクトディレクトリに移動
cd /mnt/c/Users/saita/Documents/jazzgame

# Supabase ローカル環境起動
npm run supabase:start

# 初回起動時の出力例
# Started supabase local development setup.
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

## 📊 期待される結果

Docker Desktop が正常にインストールされると、以下が利用可能になります：

- **Supabase ローカル環境**: PostgreSQL + Studio
- **自動マイグレーション**: データベーススキーマ管理
- **型定義生成**: TypeScript 型安全性
- **開発効率向上**: ワンコマンドでの環境構築

## 🚨 よくある問題とトラブルシューティング

### 問題1: WSL2統合エラー
```
Error: WSL 2 installation is incomplete
```

**解決策**:
1. PowerShellを管理者として実行
2. `wsl --update` を実行
3. Windows を再起動

### 問題2: Docker デーモンエラー
```
Cannot connect to the Docker daemon
```

**解決策**:
1. Docker Desktop が起動していることを確認
2. タスクマネージャーでDockerプロセスを確認
3. 必要に応じてDocker Desktop を再起動

### 問題3: ポート競合エラー
```
Port 54321 is already in use
```

**解決策**:
```bash
# 使用中のポートを確認
netstat -an | grep 54321

# Supabase を停止
npm run supabase:stop

# 再起動
npm run supabase:start
```

## 🔗 参考リンク

- [Docker Desktop公式ドキュメント](https://docs.docker.com/desktop/windows/)
- [WSL2 Docker統合ガイド](https://docs.docker.com/desktop/windows/wsl/)
- [Supabase CLI ドキュメント](https://supabase.com/docs/guides/cli/local-development)

## 📋 チェックリスト

インストール完了後、以下を確認してください：

- [ ] Docker Desktop が正常に起動
- [ ] WSL2統合が有効化されている  
- [ ] `docker --version` コマンドが成功
- [ ] `docker run hello-world` が成功
- [ ] `npm run supabase:start` が成功
- [ ] Supabase Studio (http://localhost:54323) にアクセス可能

---

**次のステップ**: Docker Desktop インストール後、`npm run supabase:start` を実行してSupabase CLIの動作確認を行ってください。