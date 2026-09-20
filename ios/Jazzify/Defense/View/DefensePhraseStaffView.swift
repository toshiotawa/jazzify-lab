import SwiftUI

struct DefensePhraseStaffView: View {
    let phrase: DefensePhraseDefinition
    let stageKeyFifths: Int
    let chordIndex: Int
    let judgeState: DefensePhraseJudgeState
    let staffLayout: DefenseStaffLayout
    let showTargetHints: Bool
    let unpressedNoteOpacity: Double

    var body: some View {
        Group {
            if let chord = phrase.chords[safe: chordIndex] {
                let built = buildGroups(chord: chord)
                ChordVoicingStaffGroupsView(
                    groups: built.groups,
                    denseCurrentMeasureLayout: built.dense,
                    keyFifths: phrase.keyFifths ?? stageKeyFifths,
                    activeGroupId: built.activeGroupId,
                    correctPitchClassesByGroupId: built.correctMap,
                    showTargetHints: showTargetHints,
                    singleMeasureLayout: true,
                    hideChordLabels: false,
                    phraseTightTopLedgerPadding: true,
                    unpressedNoteOpacity: CGFloat(unpressedNoteOpacity),
                    compactChordLabelGap: true,
                    compactVerticalLayout: true,
                    fadeAllMeasureNotes: true,
                    fixedActiveStaves: staffLayout.displayStaves(
                        for: NotationInstrumentPreferences.loadPreset().clef
                    )
                )
            }
        }
    }

    private struct BuiltGroups {
        let groups: [EarTrainingChordVoicingStaffLayout.GroupInput]
        let correctMap: [UUID: Set<Int>]
        let activeGroupId: UUID?
        let dense: Bool
    }

    private func buildGroups(chord: SurvivalPhraseChord) -> BuiltGroups {
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        var correctMap: [UUID: Set<Int>] = [:]
        var activeGroupId: UUID?
        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)
        let writtenOffset = NotationInstrumentPreferences.loadWrittenOffset()
        let hasStaffChordNames = chord.notes.contains {
            !($0.staffChordName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true)
        }
        var previousStaffLabel = ""

        for (stepPosition, step) in steps.enumerated() {
            let groupId = UUID()
            var stepCorrect: Set<Int> = []
            var allRevealed = true
            var stepStaffLabel = ""
            for noteIndex in step.noteIndices {
                guard noteIndex < chord.notes.count else { continue }
                let note = chord.notes[noteIndex]
                if let label = note.staffChordName?.trimmingCharacters(in: .whitespacesAndNewlines),
                   !label.isEmpty {
                    stepStaffLabel = label
                }
                if judgeState.correctNoteIndices.contains(noteIndex) {
                    stepCorrect.insert(note.pitchClass)
                }
                if !judgeState.revealedNoteIndices.contains(noteIndex) {
                    allRevealed = false
                }
            }
            if showTargetHints, stepPosition == judgeState.targetStepIndex {
                activeGroupId = groupId
            }

            let rawLabel: String
            if hasStaffChordNames {
                rawLabel = (stepStaffLabel != previousStaffLabel) ? stepStaffLabel : ""
                if !stepStaffLabel.isEmpty {
                    previousStaffLabel = stepStaffLabel
                }
            } else {
                rawLabel = stepPosition == 0 ? chord.chordName : ""
            }
            let displayLabel = rawLabel.isEmpty
                ? ""
                : EarTrainingMusicXmlTransposer.transposeChordLabelPitchClass(
                    rawLabel,
                    semitones: writtenOffset
                )

            groups.append(
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: groupId,
                    chordName: displayLabel,
                    voicing: step.noteIndices.map { chord.notes[$0].noteName },
                    voicingStaves: step.noteIndices.map { chord.notes[$0].staff },
                    measureOffset: 0,
                    isRest: false,
                    exemptFromFade: allRevealed
                )
            )
            if !stepCorrect.isEmpty {
                correctMap[groupId] = stepCorrect
            }
        }

        let dense = chord.notes.count >= EarTrainingChordVoicingStaffLayout.denseNoteTotalThreshold
        return BuiltGroups(groups: groups, correctMap: correctMap, activeGroupId: activeGroupId, dense: dense)
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
