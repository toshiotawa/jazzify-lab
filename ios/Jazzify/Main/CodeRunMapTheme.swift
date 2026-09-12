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
                skyTop: Color(hex: "12182a"),
                skyBottom: Color(hex: "1a2840"),
                signPlateTop: Color(hex: "1a2838"),
                signPlateBottom: Color(hex: "0e1828"),
                signPlateBorder: Color(hex: "6a8ab8"),
                signText: Color(hex: "e8f0ff"),
                signDepthText: Color(hex: "a8c0e0")
            )
        case .sand:
            return CodeRunMapBiomeTheme(
                biome: .sand,
                skyTop: Color(hex: "1a1420"),
                skyBottom: Color(hex: "2a1c18"),
                signPlateTop: Color(hex: "281820"),
                signPlateBottom: Color(hex: "181018"),
                signPlateBorder: Color(hex: "e8a040"),
                signText: Color(hex: "fff4e0"),
                signDepthText: Color(hex: "d0a860")
            )
        case .snow:
            return CodeRunMapBiomeTheme(
                biome: .snow,
                skyTop: Color(hex: "101828"),
                skyBottom: Color(hex: "1c2a40"),
                signPlateTop: Color(hex: "182838"),
                signPlateBottom: Color(hex: "0c1828"),
                signPlateBorder: Color(hex: "88a8d0"),
                signText: Color(hex: "e8f4ff"),
                signDepthText: Color(hex: "a0c0e8")
            )
        case .stone:
            return CodeRunMapBiomeTheme(
                biome: .stone,
                skyTop: Color(hex: "12141c"),
                skyBottom: Color(hex: "1c222c"),
                signPlateTop: Color(hex: "222830"),
                signPlateBottom: Color(hex: "141820"),
                signPlateBorder: Color(hex: "8898a8"),
                signText: Color(hex: "e8ecf0"),
                signDepthText: Color(hex: "a8b0b8")
            )
        case .purple:
            return CodeRunMapBiomeTheme(
                biome: .purple,
                skyTop: Color(hex: "140c24"),
                skyBottom: Color(hex: "281848"),
                signPlateTop: Color(hex: "281840"),
                signPlateBottom: Color(hex: "140828"),
                signPlateBorder: Color(hex: "a878d0"),
                signText: Color(hex: "f0e8ff"),
                signDepthText: Color(hex: "c8a8e8")
            )
        }
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
