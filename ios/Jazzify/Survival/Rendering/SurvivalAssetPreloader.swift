import Foundation

/// ステージ入場前に重いアセットをまとめてウォームアップする。
@MainActor
enum SurvivalAssetPreloader {
    static func preloadIfNeeded() {
        SurvivalBackgroundCache.preload()
    }
}
