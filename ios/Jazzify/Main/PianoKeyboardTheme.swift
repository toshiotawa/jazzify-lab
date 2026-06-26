import SwiftUI

/// 全モード共通の象牙鍵盤パレット。Web `pianoKeyboardTheme.ts` / `PIXINotesRenderer` と hex を揃える。
enum PianoKeyboardTheme {
    /// Web `whiteKeyGradientMid` / `whiteKeyBase`
    static let whiteKey = Color(hex: "D9CEB0")
    /// Web `blackKeyGradientMid` / `blackKeyBase`
    static let blackKey = Color(hex: "121010")
    /// Web `noteNameLabel` 相当
    static let noteNameLabel = Color(hex: "6B5F4A")

    /// Web `PIXINotesRenderer.colors.activeKey` — 演奏中ハイライト（Dark Orange）
    static let activeKey = Color(hex: "FF8C00")
    /// Web `PIXINotesRenderer.colors.voicingHintPending` — 未押下構成音ヒント
    static let voicingHintPending = Color(hex: "F39800")
    /// Web `PIXINotesRenderer.colors.voicingHintCompleted` — 押下済み構成音ヒント
    static let voicingHintCompleted = Color(hex: "22C55E")

    /// Web `drawHighlight` デフォルト: 白鍵 activeKey オーバーレイ不透明度
    static let activeKeyOverlayOpacityWhite: CGFloat = 0.35
    /// Web `drawHighlight` デフォルト: 黒鍵 activeKey オーバーレイ不透明度
    static let activeKeyOverlayOpacityBlack: CGFloat = 0.55
    /// Web `setVoicingHints` 標準 pending/completed オーバーレイ不透明度
    static let voicingHintOverlayOpacity: CGFloat = 0.7
}
