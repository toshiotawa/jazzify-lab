# 同音のピッチ揺れによる再通知の修正

## 問題と変更

たとえば予測60.45はMIDI60に丸められるが、中心60から45cent離れているため、従来の40cent許容判定で音程変更へ進み、同じ60のnoteOff/noteOnを繰り返す。WebとiOSのPitchOnsetTrackerで、音程変更の条件に「丸めたMIDI音も現在音と異なること」を追加する。同音の本当の再アタックは既存の音量・包絡ゲートで扱う。

ウェイト、ONNX、較正、prediction/confidence/volume、音域、楽器別設定は変更しない。生F0の精度改善ではなく、通知処理の不具合修正である。新しいループ、タイマー、高頻度React state更新、ホットパスの割り当てはない。既存分岐に整数比較を1つ追加する。

## 再現と回帰確認

Webの8テストとiOSの3テストを追加し、低音・高音の±41〜49centの持続揺れ、高速反応ON/OFF、本当の半音レガート、同音再アタック、無音後の解放を確認する。既存の期待音補助・連打・オクターブ抑制テストも実行する。

`evaluate-onset-drift.mjs`は、cf144d2のtrackerを厳密なGit blob SHAで固定し、修正後と同じ実モデル出力を与える。各trackerの包絡は本番のPitchAttackEnvelopeで計算する。感度5、通常反応、5ms、冷起動4フレーム抑制、期待音・同音待ちマスクなし。逐次WASM再生であり、実マイクのリアルタイム性能試験ではない。

既存70音源と前回追加60音源を各6条件（原音、小音量、ノイズ、反響、100ms/200ms短音）で再生する。楽器・音源・音域・条件・強弱ごとの集計、各試行のnoteOn列、PCM/model/sourceハッシュをJSONへ保存する。最初の名目正解音の取りこぼし・遅延、各試行の名目不正解通知増加を回帰として終了コード1にする。

```sh
npm ci
python3 scripts/pesto/materialize-pesto-model.py --output dist/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx
python3 scripts/pesto/prepare-multi-instrument.py --output /tmp/pesto-development
python3 scripts/pesto/prepare-padding-holdout.py --output /tmp/pesto-holdout
node scripts/pesto/evaluate-onset-drift.mjs /tmp/pesto-development/manifest.json /tmp/pesto-development-onset.json
node scripts/pesto/evaluate-onset-drift.mjs /tmp/pesto-holdout/manifest.json /tmp/pesto-holdout-onset.json
```

結果はPESTO offline evaluationのonset-drift-replayジョブと成果物に残す。Python元実装・新規ONNX export・配信ONNX・実WASMの既存照合も継続する。

名目MIDIは手作業のフレーム別F0注釈ではない。同一音サンプルの2回目以降の正解通知を重複の診断指標とするが、実演奏のオンセット精度とは呼ばない。既に調査済みの音源であり、新規のブラインドテストでもない。歌声は単音サンプルであり、連続歌唱の保証にはならない。

## 採用しなかった補正

周期性に基づいて生音程を補正する試作は、ノイズ下のフルートなどに悪化が見られたため採用しない。試作を本番コードから除去する。197音源のローカル実験は実行環境停止で詳細ログと未保存ファイルを回収できなくなったため、その集計値をこのPRの保存済み検証結果とはしない。上記130音源の再現可能なCI結果を別途使用する。

追加学習は行わない。今後行うなら楽器個体・歌い手・録音セッションを分離した複数楽器の評価を先に用意し、全体平均だけでなく各楽器・音域の悪化を判定する。

## 低音モードの入力と取りこぼしの内訳

+12/+24では、モデルが48 kHz換算で1/2または1/4に間引いた入力を受け取り、推定値を実音へ戻す。WebとiOSで、復元不能な音程は無音程としてtrackerに渡し、音量・リリースの観測は続ける。丸めると128になる実音も除外する。iOSの再アタック用包絡には間引き前の全チャンクを48 kHzの順序で渡す。これまでは2個・4個単位で最後のチャンクだけが入っていた。推論準備で使うバッファの寿命は同期推論の終了まで。

再生レポートの各試行には、通常モードで名目音高を一度も通知できなかった場合の内訳を加えた。暖機後の音符区間のうち、加工前PCMの5msエネルギーが−60dBFSを超えるフレームに限定する。名目MIDIへ丸められた数、そのうちモデル音量が開始閾値を超えた数、有音confidenceが閾値以上の数、両方を同時に満たした数を保存する。全試行の通知判定には従来どおり末尾の無音区間も含む。eligible-frame-without-notificationは、開始条件を満たすフレームがあった試行であり、その1フレームで採用すべきだったという判定ではない。音量やconfidenceの閾値は感度5の値を使用する。正解ラベルは音源の名目音高であり、マイク実演の注釈とは区別する。
