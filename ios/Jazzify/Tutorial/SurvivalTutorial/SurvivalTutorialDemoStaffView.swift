import SwiftUI

struct SurvivalTutorialDemoStaffView: View {
    let snapshot: SurvivalTutorialDemoStaffSnapshot

    var body: some View {
        let built = Self.buildPresentation(snapshot: snapshot)
        if built.groups.isEmpty {
            EmptyView()
        } else {
            ChordVoicingStaffGroupsView(
                groups: built.groups,
                denseCurrentMeasureLayout: built.denseLayout,
                keyFifths: snapshot.keyFifths,
                activeGroupId: built.activeGroupId,
                correctPitchClassesByGroupId: built.correctByGroupId,
                completionPulse: nil,
                showTargetHints: false,
                singleMeasureLayout: false,
                hideChordLabels: false,
                noteCollisionLayout: .anchorLow,
                unpressedNoteOpacity: 0.45,
                compactChordLabelGap: true
            )
            .frame(maxWidth: min(620, UIScreen.main.bounds.width * 0.92))
        }
    }

    private struct Presentation {
        let groups: [EarTrainingChordVoicingStaffLayout.GroupInput]
        let denseLayout: Bool
        let activeGroupId: UUID?
        let correctByGroupId: [UUID: Set<Int>]
    }

    private static func buildPresentation(snapshot: SurvivalTutorialDemoStaffSnapshot) -> Presentation {
        let windowEnd = snapshot.windowStartMeasure + 1
        var slotByMeasure: [Int: Int] = [:]
        var groups: [EarTrainingChordVoicingStaffLayout.GroupInput] = []
        var correctByGroupId: [UUID: Set<Int>] = [:]
        var activeGroupId: UUID?
        var totalNotes = 0

        for (index, chord) in snapshot.chords.enumerated() {
            guard chord.measure_number >= snapshot.windowStartMeasure,
                  chord.measure_number <= windowEnd else {
                continue
            }
            let slotIndex = slotByMeasure[chord.measure_number, default: 0]
            slotByMeasure[chord.measure_number] = slotIndex + 1
            let names = SurvivalTutorialDemoStaffBuilder.voicingNames(for: chord)
            let staves = SurvivalTutorialDemoStaffBuilder.voicingStaves(for: chord, names: names)
            let measureOffset = chord.measure_number == snapshot.windowStartMeasure ? 0 : 1
            let groupId = demoGroupId(chordIndex: index)
            let isActive = snapshot.activeChordIndex == index
            if isActive {
                activeGroupId = groupId
                correctByGroupId[groupId] = Set(chord.voicing.map { (($0 % 12) + 12) % 12 })
            }
            totalNotes += names.count
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

        return Presentation(
            groups: groups,
            denseLayout: totalNotes >= EarTrainingChordVoicingStaffLayout.denseNoteTotalThreshold,
            activeGroupId: activeGroupId,
            correctByGroupId: correctByGroupId
        )
    }

    private static func demoGroupId(chordIndex: Int) -> UUID {
        UUID(uuidString: String(format: "DEM00000-0000-4000-8000-%012X", chordIndex))
            ?? UUID()
    }
}
