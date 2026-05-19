import SwiftUI

/// Progression + HINT 時の単一和弦。バトル用 `ChordVoicingStaffGroupsView` を再利用する。
/// - `staffClef`: 1 = ト音、2 = ヘ音（WEB / MusicXML の staves 番号と一致）
struct SurvivalProgressionStaffView: View {
    let chordDisplayName: String
    let voicingNames: [String]
    let keyFifths: Int
    let correctPitchClasses: [Int]
    /// 既定はヘ音（Progression）。ランダム HINT は 1（ト音）。
    let staffClef: Int
    /// Web `ChordVoicingStaff.noteCollisionLayout` と同等。
    let noteCollisionLayout: ChordVoicingStaffNoteCollisionLayout
    /// 未正解符頭 opacity（0〜1）。本番 HINT OFF フェード用。
    let unpressedNoteOpacity: CGFloat

    init(
        chordDisplayName: String,
        voicingNames: [String],
        keyFifths: Int,
        correctPitchClasses: [Int],
        staffClef: Int = 2,
        noteCollisionLayout: ChordVoicingStaffNoteCollisionLayout = .anchorLow,
        unpressedNoteOpacity: CGFloat = 1
    ) {
        self.chordDisplayName = chordDisplayName
        self.voicingNames = voicingNames
        self.keyFifths = keyFifths
        self.correctPitchClasses = correctPitchClasses
        self.staffClef = staffClef
        self.noteCollisionLayout = noteCollisionLayout
        self.unpressedNoteOpacity = unpressedNoteOpacity
    }

    private static let staffGroupId = UUID(uuidString: "A0B99C62-1111-4222-A333-D44444444101")!

    var body: some View {
        let group = EarTrainingChordVoicingStaffLayout.GroupInput(
            id: Self.staffGroupId,
            chordName: chordDisplayName,
            voicing: voicingNames,
            voicingStaves: voicingNames.map { _ in staffClef },
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
            showTargetHints: false,
            singleMeasureLayout: true,
            hideChordLabels: false,
            noteCollisionLayout: noteCollisionLayout,
            unpressedNoteOpacity: unpressedNoteOpacity
        )
    }
}
