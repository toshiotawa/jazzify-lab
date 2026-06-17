# iOS パフォーマンス・検証メモ

## レッスンタブ / 学びの旅マップ

手動で以下を確認するとよいです（リリース前チェック）。

- コース行の**余白を含む全体**がタップで反応するか（特に `Spacer` 付近）。
- 一覧の prefetch が未完でも**タップ直後にマップへ遷移**するか（短いローディングのあとマップが表示されるか）。
- マップ画面を戻ったあと、**該当コースの進捗バッジ**が期待どおりか（親へのコールバック + 単体の progress 再取得）。
- マップの**スクロール・ノードタップ**が以前より軽く感じるか（端末による）。
- 目的別コースのマップ表示後 **10 秒間**、手を離した状態でノード・タイトルが drift しないか（開発者テスト vs Chord Run 初級など）。
- prefetch 未完で即タップしたあとも、レッスン読込完了後に frontier が中央付近で安定するか。
- プレミアムコースを開いた直後（billing refresh 中）も drift しないか。
- iPhone で**スクロール全体が勝手にずれない**か（viewport 連動・scrollTarget 重複適用の回帰確認）。

ビルド検証: `xcodebuild -project Jazzify.xcodeproj -scheme Jazzify -configuration Debug -destination 'generic/platform=iOS' build`
