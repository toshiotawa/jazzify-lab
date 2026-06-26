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

enum SurvivalStaffSizePreferences {
    private static let iPhoneKey = "survival.staff.spacingScale.iphone"
    private static let iPadKey = "survival.staff.spacingScale.ipad"

    static func defaultScale(isPad: Bool) -> CGFloat {
        isPad ? SurvivalStaffOverlayLayout.iPadBaseScale : SurvivalStaffOverlayLayout.iPhoneBaseScale
    }

    static func minScale(isPad: Bool) -> CGFloat {
        isPad ? SurvivalStaffOverlayLayout.iPadBaseScale : 1.0
    }

    static func maxScale(isPad: Bool) -> CGFloat {
        isPad
            ? (SurvivalStaffOverlayLayout.iPadBaseScale * 1.3).rounded(toPlaces: 2)
            : SurvivalStaffOverlayLayout.iPhoneBaseScale
    }

    static func loadScale(isPad: Bool) -> CGFloat {
        let key = isPad ? iPadKey : iPhoneKey
        guard let stored = UserDefaults.standard.object(forKey: key) as? Double else {
            return defaultScale(isPad: isPad)
        }
        return clampScale(CGFloat(stored), isPad: isPad)
    }

    static func saveScale(_ value: CGFloat, isPad: Bool) {
        let key = isPad ? iPadKey : iPhoneKey
        UserDefaults.standard.set(Double(clampScale(value, isPad: isPad)), forKey: key)
    }

    static func sliderValue(from scale: CGFloat, isPad: Bool) -> Double {
        let lower = minScale(isPad: isPad)
        let upper = maxScale(isPad: isPad)
        guard upper > lower else { return isPad ? 0 : 1 }
        return Double((clampScale(scale, isPad: isPad) - lower) / (upper - lower))
    }

    static func scale(fromSliderValue sliderValue: Double, isPad: Bool) -> CGFloat {
        let lower = minScale(isPad: isPad)
        let upper = maxScale(isPad: isPad)
        let t = Swift.max(0, Swift.min(1, sliderValue))
        return clampScale(lower + CGFloat(t) * (upper - lower), isPad: isPad)
    }

    static func displayPercent(from scale: CGFloat, isPad: Bool) -> Int {
        let baseline = defaultScale(isPad: isPad)
        guard baseline > 0 else { return 100 }
        return Int((clampScale(scale, isPad: isPad) / baseline * 100).rounded())
    }

    static func clampScale(_ value: CGFloat, isPad: Bool) -> CGFloat {
        let lower = minScale(isPad: isPad)
        let upper = maxScale(isPad: isPad)
        return Swift.min(upper, Swift.max(lower, value))
    }
}

enum SurvivalStaffOverlayLayout {
    static let iPadBaseScale: CGFloat = 1.4
    static let iPhoneBaseScale: CGFloat = 1.3

    static var isPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    static func staffSpacingScale(isPad: Bool) -> CGFloat {
        SurvivalStaffSizePreferences.loadScale(isPad: isPad)
    }

    static var staffSpacingScale: CGFloat {
        staffSpacingScale(isPad: isPad)
    }

    private static func iPhoneScaled(_ base: CGFloat) -> CGFloat {
        (base * iPhoneBaseScale).rounded()
    }

    private static func scaledMaxHeight(baseAtDefaultScale: CGFloat, isPad: Bool) -> CGFloat {
        let scale = staffSpacingScale(isPad: isPad)
        let defaultScale = SurvivalStaffSizePreferences.defaultScale(isPad: isPad)
        return (baseAtDefaultScale * scale / defaultScale).rounded()
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
            let base = grandStaff ? CGFloat(300) : CGFloat(224)
            return scaledMaxHeight(baseAtDefaultScale: base, isPad: true)
        }
        let base = grandStaff ? iPhoneScaled(260) : iPhoneScaled(160)
        return scaledMaxHeight(baseAtDefaultScale: base, isPad: false)
    }

    static func scenarioStaffMaxWidth(isPad: Bool) -> CGFloat {
        isPad ? 784 : 560
    }

    static func scenarioStaffMaxHeight(isPad: Bool, grandStaff: Bool) -> CGFloat {
        if isPad {
            let base = grandStaff ? CGFloat(364) : CGFloat(308)
            return scaledMaxHeight(baseAtDefaultScale: base, isPad: true)
        }
        let base = grandStaff ? iPhoneScaled(260) : iPhoneScaled(220)
        return scaledMaxHeight(baseAtDefaultScale: base, isPad: false)
    }

    static func battleStaffOverlayAlignment(grandStaff: Bool) -> Alignment {
        grandStaff ? .top : .center
    }

    static func battleStaffOverlayTopPadding(hudHeight: CGFloat, grandStaff: Bool) -> CGFloat {
        grandStaff ? hudHeight + 4 : hudHeight
    }
}

struct SurvivalBattleStaffOverlayPlacement: ViewModifier {
    let hudHeight: CGFloat
    let grandStaff: Bool

    func body(content: Content) -> some View {
        content
            .frame(
                maxWidth: .infinity,
                maxHeight: .infinity,
                alignment: SurvivalStaffOverlayLayout.battleStaffOverlayAlignment(grandStaff: grandStaff)
            )
            .padding(
                .top,
                SurvivalStaffOverlayLayout.battleStaffOverlayTopPadding(
                    hudHeight: hudHeight,
                    grandStaff: grandStaff
                )
            )
            .padding(.horizontal, 12)
    }
}

private extension CGFloat {
    func rounded(toPlaces places: Int) -> CGFloat {
        let factor = pow(10, CGFloat(places))
        return (self * factor).rounded() / factor
    }
}
