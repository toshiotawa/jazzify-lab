import SwiftUI
import UIKit

private extension Color {
    /// `base` から `toward` へ線形補間（`t=1` で toward）。Web の globalAlpha オーバーレイに近い見え方。
    static func earTrainingLerp(from base: Color, toward: Color, t: CGFloat) -> Color {
        let u1 = UIColor(base)
        let u2 = UIColor(toward)
        var r1: CGFloat = 0
        var g1: CGFloat = 0
        var b1: CGFloat = 0
        var a1: CGFloat = 0
        var r2: CGFloat = 0
        var g2: CGFloat = 0
        var b2: CGFloat = 0
        var a2: CGFloat = 0
        u1.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        u2.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        let r = r1 + (r2 - r1) * t
        let g = g1 + (g2 - g1) * t
        let b = b1 + (b2 - b1) * t
        return Color(red: Double(r), green: Double(g), blue: Double(b))
    }
}

private let earTrainingPianoNoteNameLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

private func earTrainingPianoIsBlackKey(_ midi: Int) -> Bool {
    PianoKeyboardScrollGeometry.isBlackKey(midi)
}

/// iPhone 横スクロール時の白鍵ズーム段階（大＝21 ≈3オクターブ表示、小＝35 ≈5オクターブ表示）。
enum EarTrainingPianoLayout {
    static let fullWhiteKeyCount = 52
    static let visibleWhiteKeySteps = [21, 25, 29, 35]
    static let defaultVisibleWhiteKeys = 21

    static func clampedVisibleWhiteKeys(_ value: Int) -> Int {
        guard let first = visibleWhiteKeySteps.first else { return defaultVisibleWhiteKeys }
        if visibleWhiteKeySteps.contains(value) { return value }
        return first
    }

    static func shrunkVisibleWhiteKeys(after current: Int) -> Int {
        steppedVisibleWhiteKeys(after: current, direction: 1)
    }

    static func enlargedVisibleWhiteKeys(after current: Int) -> Int {
        steppedVisibleWhiteKeys(after: current, direction: -1)
    }

    static func canShrinkKeys(after current: Int) -> Bool {
        guard let index = visibleWhiteKeySteps.firstIndex(of: clampedVisibleWhiteKeys(current)) else {
            return false
        }
        return index < visibleWhiteKeySteps.count - 1
    }

    static func canEnlargeKeys(after current: Int) -> Bool {
        guard let index = visibleWhiteKeySteps.firstIndex(of: clampedVisibleWhiteKeys(current)) else {
            return false
        }
        return index > 0
    }

    private static func steppedVisibleWhiteKeys(after current: Int, direction: Int) -> Int {
        let clamped = clampedVisibleWhiteKeys(current)
        guard let index = visibleWhiteKeySteps.firstIndex(of: clamped) else {
            return defaultVisibleWhiteKeys
        }
        let nextIndex = index + direction
        guard visibleWhiteKeySteps.indices.contains(nextIndex) else {
            return clamped
        }
        return visibleWhiteKeySteps[nextIndex]
    }

    static func whiteKeyWidth(
        viewportWidth: CGFloat,
        visibleWhiteKeys: Int,
        fitsFullKeyboard: Bool,
        whiteKeyCount: Int
    ) -> CGFloat {
        let width = max(1, viewportWidth)
        if fitsFullKeyboard {
            return max(1, width / CGFloat(max(whiteKeyCount, 1)))
        }
        let keys = CGFloat(max(clampedVisibleWhiteKeys(visibleWhiteKeys), 1))
        return width / keys
    }

    static func totalKeyboardWidth(
        viewportWidth: CGFloat,
        visibleWhiteKeys: Int,
        fitsFullKeyboard: Bool,
        whiteKeyCount: Int
    ) -> CGFloat {
        if fitsFullKeyboard {
            return max(1, viewportWidth)
        }
        let keyWidth = whiteKeyWidth(
            viewportWidth: viewportWidth,
            visibleWhiteKeys: visibleWhiteKeys,
            fitsFullKeyboard: false,
            whiteKeyCount: whiteKeyCount
        )
        return CGFloat(whiteKeyCount) * keyWidth
    }
}

enum EarTrainingPianoPreferences {
    private static let visibleWhiteKeysKey = "earTraining.piano.visibleWhiteKeys"

    static func loadVisibleWhiteKeys() -> Int {
        let stored = UserDefaults.standard.integer(forKey: visibleWhiteKeysKey)
        if stored == 0 {
            return EarTrainingPianoLayout.defaultVisibleWhiteKeys
        }
        return EarTrainingPianoLayout.clampedVisibleWhiteKeys(stored)
    }

    static func saveVisibleWhiteKeys(_ value: Int) {
        UserDefaults.standard.set(
            EarTrainingPianoLayout.clampedVisibleWhiteKeys(value),
            forKey: visibleWhiteKeysKey
        )
    }
}

private struct EarTrainingPianoKeyboardLayout {
    let whiteMidiNotes: [Int]
    let blackMidiNotes: [Int]
    let whiteMidiIndexByMidi: [Int: Int]

    static let fullRange = EarTrainingPianoKeyboardLayout(
        firstMidi: PianoKeyboardScrollGeometry.firstMidi,
        lastMidi: PianoKeyboardScrollGeometry.lastMidi
    )

    private init(firstMidi: Int, lastMidi: Int) {
        let midiRange = firstMidi...lastMidi
        let whites = midiRange.filter { !earTrainingPianoIsBlackKey($0) }
        var indexByMidi: [Int: Int] = [:]
        indexByMidi.reserveCapacity(whites.count)
        for (index, midi) in whites.enumerated() {
            indexByMidi[midi] = index
        }

        self.whiteMidiNotes = whites
        self.blackMidiNotes = midiRange.filter { earTrainingPianoIsBlackKey($0) }
        self.whiteMidiIndexByMidi = indexByMidi
    }
}

/// 耳コピバトル ゲーム画面の鍵盤。A0〜C8（88鍵）。iPhone は横スクロール＋上部音域スクロールバー（5鍵刻みボタン）。
struct EarTrainingPianoView<Player: EarTrainingPianoPlayable>: View {
    @ObservedObject var player: Player
    let scrollAnchorMidi: Int?
    @State private var visibleWhiteKeys = EarTrainingPianoPreferences.loadVisibleWhiteKeys()
    @State private var scrollOffsetX: CGFloat = 0
    @State private var scrollTargetX: CGFloat?

    private let keyboardHeight: CGFloat = 76
    private let blackKeyHeightRatio: CGFloat = 0.6
    private let blackKeyWidthRatio: CGFloat = 0.6
    private let zoomControlHitSize: CGFloat = 44
    private let zoomControlIconWidth: CGFloat = 28
    private let zoomControlIconHeight: CGFloat = 26

    private var chromeHeight: CGFloat {
        keyboardHeight + (Self.fitsFullKeyboard ? 0 : PianoKeyboardScrollGeometry.earTrainingScrollBarHeight)
    }

    var body: some View {
        GeometryReader { proxy in
            let fitsFullKeyboard = Self.fitsFullKeyboard
            let needsScroll = !fitsFullKeyboard
            let keyboardLayout = EarTrainingPianoKeyboardLayout.fullRange
            let whites = keyboardLayout.whiteMidiNotes
            let viewportWidth = proxy.size.width
            let whiteKeyWidth = EarTrainingPianoLayout.whiteKeyWidth(
                viewportWidth: viewportWidth,
                visibleWhiteKeys: visibleWhiteKeys,
                fitsFullKeyboard: fitsFullKeyboard,
                whiteKeyCount: whites.count
            )
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let totalWidth = EarTrainingPianoLayout.totalKeyboardWidth(
                viewportWidth: viewportWidth,
                visibleWhiteKeys: visibleWhiteKeys,
                fitsFullKeyboard: fitsFullKeyboard,
                whiteKeyCount: whites.count
            )
            let maxScrollOffsetX = PianoKeyboardScrollGeometry.maxScrollOffset(
                contentWidth: totalWidth,
                viewportWidth: viewportWidth
            )

            VStack(spacing: 0) {
                if needsScroll {
                    PianoRangeScrollBar(
                        barHeight: PianoKeyboardScrollGeometry.earTrainingScrollBarHeight,
                        scrollOffsetX: scrollOffsetX,
                        maxScrollOffsetX: maxScrollOffsetX,
                        whiteKeyWidth: whiteKeyWidth,
                        onScrollOffsetXChange: { scrollOffsetX = $0 }
                    )
                }

                ZStack(alignment: .topLeading) {
                    Group {
                        if fitsFullKeyboard {
                            keyboardStack(
                                keyboardLayout: keyboardLayout,
                                whites: whites,
                                whiteKeyWidth: whiteKeyWidth,
                                blackKeyWidth: blackKeyWidth,
                                blackKeyHeight: blackKeyHeight,
                                totalWidth: totalWidth
                            )
                            .frame(height: keyboardHeight)
                        } else {
                            UIKitHorizontalScrollView(
                                contentSize: CGSize(width: totalWidth, height: keyboardHeight),
                                scrollOffsetX: $scrollOffsetX,
                                scrollTargetX: $scrollTargetX,
                                isUserScrollingEnabled: false,
                                delaysContentTouches: true,
                                contentToken: scrollContentToken(
                                    viewportWidth: viewportWidth,
                                    totalWidth: totalWidth
                                )
                            ) {
                                keyboardStack(
                                    keyboardLayout: keyboardLayout,
                                    whites: whites,
                                    whiteKeyWidth: whiteKeyWidth,
                                    blackKeyWidth: blackKeyWidth,
                                    blackKeyHeight: blackKeyHeight,
                                    totalWidth: totalWidth
                                )
                            }
                            .frame(height: keyboardHeight)
                        }
                    }

                    if needsScroll {
                        zoomControls
                            .padding(.leading, 6)
                            .padding(.top, 4)
                    }
                }
                .frame(height: keyboardHeight)
                .background(Color.black.opacity(0.55))
            }
            .onAppear {
                queueScrollAnchor(
                    viewportWidth: viewportWidth,
                    totalWidth: totalWidth,
                    whiteKeyWidth: whiteKeyWidth,
                    keyboardLayout: keyboardLayout
                )
            }
            .onChange(of: scrollAnchorMidi) { _ in
                queueScrollAnchor(
                    viewportWidth: viewportWidth,
                    totalWidth: totalWidth,
                    whiteKeyWidth: whiteKeyWidth,
                    keyboardLayout: keyboardLayout
                )
            }
            .onChange(of: visibleWhiteKeys) { _ in
                queueScrollAnchor(
                    viewportWidth: viewportWidth,
                    totalWidth: totalWidth,
                    whiteKeyWidth: whiteKeyWidth,
                    keyboardLayout: keyboardLayout
                )
            }
        }
        .frame(height: chromeHeight)
    }

    private var zoomControls: some View {
        VStack(spacing: 8) {
            zoomControlButton(
                symbol: "plus",
                isEnabled: EarTrainingPianoLayout.canEnlargeKeys(after: visibleWhiteKeys),
                accessibilityLabel: "鍵盤を拡大 / Enlarge keyboard"
            ) {
                let next = EarTrainingPianoLayout.enlargedVisibleWhiteKeys(after: visibleWhiteKeys)
                visibleWhiteKeys = next
                EarTrainingPianoPreferences.saveVisibleWhiteKeys(next)
            }
            zoomControlButton(
                symbol: "minus",
                isEnabled: EarTrainingPianoLayout.canShrinkKeys(after: visibleWhiteKeys),
                accessibilityLabel: "鍵盤を縮小 / Shrink keyboard"
            ) {
                let next = EarTrainingPianoLayout.shrunkVisibleWhiteKeys(after: visibleWhiteKeys)
                visibleWhiteKeys = next
                EarTrainingPianoPreferences.saveVisibleWhiteKeys(next)
            }
        }
        .padding(4)
        .background(Color.black.opacity(0.55))
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private func zoomControlButton(
        symbol: String,
        isEnabled: Bool,
        accessibilityLabel: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(isEnabled ? 1 : 0.35))
                .frame(width: zoomControlIconWidth, height: zoomControlIconHeight)
                .frame(minWidth: zoomControlHitSize, minHeight: zoomControlHitSize)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityLabel(accessibilityLabel)
    }

    private func scrollContentToken(viewportWidth: CGFloat, totalWidth: CGFloat) -> AnyHashable {
        var hasher = Hasher()
        hasher.combine(player.midiHeldKeys)
        hasher.combine(player.voicingHintsByMidi.count)
        hasher.combine(visibleWhiteKeys)
        hasher.combine(viewportWidth)
        hasher.combine(totalWidth)
        return hasher.finalize()
    }

    private func queueScrollAnchor(
        viewportWidth: CGFloat,
        totalWidth: CGFloat,
        whiteKeyWidth: CGFloat,
        keyboardLayout: EarTrainingPianoKeyboardLayout
    ) {
        guard !Self.fitsFullKeyboard else { return }
        let targetX: CGFloat
        if let anchorMidi = scrollAnchorMidi {
            targetX = PianoKeyboardScrollGeometry.trailingScrollOffsetX(
                anchorWhiteMidi: anchorMidi,
                whiteKeyWidth: whiteKeyWidth,
                viewportWidth: viewportWidth,
                contentWidth: totalWidth,
                whiteMidiIndexByMidi: keyboardLayout.whiteMidiIndexByMidi
            )
        } else {
            targetX = PianoKeyboardScrollGeometry.centerScrollOffsetX(
                anchorMidi: PianoKeyboardScrollGeometry.fallbackCenterMidi,
                whiteKeyWidth: whiteKeyWidth,
                viewportWidth: viewportWidth,
                contentWidth: totalWidth,
                whiteMidiIndexByMidi: keyboardLayout.whiteMidiIndexByMidi
            )
        }
        scrollTargetX = targetX
    }

    @ViewBuilder
    private func keyboardStack(
        keyboardLayout: EarTrainingPianoKeyboardLayout,
        whites: [Int],
        whiteKeyWidth: CGFloat,
        blackKeyWidth: CGFloat,
        blackKeyHeight: CGFloat,
        totalWidth: CGFloat
    ) -> some View {
        ZStack(alignment: .topLeading) {
            HStack(spacing: 0) {
                ForEach(whites, id: \.self) { midi in
                    EarTrainingPianoKeyButton(
                        midi: midi,
                        label: Self.shouldLabelC(midi: midi) ? Self.midiLabel(midi) : "",
                        isBlack: false,
                        isMidiHeld: player.midiHeldKeys.contains(midi),
                        voicingHintIntensity: player.voicingHintIntensitiesByMidi?[midi],
                        voicingHint: player.voicingHintsByMidi[midi],
                        width: whiteKeyWidth,
                        height: keyboardHeight,
                        onPress: { player.handleNoteOn(midi: $0, velocity: 100, playAudio: true) },
                        onRelease: { player.handleNoteOff(midi: $0, playAudio: true) }
                    )
                    .id(midi)
                }
            }
            .frame(width: totalWidth, height: keyboardHeight)

            ForEach(keyboardLayout.blackMidiNotes, id: \.self) { midi in
                let x = blackKeyCenterX(midi: midi, whiteKeyWidth: whiteKeyWidth, keyboardLayout: keyboardLayout)
                EarTrainingPianoKeyButton(
                    midi: midi,
                    label: "",
                    isBlack: true,
                    isMidiHeld: player.midiHeldKeys.contains(midi),
                    voicingHintIntensity: player.voicingHintIntensitiesByMidi?[midi],
                    voicingHint: player.voicingHintsByMidi[midi],
                    width: blackKeyWidth,
                    height: blackKeyHeight,
                    onPress: { player.handleNoteOn(midi: $0, velocity: 100, playAudio: true) },
                    onRelease: { player.handleNoteOff(midi: $0, playAudio: true) }
                )
                .offset(x: x - blackKeyWidth / 2, y: 0)
            }
        }
        .frame(width: totalWidth, height: keyboardHeight)
    }

    private func blackKeyCenterX(
        midi: Int,
        whiteKeyWidth: CGFloat,
        keyboardLayout: EarTrainingPianoKeyboardLayout
    ) -> CGFloat {
        let leftWhite = midi - 1
        guard let idx = keyboardLayout.whiteMidiIndexByMidi[leftWhite] else { return 0 }
        return (CGFloat(idx) + 1) * whiteKeyWidth
    }

    private static var fitsFullKeyboard: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    private static func shouldLabelC(midi: Int) -> Bool {
        let pc = ((midi % 12) + 12) % 12
        return pc == 0
    }

    private static func midiLabel(_ midi: Int) -> String {
        let pc = ((midi % 12) + 12) % 12
        let octave = midi / 12 - 1
        return "\(earTrainingPianoNoteNameLabels[pc])\(octave)"
    }
}

private struct EarTrainingPianoKeyButton: View {
    let midi: Int
    let label: String
    let isBlack: Bool
    let isMidiHeld: Bool
    /// OSMD バトル: 判定距離別マリーゴールド濃さ。指定時は `voicingHint` より優先。
    let voicingHintIntensity: VoicingHintIntensity?
    /// 練習モード時のヴォイシング構成音ヒント。`nil` ならヒント表示なし。
    let voicingHint: VoicingHintState?
    let width: CGFloat
    let height: CGFloat
    let onPress: (Int) -> Void
    let onRelease: (Int) -> Void

    @State private var isPressing: Bool = false

    /// Web `NEXT_TARGET_COLOR`（#f39800 マリーゴールド）と統一。
    private static let voicingHintPendingColor = Color(red: 243.0 / 255.0, green: 152.0 / 255.0, blue: 0.0)
    /// Web `CORRECT_NOTATION_COLOR`（#22c55e 緑）と統一。
    private static let voicingHintCompletedColor = Color(red: 34.0 / 255.0, green: 197.0 / 255.0, blue: 94.0 / 255.0)

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(fillColor)
                .overlay(
                    RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                        .stroke(Color.black.opacity(0.85), lineWidth: 1)
                )
            if !label.isEmpty {
                Text(label)
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundStyle(.gray)
                    .padding(.bottom, 3)
            }
        }
        .frame(width: width, height: height)
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !isPressing {
                        isPressing = true
                        onPress(midi)
                    }
                }
                .onEnded { _ in
                    if isPressing {
                        isPressing = false
                        onRelease(midi)
                    }
                }
        )
    }

    private var fillColor: Color {
        let held = isPressing || isMidiHeld
        if held {
            return isBlack ? Color(white: 0.35) : Color(white: 0.78)
        }
        if let voicingHintIntensity {
            let alpha: CGFloat
            switch voicingHintIntensity {
            case .strong:
                alpha = 0.85
            case .medium:
                alpha = 0.55
            case .soft:
                alpha = 0.30
            }
            let base = isBlack ? Color.black : Color.white
            return Color.earTrainingLerp(from: base, toward: Self.voicingHintPendingColor, t: alpha)
        }
        switch voicingHint {
        case .completed:
            return Self.voicingHintCompletedColor
        case .pending:
            return Self.voicingHintPendingColor
        case .none:
            return isBlack ? Color.black : Color.white
        }
    }
}
