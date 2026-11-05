# PESTO 元Python・ONNX・音程較正の照合（2026-11-05）

現行と同じrefill前処理を使ったPython版、現行17MB ONNX、compact-v2、元ソースから新規書き出ししたONNXを照合した。70録音×160フレーム=11,200フレーム、別に16人工信号×160=2,560フレーム。いずれも48kHz/240 samples、cacheを音源ごとにリセット。tracker・期待音・低音補正は通さない。基準stgは`c6b56b46b7c9aead4880b2b271d555fea983762f`。

**測定した入力では書き出し・compact化・MIDI復号に、大きな音程ずれを説明する差はなかった。ウェイトや全体の音程補正は変更しない。** 元のPython既定streamingとは前処理設定が違い、そこには楽器間の利得と悪化がある。追加学習の前に、この前処理を独立した録音で比較する余地がある。

## 書き出しの照合

元ソースはSonyCSLParis/pesto `62bc0c9702558f19af4593752947fb9db1eadac9`、チェックポイント`mir-1k_g7`。encoderとvoicing classifierの学習済み係数は元17MB ONNXとbitwise一致。固定CQT係数も一致し、sqrt_lengthsの最大差は約3.8e−6だった。

| 比較（70録音・全11,200フレーム） | 音高の最大差 | confidence最大絶対差 | cache最大差 |
|---|---:|---:|---:|
| Python refill ↔ 現行17MB CPU ONNX | 0.008774cent | 0.00003952 | 0 |
| Python refill ↔ compact-v2 CPU ONNX | 0.008774cent | 0.00001342 | 0 |
| Python refill ↔ 新規export CPU ONNX | 0.008774cent | 0.00003952 | 0 |
| 検証済みcompact CPU ONNX ↔ 実Web WASM | 0.008392cent | 0.00000855 | 0 |

1cent超の音高差は0フレーム。独立NumPy復号との差も最大0.001485cent以下。WASMはonnxruntime-web 1.20.0の単一スレッドで実行し、全PCM履歴cacheを別計算でも確認した。Pythonとの差とWASMとの差はそれぞれ別の比較であり、上表をPython↔WASM直接差だとは解釈しない。推論時間・実時間の入力欠落を調べた試験ではない。

中間値は完全一致ではない。log magnitude最大絶対差0.004799dB、encoder入力0.000412、LayerNorm0.000654、logits0.042603、最終activation0.00140515。float32の計算・加算順による小さい入力差が後段で拡大する傾向と整合するが、数学的な全入力保証ではない。**当初のactivation監視線0.001は超過し、初回の全出力合否は失敗した。** 測定値を変更せず、最終レポートでは音高/confidence/volume/cache/独立復号による機能的合否と`activationAlert=true`を分離した。すべての中間値が0.001以内という主張はしない。合否定義はJSONとREADMEへ記録した。

## 音程較正

predictionはHzではなくfractional MIDI。A4=69=440Hz、activationは3 bins/semitone。チェックポイントのshiftは6.677955627半音、実際のrollは**−20 bins**（−6.666667半音）。較正前後の丸め残差は約1.129centで、約66.7centやオクターブ単位の不一致を説明しない。出力activationはすでにshift済みなので、後から同じshiftを再適用しない。

独立ALWA（最大binの周囲±2を重み付き平均）をNumPyで実装し、端のclamp重複も元実装と合わせた。16人工信号は既知周波数を正しい48kHzで生成した。例えば現行refillはA4の正弦波を69に返す一方、C3の正弦波では約48.6667となり、同じ誤差がPythonでも出る。音域・波形・補完設定で誤差が変わるため、一律−66.7centの補正は根拠がない。人工信号を楽器録音の代用にはしない。

**confidenceは有音/無音を推定する学習済みclassifierであり、「出した音程が正しい確率」ではない。** confidence=1でも音程が外れることは、その仕様だけでは矛盾しない。全楽器共通のconfidence閾値を下げるだけでは音高誤りを修正できない。

## 元Python既定のzerosとの比較

現行exportスクリプトは元ソースのmirror_fn既定値`zeros`を`refill`へ変更する。今回のfresh exportでは元ソースを編集せず、同じ補完をモデルへ明示適用した。streaming mirror=1の履歴は両者とも3976 samples。以下は同じ70録音のclean sustain（100〜600ms）、名目MIDI±50cent一致率。confidence付きrecallの分母も全対象フレームとし、低confidenceを除外して水増ししない。

| 分類 | 現行refill 生音高 | zeros 生音高 | refill confidence付きrecall | zeros confidence付きrecall |
|---|---:|---:|---:|---:|
| Felt Piano元録音 | 26.4% | 43.6% | 17.4% | 31.4% |
| NSynth鍵盤系 | 50.8% | 66.4% | 34.3% | 45.2% |
| ギター | 66.7% | 100.0% | 66.6% | 99.0% |
| ベース | 60.2% | 65.5% | 59.5% | 53.0% |
| フルート | 98.1% | 99.8% | 66.2% | 58.8% |
| 金管系 | 68.2% | 68.4% | 68.2% | 68.4% |
| 歌声サンプル | 73.8% | 83.5% | 73.7% | 82.3% |

zerosはこのsubsetのギター等では改善したが、confidence付きrecallはフルートで66.2→58.8%、ベースで59.5→53.0%に低下した。したがって、この変更を全楽器で改善したとして採用できない。50cent境界上のフレームはごく小さい丸め差で二値判定が変わり、前回WASMの鍵盤50.8%に対し今回のPython集計は50.7%となる。波形/音程が大きく変化したという意味ではない。

元Pythonのoffline centered版、mirror=0の長い履歴を持つcausal版もJSONへ記録した。ただし前者は未来の音声を参照し、後者も現行と観測時刻・遅延条件が違う。今回の時刻を後から精度最大化する方向へずらしていない。高い数字だけを使って実時間モデルの置換根拠にはしない。

## 実装と残る範囲

追加は`audit-python-onnx.py`、正確な入力を固定する`prepare-parity-inputs.mjs`、実WASM照合`verify-python-wasm-parity.mjs`、依存版、独立復号の5テスト、CI、文書。CIは16人工信号で元Python→新規/現行/compact ONNX→実WASMを検証する。70録音の結果は今回実行した証拠であり、毎回のCIでは外部音源をダウンロードしない。

[測定JSON](pesto-python-onnx-audit-2026-11-05.json)に全音源×モデルのattack/sustain、PCM/model/checkpointハッシュ、版、各段差、WASM結果を保存した。[再現コマンド](../scripts/pesto/README.md#元python版onnx書き出し音程較正の照合)。全フレームoracle・ONNX・PCMはGitに追加しない。

録音の名目MIDIと真のフレーム別F0は同一ではなく、サンプル数・音源個体数も限定される。実マイク・連続歌唱・未使用の楽器個体での精度は未検証。quiet/noise/echo/短音条件のPython照合は今回の範囲外。追加学習による改善や他楽器での非悪化も未測定。先に未使用録音と実測F0を用意し、前処理の候補を遅延・voicing・音高の3面から比較すべきである。

配信ウェイト・前処理・音程補正・アプリ本体は変更していない。ゲームの毎フレーム処理、タイマー、polling、高頻度React state更新、hot path allocationの追加はすべてなし。追加の配列・推論・ファイルI/Oはオフライン監査とCIのみに存在する。
