import SwiftUI

enum CodeRunMapBiome: String, CaseIterable {
    case grass
    case sand
    case snow
    case stone
    case purple
}

struct CodeRunMapBiomeTheme {
    let biome: CodeRunMapBiome
    let skyTop: Color
    let skyBottom: Color
    let signPlateTop: Color
    let signPlateBottom: Color
    let signPlateBorder: Color
    let signText: Color
    let signDepthText: Color
}

enum CodeRunMapThemeCatalog {
    private static let order: [CodeRunMapBiome] = [.grass, .sand, .snow, .stone, .purple]

    static func biome(for blockIndex: Int) -> CodeRunMapBiome {
        let idx = ((blockIndex % order.count) + order.count) % order.count
        return order[idx]
    }

    static func theme(for blockIndex: Int) -> CodeRunMapBiomeTheme {
        switch biome(for: blockIndex) {
        case .grass:
            return CodeRunMapBiomeTheme(
                biome: .grass,
                skyTop: Color(hex: "7ec8f0"),
                skyBottom: Color(hex: "b8e4ff"),
                signPlateTop: Color(hex: "2d6b3a"),
                signPlateBottom: Color(hex: "1a4528"),
                signPlateBorder: Color(hex: "8fd49a"),
                signText: Color(hex: "f0fff4"),
                signDepthText: Color(hex: "c8f0d0")
            )
        case .sand:
            return CodeRunMapBiomeTheme(
                biome: .sand,
                skyTop: Color(hex: "f0c878"),
                skyBottom: Color(hex: "ffe8b0"),
                signPlateTop: Color(hex: "8b5a2b"),
                signPlateBottom: Color(hex: "5c3a18"),
                signPlateBorder: Color(hex: "f0c878"),
                signText: Color(hex: "fff8e8"),
                signDepthText: Color(hex: "ffe0a8")
            )
        case .snow:
            return CodeRunMapBiomeTheme(
                biome: .snow,
                skyTop: Color(hex: "a8c8e8"),
                skyBottom: Color(hex: "dce8f8"),
                signPlateTop: Color(hex: "4a6888"),
                signPlateBottom: Color(hex: "2a4058"),
                signPlateBorder: Color(hex: "c8e0f8"),
                signText: Color(hex: "f0f8ff"),
                signDepthText: Color(hex: "d0e8ff")
            )
        case .stone:
            return CodeRunMapBiomeTheme(
                biome: .stone,
                skyTop: Color(hex: "8898a8"),
                skyBottom: Color(hex: "c0ccd8"),
                signPlateTop: Color(hex: "4a5058"),
                signPlateBottom: Color(hex: "2a3038"),
                signPlateBorder: Color(hex: "b0b8c0"),
                signText: Color(hex: "f0f4f8"),
                signDepthText: Color(hex: "c8d0d8")
            )
        case .purple:
            return CodeRunMapBiomeTheme(
                biome: .purple,
                skyTop: Color(hex: "8868c8"),
                skyBottom: Color(hex: "c8a8f0"),
                signPlateTop: Color(hex: "5a3888"),
                signPlateBottom: Color(hex: "381858"),
                signPlateBorder: Color(hex: "d0a8f0"),
                signText: Color(hex: "f8f0ff"),
                signDepthText: Color(hex: "e8c8ff")
            )
        }
    }

    static func islandAssetName(biome: CodeRunMapBiome, big: Bool) -> String {
        big
            ? "CodeRunMap/code_run_map_island_big_\(biome.rawValue)"
            : "CodeRunMap/code_run_map_island_small_\(biome.rawValue)"
    }
}

enum CodeRunRankFormatter {
    static func rankCondition(
        required: CodeRunLetterRank,
        thresholds: [CodeRunRankThreshold],
        isEnglish: Bool
    ) -> String {
        let threshold = thresholds.first(where: { $0.rank == required })
        let sec = threshold?.maxSeconds ?? 150
        let min = sec / 60
        let rem = sec % 60
        let timeLabel = isEnglish
            ? String(format: "%d:%02d or faster", min, rem)
            : (rem > 0 ? "\(min)分\(rem)秒以内" : "\(min)分以内")
        return isEnglish
            ? "Clear rank \(required.rawValue) or better (\(timeLabel))"
            : "クリアランク \(required.rawValue) 以上（\(timeLabel)）"
    }
}
