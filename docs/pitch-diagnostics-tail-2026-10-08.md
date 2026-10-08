# Web音声入力：終盤の未認識（2026-10-08）

対象：`pitch-diagnostics-1791441524445.json`。記録開始は2026-10-08 15:37:41 JST、記録長は約63.085秒。以下の時刻は診断記録開始からの経過秒であり、ゲーム開始からの経過時間ではない。

## 確認できた現象

- 入力はUniversal Audio Thunderbolt (PCI)、48kHz。感度10、安定フレーム数2、低音シフトなし。
- noteOnは262件、ゲームの正解受理は126件、フレーズ完了は21件。
- 50.335秒にMIDI 62（レ）が正解として受理され、フレーズが完了した。
- 50.632秒に同じレのnoteOnがもう一度出たが、期待音がMIDI 76（ミ）に変わっていたため不正解。その後、最初の切断までnoteOnは出ていない。
- 50.411秒のmonitorでは原音RMSが−25.63dBFS、confidenceが1.0。50.713〜55.488秒の16個のmonitorでは、原音RMSが−68.06〜−62.56dBFS、confidenceが0.0126〜0.0308で、すべて棄却理由が`confidence`だった。感度10の通常判定基準は0.28。
- この区間でもAudioContextは`running`、トラックは`live`・非ミュート、推論とmonitor通知は継続。Worker/Workletのエラー、ページ非表示、トラック終了のイベントは記録されていない。
- 51.640秒のmonitorから35msの音声欠落が観測され、55.488秒までに8回・合計280msとなった。モデルresetとwarmupは0、cacheRecoveryは8。入力が弱い状態は欠落の観測前から始まっているため、欠落だけで終盤の未認識は説明できない。
- 55.752秒に切断。60.287秒付近に接続開始が2件あり、61.599秒の接続直後に切断、61.693秒に再接続している。再接続後も4個のmonitorで−76.68〜−75.92dBFS、confidenceは最大0.0242で、noteOnは出ていない。この再接続は最初の未認識より後の出来事。

## 原因の確度

直接の判定理由は、音程推論のconfidenceが基準に達しなかったこと。終盤のmonitorでは、推論に渡った音声自体のレベルも非常に低い。認識処理が停止していたという証拠はない。

ログの原音RMSはブラウザの入力処理後のPCMを測定している。通話向けのechoCancellationは要求・実設定ともtrueであり、演奏音が入力処理で抑制された可能性がある。ただし、演奏停止、入力ゲイン・ルーティングの変化、エコーキャンセルのどれによるものかは、このログだけでは特定できない。monitorは約300msごとの直近フレームの値であり、この数値だけから全フレームの音量を断定しない。

echoCancellation=trueでは、ブラウザが入力から除去する再生音を選ぶ。falseではエコーキャンセルを行わない：[W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/#dom-mediatrackconstraintset-echocancellation)。これは設定の挙動を示す資料であり、今回の原因を証明するものではない。

## 対応

ユーザーから、マイクで演奏音を拾っており、演奏音量は変わっていないとの補足があった。これは実際の演奏が弱くなったという説明を支持しない。一方、ログ上のブラウザ処理後の入力レベルが低いことは確認できる。エコーキャンセルの影響を比較できる切替をWebの音声入力設定とチュートリアルに追加した。

感度はすでに最大であり、confidence基準を0.03付近まで下げると、今回のような弱い入力から不確かな音程を発音として扱ってしまうため、基準は変更しない。

切替は既定ON。OFFを選ぶと、マイクの再接続時に`getUserMedia`とキャッシュ済みトラックの`applyConstraints`へfalseを送る。権限取得時も選択済みの設定を使う。設定変更時の再接続のみで反映し、描画や音声フレームごとの設定処理は追加しない。ゲーム音の回り込みを避けるため、OFFの比較はヘッドホンで行う。

診断は要求値と実適用値を別々に記録するため、ブラウザがOFFを適用したか確認できる。既存の通常入力・単独画面・サバイバルの入力経路に同じ設定を渡す。エコーキャンセルを全入力で一律に無効化はしない。実演奏での改善と原因の確定は未検証。

## 追加ログとの比較

`pitch-diagnostics-1791441728102.json`は約33.943秒。21.528秒のミ（MIDI 64）が最後の正解。21.75秒以降の22個のmonitorは、原音RMSが−70.40〜−59.36dBFS、confidenceが0.0165〜0.0376で、すべて`confidence`棄却。同区間のnoteOnは27件あり、すべてミで、次のレの正解には到達していない。monitorは直近フレームだけの値であり、各noteOn時のconfidenceはこの記録から直接確認できない。

推論の移動平均値の中央値は約8.03msで、5msの取り込み周期を超えている。最初のmonitorと書き出し時のWorker状態の差で、欠落が395回・663600サンプル（13.825秒）増加している。累積値は396回だが、記録開始前の1回を含む。モデルreset・warmupは0で、PCM cache復旧は継続している。入力抑制の切替追加では、この処理遅延自体を解消したとは扱わない。

30.710秒以降の9件は設定画面が開いており、ゲーム判定されていない。それ以前の未認識や不正解は設定画面だけでは説明できない。

## 変更ファイル

- `src/utils/PitchInputController.ts`
- `src/hooks/useStandaloneNoteInput.ts`
- `src/hooks/useNoteInputSession.ts`
- `src/components/survival/SurvivalGameScreen.tsx`
- `src/components/ui/MidiDeviceManager.tsx`
- `src/components/ui/VoiceEchoCancellationControl.tsx`
- `src/components/ui/InputMethodSelector.tsx`
- `src/components/defense/tutorial/DefenseTutorialInputPanel.tsx`
- `src/stores/gameStore.ts`
- `src/types/index.ts`
- `src/utils/__tests__/pitchInputController.test.ts`
- `src/components/ui/__tests__/VoiceEchoCancellationControl.test.tsx`
- 本レポート

## チェックと性能

- JSONのイベント集計、終盤のmonitor・判定・接続イベントの時系列を確認。
- 既存コードの入力制約、Workerの棄却理由、感度10のconfidence基準、キャッシュ復旧処理を照合。
- 権限取得時のOFF、キャッシュ済み入力へのOFF適用、再接続でのON/OFF、要求値と実適用値の診断、設定変更による再接続と画面再表示時の設定維持、音量変更では再接続しないことを回帰テストで確認。
- `npx tsc --noEmit`：エラー0。`npm run lint`：エラー0・警告0。
- `npm test -- --testTimeout=30000 --reporter=dot`（Vitest）：312ファイル・2350テスト成功。Node環境の既存の`--localstorage-file`警告は出るが、テスト失敗と新規のReact act警告はなし。
- `npx ts-prune`：実行済み。`used in module`を除く未使用export候補は既存と同じ323件。変更前の出力とファイル名・export名を照合して新規指摘0件を確認。
- 改行コードを考慮した`git -c core.whitespace=cr-at-eol diff --check`：成功。
- 描画／音声フレーム処理、タイマー・ポーリング、高頻度React state更新、ホットパスの割り当ての追加はいずれもなし。新しい高コスト処理のキャッシュ移動はなし。
- マイク設定を切り替えたときだけ既存の接続処理を呼ぶ。この際には既存のAudioContext・ONNXセッションを解放して作り直すため、短い入力中断がある。
