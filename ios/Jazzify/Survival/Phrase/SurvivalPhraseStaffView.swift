import SwiftUI

/// Phrases モード用 1 小節譜面（現在和音のみ、順次全音符）。
struct SurvivalPhraseStaffView: View {
    let snapshot: SurvivalPhraseStaffSnapshot

    var body: some View {
        let built = buildGroups()
        ChordVoicingStaffGroupsView(
            groups: built.groups,
            denseCurrentMeasureLayout: built.dense,
            keyFifths: snapshot.keyFifths,
            activeGroupId: built.activeGroupId,
            correctPitchClassesByGroupId: built.correctMap,
            completionPulse: nil,
            showTargetHints: snapshot.hintMode,
            singleMeasureLayout: true,
            hideChordLabels: false,
            noteCollisionLayout: .anchorLow,
            phraseTightTopLedgerPadding: true,
            unpressedNoteOpacity: CGFloat(snapshot.unpressedNoteOpacity),
            compactChordLabelGap: true,
            compactVerticalLayout: true,
            fadeAllMeasureNotes: true
        )
    }

    private struct BuiltGroups {
        let groups: [EarTrainingChordVoicingStaffLayout.GroupInput]
        let correctMap: [UUID: Set<Int>]
        let activeGroupId: UUID?
        let dense: Bool
    }

    private func buildGroups() -> BuiltGroups {
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        var correctMap: [UUID: Set<Int>] = [:]
        var activeGroupId: UUID?
        var noteCountCurrent = 0

        if let current = snapshot.currentChord {
            let currentBuilt = chordGroups(chord: current, measureOffset: 0, isCurrent: true)
            groups.append(contentsOf: currentBuilt.groups)
            correctMap.merge(currentBuilt.correctMap) { $1 }
            activeGroupId = currentBuilt.activeGroupId
            noteCountCurrent = current.notes.count
        }

        let dense = noteCountCurrent >= EarTrainingChordVoicingStaffLayout.denseNoteTotalThreshold
        return BuiltGroups(groups: groups, correctMap: correctMap, activeGroupId: activeGroupId, dense: dense)
    }

    private struct ChordBuilt {
        let groups: [EarTrainingChordVoicingStaffLayout.GroupInput]
        let correctMap: [UUID: Set<Int>]
        let activeGroupId: UUID?
    }

    private func chordGroups(chord: SurvivalPhraseChord, measureOffset: Int, isCurrent: Bool) -> ChordBuilt {
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        var correctMap: [UUID: Set<Int>] = [:]
        var activeGroupId: UUID?

        for (index, note) in chord.notes.enumerated() {
            let groupId = UUID()
            let isCorrect = isCurrent && snapshot.correctNoteIndices.contains(index)
            let isRevealed = isCurrent && snapshot.revealedNoteIndices.contains(index)
            if isCurrent && snapshot.hintMode && !isCorrect && index == snapshot.targetNoteIndex {
                activeGroupId = groupId
            }
            groups.append(
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: groupId,
                    chordName: index == 0 ? chord.chordName : "",
                    voicing: [note.noteName],
                    voicingStaves: [note.staff],
                    measureOffset: measureOffset,
                    isRest: false,
                    exemptFromFade: isCurrent && isRevealed
                )
            )
            if isCorrect {
                correctMap[groupId] = [note.pitchClass]
            }
        }
        return ChordBuilt(groups: groups, correctMap: correctMap, activeGroupId: activeGroupId)
    }
}
