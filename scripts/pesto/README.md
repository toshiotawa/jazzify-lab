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

## 複数楽器の生音程評価（オフライン専用）

`evaluate-multi-instrument.mjs` は本番compact-v2の**生のprediction/confidence**を5msごとに読み、tracker・期待音補助・オクターブ補正を通さず評価する。ゲーム側の処理や学習済み重みは変更しない。

```sh
npm ci
npm run build:app
npm run test:pesto-evaluation
node scripts/pesto/smoke-multi-instrument.mjs
# FFmpegとPython標準ライブラリのみ。外部MP3はダウンロードしてSHA-256を検証する。
python scripts/pesto/prepare-multi-instrument.py --output /tmp/pesto-multi
node scripts/pesto/evaluate-multi-instrument.mjs /tmp/pesto-multi/manifest.json /tmp/pesto-results.json
# 候補ONNXは現行と同じaudio/cache入出力仕様が必要。
# training-groups.jsonは候補の学習に使ったinstrument/speakerグループIDの配列。
node scripts/pesto/evaluate-multi-instrument.mjs /tmp/pesto-multi/manifest.json /tmp/pesto-candidate-results.json candidate.onnx training-groups.json
```

音源はNSynth acousticの63サンプル（11音源ID、3音高、取得可能な弱/強velocity）と、リポジトリ内Felt Piano SF2の7つの**元録音**。波形を合成して楽器録音の代用にしない。NSynthの鍵盤ファミリーを具体的なピアノ機種だとは断定しない。ベースは1音源ID、Felt Pianoも1音源IDで、母集団の代表性は限定される。歌声はacoustic vocalサンプルであり、連続歌唱、子音、ポルタメント、実際の歌い手の独立評価を保証しない。

NSynth元資料: https://magenta.tensorflow.org/datasets/nsynth （CC BY 4.0）。MP3配布・変換: https://github.com/vvolhejn/nsynth 。取得元URL・source SHA-256を`scripts/pesto/multi-instrument-sources.json`へ固定。準備時のFFmpeg版、デコードPCMのSHA-256、SF2のSHA-256・sample headerも結果JSONへ保存する。`--lock-sources`は音源リストを意図的に更新するときだけ使用し、変更内容と来歴をレビューする。MP3/WAV/PCMをGitへ追加しない。

参照値は**名目MIDI音番号**。50cent以内の一致率を`rawRpa50`として集計するが、実測したフレーム別F0との正式なRPAではない。録音の調律、ビブラート、倍音・非調和性、元データのラベル不整合も数値に影響するため、不一致をすべてモデルの誤りと断定しない。

- 全音源を48kHz mono float32にして先頭0.8秒を取得する。通常条件は最初の0.6秒、短音は0.1/0.2秒で切り、末尾2msにfadeを付けて0.2秒のゼロを追加する。短音条件は**人工的に切り出したアタック**であり、実奏のスタッカート・連打ではない。
- 各条件でcacheをゼロ初期化する。原音チャンク終端へ時刻を合わせ、精度が上がるような遅延補正やwarmup除外をしない。attackは0〜100ms、sustainは100ms〜切断時刻、silenceはゼロ末尾の最後50ms。原音先頭が必ず物理的な発音時刻とは限らない。
- cleanの5msチャンク平均エネルギーが−60dBFS超のフレームだけを名目音高の評価対象にする。**条件を加える前の同じマスク**を全モデルで使い、confidenceで評価分母を減らさない。各行のvoicedFramesを併記し、対象0フレームはnullにする。これは厳密なvoiced/unvoiced注釈ではない。
- quietは−24dB、noiseはcleanのRMSを基準にした20dB SNRの固定seed白色雑音、反響は35/70msの2tap（0.25/0.1）。実際の部屋IR・マイク・ブラウザ音声処理・伴奏の代用とはしない。
- confidence無条件の音高一致率、confidence≥0.5でのrecall/precision/coverage、オクターブ誤り、中央値cent誤差・confidence、人工ゼロ末尾の高confidence出力率を分離する。楽器・音源ID・絶対音域（<48、48〜71、≥72）・velocity・条件・phaseで集計。summary内のcasesは**音源×条件×phaseの行数**であり、独立録音の数ではない。
- 実行はNode内のonnxruntime-web単一スレッドWASMの逐次再生。推論時間を打鍵から通知までの遅延や実時間欠落の測定値にしない。NodeのWASM統合smokeは440Hzの人工信号で、楽器精度の根拠にはしない。

候補比較は同じPCMハッシュ・条件・phase・評価プロトコルを要求する。学習グループが評価instrumentと重なる場合は拒否。各音源×条件×phaseの行と各楽器/音域/条件などで音高一致率・confidence付きrecall・オクターブ誤り・人工無音の誤反応を比較し、1 percentage point超の悪化があれば終了コード1。全体平均の改善だけで合格にしない。学習グループは申告値なので、それ自体が正しいことや、元のPESTOの学習データとの完全非重複を証明する仕組みではない。評価対象フレームがない楽器は判定不能とする。小さいサンプルでの非悪化は追加学習の成功・汎化・本番採用の保証ではない。

追加学習を行う場合は、評価に使った音源ID/歌い手を学習から丸ごと分離し、同じ録音の別音高・加工版も学習へ回さない。調整用validationと最終testをさらに別の楽器個体・歌い手・録音セッションで用意する。今回のsubsetを見て手法を選ぶなら、このsubsetは開発用であり最終testには使わない。複数楽器混合、学習前モデルとの比較、各楽器の悪化確認を必須にし、学習データの使用条件も確認する。

生prediction/confidence/volumeの全フレームを調べる場合は、`PESTO_EVAL_TRACE_DIR=/tmp/pesto-traces`を評価コマンドに付ける。モデルSHA・音源ID・条件ごとにJSONを出力し、名目MIDIと劣化前のclean energyも記録する。保存先は検証用ディレクトリにし、Gitや公開用assetsへ追加しない。

## 元Python版・ONNX書き出し・音程較正の照合

`scripts/pesto/audit-python-onnx.py`は元チェックポイントと学習済み係数、CQT/log/LayerNorm/logits、音高・voicing confidence・volume・activation・PCM cacheを比較する。元Pythonの既定streaming（zeros）、現行配信に合わせたrefill、未来を参照するoffline、長い履歴を使うcausalも分離する。較正済み384-bin activationを独立したNumPy ALWAでfractional MIDIへ復号し、A4=440Hz・3 bins/semitone・shiftの符号/丸めを確認する。元Pythonの既定値と現行配信は同一の前処理ではない。

```sh
python3 -m venv /tmp/pesto-audit-venv
# LinuxのCPU環境。macOSではこの行を省略し、requirementsから通常のtorchを入れる。
/tmp/pesto-audit-venv/bin/pip install torch==2.5.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cpu
/tmp/pesto-audit-venv/bin/pip install -r scripts/pesto/requirements-audit.txt
git clone https://github.com/SonyCSLParis/pesto /tmp/pesto-upstream
git -C /tmp/pesto-upstream checkout 62bc0c9702558f19af4593752947fb9db1eadac9
npm ci
python3 scripts/pesto/materialize-pesto-model.py --output dist/models/pesto/pesto-mir1k-g7-48000-240-refill-compact-v2.onnx
/tmp/pesto-audit-venv/bin/python -m unittest discover -s scripts/pesto -p test_python_onnx_audit.py -v
# 上のprepare-multi-instrument.pyで作成した70音源を使用。makeCondition(clean)と同一PCMを固定。
node scripts/pesto/prepare-parity-inputs.mjs /tmp/pesto-multi/manifest.json /tmp/pesto-parity-inputs
/tmp/pesto-audit-venv/bin/python scripts/pesto/audit-python-onnx.py \
  --upstream /tmp/pesto-upstream --manifest /tmp/pesto-parity-inputs/manifest.json \
  --fresh-export /tmp/pesto-fresh-audit.onnx --output /tmp/pesto-audit.json
node scripts/pesto/verify-python-wasm-parity.mjs /tmp/pesto-parity-inputs/manifest.json \
  /tmp/pesto-audit.json /tmp/pesto-audit.web-reference.json /tmp/pesto-wasm.json
# 人工信号16本の較正検証。楽器精度の根拠にはしない。上と同じPython→WASM照合に入力できる。
node scripts/pesto/prepare-parity-inputs.mjs --calibration /tmp/pesto-calibration
```

元ソースのcommit/未変更、checkpoint/model/input SHA-256を検証し、fresh exportはpublic/dist/iOSの配信モデル保存先への上書きを拒否する。既存の`export-pesto-onnx.sh`をこの監査で実行する必要はない。報告JSONに各段の最大差・全音源のattack/sustain・依存ライブラリ版を残す。伴う`.web-reference.json`は全フレームのCPU ONNX出力で、Python照合に合格した同じ入力・モデルだけをWASMで再生する。

機能的な照合の合格条件は音高差≤1cent、confidence差<0.001、volumeの`abs(diff)/max(1,abs(reference))`<0.0001、cache差=0、独立復号との差<0.01cent。activationは別の診断項目で、最大絶対差≥0.001なら`activationAlert`を残す。実録音ではこの監視線を超えたため、「すべての中間値が0.001以内」とは判定しない。中間値のbitwise一致や、全入力での精度保証とも区別する。較正信号16本はCIでもPython→fresh/original/compact→実WASMを照合する。70音源の全再生は上のコマンドで実行する。

数値と判断は[照合レポート](../../docs/pesto-python-onnx-audit-2026-11-05.md)を参照。今回はウェイト、音程補正、配信モデル、ゲーム判定を変更しない。

## 未使用音源でのrefill/zeros比較と独立した基音確認

`prepare-padding-holdout.py`は前回未評価の12音源ID・60サンプルを固定し、元データとPCMのSHA-256を検証する。NSynthの未使用IDに加え、Iowa Steinwayの実録音6音と同梱Finger Bassの元録音3音を使う。全音源の来歴と利用条件は`padding-holdout-sources.json`。NSynthは録音由来のacoustic分類で、vocalは連続歌唱や独立した歌い手の評価を意味しない。

新音源は最初の2秒から、連続する2つの5ms区間が `max(-60dBFS, 最大区間エネルギー−40dB)` を超える最初の位置を探し、20ms前から800ms切り出す。Iowa音源の長い発音前無音を人工短音として切り落とさないためで、音量正規化・調律補正はしない。これは実際の発音時刻の人手注釈ではない。以前の70音源は以前と同じ切り出しで開発用対照として扱い、新音源との平均値の差を改善量とはしない。

```sh
# Python環境と固定upstreamは上の照合手順と同じ。
python3 scripts/pesto/prepare-padding-holdout.py --output /tmp/pesto-padding-holdout
python3 scripts/pesto/prepare-multi-instrument.py --output /tmp/pesto-padding-development
/tmp/pesto-audit-venv/bin/python -m unittest discover -s scripts/pesto -p 'test_*.py' -v
/tmp/pesto-audit-venv/bin/python scripts/pesto/evaluate-padding.py \
  --upstream /tmp/pesto-upstream --manifest /tmp/pesto-padding-holdout/manifest.json \
  --output /tmp/pesto-padding-holdout.json --reference-traces /tmp/pesto-padding-reference-traces.json
/tmp/pesto-audit-venv/bin/python scripts/pesto/evaluate-padding.py \
  --upstream /tmp/pesto-upstream --manifest /tmp/pesto-padding-development/manifest.json \
  --output /tmp/pesto-padding-development.json
```

両コマンドはstrictなONNX/Python音高照合に不合格なら、結果JSONを保存した上で終了コード1となる。今回、極小音量・低confidence区間で不一致が見つかっており、候補モデルを自動採用しない。例外による失敗と区別するため、結果JSONの`exportPassed`・`onnxSourceParity`を確認する。CIは既知周波数16信号を使い、厳密照合に合格する経路を実行する。

評価はclean/100ms人工短音/200ms人工短音。同じ学習済み係数・48kHz/240 samples・3976-sample履歴で、Python同士の補完方法だけを変える比較を行う。配信refill ONNXと新規zeros ONNXも同じ入力で比較し、各々のPython版との照合を別に残す。モデル/チェックポイント/source SHA・各条件のPCM SHAを記録する。`prepare-parity-inputs.mjs`の第3引数で`clean`/`short100ms`/`short200ms`を選べる。既定はclean。

`pitch_reference.py`の独立推定は、PESTO出力と名目音番号を入力にしない。8192 samplesの窓で、周期差分の累積平均正規化（YINに着想を得た可変ペア数補正版）と、FFTピークからの倍音comb探索を別々に行い、20cent以内で一致した区間の幾何平均を診断用参照にする。窓は原音のチャンク終端を中心とし、**参照推定だけ**未来を使う。両モデルの推論へ未来の原音は渡さない。人工短音を切る前の原音を参照し、cut以降は音高評価へ入れない。

この参照は人手で確認した真値ではない。二つの手法が共に倍音・オクターブを誤る可能性がある。名目音番号と食い違う音源は別途点検対象とし、解析一致率を実測F0の精度だと断定しない。名目音番号による全評価対象と、解析一致が得られた部分集合の結果を両方残す。除外マスクは両モデルで共通、confidenceで音高評価の分母を減らさない。

発音直後の指標は、原音の連続2区間が−60dBFSを超えた位置を基準に、正しい音高が4フレーム続いた**4番目の通知時点**までの時間を測る。confidence≥0.5を要求する場合も別に測る。参照が4フレーム連続しない音は到達率の判定不能として区別し、判定可能数・到達数・未到達数を記録する。成功例だけの中央値で全例が速くなったとしない。これはアプリの実マイク入力遅延・ゲーム判定通知の計測ではない。

各音源×条件×phaseで音高一致、confidence付き正音recall、オクターブ誤り、人工ゼロ末尾の誤有音を比較し、1 percentage point超の悪化があれば`do-not-promote`。前処理の良否と、ONNX/Pythonの厳密一致は別の判定。全体平均が上がっても、個別悪化や参照未確認を隠さない。今回の録音を見て次の方法を選んだ時点で、これらは以後の最終testには使えない。

出典: [NSynth](https://magenta.tensorflow.org/datasets/nsynth)、[MP3配布](https://github.com/vvolhejn/nsynth)、[Iowa MISの利用条件](https://theremin.music.uiowa.edu/MIS.html)、[Piano録音の来歴](https://theremin.music.uiowa.edu/MISPiano.html)。独立推定の参考: [de Cheveigné & Kawahara, 2002, YIN](https://pubmed.ncbi.nlm.nih.gov/12002874/)。結果と制約は[今回の比較レポート](../../docs/pesto-padding-holdout-2026-11-05.md)を参照。

評価JSONを、音源別診断・全Python評価行・楽器別集計・悪化行・到達率へまとめるには:

```sh
/tmp/pesto-audit-venv/bin/python scripts/pesto/summarize-padding.py \
  --holdout /tmp/pesto-padding-holdout.json --development /tmp/pesto-padding-development.json \
  --output /tmp/pesto-padding-summary.json
```

配列の評価行は`scoreColumns`/`timingColumns`に列定義を持つ。ONNXとPythonで整数評価指標が違う場合は`backendMetricDisagreements`へ別保存する。全区間の音高最大差は`onnxSourceParity`に残すため、ほぼ無音での厳密照合失敗を、評価集計の一致で隠さない。

## 同音のピッチ揺れと通知処理

[修正と再現手順](../../docs/pesto-onset-drift.md)を参照。生音程の評価とは分け、同じモデル出力を変更前後のtrackerへ再生する。モデルのウェイトと較正は変更しない。
