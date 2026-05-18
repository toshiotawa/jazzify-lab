import SwiftUI

/// Phrases モード用 2 小節譜面（現在和音 + 次和音、順次全音符）。
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
            singleMeasureLayout: false,
            hideChordLabels: false,
            noteCollisionLayout: .anchorLow,
            hideUnpressedNotes: snapshot.hideUnpressedAfter30s
        )
        .scaleEffect(1.35, anchor: .top)
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
        if let next = snapshot.nextChord {
            let nextBuilt = chordGroups(chord: next, measureOffset: 1, isCurrent: false)
            groups.append(contentsOf: nextBuilt.groups)
            correctMap.merge(nextBuilt.correctMap) { $1 }
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
            let isCorrect = snapshot.correctNoteIndices.contains(index)
            let isRevealed = snapshot.revealedNoteIndices.contains(index)
            let hide = snapshot.hideUnpressedAfter30s && isCurrent && !isCorrect && !isRevealed
            if isCurrent && snapshot.hintMode && !isCorrect && index == snapshot.targetNoteIndex {
                activeGroupId = groupId
            }
            let voicing = hide ? [] : [note.noteName]
            groups.append(
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: groupId,
                    chordName: index == 0 ? chord.chordName : "",
                    voicing: voicing,
                    voicingStaves: [note.staff],
                    measureOffset: measureOffset,
                    isRest: false
                )
            )
            if isCorrect {
                correctMap[groupId] = [note.pitchClass]
            }
        }
        return ChordBuilt(groups: groups, correctMap: correctMap, activeGroupId: activeGroupId)
    }
}
