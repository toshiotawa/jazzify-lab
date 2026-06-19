import SwiftUI

struct SurvivalTutorialDemoStaffView: View {
    let snapshot: SurvivalTutorialDemoStaffSnapshot

    var body: some View {
        let built = Self.buildPresentation(snapshot: snapshot)
        let isPad = SurvivalStaffOverlayLayout.isPad
        let grandStaff = built.usesGrandStaffLayout

        if !built.showEmptyStaff && built.groups.isEmpty {
            EmptyView()
        } else {
            ChordVoicingStaffGroupsView(
                groups: built.groups,
                denseCurrentMeasureLayout: built.denseLayout,
                keyFifths: snapshot.keyFifths,
                activeGroupId: built.activeGroupId,
                correctPitchClassesByGroupId: built.correctByGroupId,
                completionPulse: nil,
                showEmptyStaff: built.showEmptyStaff,
                showTargetHints: false,
                singleMeasureLayout: true,
                hideChordLabels: false,
                noteCollisionLayout: .anchorLow,
                unpressedNoteOpacity: 0.45,
                compactChordLabelGap: true,
                staffSpacingScale: SurvivalStaffOverlayLayout.staffSpacingScale,
                fixedActiveStaves: built.fixedActiveStaves
            )
            .frame(
                maxWidth: SurvivalStaffOverlayLayout.scenarioStaffMaxWidth(isPad: isPad),
                maxHeight: SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(isPad: isPad, grandStaff: grandStaff),
                alignment: .top
            )
        }
    }

    private struct Presentation {
        let groups: [EarTrainingChordVoicingStaffLayout.GroupInput]
        let denseLayout: Bool
        let activeGroupId: UUID?
        let correctByGroupId: [UUID: Set<Int>]
        let showEmptyStaff: Bool
        let usesGrandStaffLayout: Bool
        let fixedActiveStaves: [Int]
    }

    private static func voicingForActiveChord(
        _ chord: SurvivalTutorialV3DemoChordEvent,
        activeRollStepIndex: Int?
    ) -> [Int] {
        guard let activeRollStepIndex,
              let rollSteps = chord.rollSteps,
              rollSteps.indices.contains(activeRollStepIndex) else {
            return chord.voicing
        }
        return rollSteps[activeRollStepIndex].voicing
    }

    private static func voicingNamesForActiveChord(
        _ chord: SurvivalTutorialV3DemoChordEvent,
        fallback: [String],
        activeRollStepIndex: Int?
    ) -> [String] {
        guard let activeRollStepIndex,
              let rollSteps = chord.rollSteps,
              rollSteps.indices.contains(activeRollStepIndex),
              let names = rollSteps[activeRollStepIndex].voicingNames,
              names.count == rollSteps[activeRollStepIndex].voicing.count else {
            return fallback
        }
        return names
    }

    private static func voicingStavesForActiveChord(
        _ chord: SurvivalTutorialV3DemoChordEvent,
        fallback: [Int],
        activeRollStepIndex: Int?
    ) -> [Int] {
        guard let activeRollStepIndex,
              let rollSteps = chord.rollSteps,
              rollSteps.indices.contains(activeRollStepIndex),
              let staves = rollSteps[activeRollStepIndex].voicing_staves,
              staves.count == rollSteps[activeRollStepIndex].voicing.count else {
            return fallback
        }
        return staves
    }

    private static func highlightPitchClasses(
        _ chord: SurvivalTutorialV3DemoChordEvent,
        activeRollStepIndex: Int?
    ) -> Set<Int> {
        if let activeRollStepIndex,
           let rollSteps = chord.rollSteps,
           rollSteps.indices.contains(activeRollStepIndex) {
            return Set(rollSteps[activeRollStepIndex].newVoicing.map { (($0 % 12) + 12) % 12 })
        }
        return Set(chord.voicing.map { (($0 % 12) + 12) % 12 })
    }

    private static func buildPresentation(snapshot: SurvivalTutorialDemoStaffSnapshot) -> Presentation {
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        var correctByGroupId: [UUID: Set<Int>] = [:]
        var activeGroupId: UUID?
        var totalNotes = 0
        var hasRestInWindow = false
        var hasVoicedInWindow = false

        for (index, chord) in snapshot.chords.enumerated() {
            guard chord.measure_number == snapshot.windowStartMeasure else {
                continue
            }
            if chord.voicing.isEmpty {
                hasRestInWindow = true
                continue
            }
            hasVoicedInWindow = true

            let isActive = snapshot.activeChordIndex == index
            let displayVoicing = isActive
                ? voicingForActiveChord(chord, activeRollStepIndex: snapshot.activeRollStepIndex)
                : chord.voicing
            if displayVoicing.isEmpty {
                continue
            }

            let baseNames = SurvivalTutorialDemoStaffBuilder.voicingNames(for: chord)
            let names = isActive
                ? voicingNamesForActiveChord(chord, fallback: baseNames, activeRollStepIndex: snapshot.activeRollStepIndex)
                : baseNames
            let staves = isActive
                ? voicingStavesForActiveChord(
                    chord,
                    fallback: SurvivalTutorialDemoStaffBuilder.voicingStaves(for: chord, names: names),
                    activeRollStepIndex: snapshot.activeRollStepIndex
                )
                : SurvivalTutorialDemoStaffBuilder.voicingStaves(for: chord, names: names)
            let measureOffset = 0
            let groupId = demoGroupId(chordIndex: index)
            if isActive {
                activeGroupId = groupId
                correctByGroupId[groupId] = highlightPitchClasses(chord, activeRollStepIndex: snapshot.activeRollStepIndex)
            }
            totalNotes += min(names.count, displayVoicing.count)
            groups.append(
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: groupId,
                    chordName: isActive ? chord.chordName : "",
                    voicing: Array(names.prefix(displayVoicing.count)),
                    voicingStaves: Array(staves.prefix(displayVoicing.count)),
                    measureOffset: measureOffset,
                    isRest: false,
                    exemptFromFade: isActive
                )
            )
        }

        let showEmptyStaff = hasRestInWindow && !hasVoicedInWindow
        let fixedActiveStaves = SurvivalTutorialDemoStaffBuilder.fixedStaves(for: snapshot.chords)
        let usesGrandStaffLayout = showEmptyStaff
            || SurvivalStaffOverlayLayout.usesGrandStaff(voicingStaves: fixedActiveStaves)

        return Presentation(
            groups: groups,
            denseLayout: totalNotes >= EarTrainingChordVoicingStaffLayout.denseNoteTotalThreshold,
            activeGroupId: activeGroupId,
            correctByGroupId: correctByGroupId,
            showEmptyStaff: showEmptyStaff,
            usesGrandStaffLayout: usesGrandStaffLayout,
            fixedActiveStaves: fixedActiveStaves
        )
    }

    private static func demoGroupId(chordIndex: Int) -> UUID {
        UUID(uuidString: String(format: "DEM00000-0000-4000-8000-%012X", chordIndex))
            ?? UUID()
    }
}
