import CoreGraphics

/// 風船ラッシュのプレイフィールド（`SurvivalMap` の 1/4）。Web `BALLOON_RUSH_MAP_CONFIG` と同期。
enum BalloonRushMap {
    static let width: CGFloat = SurvivalMap.width / 4
    static let height: CGFloat = SurvivalMap.height / 4
}

/// `public/Drums160Loop.mp3` の CDN URL（`scripts/upload-drums160-loop-r2.mjs`）。
enum BalloonRushDrumLoopBgm {
    static let urlString = "https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"
}
