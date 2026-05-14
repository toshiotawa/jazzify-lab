# iOS パフォーマンス・検証メモ

## レッスンタブ / 学びの旅マップ

手動で以下を確認するとよいです（リリース前チェック）。

- コース行の**余白を含む全体**がタップで反応するか（特に `Spacer` 付近）。
- 一覧の prefetch が未完でも**タップ直後にマップへ遷移**するか（短いローディングのあとマップが表示されるか）。
- マップ画面を戻ったあと、**該当コースの進捗バッジ**が期待どおりか（親へのコールバック + 単体の progress 再取得）。
- マップの**スクロール・ノードタップ**が以前より軽く感じるか（端末による）。

ビルド検証: `xcodebuild -project Jazzify.xcodeproj -scheme Jazzify -configuration Debug -destination 'generic/platform=iOS' build`
