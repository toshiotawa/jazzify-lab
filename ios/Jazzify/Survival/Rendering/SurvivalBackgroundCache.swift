import SpriteKit
import UIKit

// MARK: - Web 版 `SurvivalCanvas` の `woodSeededUnit` / `Math.imul` 互換（板の色・木目の決定論的再現）

@inline(__always)
private func survivalMathImul32(_ a: UInt32, _ b: UInt32) -> UInt32 {
    let product = Int64(Int32(bitPattern: a)) * Int64(Int32(bitPattern: b))
    return UInt32(bitPattern: Int32(truncatingIfNeeded: product))
}

@inline(__always)
private func survivalWoodSeededUnit(seed: UInt32) -> CGFloat {
    var t = seed &+ 0x6d2b79f5
    t = survivalMathImul32(t ^ (t >> 15), t | 1)
    t ^= t &+ survivalMathImul32(t ^ (t >> 7), t | 61)
    let fin = t ^ (t >> 14)
    return CGFloat(Double(fin) / 4294967296.0)
}

/// マップ全体の木床テクスチャを **プロセス内で 1 枚だけ** CoreGraphics 合成して共有する。
/// ステージ再入場や `SKScene` の作り直しのたびに 3200×2400 を再生成しない。
@MainActor
enum SurvivalBackgroundCache {
    private static var floorTexture: SKTexture?

    /// テクスチャを構築済みならそれを返す。初回のみ重い。
    static func sharedFloorTexture() -> SKTexture {
        if let floorTexture {
            return floorTexture
        }
        let built = buildFloorTexture()
        floorTexture = built
        return built
    }

    static func preload() {
        _ = sharedFloorTexture()
    }

    private static func buildFloorTexture() -> SKTexture {
        /// Web: `WOOD_PLANK_W` / `WOOD_PLANK_H`
        let plankW: CGFloat = 120
        let plankH: CGFloat = 24
        let tileW = plankW * 2
        let tileH = plankH * 2
        let tileSize = CGSize(width: tileW, height: tileH)

        let tileRenderer = UIGraphicsImageRenderer(size: tileSize)
        let tileImage = tileRenderer.image { ctx in
            let cg = ctx.cgContext
            cg.setFillColor(UIColor(red: 0x15 / 255.0, green: 0x0e / 255.0, blue: 0x07 / 255.0, alpha: 1).cgColor)
            cg.fill(CGRect(origin: .zero, size: tileSize))

            func drawPlank(x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat, seed: UInt32) {
                let ru = survivalWoodSeededUnit(seed: seed)
                let dr = Double(ru) - 0.5
                let baseRi = 0x1c + Int(floor(dr * 14))
                let baseGi = 0x13 + Int(floor(dr * 10))
                let baseBi = 0x0a + Int(floor(dr * 8))
                cg.setFillColor(
                    UIColor(
                        red: CGFloat(baseRi) / 255.0,
                        green: CGFloat(baseGi) / 255.0,
                        blue: CGFloat(baseBi) / 255.0,
                        alpha: 1
                    ).cgColor
                )
                cg.fill(CGRect(x: x, y: y, width: w, height: h))

                let grainCount = 2 + Int(floor(Double(survivalWoodSeededUnit(seed: seed &+ 31)) * 2))
                for i in 0..<grainCount {
                    let gx = x + 6 + survivalWoodSeededUnit(seed: seed &+ UInt32(i * 7)) * (w - 12)
                    let grainAlpha = 0.1 + Double(survivalWoodSeededUnit(seed: seed &+ UInt32(i * 11))) * 0.1
                    cg.setStrokeColor(
                        UIColor(red: 80 / 255.0, green: 55 / 255.0, blue: 30 / 255.0, alpha: grainAlpha).cgColor
                    )
                    cg.setLineWidth(1)
                    cg.beginPath()
                    cg.move(to: CGPoint(x: gx, y: y + 2))
                    let dx = (survivalWoodSeededUnit(seed: seed &+ UInt32(i * 13)) - 0.5) * 4
                    cg.addLine(to: CGPoint(x: gx + dx, y: y + h - 2))
                    cg.strokePath()
                }

                cg.setStrokeColor(UIColor(red: 5 / 255.0, green: 3 / 255.0, blue: 0, alpha: 0.85).cgColor)
                cg.setLineWidth(1)
                cg.stroke(CGRect(x: x + 0.5, y: y + 0.5, width: w - 1, height: h - 1))
            }

            drawPlank(x: 0, y: 0, w: plankW, h: plankH, seed: 1001)
            drawPlank(x: plankW, y: 0, w: plankW, h: plankH, seed: 1002)
            drawPlank(x: -plankW / 2, y: plankH, w: plankW, h: plankH, seed: 2001)
            drawPlank(x: plankW / 2, y: plankH, w: plankW, h: plankH, seed: 2002)
            drawPlank(x: plankW * 1.5, y: plankH, w: plankW, h: plankH, seed: 2003)
        }

        let mapW = SurvivalMap.width
        let mapH = SurvivalMap.height
        let mapSize = CGSize(width: mapW, height: mapH)

        guard let tileCg = tileImage.cgImage else {
            return SKTexture()
        }

        let format = UIGraphicsImageRendererFormat.default()
        format.opaque = true
        format.scale = 1
        let floorRenderer = UIGraphicsImageRenderer(size: mapSize, format: format)
        let floorImage = floorRenderer.image { ctx in
            let cg = ctx.cgContext
            var y: CGFloat = 0
            while y < mapH {
                let rowH = min(tileH, mapH - y)
                var x: CGFloat = 0
                while x < mapW {
                    let colW = min(tileW, mapW - x)
                    cg.saveGState()
                    cg.clip(to: CGRect(x: x, y: y, width: colW, height: rowH))
                    cg.draw(tileCg, in: CGRect(x: x, y: y, width: tileW, height: tileH))
                    cg.restoreGState()
                    x += tileW
                }
                y += tileH
            }
        }

        let floorTexture = SKTexture(image: floorImage)
        floorTexture.filteringMode = .linear
        return floorTexture
    }
}
