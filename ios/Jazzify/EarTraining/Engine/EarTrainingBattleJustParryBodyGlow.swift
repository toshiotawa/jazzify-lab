import SpriteKit
import UIKit

/// Web `earTrainingBattleJustParryEffect.ts` の身体グロー状態。
struct JustParryBodyGlowState: Equatable {
    var active = false
    var startedAt: Double = 0
    var endAt: Double = 0
    var assetName: String = ""

    mutating func start(startedAt: Double, durationMs: Double, assetName: String) {
        let duration = max(1, durationMs.rounded())
        active = true
        self.startedAt = startedAt
        endAt = startedAt + duration
        self.assetName = assetName
    }

    mutating func clear() {
        active = false
    }

    func isActive(nowMs: Double) -> Bool {
        active && nowMs < endAt
    }

    mutating func prune(nowMs: Double) {
        if active && nowMs >= endAt {
            clear()
        }
    }

    func alpha(nowMs: Double) -> Double {
        guard isActive(nowMs: nowMs) else { return 0 }
        let durationMs = max(1, endAt - startedAt)
        let elapsed = nowMs - startedAt
        let fadeStart = durationMs * 0.72
        if elapsed <= fadeStart {
            return 1
        }
        let fadeT = min(1, (elapsed - fadeStart) / max(1, durationMs - fadeStart))
        return 1 - EarTrainingBattleParryConstants.easeCubicOut(fadeT)
    }

    func pulse(nowMs: Double) -> Double {
        0.88 + sin((nowMs - startedAt) / 70) * 0.12
    }
}

/// Web `buildBodyGlowCanvas` 相当のテクスチャ生成と描画パラメータ。
enum EarTrainingBattleJustParryBodyGlow {
    static let innerAlphaFactor: CGFloat = 0.48
    static let rimAlphaFactor: CGFloat = 0.36
    static let rimScale: CGFloat = 1.06

    private static var textureCache: [String: SKTexture] = [:]
    private static let cacheLimit = 8

    static func glowTexture(assetName: String, width: CGFloat, height: CGFloat) -> SKTexture? {
        let key = "\(assetName)|\(Int(width.rounded()))|\(Int(height.rounded()))|cyan-indigo"
        if let cached = textureCache[key] {
            return cached
        }
        guard let image = UIImage(named: assetName) else { return nil }
        let glowImage = makeGlowImage(from: image, width: width, height: height)
        let texture = SKTexture(image: glowImage)
        texture.filteringMode = .linear
        if textureCache.count >= cacheLimit {
            textureCache.removeAll(keepingCapacity: true)
        }
        textureCache[key] = texture
        return texture
    }

    private static func makeGlowImage(from image: UIImage, width: CGFloat, height: CGFloat) -> UIImage {
        let size = CGSize(width: max(1, width), height: max(1, height))
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            image.draw(in: CGRect(origin: .zero, size: size))
            ctx.cgContext.setBlendMode(.sourceIn)
            let colors = [
                UIColor(red: 248 / 255, green: 250 / 255, blue: 252 / 255, alpha: 1).cgColor,
                UIColor(red: 103 / 255, green: 232 / 255, blue: 249 / 255, alpha: 1).cgColor,
                UIColor(red: 59 / 255, green: 130 / 255, blue: 246 / 255, alpha: 1).cgColor,
                UIColor(red: 129 / 255, green: 140 / 255, blue: 248 / 255, alpha: 1).cgColor,
                UIColor(red: 30 / 255, green: 58 / 255, blue: 138 / 255, alpha: 1).cgColor,
            ] as CFArray
            let locations: [CGFloat] = [0, 0.22, 0.48, 0.72, 1.0]
            guard let gradient = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: colors,
                locations: locations
            ) else { return }
            ctx.cgContext.drawLinearGradient(
                gradient,
                start: CGPoint(x: 0, y: 0),
                end: CGPoint(x: size.width * 0.4, y: size.height),
                options: []
            )
        }
    }
}
