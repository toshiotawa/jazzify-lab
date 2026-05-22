import CoreGraphics

/// サバイバル本番セリフ吹き出し。ファイ・ジャ爺でフォントは共通、幅のみジャ爺が 2/3。
enum SurvivalSpeechBubbleLayout {
    /// Web `text-sm` / Onboarding 吹き出しと同等。
    static let bodyFontPoints: CGFloat = 14
    static let faiMaxBubbleWidth: CGFloat = 300
    static let jajiiMaxBubbleWidth: CGFloat = faiMaxBubbleWidth * 2 / 3
}
