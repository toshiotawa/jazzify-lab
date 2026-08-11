import SwiftUI

/// Phrases モード用 1 小節譜面（現在和音のみ、順次全音符）。
struct SurvivalPhraseStaffView: View {
    let snapshot: SurvivalPhraseStaffSnapshot
    /// サバイバル iPad 用: 五線間隔スケール。既定 1。
    let staffSpacingScale: CGFloat

    init(snapshot: SurvivalPhraseStaffSnapshot, staffSpacingScale: CGFloat = 1) {
        self.snapshot = snapshot
        self.staffSpacingScale = staffSpacingScale
    }

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
            fadeAllMeasureNotes: true,
            staffSpacingScale: staffSpacingScale
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
        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)

        for (stepPosition, step) in steps.enumerated() {
            let groupId = UUID()
            var stepCorrectPitchClasses: Set<Int> = []
            var allRevealed = true

            for noteIndex in step.noteIndices {
                guard noteIndex < chord.notes.count else { continue }
                let note = chord.notes[noteIndex]
                if isCurrent, snapshot.correctNoteIndices.contains(noteIndex) {
                    stepCorrectPitchClasses.insert(note.pitchClass)
                }
                if isCurrent, !snapshot.revealedNoteIndices.contains(noteIndex) {
                    allRevealed = false
                }
            }

            if isCurrent, snapshot.hintMode, stepPosition == snapshot.targetStepIndex {
                activeGroupId = groupId
            }

            groups.append(
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: groupId,
                    chordName: stepPosition == 0 ? chord.chordName : "",
                    voicing: step.noteIndices.map { chord.notes[$0].noteName },
                    voicingStaves: step.noteIndices.map { chord.notes[$0].staff },
                    measureOffset: measureOffset,
                    isRest: false,
                    exemptFromFade: isCurrent && allRevealed
                )
            )
            if !stepCorrectPitchClasses.isEmpty {
                correctMap[groupId] = stepCorrectPitchClasses
            }
        }
        return ChordBuilt(groups: groups, correctMap: correctMap, activeGroupId: activeGroupId)
    }
}
