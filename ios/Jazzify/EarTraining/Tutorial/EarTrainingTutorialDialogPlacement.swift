import SwiftUI

/// 耳コピチュートリアルセリフの landscape 配置。
enum EarTrainingTutorialDialogPlacement: Equatable {
    /// chord HUD の下（コード名チップ行の直下）。
    case belowChordHud
    /// voicing の下部フレーズスロット行の直上（ピアノ上）。`slotCount` でスロット帯の高さを近似。
    case belowVoicingPhraseSlots(slotCount: Int)
    /// dialogue_only 用（コード HUD 無し）。
    case dialogueIntroUpperCenter
}

enum EarTrainingTutorialDialogLayoutConstants {
    /// チュートリアル HUD（HP 非表示・コードチップのみ）の上端パディング＋チップ帯。
    static let compactChordHudTopY: CGFloat = 4
    static let compactChordChipBandHeight: CGFloat = 26
    static let pianoOverlayHeight: CGFloat = 80
    /// 吹き出し band（padding・尾含むおよそ）。
    static let bubbleApproxHalfHeight: CGFloat = 54
    static let maxBubbleWidth: CGFloat = 300

    /// `ChordVoicingBottomSlotsView.slotSize` を landscape 近似。
    static func voicingPhraseSlotBandHeight(slotCount: Int, landscapeWidth: CGFloat) -> CGFloat {
        let avail = min(landscapeWidth * 0.52, 260)
        let count = max(1, slotCount)
        let gap: CGFloat = 6
        let gaps = CGFloat(max(0, count - 1)) * gap
        let slotSize = max(34, floor((avail - gaps) / CGFloat(count)))
        return slotSize + 6
    }
}
