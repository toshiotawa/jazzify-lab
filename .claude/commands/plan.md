# PLAN フェーズ

## 目的
実装方針の決定、タスク分解、ファイル変更計画、テスト方針を策定する。

## 必要な入力ファイル
- `docs/investigate/investigate_{TIMESTAMP}.md` - 調査結果

## 注意事項
- 全ての処理においてultrathinkでしっかりと考えて作業を行うこと。
- 全てのやり取りに関して日本語を使用すること
- この処理中はコードを一才変更してはいけません。

# ユーザの入力
#$ARGUMENTS


## テスト方針
- **エンドポイントテスト**: 必須（FastAPI: TestClient / httpx）
- **統合テスト**: 必要に応じて実施
- **E2Eテスト**: UI変更がある場合は実施
- **Docker環境での実行**: 全てのテストはDocker環境で実行

## タスクに含まれるべきTODO
1. ユーザの指示を理解する
2. 最新の `docs/investigate/investigate_{TIMESTAMP}.md` を読み込み、調査結果を確認
3. 調査結果を元に実装方針を決定
4. 詳細実装タスクを分解し、優先度を設定
5. ファイル変更計画を作成（新規作成・修正・削除）
6. テスト戦略を策定（単体・統合・E2E）
7. リスク分析と対策を検討
8. 実装計画を文書化し、`docs/plan/plan_{TIMESTAMP}.md`に保存
9. 必要に応じて `@ai-rules/ISSUE_GUIDELINES.md` を確認してGitHub Issue を作成
10. プラン完成とファイル保存に関して`afplay /System/Library/Sounds/Sosumi.aiff`を実行しユーザに通知
11. プランファイル名、作成されたIssue番号（もしあれば）をコンソール出力

## GitHub Issue作成（必要に応じて）
`@ai-rules/ISSUE_GUIDELINES.md`に従い、以下を含むIssueを作成：
- タイトル
- 概要
- 受入基準
- タスクリスト
- 優先度・ラベル

## 出力ファイル
- `docs/plan/plan_{TIMESTAMP}.md`

## 最終出力形式

### プラン策定完了の場合
```yaml
status: SUCCESS
next: IMPLEMENT
details: "実装プラン策定完了。plan_{TIMESTAMP}.mdに詳細記録。実装フェーズに移行。"