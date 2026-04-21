import SwiftUI

/// 魔王城降下マップ: ブロック別ビジュアルテーマ (iOS 版)
/// Web 版 `src/components/survival/descent/blockTheme.ts` の色定義をポート。
/// ブロック 0..20 を 7 Tier に分類し、各ブロックへテーマカラーを割り当てる。
enum SurvivalDescentBlockTier: String, Sendable {
    case moss
    case stone
    case ember
    case violet
    case azure
    case crimson
    case abyss
}

struct SurvivalDescentBlockTheme: Sendable {
    let tier: SurvivalDescentBlockTier
    let plateTop: Color
    let plateBottom: Color
    let plateBorder: Color
    let plateText: Color
    let plateClearedGlow: Color
    let lanternCore: Color
    let lanternOuter: Color
    let sealStroke: Color
    let sealGlow: Color
    let tintTop: Color
    let tintBottom: Color
}

enum SurvivalDescentThemeCatalog {
    private static let moss = SurvivalDescentBlockTheme(
        tier: .moss,
        plateTop: Color(red: 48 / 255, green: 78 / 255, blue: 78 / 255),
        plateBottom: Color(red: 14 / 255, green: 32 / 255, blue: 32 / 255),
        plateBorder: Color(red: 140 / 255, green: 220 / 255, blue: 200 / 255).opacity(0.6),
        plateText: Color(hex: "dff6ed"),
        plateClearedGlow: Color(red: 150 / 255, green: 240 / 255, blue: 200 / 255).opacity(0.7),
        lanternCore: Color(red: 210 / 255, green: 255 / 255, blue: 230 / 255),
        lanternOuter: Color(red: 90 / 255, green: 220 / 255, blue: 170 / 255).opacity(0.9),
        sealStroke: Color(red: 180 / 255, green: 240 / 255, blue: 220 / 255).opacity(0.9),
        sealGlow: Color(red: 100 / 255, green: 200 / 255, blue: 170 / 255).opacity(0.75),
        tintTop: Color(red: 80 / 255, green: 180 / 255, blue: 150 / 255).opacity(0.25),
        tintBottom: Color(red: 30 / 255, green: 90 / 255, blue: 80 / 255).opacity(0.3)
    )

    private static let stone = SurvivalDescentBlockTheme(
        tier: .stone,
        plateTop: Color(red: 78 / 255, green: 82 / 255, blue: 100 / 255),
        plateBottom: Color(red: 32 / 255, green: 34 / 255, blue: 48 / 255),
        plateBorder: Color(red: 170 / 255, green: 178 / 255, blue: 196 / 255).opacity(0.55),
        plateText: Color(hex: "e6eaf2"),
        plateClearedGlow: Color(red: 220 / 255, green: 226 / 255, blue: 240 / 255).opacity(0.6),
        lanternCore: Color(red: 255 / 255, green: 236 / 255, blue: 190 / 255),
        lanternOuter: Color(red: 255 / 255, green: 186 / 255, blue: 96 / 255).opacity(0.85),
        sealStroke: Color(red: 200 / 255, green: 214 / 255, blue: 240 / 255).opacity(0.85),
        sealGlow: Color(red: 140 / 255, green: 180 / 255, blue: 230 / 255).opacity(0.7),
        tintTop: Color(red: 120 / 255, green: 140 / 255, blue: 180 / 255).opacity(0.22),
        tintBottom: Color(red: 80 / 255, green: 96 / 255, blue: 140 / 255).opacity(0.26)
    )

    private static let ember = SurvivalDescentBlockTheme(
        tier: .ember,
        plateTop: Color(red: 130 / 255, green: 80 / 255, blue: 50 / 255),
        plateBottom: Color(red: 60 / 255, green: 28 / 255, blue: 18 / 255),
        plateBorder: Color(red: 230 / 255, green: 160 / 255, blue: 90 / 255).opacity(0.7),
        plateText: Color(hex: "ffe2ae"),
        plateClearedGlow: Color(red: 255 / 255, green: 180 / 255, blue: 90 / 255).opacity(0.75),
        lanternCore: Color(red: 255 / 255, green: 220 / 255, blue: 140 / 255),
        lanternOuter: Color(red: 255 / 255, green: 140 / 255, blue: 60 / 255).opacity(0.9),
        sealStroke: Color(red: 255 / 255, green: 196 / 255, blue: 120 / 255).opacity(0.92),
        sealGlow: Color(red: 255 / 255, green: 150 / 255, blue: 70 / 255).opacity(0.8),
        tintTop: Color(red: 200 / 255, green: 120 / 255, blue: 60 / 255).opacity(0.3),
        tintBottom: Color(red: 140 / 255, green: 60 / 255, blue: 30 / 255).opacity(0.34)
    )

    private static let violet = SurvivalDescentBlockTheme(
        tier: .violet,
        plateTop: Color(red: 86 / 255, green: 60 / 255, blue: 130 / 255),
        plateBottom: Color(red: 38 / 255, green: 22 / 255, blue: 66 / 255),
        plateBorder: Color(red: 190 / 255, green: 150 / 255, blue: 240 / 255).opacity(0.65),
        plateText: Color(hex: "efdcff"),
        plateClearedGlow: Color(red: 200 / 255, green: 150 / 255, blue: 255 / 255).opacity(0.72),
        lanternCore: Color(red: 230 / 255, green: 210 / 255, blue: 255 / 255),
        lanternOuter: Color(red: 180 / 255, green: 120 / 255, blue: 240 / 255).opacity(0.9),
        sealStroke: Color(red: 220 / 255, green: 180 / 255, blue: 255 / 255).opacity(0.92),
        sealGlow: Color(red: 170 / 255, green: 110 / 255, blue: 240 / 255).opacity(0.8),
        tintTop: Color(red: 130 / 255, green: 80 / 255, blue: 210 / 255).opacity(0.3),
        tintBottom: Color(red: 70 / 255, green: 30 / 255, blue: 140 / 255).opacity(0.34)
    )

    private static let azure = SurvivalDescentBlockTheme(
        tier: .azure,
        plateTop: Color(red: 40 / 255, green: 90 / 255, blue: 130 / 255),
        plateBottom: Color(red: 14 / 255, green: 40 / 255, blue: 70 / 255),
        plateBorder: Color(red: 130 / 255, green: 200 / 255, blue: 240 / 255).opacity(0.65),
        plateText: Color(hex: "d9efff"),
        plateClearedGlow: Color(red: 130 / 255, green: 200 / 255, blue: 255 / 255).opacity(0.75),
        lanternCore: Color(red: 210 / 255, green: 240 / 255, blue: 255 / 255),
        lanternOuter: Color(red: 110 / 255, green: 180 / 255, blue: 255 / 255).opacity(0.92),
        sealStroke: Color(red: 180 / 255, green: 220 / 255, blue: 255 / 255).opacity(0.95),
        sealGlow: Color(red: 80 / 255, green: 170 / 255, blue: 255 / 255).opacity(0.85),
        tintTop: Color(red: 80 / 255, green: 160 / 255, blue: 230 / 255).opacity(0.28),
        tintBottom: Color(red: 20 / 255, green: 60 / 255, blue: 120 / 255).opacity(0.34)
    )

    private static let crimson = SurvivalDescentBlockTheme(
        tier: .crimson,
        plateTop: Color(red: 150 / 255, green: 40 / 255, blue: 60 / 255),
        plateBottom: Color(red: 60 / 255, green: 10 / 255, blue: 22 / 255),
        plateBorder: Color(red: 255 / 255, green: 120 / 255, blue: 140 / 255).opacity(0.7),
        plateText: Color(hex: "ffd6dc"),
        plateClearedGlow: Color(red: 255 / 255, green: 110 / 255, blue: 130 / 255).opacity(0.8),
        lanternCore: Color(red: 255 / 255, green: 210 / 255, blue: 210 / 255),
        lanternOuter: Color(red: 230 / 255, green: 70 / 255, blue: 90 / 255).opacity(0.95),
        sealStroke: Color(red: 255 / 255, green: 160 / 255, blue: 170 / 255).opacity(0.95),
        sealGlow: Color(red: 230 / 255, green: 60 / 255, blue: 90 / 255).opacity(0.9),
        tintTop: Color(red: 210 / 255, green: 60 / 255, blue: 80 / 255).opacity(0.32),
        tintBottom: Color(red: 110 / 255, green: 10 / 255, blue: 20 / 255).opacity(0.38)
    )

    private static let abyss = SurvivalDescentBlockTheme(
        tier: .abyss,
        plateTop: Color(red: 24 / 255, green: 22 / 255, blue: 40 / 255),
        plateBottom: Color(red: 4 / 255, green: 2 / 255, blue: 12 / 255),
        plateBorder: Color(red: 255 / 255, green: 196 / 255, blue: 120 / 255).opacity(0.9),
        plateText: Color(hex: "fff0c2"),
        plateClearedGlow: Color(red: 255 / 255, green: 210 / 255, blue: 120 / 255).opacity(0.98),
        lanternCore: Color(red: 255 / 255, green: 240 / 255, blue: 190 / 255),
        lanternOuter: Color(red: 255 / 255, green: 160 / 255, blue: 40 / 255).opacity(0.98),
        sealStroke: Color(red: 255 / 255, green: 220 / 255, blue: 140 / 255).opacity(0.98),
        sealGlow: Color(red: 255 / 255, green: 170 / 255, blue: 60 / 255).opacity(0.98),
        tintTop: Color(red: 60 / 255, green: 30 / 255, blue: 80 / 255).opacity(0.38),
        tintBottom: Color(red: 10 / 255, green: 4 / 255, blue: 20 / 255).opacity(0.48)
    )

    static func theme(for blockIndex: Int) -> SurvivalDescentBlockTheme {
        switch blockIndex {
        case ...1: return moss
        case 2...3: return stone
        case 4...6: return ember
        case 7...9: return violet
        case 10...12: return azure
        case 13...16: return crimson
        default: return abyss
        }
    }
}
