import SwiftUI

/// Progression + HINT 時の単一和弦（ヘ音のみ）。バトル用 `ChordVoicingStaffGroupsView` を再利用する。
struct SurvivalProgressionStaffView: View {
    let voicingNames: [String]
    let keyFifths: Int
    let correctPitchClasses: [Int]

    private static let staffGroupId = UUID(uuidString: "A0B99C62-1111-4222-A333-D44444444101")!

    var body: some View {
        let group = EarTrainingChordVoicingStaffLayout.GroupInput(
            id: Self.staffGroupId,
            chordName: "",
            voicing: voicingNames,
            voicingStaves: voicingNames.map { _ in 2 },
            measureOffset: 0,
            isRest: false
        )
        let dense = voicingNames.count >= EarTrainingChordVoicingStaffLayout.denseNoteTotalThreshold
        let correctSet = Set(correctPitchClasses.map { (($0 % 12) + 12) % 12 })
        ChordVoicingStaffGroupsView(
            groups: [group],
            denseCurrentMeasureLayout: dense,
            keyFifths: keyFifths,
            activeGroupId: nil,
            correctPitchClassesByGroupId: [Self.staffGroupId: correctSet],
            completionPulse: nil,
            showTargetHints: false
        )
    }
}
