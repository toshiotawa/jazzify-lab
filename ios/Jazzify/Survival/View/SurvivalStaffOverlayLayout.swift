import SwiftUI

struct SurvivalTutorialStaffBackdropModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1),
            )
    }
}

enum SurvivalStaffOverlayLayout {
    static let iPadScale: CGFloat = 1.4

    static var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    static var staffSpacingScale: CGFloat {
        isPad ? iPadScale : 1
    }

    static func usesGrandStaff(voicingStavesPerNote: [Int]?) -> Bool {
        guard let staves = voicingStavesPerNote else { return false }
        return staves.contains(1) && staves.contains(2)
    }

    static func usesGrandStaff(notes: [SurvivalPhraseChordNote]?) -> Bool {
        guard let notes else { return false }
        return notes.contains { $0.staff == 1 } && notes.contains { $0.staff == 2 }
    }

    static func usesGrandStaff(voicingStaves: [Int]) -> Bool {
        voicingStaves.contains(1) && voicingStaves.contains(2)
    }

    static func centerStaffMaxWidth(isPad: Bool) -> CGFloat {
        isPad ? 784 : 560
    }

    static func centerStaffMaxHeight(isPad: Bool, grandStaff: Bool) -> CGFloat {
        if isPad {
            return grandStaff ? 300 : 224
        }
        return 160
    }

    static func scenarioStaffMaxWidth(isPad: Bool) -> CGFloat {
        isPad ? 784 : 560
    }

    static func scenarioStaffMaxHeight(isPad: Bool, grandStaff: Bool) -> CGFloat {
        if isPad {
            return grandStaff ? 364 : 308
        }
        return grandStaff ? 260 : 220
    }
}
