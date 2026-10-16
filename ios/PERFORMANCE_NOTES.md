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
- サバイバル降下マップでも同様に、表示後しばらく手を離して上下 drift しないか。

ビルド検証: `xcodebuild -project Jazzify.xcodeproj -scheme Jazzify -configuration Debug -destination 'generic/platform=iOS' build`

## PESTO compact-v2 / 入力Tensor再利用（2026-10-16）

- Xcodeの「Build compact PESTO model」で、チェックイン済み元ONNXとWeb版と同じ差分から完成済みモデルを生成して同梱する。Python 3（標準ライブラリのみ）が必要。アプリ起動時の再構成・ダウンロードはない。
- 配信モデルは11,150,637 bytes、SHA-256 `c50ca16a07297ddc2b788403268a43736cceb792ec599746da7d5486bca974b8`。元モデルと学習係数は同じ。既存2モデル（合計34,034,416 bytes）はアプリのCopy Bundle Resourcesから除外。比較用のrefill元モデルだけをテストbundleへ入れる。IPAの圧縮後サイズは別途確認する。
- audio/cacheのORTValue、NSMutableData、入力辞書、出力名Setを初期化時に作り、通常推論で再生成しない。音声は固定960 bytesを毎推論コピーする（通常5msで約192KB/s）。生PCMをアタック包絡用に維持し、capture pool・低音域バッファが切り替わってもTensorの参照先を変えないためのコピー。ORT内部や出力Tensorの割り当ては残る。
- q=2/4のローパス係数はデシメータ初期化時に計算。出力は既存の固定バッファを継続利用。フィルタ式・PCM順・tracker・推論周期・欠落時のリセットは変更しない。
- 新しいtimer/polling、UIの高頻度更新はない。通常推論に追加した処理は上記960Bの固定コピーで、Tensorラッパー生成を置き換える。

### ネイティブ検証とスレッド比較

`PestoDecimatorTests` はq=1/2/4のPCMを旧式の係数計算とbit単位で比較し、出力アドレス維持と途中リセットを確認する。`PestoModelInputsTests` は同じORTValueが更新後の音声/cacheを読み、原音を変更しないことを確認する。

`PestoNativeModelTests` は同梱済みcompact-v2とテストbundleの元モデルを実際のONNX Runtimeで比較する。低音～高音の倍音付き減衰音・無音・cacheリセットを含む480フレームを、自動/1/2スレッドの各設定で入力。cacheは厳密一致、他の出力はfloat32丸めの許容差内を要求する。計測はXCTestの `PESTO-native-thread-comparison` JSON attachmentに保存する。`configuredThreads=0`は自動選択を表す。これは逐次再生であり、実時間のマイク取り込み・ゲーム描画・発熱試験ではない。

Releaseは既存のONNX Runtime自動選択を維持する。DebugではXcode SchemeのRun > Arguments Passed On Launchに `-pesto-intra-op-threads 1` または `-pesto-intra-op-threads 2` を指定できる。変更後はアプリを終了して再起動する。指定なし/不正値は自動選択。モニタsnapshotの `intraOpThreads=nil`も自動選択であり、実際のスレッド数が1という意味ではない。

CIはMac上でiOS Simulator向けアプリをビルドし、上記テストを実行する。ローカルでの実行例:

```sh
python3 -m unittest discover -s scripts/pesto -p 'test_materialize_pesto_model.py' -v
xcodebuild -project ios/Jazzify.xcodeproj -scheme JazzifyPesto -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:JazzifyPestoTests/PestoNativeModelTests \
  -only-testing:JazzifyPestoTests/PestoModelInputsTests \
  -only-testing:JazzifyPestoTests/PestoDecimatorTests test
```

実機では自動/1/2スレッドを同一iPhone・同一音源・ゲーム描画ありで各2分以上比較する。通常音域と低音域の認識、同音連打、droppedSamples/discontinuities、推論p95と通知遅延を確認し、さらに長時間使用時の発熱・消費電力を見る。Simulatorの速度をiPhoneの性能として採用しない。実機での優位が確認されるまで2スレッドに固定しない。

PESTO検証は専用の `JazzifyPesto` scheme / `JazzifyPestoTests` targetで実行する。既存 `JazzifyTests/EarTrainingChordOsmdTimingTests.swift` が削除済みの `resolvePhraseTiming` / `computeFromPhrase` を参照して全体テストのコンパイルを止めるため、今回の検証を別ターゲットにした。既存のテストや対象APIは変更していない。

cacheはエンジン所有の `NSMutableData` をORTValueへ直接渡す。外部ポインタを `NSMutableData(bytesNoCopy:freeWhenDone:false)` で再ラップすると、FoundationのmutableBytes取得時に別のメモリへ移る場合があり、再利用したTensorへ更新が届かない。この差をネイティブ試験で検出したため、エンジンの更新先とTensorの参照先を同じ所有バッファへ統一した。テストは両者のポインタ一致と値更新を検証する。
