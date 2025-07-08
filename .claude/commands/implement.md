# IMPLEMENT フェーズ

# ユーザの入力
#$ARGUMENTS

## 目的
plan.mdに基づきタスク単位で実装を行う。Draft PRを継続的に更新する。

## 注意事項
- 常にultrathinkでしっかりと考えて作業を行うこと
- 全てのやり取りに関して日本語を使用すること

## 必要な入力ファイル
- `docs/plan/plan_{TIMESTAMP}.md` - 実装計画書
- GitHub Issues（もしあれば）
- 関連する既存ファイル・コード

## タスクに含まれるべきTODO
1. ユーザの指示を理解し、実装開始をコンソールで通知
2. 最新の `docs/plan/plan_{TIMESTAMP}.md` ファイルを読み込み、実装計画を確認
3. 現在のブランチを確認し、適切なブランチにいることを確認
4. プランに従った実装を段階的に実行
5. `@ai-rules/COMMIT_AND_PR_GUIDELINES.md`に従ったコミット・プッシュ
6. Draft PRを作成または更新（初回実装時は作成、継続時は更新）
7. 実装内容の詳細を `docs/implement/implement_{TIMESTAMP}.md` に記録
8. 実装完了とファイル保存に関して`afplay /System/Library/Sounds/Sosumi.aiff`を実行しユーザに通知
9. 関連するplanファイル、実装詳細ファイル、PR番号をコンソール出力

## ブランチ・コミット規則
- ブランチ命名: `@ai-rules/COMMIT_AND_PR_GUIDELINES.md` に準拠
- コミットメッセージ: 同ガイドラインに従う
- 小粒コミット: タスク単位で適切に分割
- Draft PR: 実装初回時は作成、継続時は更新


## 出力ファイル
- `docs/implement/implement_{TIMESTAMP}.md` - 実装詳細記録

## 最終出力形式

### 実装完了の場合
```yaml
status: SUCCESS
next: TEST
details: "実装完了。implement_{TIMESTAMP}.mdに詳細記録。テストフェーズへ移行。"