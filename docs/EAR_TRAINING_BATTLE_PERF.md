# 耳コピバトル（WEB）パフォーマンス計測手順

描画品質（`antialias` / `roundPixels` / DPR）は変更せず、ボトルネック特定のための計測手順です。

## 簡易 FPS オーバーレイ（開発用）

1. URL に `?earPerf=1` を付けて耳コピバトル／チュートリアルを開く  
   または DevTools Console で  
   `localStorage.setItem('earTrainingBattlePerfDebug', '1')` を実行してリロード
2. 画面左上に FPS / avg / max が表示される
3. 計測後は `localStorage.removeItem('earTrainingBattlePerfDebug')` で無効化

## Chrome DevTools Performance

### ケース A: チュートリアル dialogue_only（静止シーン）

1. Performance タブ → Record
2. dialogue シーンで 5 秒待機（セリフ自動進行前後）
3. Stop → Main スレッドで `Scripting` / `Rendering` / `Painting` / `GPU` の比率を確認
4. Phaser WebGL (`drawElements` / `WebGL`) が支配的か、React commit が支配的かをメモ

### ケース B: チュートリアル interactive（コードヴォイシング等）

1. 演奏シーンに入り、カウントイン → 1 フレーズ入力
2. 同様に Record 5〜10 秒
3. `EarTrainingBattleScene` / `PIXINotesRenderer` / React のどれが長いか比較

## 改善後の確認

- dialogue 静止時: FPS オーバーレイでベースライン FPS が上がること
- 通常バトル演奏中: ゲージ更新中も React 全体再レンダーが減り、Scripting 比率が下がること
- 画質: デスクトップでギザギザ／解像度劣化が再発していないこと
