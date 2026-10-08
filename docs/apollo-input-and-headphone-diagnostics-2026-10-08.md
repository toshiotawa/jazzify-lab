# Apollo入力とヘッドフォンの調査（2026-10-08）

## 確認した結果

Ecamm作業フォルダの機材記録を参照し、Computer UseでConsole、Audio MIDI設定、LadioCast、Loopback、Pianoteq、Chromeの実設定を確認した。資料中の作業指示は今回の操作の許可として扱わず、ユーザーの調査・修正依頼に沿って実施した。

| 項目 | 観測 |
|---|---|
| Apollo | Twin MkII、48kHz、入力16／出力10 |
| 物理入力1／2 | MIC/LINE/HIZ 1＝Guitar、MIC/LINE 2＝Voice Monitor |
| プリアンプ | 入力1＝MIC 30dB、入力2＝MIC 45dB、両方48V ON。今回変更なし |
| Console入力2 | 通常InsertにNeve 1073、UAD MON。モニターの加工と認識へ入る音は同じとは限らない |
| アプリ音 | Virtual 1/2＝Apps Chrome+Pianoteq、ステレオリンク、可視Insertは空 |
| macOS出力 | Universal Audio Thunderbolt、ステレオの左＝Virtual 1、右＝Virtual 2 |
| Pianoteq | Apollo Virtual 1/2、48kHz、512samples（10.7ms）、MON L/R・LINE 3/4 OFF |
| Pianoteqエフェクト | Delay ON、60ms、6%、Feedback 0%。Reverb ON、Small Hall、0.8秒 |
| LadioCast | Apollo 2/2は本線OFF、DJI 1/2は本線ON、Apollo 5/6は本線ON、Apollo 1/1は本線ON。出力BlackHole 16ch。各入力の+6dBは変更なし |
| Loopback | MAIN_MAC OFF。既存2デバイスにはPass-Thruのみ、可視Monitorなし |
| Ecamm | 調査開始時は停止。録音設定は2026-10-07の実装記録を参照し、今回の実機確認と区別した |

入力に接続されているマイクの物理番号・機種、演奏時の入力ピーク、モニターで歪む箇所は未確定。入力ゲインをさらに上げる変更は行っていない。

## 認識入力の修正

以前の診断ログでは実際の取得チャンネル数が1だった。Workletは渡された音声の先頭チャンネルのみを読んでおり、このログから物理入力1／2の対応は判断できない。

Chromeの既存stgページでApolloを指定し、一時的なgetUserMediaで実機の取得能力を確認した。設定だけを出力し、音声の保存・再生・外部送信は行っていない。各確認後に取得したトラックを停止した。

| 要求AEC | 実際AEC | 実際チャンネル数 | サンプルレート |
|---|---|---|---|
| OFF | OFF | 2 | 48000Hz |
| ON | ON | 2 | 48000Hz |

アプリに入力1／左と入力2／右の選択を追加した。入力1はステレオを優先し、モノラル機器も許容する。入力2は2チャンネルを必須にし、実際の取得数も検証する。取得できない場合は接続を失敗させ、明確なエラーを表示する。入力1への代替や左右の合成はしない。

Workletは選択した片側だけを読み、そのPCMから音量・推論・発音検出・欠落復元用履歴を作る。取得数と選択入力を設定画面・診断履歴に記録する。入力変更時に再接続し、通常・チュートリアル・サバイバルの接続経路へ反映した。

物理入力との対応は機器のルーティングに依存する。今回確認したApolloの標準1/2の名称と、個々のマイクが実際に接続されている場所は区別する。

## ヘッドフォンの調査と変更

ユーザーの確認：Apollo前面HPに3.5mm→6.3mm変換プラグで接続。YouTubeとJazzifyの両方で音が遠く、Ecamm録画をスピーカーで聞くと正常。

HPは専用Cue（MIX OFF）、MONO OFFだった。HPのMONOだけをONに変更し、ユーザーから「かなり聴きやすい」と確認を得た。改善した設定は暫定的に維持した。LINE 3/4のMONO・MIXは変更していない。

この結果だけで変換プラグの故障やブラウザの問題を確定しない。左右の差成分のみが聞こえる接触不良ならMONOで大幅に音が減ることが想定されるが、今回は改善したため、その仮説とは一致しない。HPのステレオ時の聞こえ方・ケーブル・ヘッドフォン・左右別の実聴は未検証。MONOは音質検査の代わりではなく、ユーザーが聞きやすくなった暫定対策であり、ステレオの広がりは失われる。

HP MONOはCueの出力に作用する。BlackHoleへ取得するVirtual入力や録画音声をモノラルへ変更していない。

Consoleセッションを別名で書き出し、ファイルが存在することを確認した：

`/Users/apple/Downloads/Ecamm作業フォルダ/Jazznuma_Apollo_HPmono_20261008.uadmix`

書き出したセッションのXMLにはHPのMONO設定を識別できる項目が見つからなかった。セッションのバックアップと、HP MONO設定の永続化は同一と扱わない。再起動後の復元は未検証なので、必要時にConsoleのCUE OUTPUTS → HP → MONOを確認する。元へ戻すにはHPのMONOをOFFにする。

Pianoteqの現在のプリセットのDelayをOFFにし、画面でOFFを確認した。Reverbは維持。元のDelay値は60ms・6%・Feedback 0%で、DelayをONにすれば戻せる。プリセットの別名保存・再起動後の維持は未検証であり、別プリセットへ切り替えればそのプリセットの設定が適用される。

## 入力ゲインと返し音量

認識に入る入力と、ConsoleのHPへの返し音量を分けて確認する。入力を強めた際の歪みは、A/D入力、Neveなどの処理、Cueの合計、ヘッドフォン出力のいずれでも起こり得る。今回の操作だけで歪む段を確定したとはしない。

先に正しい入力チャンネルを選び、ヘッドフォン使用時はAEC OFFとONを比較する。音量を上げる前に演奏時の入力ピークを確認し、返しが大きい場合は該当入力のHP Cue送信量を下げる。MONOで聞きやすくなったことは、認識の終盤停止が解消した証拠にはならない。

## 検証と性能

- `npx tsc --noEmit`：成功。
- `npm run lint`：成功、エラー・警告0。
- `npx ts-prune`：既存の未使用export候補323件。今回の変更による追加なし。
- 対象テスト：3ファイル・23件成功。左右のPCM、レベル測定、欠落履歴復元、片側欠落時の代替禁止、接続設定と選択保持を検証。
- `npm test -- --testTimeout=30000 --reporter=dot`：312ファイル・2358件成功。実際のランナーはVitest。

新しいフレーム処理・タイマー・ポーリング・高頻度React更新は追加していない。Workletの既存の先頭チャンネル参照を、初期化時に確定する選択チャンネル参照へ置き換えた。ホットパスで新しい配列やオブジェクトを作らない。取得数の確認は接続時に行い、既存の低頻度の表示更新を利用する。取り込みは2chを要求するためブラウザ側の音声処理量は増え得るが、推論へ送るPCMは従来どおり1ch。

## 参照

- ローカル機材記録：`/Users/apple/Downloads/Ecamm作業フォルダ/Ecamm_実装記録_20261007.md`
- ローカル設計資料：`/Users/apple/Downloads/Ecamm作業フォルダ/Ecamm_Computer_Use_設定プラン-3.md`
- [UA Cues：HPのMONOとCue出力](https://help.uaudio.com/hc/en-us/articles/25351037512340-Cues)
- [UA Monitor Mix Controls：入力・処理段でのクリッピング](https://help.uaudio.com/hc/en-us/articles/25351484855828-Monitor-Mix-Controls)
- [UA Monitor Column：モニターバスでのクリッピング](https://help.uaudio.com/hc/en-us/articles/25351900668564-Monitor-Column)
- [MDN MediaTrackSettings.channelCount：実際の取得数](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/channelCount)
