import SwiftUI

/// 全モード共通の象牙鍵盤パレット。Web `pianoKeyboardTheme.ts` と hex を揃える。
enum PianoKeyboardTheme {
    /// Web `whiteKeyGradientMid` / `whiteKeyBase`
    static let whiteKey = Color(hex: "D9CEB0")
    /// Web `whiteKeyPressed`
    static let whiteKeyPressed = Color(hex: "C9BC98")
    /// Web `blackKeyGradientMid` / `blackKeyBase`
    static let blackKey = Color(hex: "121010")
    /// Web `blackKeyPressed` — 押下時の黒鍵
    static let blackKeyPressed = Color(white: 0.35)
    /// Web `noteNameLabel` 相当
    static let noteNameLabel = Color(hex: "6B5F4A")
}
