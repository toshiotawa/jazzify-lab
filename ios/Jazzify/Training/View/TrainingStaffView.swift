import SwiftUI

struct TrainingStaffView: View {
    let question: TrainingQuestion
    let correctIndices: [Int]
    let showHints: Bool
    let clefMode: TrainingClefMode

    private var ignoreNotationInstrument: Bool {
        clefMode == .bassConcert || clefMode == .grandConcert
    }

    private var fixedActiveStaves: [Int]? {
        switch clefMode {
        case .bassConcert: return [2]
        case .grandConcert: return [1, 2]
        case .instrument: return nil
        }
    }

    private var staffGroups: [EarTrainingChordVoicingStaffLayout.GroupInput] {
        if question.layout == .horizontal {
            return question.notes.enumerated().map { index, note in
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: stableGroupId(index: index),
                    chordName: index == 0 ? question.promptLabel : "",
                    voicing: [note.noteName],
                    voicingStaves: [note.staff],
                    measureOffset: 0,
                    isRest: false
                )
            }
        }
        return [
            EarTrainingChordVoicingStaffLayout.GroupInput(
                id: stableGroupId(index: 0),
                chordName: question.promptLabel,
                voicing: question.notes.map(\.noteName),
                voicingStaves: question.notes.map(\.staff),
                measureOffset: 0,
                isRest: false
            ),
        ]
    }

    private var correctPitchClassesByGroupId: [UUID: Set<Int>] {
        if question.layout == .horizontal {
            return Dictionary(uniqueKeysWithValues: question.notes.enumerated().map { index, note in
                let groupId = stableGroupId(index: index)
                let pcs = correctIndices.contains(index) ? [note.pitchClass] : []
                return (groupId, Set(pcs))
            })
        }
        let groupId = stableGroupId(index: 0)
        let pcs = question.notes.enumerated()
            .filter { correctIndices.contains($0.offset) }
            .map(\.element.pitchClass)
        return [groupId: Set(pcs)]
    }

    var body: some View {
        ChordVoicingStaffGroupsView(
            groups: staffGroups,
            denseCurrentMeasureLayout: question.layout == .horizontal,
            keyFifths: question.keyFifths,
            activeGroupId: nil,
            correctPitchClassesByGroupId: correctPitchClassesByGroupId,
            showTargetHints: showHints,
            singleMeasureLayout: true,
            hideChordLabels: question.layout == .horizontal,
            unpressedNoteOpacity: 1,
            fixedActiveStaves: fixedActiveStaves,
            ignoreNotationInstrument: ignoreNotationInstrument
        )
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func stableGroupId(index: Int) -> UUID {
        UUID(uuidString: "00000000-0000-4000-8000-\(String(format: "%012x", index))") ?? UUID()
    }
}
