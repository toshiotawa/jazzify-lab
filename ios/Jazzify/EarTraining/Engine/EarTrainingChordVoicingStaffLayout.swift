import Foundation

/// Web `EarTrainingChordVoicingScreen` の `staffVoicingGroups` / 密集フラグ算出を Swift で再現する。
enum EarTrainingChordVoicingStaffLayout {
    /// Web `CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD`
    static let denseNoteTotalThreshold = 5

    struct GroupInput: Identifiable, Equatable, Sendable {
        let id: UUID
        let chordName: String
        let voicing: [String]
        let voicingStaves: [Int]
        let measureOffset: Int
        let isRest: Bool
    }

    struct BuildInput: Sendable {
        let phrase: EarTrainingPhraseDetail
        let stageLoopMeasures: Int
        let activeMeasureNumber: Int
        let activeChordId: UUID?
        let attempt: EarTrainingChordVoicingAttempt?
    }

    static func buildGroups(input: BuildInput) -> (groups: [GroupInput], denseCurrentMeasureLayout: Bool) {
        let chords = input.phrase.chords ?? []
        let loopDurationSec = input.phrase.loopDurationSec
        guard loopDurationSec > 0, !chords.isEmpty else {
            return ([], false)
        }

        let currentMeasureNumber = normalizeMeasureNumber(input.activeMeasureNumber, loopMeasures: input.stageLoopMeasures)
        let safeLoopMeasures = max(1, input.stageLoopMeasures)
        let nextMeasureNumber = currentMeasureNumber >= safeLoopMeasures ? 1 : currentMeasureNumber + 1
        var slotIndexByMeasure: [Int: Int] = [:]

        let visibleEntries = chords
            .sorted(by: sortChordsForVoicingDisplay)
            .map { chord -> (chord: EarTrainingPhraseChordDetail, measureNumber: Int) in
                (chord, chordMeasureNumber(chord: chord, loopDurationSec: loopDurationSec, loopMeasures: input.stageLoopMeasures))
            }
            .filter { $0.measureNumber == currentMeasureNumber || $0.measureNumber == nextMeasureNumber }

        let harmonyRow: EarTrainingChordVoicingEngine.HarmonyHudRow? = {
            guard let activeId = input.activeChordId else { return nil }
            return EarTrainingChordVoicingEngine.harmonyRow(containingChordId: activeId, phrase: input.phrase)
        }()
        let harmonyIdSet = Set(harmonyRow?.voicingIds ?? [])

        let currentMeasureNoteTotalAll = visibleEntries.reduce(0) { sum, entry in
            entry.measureNumber == currentMeasureNumber ? sum + (entry.chord.voicing?.count ?? 0) : sum
        }
        let currentMeasureNoteTotalInActiveHarmony = visibleEntries.reduce(0) { sum, entry in
            guard entry.measureNumber == currentMeasureNumber, harmonyIdSet.contains(entry.chord.id) else {
                return sum
            }
            return sum + (entry.chord.voicing?.count ?? 0)
        }
        let useWideCurrentMeasure: Bool = {
            if input.activeChordId != nil {
                return currentMeasureNoteTotalInActiveHarmony >= Self.denseNoteTotalThreshold
            }
            return currentMeasureNoteTotalAll >= Self.denseNoteTotalThreshold
        }()

        var nextMeasureVisibleCount = 0
        let filtered = visibleEntries.filter { entry in
            if entry.measureNumber == currentMeasureNumber || !useWideCurrentMeasure {
                return true
            }
            nextMeasureVisibleCount += 1
            return nextMeasureVisibleCount == 1
        }

        let groups: [GroupInput] = filtered.map { entry in
            let measureNumber = entry.measureNumber
            let chord = entry.chord
            let slotIndex = slotIndexByMeasure[measureNumber] ?? 0
            slotIndexByMeasure[measureNumber] = slotIndex + 1
            let voicingNoteNames: [String] = chord.voicing ?? []
            let staffRows: [Int] = chord.voicingStaves ?? []
            let offset = measureNumber == currentMeasureNumber ? 0 : 1
            let showName = slotIndex == 0
            return GroupInput(
                id: chord.id,
                chordName: showName ? chord.chordName : "",
                voicing: voicingNoteNames,
                voicingStaves: staffRows,
                measureOffset: offset,
                isRest: voicingNoteNames.isEmpty
            )
        }

        return (groups, useWideCurrentMeasure)
    }

    static func correctPitchClassesByGroupId(attempt: EarTrainingChordVoicingAttempt?) -> [UUID: Set<Int>] {
        guard let attempt else { return [:] }
        var map: [UUID: Set<Int>] = [:]
        for (id, pressed) in attempt.pressedByChord {
            map[id] = pressed
        }
        return map
    }

    private static func sortChordsForVoicingDisplay(_ a: EarTrainingPhraseChordDetail, _ b: EarTrainingPhraseChordDetail) -> Bool {
        let aStart = a.startTimeSec ?? 0
        let bStart = b.startTimeSec ?? 0
        if aStart != bStart { return aStart < bStart }
        return a.orderIndex < b.orderIndex
    }

    private static func normalizeMeasureNumber(_ measureNumber: Int, loopMeasures: Int) -> Int {
        let safe = max(1, loopMeasures)
        let m = max(1, measureNumber)
        return ((m - 1) % safe) + 1
    }

    private static func chordMeasureNumber(
        chord: EarTrainingPhraseChordDetail,
        loopDurationSec: Double,
        loopMeasures: Int
    ) -> Int {
        if let m = chord.measureNumber {
            return normalizeMeasureNumber(m, loopMeasures: loopMeasures)
        }
        if let start = chord.startTimeSec, start.isFinite {
            return measureNumberAtLoopTime(loopTimeSec: start, loopDurationSec: loopDurationSec, loopMeasures: loopMeasures)
        }
        return 1
    }

    private static func measureNumberAtLoopTime(loopTimeSec: Double, loopDurationSec: Double, loopMeasures: Int) -> Int {
        let safeLoopMeasures = max(1, loopMeasures)
        let measureDurationSec = loopDurationSec / Double(safeLoopMeasures)
        guard measureDurationSec.isFinite, measureDurationSec > 0 else { return 1 }
        return min(safeLoopMeasures, Int(floor(loopTimeSec / measureDurationSec)) + 1)
    }
}
