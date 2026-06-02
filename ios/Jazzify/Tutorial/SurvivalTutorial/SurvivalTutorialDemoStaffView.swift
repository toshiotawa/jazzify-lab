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
                staffSpacingScale: SurvivalStaffOverlayLayout.staffSpacingScale
            )
            .frame(
                maxWidth: SurvivalStaffOverlayLayout.scenarioStaffMaxWidth(isPad: isPad),
                maxHeight: SurvivalStaffOverlayLayout.scenarioStaffMaxHeight(isPad: isPad, grandStaff: grandStaff),
                alignment: .top
            )
            .modifier(SurvivalTutorialStaffBackdropModifier())
        }
    }

    private struct Presentation {
        let groups: [EarTrainingChordVoicingStaffLayout.GroupInput]
        let denseLayout: Bool
        let activeGroupId: UUID?
        let correctByGroupId: [UUID: Set<Int>]
        let showEmptyStaff: Bool
        let usesGrandStaffLayout: Bool
    }

    private static func buildPresentation(snapshot: SurvivalTutorialDemoStaffSnapshot) -> Presentation {
        var slotByMeasure: [Int: Int] = [:]
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        var correctByGroupId: [UUID: Set<Int>] = [:]
        var activeGroupId: UUID?
        var totalNotes = 0
        var hasRestInWindow = false
        var hasVoicedInWindow = false
        var voicedStaves: [Int] = []

        for (index, chord) in snapshot.chords.enumerated() {
            guard chord.measure_number == snapshot.windowStartMeasure else {
                continue
            }
            if chord.voicing.isEmpty {
                hasRestInWindow = true
                continue
            }
            hasVoicedInWindow = true

            let slotIndex = slotByMeasure[chord.measure_number, default: 0]
            slotByMeasure[chord.measure_number] = slotIndex + 1
            let names = SurvivalTutorialDemoStaffBuilder.voicingNames(for: chord)
            let staves = SurvivalTutorialDemoStaffBuilder.voicingStaves(for: chord, names: names)
            let measureOffset = 0
            let groupId = demoGroupId(chordIndex: index)
            let isActive = snapshot.activeChordIndex == index
            if isActive {
                activeGroupId = groupId
                correctByGroupId[groupId] = Set(chord.voicing.map { (($0 % 12) + 12) % 12 })
            }
            totalNotes += names.count
            voicedStaves.append(contentsOf: staves)
            groups.append(
                EarTrainingChordVoicingStaffLayout.GroupInput(
                    id: groupId,
                    chordName: slotIndex == 0 ? chord.chordName : "",
                    voicing: names,
                    voicingStaves: staves,
                    measureOffset: measureOffset,
                    isRest: false,
                    exemptFromFade: isActive
                )
            )
        }

        let showEmptyStaff = hasRestInWindow && !hasVoicedInWindow
        let usesGrandStaffLayout = showEmptyStaff
            || SurvivalStaffOverlayLayout.usesGrandStaff(voicingStaves: voicedStaves)

        return Presentation(
            groups: groups,
            denseLayout: totalNotes >= EarTrainingChordVoicingStaffLayout.denseNoteTotalThreshold,
            activeGroupId: activeGroupId,
            correctByGroupId: correctByGroupId,
            showEmptyStaff: showEmptyStaff,
            usesGrandStaffLayout: usesGrandStaffLayout
        )
    }

    private static func demoGroupId(chordIndex: Int) -> UUID {
        UUID(uuidString: String(format: "DEM00000-0000-4000-8000-%012X", chordIndex))
            ?? UUID()
    }
}
