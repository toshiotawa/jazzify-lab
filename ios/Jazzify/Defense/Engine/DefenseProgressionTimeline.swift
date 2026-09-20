import Foundation

struct DefenseStageProgressionChord: Codable, Sendable, Equatable, Identifiable {
    var id: Int { orderIndex }
    let orderIndex: Int
    let chordName: String
    let measureNumber: Int
    let beatOffset: Int
    let durationBeats: Int

    enum CodingKeys: String, CodingKey {
        case orderIndex = "order_index"
        case chordName = "chord_name"
        case measureNumber = "measure_number"
        case beatOffset = "beat_offset"
        case durationBeats = "duration_beats"
    }
}

struct DefenseProgressionChip: Equatable, Identifiable {
    let id: String
    let name: String
    let active: Bool
}

enum DefenseProgressionTimeline {
    static let hudSlotCount = 4

    static func loopPositionToBeatInLoop(
        positionInLoopSec: Double,
        barSec: Double,
        beatsPerBar: Int
    ) -> Double {
        guard barSec > 0, beatsPerBar > 0 else { return 0 }
        return max(0, positionInLoopSec) / barSec * Double(beatsPerBar)
    }

    static func elapsedSecToBeatInLoop(
        elapsedSec: Double,
        loopStartSec: Double,
        loopEndSec: Double,
        startOffsetSec: Double,
        barSec: Double,
        beatsPerBar: Int
    ) -> Double {
        let loopDuration = max(1e-6, loopEndSec - loopStartSec)
        let positionInBuffer = startOffsetSec + max(0, elapsedSec)
        var positionInLoop = positionInBuffer - loopStartSec
        positionInLoop.formTruncatingRemainder(dividingBy: loopDuration)
        if positionInLoop < 0 {
            positionInLoop += loopDuration
        }
        return loopPositionToBeatInLoop(
            positionInLoopSec: positionInLoop,
            barSec: barSec,
            beatsPerBar: beatsPerBar
        )
    }

    struct HudWindow: Equatable {
        let firstVisibleIndex: Int
        let visibleCount: Int
    }

    static func resolveHudWindow(
        chipCount: Int,
        activeIndex: Int,
        slotCount: Int = hudSlotCount
    ) -> HudWindow {
        let visibleCount = min(slotCount, max(0, chipCount))
        guard visibleCount > 0 else {
            return HudWindow(firstVisibleIndex: 0, visibleCount: 0)
        }
        let safeActive = min(max(activeIndex, 0), max(0, chipCount - 1))
        let pageStart = (safeActive / slotCount) * slotCount
        let maxStart = max(0, chipCount - visibleCount)
        let firstVisibleIndex = min(pageStart, maxStart)
        return HudWindow(firstVisibleIndex: firstVisibleIndex, visibleCount: visibleCount)
    }

    private static func startBeat(_ chord: DefenseStageProgressionChord, beatsPerBar: Int) -> Double {
        Double((chord.measureNumber - 1) * beatsPerBar + (chord.beatOffset - 1))
    }

    static func resolveActiveIndex(
        chords: [DefenseStageProgressionChord],
        beatInForm: Double,
        formBarCount: Int,
        beatsPerBar: Int
    ) -> Int {
        guard !chords.isEmpty, formBarCount > 0, beatsPerBar > 0 else { return 0 }
        let totalBeats = Double(formBarCount * beatsPerBar)
        var normalized = beatInForm.truncatingRemainder(dividingBy: totalBeats)
        if normalized < 0 { normalized += totalBeats }

        for index in stride(from: chords.count - 1, through: 0, by: -1) {
            let start = startBeat(chords[index], beatsPerBar: beatsPerBar)
            if normalized + 1e-9 >= start {
                return index
            }
        }
        return 0
    }

    static func resolveFormBarCount(progressionBars: Int?, phraseLoopBarCount: Int) -> Int {
        if let progressionBars, progressionBars > 0 {
            return progressionBars
        }
        return max(1, phraseLoopBarCount)
    }

    static func buildChips(
        chords: [DefenseStageProgressionChord],
        activeIndex: Int,
        transposeLabel: (String) -> String
    ) -> [DefenseProgressionChip] {
        chords.enumerated().map { index, chord in
            DefenseProgressionChip(
                id: "progression-\(chord.orderIndex)",
                name: transposeLabel(chord.chordName),
                active: index == activeIndex
            )
        }
    }
}
