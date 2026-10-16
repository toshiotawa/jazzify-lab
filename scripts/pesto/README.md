# Web用PESTOモデルの最適化

Webの入力はiOSと同じ48kHz・240 samples（5ms）。推論時間が入力周期を超えると、40msの待機上限に達して音声の欠落が繰り返される。この変更では周期・音声・判定閾値を変えず、モデルの計算量を減らす。

- CQTの各カーネルから、中心窓の外側の**厳密にゼロの係数だけ**を取り除く。入力も同じ幅で切り出し、実部・虚部のチャンネル順と出力時刻を保持する。
- 入力形状を1×240に固定し、ONNX RuntimeのBASIC最適化で定数の形状計算・分岐を畳み込む。CPU専用の融合演算は使わない。
- 学習済みの非ゼロ係数、5ms stride、refill、3976 samplesのcache、低音モード、オンセット判定、欠落後の復帰処理は保持する。浮動小数点の加算順の違いによる微小な差はあり得る。

元モデルは17,015,145 bytes、現在のcompact-v2は11,150,637 bytes。係数を複製したモデルファイルを配信する代わりに、元モデルからのコピーと小さなリテラルからなる47,991 bytesの差分を追加する。Worker初期化時に一度だけモデルを復元し、元モデルと復元結果のSHA-256を検証する。Viteビルド時・プレイ中にPythonやモデル変換は実行しない。初期化時の一時メモリには元モデルと復元用バッファが必要になる。

## 再生成

```sh
python -m venv .venv-pesto-optimize
.venv-pesto-optimize/bin/pip install onnx==1.23.1 onnxruntime==1.30.0 numpy==2.5.4
.venv-pesto-optimize/bin/python scripts/pesto/optimize-pesto-onnx.py
.venv-pesto-optimize/bin/python scripts/pesto/build-pesto-model-patch.py
node scripts/pesto/verify-pesto-web-model.mjs
```

最適化ONNXの中間ファイルは一時ディレクトリへ出力する。元モデルと差分はimmutable配信のため、将来その内容を変えるときは配信パスと`PESTO_MODEL_ID`も更新する。

## 検証

`verify-pesto-web-model.mjs`はビルドが生成した配信用ONNXを読み込み、onnxruntime-web 1.20.0の単一スレッドWASMで元モデルと比較する。2400フレームについて、低音から高音の倍音付き音・小音量・無音・ノイズ・インパルス・音程変更と定期的なcache初期化を含める。再帰cacheの一致は厳密、他の出力にはfloat32の丸め誤差の許容値を設定する。実行順は毎フレーム交互にする。

compact-v1の2026-10-03の測定では中央値7.39→5.76ms、p95 8.46→6.64ms。最大差はMIDI 0.0000153、confidence 0.000000119、volume 0.00000382、cache 0。これは検証環境の値であり、利用端末の速度や実マイクでの停止解消を保証するものではない。

ブラウザ側は本番ビルドのAudioWorklet・Worker・WASMを使用し、48kHzの440Hz信号を30秒間送って確認する。元モデルとの比較には、元モデルをそのまま復元する同一形式の差分を検証用HTTPサーバーで返す。ゲーム描画や実マイクを含まない検証として扱う。

## 欠落後のPCM履歴復元

この配信モデルの3976要素のcacheは、推論結果の隠れ状態ではなく直前3976サンプルのPCMそのもの。Webでは推論が5msを超えると、35msの欠落とゼロ初期化が繰り返され、CQTの履歴不足によるconfidence低下が再発する。

Workletは8192サンプルの固定リングに原音を保持し、欠落直後に送るチャンクにだけ、**そのチャンクの開始直前**の3976サンプルを添付する。復元用バッファ2個は事前確保し、Workerから返却して再利用する。開始前はゼロ埋めし、世代変更で古い音声を使わない。通常の連続チャンクには添付・3976サンプルのコピーを行わない。追加メモリは約64KiB。

Workerはshift +0で3976サンプルの完全かつ有限な履歴を復元できた場合、モデルcacheを実PCMで復元し、trackerの持続音・同音連打ゲートを保持する。冷起動のゼロ初期化と4フレームの判定抑制は行わず、アタック包絡も実PCMから復元する。履歴が不足・不正な場合やshift +12/+24では、従来の冷起動・判定抑制を維持する。shift +12/+24のcacheはフィルタ・間引き後の音声なので原音で上書きしない。5ms周期、モデル、閾値、40msの待機上限は保持する。履歴に含まれる欠落区間を後から判定する処理は追加していない。

```sh
npm run build:app
node scripts/pesto/verify-pesto-gap-recovery.mjs
```

ビルド済みの配信ONNXを使う実際のWASMモデルに、低音〜高音の倍音付き・小音量信号を3200フレーム入力する。35msの欠落を繰り返し、200msの停止も含める。各フレームでcacheが原音履歴と厳密一致することを検証し、欠落後に実PCMを復元したprediction・confidence・volume・cacheが、欠落せずに推論を続けた参照モデルと**全て厳密一致**することを要求する。ゼロ初期化を繰り返す従来処理のconfidenceも比較する。実マイク・ゲーム描画を含む端末上の検証ではない。

10ms推論の試作とWASM 1・2・4スレッドの実測結果は、[2026-10-08の検討レポート](../../docs/pitch-performance-options-2026-10-08.md)を参照。通常音域の完全な履歴復元後のwarmup回避はすでに実装済み。10ms周期は診断設定から選択可能。2スレッドの現在の条件は末尾の節を参照。

## 5/10/20msの実装比較

[2026-10-16の比較と停止原因の切り分け](../../docs/pitch-cadence-comparison-2026-10-16.md)を参照。既定5msを維持し、音声設定の診断欄で10/20msへ切り替える。モデルの同時刻出力が一致しても、短い音の発音判定は一致しない条件がある。

```sh
npm run build:app
node scripts/pesto/compare-pesto-cadence.mjs temp/pesto-cadence/results.json
# Playwrightを検証環境へ用意し、Chromiumをインストールしてから実行
npm run build:app
PESTO_BENCHMARK_SECONDS=120 node scripts/pesto/benchmark-pesto-browser.mjs temp/pesto-cadence/browser-results.json
```

ブラウザ実行には任意の検証用Playwrightが必要（アプリ依存には追加しない）。必要なら`PESTO_PLAYWRIGHT_MODULE`へモジュールの絶対パス、`PESTO_CHROME_PATH`へChrome/Headless Shellの実行ファイルを指定する。モデル逐次再生の計測時間は実時間の取り込み負荷を表さない。ブラウザ試験は本番Worklet/Workerを使うが、実マイク・Apollo・ゲーム描画は含まない。

## compact-v2: 固定CQT窓を行列積に置き換える

各CQT Convは、入力幅とカーネル幅が一致し、時刻方向に1個の値を出す。これを `Gemm(transB=1)` と形状変換で表す。非ゼロ係数、チャンネル順、refill、cache、入力PCM、5/10/20ms周期とtrackerは変更しない。このモデル変換自体は量子化・モデル再学習・スレッド増加を行わない。加算順の違いによるfloat32丸め差は許容値内で検証する。

配信パスは `pesto-mir1k-g7-48000-240-refill-compact-v2.onnx`。Viteが元ONNXとv2差分からビルド時に生成し、旧配信と同じSHA-256を検証する。ブラウザは完成済みONNXだけを取得・ハッシュ検証する。元ONNXと既存差分は再現性および旧クライアント用に保持する。

v1とv2を実WASMで直接比較するには:

```sh
npm run build:app
PESTO_REFERENCE_PATCH=pesto-mir1k-g7-48000-240-refill-compact-v1.patch.json node scripts/pesto/verify-pesto-web-model.mjs
```

本番Worker/Workletへ同じ録音ピアノ音声を入力する負荷試験:

```sh
# 修正前ビルドで実行し、比較用Workerを退避する。
cp dist/assets/pestoPitchWorker-*.js /tmp/pesto-baseline-worker.js
# 修正後のソースをビルドする。
npm run build:app
PESTO_BENCHMARK_SECONDS=120 PESTO_BENCHMARK_INTERVALS=10 \
  node scripts/pesto/benchmark-pesto-headroom.mjs /path/to/pitch-comparison/fixtures.json /tmp/pesto-normal.json
# 同じWorker内に50msごと20msの競合処理を追加する検証専用ストレス。
PESTO_HEADROOM_VARIANTS=baseline,candidate PESTO_HEADROOM_BASELINE_WORKER=/tmp/pesto-baseline-worker.js \
  PESTO_HEADROOM_STRESS_MS=20 PESTO_BENCHMARK_SECONDS=120 \
  node scripts/pesto/benchmark-pesto-headroom.mjs /path/to/pitch-comparison/fixtures.json /tmp/pesto-stress.json
```

入力は前回のピアノ比較アーカイブにある `fixtures.json` と同じ階層の `fixtures/*.f32` を使用する。4音声のSHA-256を検証する。Playwright/Chromeの指定は既存の `PESTO_PLAYWRIGHT_MODULE` / `PESTO_CHROME_PATH`。競合処理のタイマーは検証サーバーが返すWorkerにだけ追加し、配信ソースや本番ビルドには入らない。各試行後にWorkerを終了する。

診断の前処理時間は従来の固定値0から実測へ変更し、推論時間と分離。取り込み側の転送待ちとWorker内の待ちも個別に記録する。MessagePort内で配送待ちした時間はこの2指標に含まれないため、ブラウザ試験では原音終了時刻からmonitor受信までのpipelineLagも記録する。診断p95は末尾128観測、windowsはそのsnapshotを約300msごとに収集した分布であり、全推論の直接のp95ではない。

結果と制約は [負荷改善レポート](../../docs/pesto-headroom-2026-10-16.md)を参照。

## 配信・2スレッド・低音バッファの軽量化

本番では `/main/play` と `/main/play/*` の文書だけにCOOP `same-origin` / COEP `credentialless`を設定する。アプリはこの境界に出入りするときだけ文書を再読込し、ゲーム間のSPA遷移ではAudioContextを維持する。レッスン動画・アカウント・LP・ブログ・外部埋め込み文書は対象外。Workerスクリプトには同じCOEPを設定し、mjsの固定queryで旧immutableヘッダーキャッシュを避ける。Worker内の `crossOriginIsolated`、SharedArrayBuffer、論理コア数2以上を確認して2スレッドを選び、それ以外は1スレッド。診断snapshotの `wasmThreads` で実際の設定を確認できる。開発サーバーは分離ヘッダーを付けないので1スレッドになる。

`onnxruntime-web/wasm`だけをimportし、GPU用JavaScriptを除外する。Node検証ハーネスはNode exportを持つ本体へaliasする（NodeのWASMは1スレッド）。モデル再構成はViteビルドまたは開発サーバー起動時に1回だけ実行。ブラウザは17MBの元ONNX・差分JSONを取得せず、11,150,637 bytesの完成済みONNXを1回取得する。

q=2/4のローパス係数をデシメータ生成時に保存し、240サンプル出力を借用バッファとして返す。次のfeed/reset前に読み終える必要がある。Workerはキューを逐次処理し、推論前に既存tensorへコピーするため、非同期推論中に借用バッファを上書きしない。旧実装のPCMハッシュ、リセット、待機中の追加チャンクをテストする。

```sh
npm run build:app
# 4録音ピアノから各2秒、同一PCMを1/2スレッドで逐次推論し全出力を比較。
node scripts/pesto/verify-pesto-browser-threads.mjs /path/to/fixtures.json /tmp/thread-outputs.json
# 実時間AudioWorklet→Worker試験。0は非分離・1スレッド、1は分離・対応時2スレッド。
PESTO_BENCHMARK_ISOLATED=1 PESTO_BENCHMARK_INTERVALS=5 PESTO_BENCHMARK_SECONDS=120 \
  node scripts/pesto/benchmark-pesto-headroom.mjs /path/to/fixtures.json /tmp/two-threads.json
```

Playwright/Chromeの指定は前述の環境変数を使用。結果・測定の制約は [実装レポート](../../docs/pesto-loading-threads-2026-10-16.md)を参照。
