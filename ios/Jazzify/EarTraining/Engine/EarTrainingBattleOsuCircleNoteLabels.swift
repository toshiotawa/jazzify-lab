import Foundation

/// Web `earTrainingBattleOsuCircleNoteLabels.ts` 相当。
enum EarTrainingBattleOsuCircleNoteLabels {
    private static let pitchClassNames = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ]

    /// MusicXML 由来の spellings があれば優先。無いとき MIDI → シャープ固定名。
    static func resolve(from midis: [Int], musicXmlSpellings: [String]? = nil) -> [String] {
        if let musicXmlSpellings, !musicXmlSpellings.isEmpty {
            return musicXmlSpellings
        }
        let unique = Array(Set(midis)).sorted()
        return unique.map { midi in
            let pc = ((midi % 12) + 12) % 12
            return pitchClassNames[pc]
        }
    }

    /// アタック内 midis/spellings から低い MIDI 順の重複なし音名を作る。
    static func uniqueSpellings(midis: [Int], spellings: [String]) -> [String] {
        var byMidi: [Int: String] = [:]
        let n = min(midis.count, spellings.count)
        if n > 0 {
            for index in 0..<n {
                let midi = midis[index]
                let spelling = spellings[index].trimmingCharacters(in: .whitespacesAndNewlines)
                guard !spelling.isEmpty, byMidi[midi] == nil else { continue }
                byMidi[midi] = spelling
            }
        }
        return byMidi.keys.sorted().compactMap { byMidi[$0] }
    }
}
