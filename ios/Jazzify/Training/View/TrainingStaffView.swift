import SwiftUI

struct TrainingStaffView: View {
    let question: TrainingQuestion
    let correctIndices: [Int]
    let showHints: Bool
    let kind: TrainingKind
    let unpressedNoteOpacity: CGFloat
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

    private var displayNotes: [TrainingQuestionNote] {
        TrainingEngine.staffDisplayNotes(
            question: question,
            practiceMode: showHints,
            kind: kind
        )
    }

    private var staffGroups: [EarTrainingChordVoicingStaffLayout.GroupInput] {
        if question.layout == .horizontal {
            return displayNotes.enumerated().map { index, note in
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: stableGroupId(index: index),
                    chordName: "",
                    voicing: [note.noteName],
                    voicingStaves: [note.staff],
                    measureOffset: 0,
                    isRest: false
                )
            }
        }
        if question.layout == .grouped {
            let groupCount = question.voicingGroupCount
                ?? ((question.notes.map { $0.groupIndex ?? 0 }.max() ?? 0) + 1)
            var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
            for groupIndex in 0..<groupCount {
                let indices = question.notes.enumerated().compactMap { index, note -> Int? in
                    (note.groupIndex ?? 0) == groupIndex ? index : nil
                }
                guard !indices.isEmpty else { continue }
                groups.append(
                    EarTrainingChordVoicingStaffLayout.GroupInput(
                        id: stableGroupId(index: groupIndex),
                        chordName: "",
                        voicing: indices.compactMap { question.notes[safe: $0]?.noteName },
                        voicingStaves: indices.compactMap { question.notes[safe: $0]?.staff },
                        measureOffset: 0,
                        isRest: false
                    )
                )
            }
            return groups
        }
        return [
            EarTrainingChordVoicingStaffLayout.GroupInput(
                id: stableGroupId(index: 0),
                chordName: "",
                voicing: displayNotes.map(\.noteName),
                voicingStaves: displayNotes.map(\.staff),
                measureOffset: 0,
                isRest: false
            ),
        ]
    }

    private var correctPitchClassesByGroupId: [UUID: Set<Int>] {
        if question.layout == .horizontal {
            return Dictionary(uniqueKeysWithValues: displayNotes.enumerated().map { index, note in
                let groupId = stableGroupId(index: index)
                let pcs = correctIndices.contains(index) ? [note.pitchClass] : []
                return (groupId, Set(pcs))
            })
        }
        if question.layout == .grouped {
            let groupCount = question.voicingGroupCount
                ?? ((question.notes.map { $0.groupIndex ?? 0 }.max() ?? 0) + 1)
            var out: [UUID: Set<Int>] = [:]
            for groupIndex in 0..<groupCount {
                let indices = question.notes.enumerated().compactMap { index, note -> Int? in
                    (note.groupIndex ?? 0) == groupIndex ? index : nil
                }
                let pcs = indices.compactMap { index -> Int? in
                    guard correctIndices.contains(index) else { return nil }
                    return question.notes[safe: index]?.pitchClass
                }
                out[stableGroupId(index: groupIndex)] = Set(pcs)
            }
            return out
        }
        let groupId = stableGroupId(index: 0)
        let pcs = TrainingEngine.staffHintedPitchClasses(
            question: question,
            correctIndices: correctIndices,
            practiceMode: showHints,
            kind: kind
        )
        return [groupId: Set(pcs)]
    }

    var body: some View {
        ChordVoicingStaffGroupsView(
            groups: staffGroups,
            denseCurrentMeasureLayout: question.layout == .horizontal || question.layout == .grouped,
            keyFifths: question.keyFifths,
            activeGroupId: nil,
            correctPitchClassesByGroupId: correctPitchClassesByGroupId,
            showTargetHints: showHints,
            singleMeasureLayout: true,
            hideChordLabels: true,
            phraseTightTopLedgerPadding: true,
            unpressedNoteOpacity: unpressedNoteOpacity,
            compactChordLabelGap: true,
            compactVerticalLayout: true,
            fixedActiveStaves: fixedActiveStaves,
            ignoreNotationInstrument: ignoreNotationInstrument
        )
        .frame(maxHeight: .infinity)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func stableGroupId(index: Int) -> UUID {
        UUID(uuidString: "00000000-0000-4000-8000-\(String(format: "%012x", index))") ?? UUID()
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
