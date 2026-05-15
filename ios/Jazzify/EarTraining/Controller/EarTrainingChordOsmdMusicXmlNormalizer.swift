import Foundation

/// Web 版 `relocateHarmonyAfterFirstTimedNote` 相当。iOS では `XMLDocument` が非対応のため文字列で処理する。
enum EarTrainingChordOsmdMusicXmlNormalizer {
    static func normalizeChordOsmdMusicXml(_ xmlText: String) -> String {
        guard xmlText.contains("<backup>"), xmlText.contains("<harmony") else { return xmlText }

        let measurePattern = try? NSRegularExpression(
            pattern: #"<measure\b[^>]*>[\s\S]*?</measure>"#,
            options: []
        )
        guard let measurePattern else { return xmlText }

        let full = xmlText as NSString
        let fullRange = NSRange(location: 0, length: full.length)
        let matches = measurePattern.matches(in: xmlText, options: [], range: fullRange)
        guard !matches.isEmpty else { return xmlText }

        var rebuilt = ""
        var cursor = 0
        var anyChanged = false

        for match in matches {
            let measureRange = match.range
            if measureRange.location > cursor {
                rebuilt += full.substring(with: NSRange(location: cursor, length: measureRange.location - cursor))
            }
            let measureChunk = full.substring(with: measureRange)
            let relocated = relocateHarmonyAfterFirstTimedNote(in: measureChunk)
            if relocated != measureChunk {
                anyChanged = true
            }
            rebuilt += relocated
            cursor = measureRange.location + measureRange.length
        }
        if cursor < full.length {
            rebuilt += full.substring(with: NSRange(location: cursor, length: full.length - cursor))
        }
        return anyChanged ? rebuilt : xmlText
    }

    /// `<backup>` があり、先頭付近の `<harmony>` が最初のトップレベル `<note>` より前にあるとき、
    /// その `<harmony>` を「最初の `<note>...</note>` の直後」へ移す（複数あれば繰り返し）。
    private static func relocateHarmonyAfterFirstTimedNote(in measureXml: String) -> String {
        guard measureXml.contains("<backup>") else { return measureXml }
        var result = measureXml
        while true {
            let next = relocateOneLeadingHarmonyAfterFirstNote(in: result)
            if next == result { return result }
            result = next
        }
    }

    private static func relocateOneLeadingHarmonyAfterFirstNote(in measureXml: String) -> String {
        guard measureXml.contains("<backup>") else { return measureXml }

        guard let harmonyStart = measureXml.range(of: "<harmony") else { return measureXml }

        guard let firstNoteStart = measureXml.range(of: "<note") else { return measureXml }
        guard harmonyStart.lowerBound < firstNoteStart.lowerBound else { return measureXml }

        guard let harmonyEnd = measureXml.range(of: "</harmony>", range: harmonyStart.upperBound..<measureXml.endIndex) else {
            return measureXml
        }
        let harmonyBlock = measureXml[harmonyStart.lowerBound..<harmonyEnd.upperBound]

        var without = measureXml
        without.removeSubrange(harmonyStart.lowerBound..<harmonyEnd.upperBound)

        guard let noteStart = without.range(of: "<note") else { return measureXml }
        guard let noteClose = without.range(of: "</note>", range: noteStart.upperBound..<without.endIndex) else {
            return measureXml
        }
        let insertPos = noteClose.upperBound
        without.insert(contentsOf: harmonyBlock, at: insertPos)
        return String(without)
    }
}
