---
name: bump-app-version
description: >-
  Bumps Jazzify iOS MARKETING_VERSION by a patch (0.0.1). Use when the user asks
  to アプリバージョン上げ, バージョン上げ, bump app version, MARKETING_VERSION,
  or patch bump the native app. Default: code only, no DB migration.
---

# Bump App Version

Jazzify ネイティブ（iOS）の marketing version をパッチ上げする。

正本: `ios/project.yml` の `MARKETING_VERSION`  
同期先: `ios/Jazzify.xcodeproj/project.pbxproj` の Debug / Release 両方の `MARKETING_VERSION`

`Info.plist` は `$(MARKETING_VERSION)` 参照のため編集しない。  
`CURRENT_PROJECT_VERSION`（ビルド番号）はデフォルトでは触らない。  
`package.json` の `version` は対象外。

## Default behavior

- 上げ幅: **patch +0.0.1**（例: `1.4.2` → `1.4.3`）
- **DB は不要**（`app_release_versions` マイグレーションを作らない）
- コミットはユーザーが明示したときだけ

ユーザーが「DBも」「アップデート通知も」「app_release_versions」と言った場合のみ、下記 Optional DB を行う。

## Workflow

```
- [ ] 1. Read current MARKETING_VERSION from ios/project.yml
- [ ] 2. Compute next patch (major.minor.patch + 1 on patch)
- [ ] 3. Update ios/project.yml
- [ ] 4. Update both MARKETING_VERSION entries in ios/Jazzify.xcodeproj/project.pbxproj
- [ ] 5. Grep to confirm no stale old version remains in those two files
- [ ] 6. Report old → new (Japanese, concise)
```

### 1–2. Compute next version

`ios/project.yml`:

```yaml
MARKETING_VERSION: "X.Y.Z"
```

次バージョンは `X.Y.(Z+1)`。メジャー/マイナー上げはユーザー指定時のみ。

### 3–4. Edit files

1. `ios/project.yml` — `settings.base.MARKETING_VERSION`
2. `ios/Jazzify.xcodeproj/project.pbxproj` — Debug / Release の両方（通常 2 箇所）

### 5. Verify

```bash
rg 'MARKETING_VERSION' ios/project.yml ios/Jazzify.xcodeproj/project.pbxproj
```

新旧が混在していないこと。

## Optional: DB（明示時のみ）

アップデート通知用に `public.app_release_versions` を揃えるときだけ、  
`supabase/migrations/` に既存パターンで SQL を追加する。

テンプレ（最新マイグレーションをコピーして `latest_version` だけ差し替え）:

- ファイル名: `YYYYMMDDHHMMSS_app_release_versions_latest_X_Y_Z.sql`
- `latest_version` を新しい MARKETING_VERSION に合わせる
- `ON CONFLICT (platform) DO UPDATE` パターンを維持
- App Store URL / 文言は既存マイグレーションと同じでよい

ユーザーが「DBは不要」と言ったらこのステップはスキップする。

## Do not

- `package.json` の version を勝手に上げない
- `CURRENT_PROJECT_VERSION` を勝手に上げない（明示時のみ）
- DB マイグレーションをデフォルトで作らない
- コミットを勝手に作らない
