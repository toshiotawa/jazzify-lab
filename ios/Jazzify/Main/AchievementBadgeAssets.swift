import UIKit

/// 称号メダル PNG（`public/achivement` を bundle folder reference で同梱）。
enum AchievementBadgeAssets {
    private static let subdirectory = "achivement"

    /// 一覧行のメダル表示サイズ（pt）。
    static let listDisplaySize: CGFloat = 64
    /// 詳細シートのメダル表示サイズ（pt）。
    static let detailDisplaySize: CGFloat = 150

    private static let imageCache: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.totalCostLimit = 8 * 1024 * 1024
        return cache
    }()

    static func cachedImage(fileName: String, displaySize: CGFloat) -> UIImage? {
        let scale = UIScreen.main.scale
        let key = cacheKey(fileName: fileName, displaySize: displaySize, scale: scale)
        if let cached = imageCache.object(forKey: key) {
            return cached
        }
        guard let image = loadImage(fileName: fileName, displaySize: displaySize, scale: scale) else {
            return nil
        }
        imageCache.setObject(image, forKey: key, cost: estimatedCost(of: image))
        return image
    }

    /// 一覧表示前にバックグラウンドで全メダルをプリロードする。
    static func preloadAll(displaySize: CGFloat = listDisplaySize) async {
        let scale = await MainActor.run { UIScreen.main.scale }
        let fileNames = AchievementBadgeCatalog.definitions.map { bundleFileName(from: $0.imagePath) }
        await withTaskGroup(of: Void.self) { group in
            for fileName in fileNames {
                group.addTask {
                    _ = loadImage(fileName: fileName, displaySize: displaySize, scale: scale)
                }
            }
        }
    }

    /// `/achivement/achievement_monster_02.png` → `achievement_monster_02`
    private static func bundleFileName(from imagePath: String) -> String {
        URL(fileURLWithPath: imagePath).deletingPathExtension().lastPathComponent
    }

    private static func loadImage(fileName: String, displaySize: CGFloat, scale: CGFloat) -> UIImage? {
        let key = cacheKey(fileName: fileName, displaySize: displaySize, scale: scale)
        if let cached = imageCache.object(forKey: key) {
            return cached
        }
        guard let url = Bundle.main.url(
            forResource: fileName,
            withExtension: "png",
            subdirectory: subdirectory
        ) else {
            return nil
        }
        guard let source = UIImage(contentsOfFile: url.path) else {
            return nil
        }
        let pixelSize = displaySize * scale
        let thumbnail = source.preparingThumbnail(of: CGSize(width: pixelSize, height: pixelSize)) ?? source
        imageCache.setObject(thumbnail, forKey: key, cost: estimatedCost(of: thumbnail))
        return thumbnail
    }

    private static func cacheKey(fileName: String, displaySize: CGFloat, scale: CGFloat) -> NSString {
        NSString(string: "\(fileName)@\(Int(displaySize))x\(Int(scale))")
    }

    private static func estimatedCost(of image: UIImage) -> Int {
        guard let cgImage = image.cgImage else {
            return 256 * 256 * 4
        }
        return cgImage.bytesPerRow * cgImage.height
    }
}
