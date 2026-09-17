import SwiftUI

struct DefenseTutorialStaffView: View {
    let staffDisplay: DefenseTutorialStaffDisplay
    let keyFifths: Int
    let clefOverride: NotationInstrumentClef?

    var body: some View {
        ChordVoicingStaffGroupsView(
            groups: staffDisplay.groups,
            denseCurrentMeasureLayout: false,
            keyFifths: keyFifths,
            activeGroupId: staffDisplay.activeGroupId,
            correctPitchClassesByGroupId: staffDisplay.correctPitchClassesByGroupId,
            showTargetHints: true,
            singleMeasureLayout: true,
            hideChordLabels: true,
            phraseTightTopLedgerPadding: true,
            unpressedNoteOpacity: 1,
            compactChordLabelGap: true,
            compactVerticalLayout: true,
            fadeAllMeasureNotes: false,
            fixedActiveStaves: resolvedStaves
        )
    }

    private var resolvedStaves: [Int] {
        switch clefOverride {
        case .bass: return [2]
        case .grand: return [1, 2]
        default: return [1]
        }
    }
}
