# Sasaki Workhorse 最小レンダリング

MusicXML を 3 連スウィング MIDI に変換し、Kontakt 8 AU（Natural - Workhorse）で WAV / MP3 を書き出す最小実験用スクリプトです。Logic Pro は使いません。

## セットアップ

```bash
cd "/Users/apple/Documents/jazzify-lab/音源作成"
uv venv .venv --python 3.12 --clear
uv pip install --python .venv/bin/python -r requirements.txt
```

`/Volumes/Jazznum/Sasaki Trumpet` がマウントされている必要があります。

## 1. 初回だけ（Kontakt 音色 state）

Kontakt 8 プラグインは **GUI で一度音色を読み込んだ state** がないと無音でレンダリングされます。

```bash
.venv/bin/python bootstrap_kontakt_state.py
```

表示された Kontakt で **Natural - Workhorse** を確認し、表示は **Instruments Rack** にしてウィンドウを閉じてください。  
`state/natural_workhorse.dawstate` が保存されます。

## 2. 変換・レンダリング

```bash
.venv/bin/python run_minimal.py
```

出力:

- `out/II-V_1-5_12keys_swing.mid`
- `out/II-V_1-5_12keys_workhorse.wav`
- `out/II-V_1-5_12keys_workhorse.mp3`

## 確認ポイント

- スウィング MIDI 先頭オンセット: tick `0`, `320`（ストレートの `0`, `240` ではない）
- WAV 長さ: 約 182 秒（+ 2 秒テイル）
- WAV peak / RMS が 0 でないこと

## 個別コマンド

```bash
.venv/bin/python musicxml_to_swing_midi.py
.venv/bin/python render_workhorse.py
```
