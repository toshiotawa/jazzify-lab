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
    /// サバイバル中央楽譜: コード名を譜面近傍へ寄せる（垂直中央寄せを無効化）。
    let compactVerticalLayout: Bool
    /// 並びが `voicingNames` と一致するときのみ多段譜へ。無ければ `staffClef` を全構成音へ。
    let voicingStavesPerNote: [Int]?
    /// サバイバル iPad 用: 五線間隔スケール。既定 1。
    let staffSpacingScale: CGFloat

    init(
        chordDisplayName: String,
        voicingNames: [String],
        keyFifths: Int,
        correctPitchClasses: [Int],
        staffClef: Int = 2,
        noteCollisionLayout: ChordVoicingStaffNoteCollisionLayout = .anchorLow,
        unpressedNoteOpacity: CGFloat = 1,
        compactVerticalLayout: Bool = false,
        voicingStavesPerNote: [Int]? = nil,
        staffSpacingScale: CGFloat = 1
    ) {
        self.chordDisplayName = chordDisplayName
        self.voicingNames = voicingNames
        self.keyFifths = keyFifths
        self.correctPitchClasses = correctPitchClasses
        self.staffClef = staffClef
        self.noteCollisionLayout = noteCollisionLayout
        self.unpressedNoteOpacity = unpressedNoteOpacity
        self.compactVerticalLayout = compactVerticalLayout
        self.voicingStavesPerNote = voicingStavesPerNote
        self.staffSpacingScale = staffSpacingScale
    }

    private static let staffGroupId = UUID(uuidString: "A0B99C62-1111-4222-A333-D44444444101")!

    private var resolvedStaffRows: [Int] {
        if let rows = voicingStavesPerNote, rows.count == voicingNames.count {
            return rows
        }
        return voicingNames.map { _ in staffClef }
    }

    var body: some View {
        let group = EarTrainingChordVoicingStaffLayout.GroupInput(
            id: Self.staffGroupId,
            chordName: chordDisplayName,
            voicing: voicingNames,
            voicingStaves: resolvedStaffRows,
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
            unpressedNoteOpacity: unpressedNoteOpacity,
            compactChordLabelGap: true,
            compactVerticalLayout: compactVerticalLayout,
            staffSpacingScale: staffSpacingScale
        )
    }
}
