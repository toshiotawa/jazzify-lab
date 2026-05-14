import SwiftUI
import UIKit

/// 鍵盤 UI に閉じた入力 (`hintMidis` / `completedHintMidis` / `midiHeldKeys` / `isEnabled`)。親が差分のみで構築し `.equatable()` で再評価を抑える。
struct SurvivalChordPadSnapshot: Equatable, Sendable {
    let hintMidis: Set<Int>
    /// 構成音入力済み（pitch class 一致）に対応するハイライト MIDI。`hintMidis` の部分集合。
    let completedHintMidis: Set<Int>
    let midiHeldKeys: Set<Int>
    let isEnabled: Bool
}

/// 画面右下のピアノ鍵盤。A0〜C8 の 88 鍵を持ち、iPhone は横スクロール、iPad は全体を幅に収めて表示する。
/// - `@ObservedObject` は使わず `SurvivalChordPadSnapshot` とコールバックのみ受け取る（controller 全体の publish から隔離）。
/// - ヒント MIDI / 入力済みハイライトは親が `SurvivalViewModel` で組み立てて渡す。
struct SurvivalChordPadView: View, Equatable {
    let snapshot: SurvivalChordPadSnapshot
    let onPress: (Int) -> Void
    let onRelease: (Int) -> Void

    static func == (lhs: SurvivalChordPadView, rhs: SurvivalChordPadView) -> Bool {
        lhs.snapshot == rhs.snapshot
    }

    private static let firstMidi: Int = 21
    private static let lastMidi: Int = 108
    private static let scrollVisibleWhiteKeys: CGFloat = 14
    private static let scrollMinWhiteKeyWidth: CGFloat = 24
    private static let whiteNotes = whiteMidiNotes(first: firstMidi, last: lastMidi)
    private static let blackNotes = blackMidiNotes(first: firstMidi, last: lastMidi)
    private static let whiteMidiIndexByMidi = buildWhiteMidiIndexByMidi(whiteNotes)

    private let keyboardHeight: CGFloat = 120
    private let blackKeyHeightRatio: CGFloat = 0.62
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let fitsFullKeyboard = Self.fitsFullKeyboard
            let whites = Self.whiteNotes
            let visibleWhiteKeys = fitsFullKeyboard ? CGFloat(whites.count) : Self.scrollVisibleWhiteKeys
            let minWhiteKeyWidth = fitsFullKeyboard ? 1 : Self.scrollMinWhiteKeyWidth
            let whiteKeyWidth = max(minWhiteKeyWidth, proxy.size.width / visibleWhiteKeys)
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let totalWidth = CGFloat(whites.count) * whiteKeyWidth

            ScrollViewReader { scrollProxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    ZStack(alignment: .topLeading) {
                        HStack(spacing: 0) {
                            ForEach(whites, id: \.self) { midi in
                                PianoKeyButton(
                                    label: Self.shouldLabelC(midi: midi) ? Self.midiLabel(midi) : "",
                                    isBlack: false,
                                    isHinted: snapshot.hintMidis.contains(midi),
                                    isHintCompleted: snapshot.completedHintMidis.contains(midi),
                                    isMidiHeld: snapshot.midiHeldKeys.contains(midi),
                                    width: whiteKeyWidth,
                                    height: keyboardHeight,
                                    onPress: {
                                        guard snapshot.isEnabled else { return }
                                        onPress(midi)
                                    },
                                    onRelease: {
                                        guard snapshot.isEnabled else { return }
                                        onRelease(midi)
                                    }
                                )
                                .id(midi)
                            }
                        }
                        .frame(width: totalWidth, height: keyboardHeight)

                        ForEach(Self.blackNotes, id: \.self) { midi in
                            let x = Self.blackKeyCenterX(midi: midi, whiteKeyWidth: whiteKeyWidth)
                            PianoKeyButton(
                                label: "",
                                isBlack: true,
                                isHinted: snapshot.hintMidis.contains(midi),
                                isHintCompleted: snapshot.completedHintMidis.contains(midi),
                                isMidiHeld: snapshot.midiHeldKeys.contains(midi),
                                width: blackKeyWidth,
                                height: blackKeyHeight,
                                onPress: {
                                    guard snapshot.isEnabled else { return }
                                    onPress(midi)
                                },
                                onRelease: {
                                    guard snapshot.isEnabled else { return }
                                    onRelease(midi)
                                }
                            )
                            .offset(x: x - blackKeyWidth / 2, y: 0)
                        }
                    }
                    .frame(width: totalWidth, height: keyboardHeight)
                }
                .frame(height: keyboardHeight)
                .onAppear {
                    if !fitsFullKeyboard {
                        scrollProxy.scrollTo(60, anchor: .center)
                    }
                }
            }
            .background(Color.black.opacity(0.55))
        }
        .frame(height: keyboardHeight)
    }

    private static func whiteMidiNotes(first: Int, last: Int) -> [Int] {
        (first...last).filter { !Self.isBlackKey($0) }
    }

    private static func blackMidiNotes(first: Int, last: Int) -> [Int] {
        (first...last).filter { Self.isBlackKey($0) }
    }

    private static func buildWhiteMidiIndexByMidi(_ notes: [Int]) -> [Int: Int] {
        var indexByMidi: [Int: Int] = [:]
        indexByMidi.reserveCapacity(notes.count)
        for (index, midi) in notes.enumerated() {
            indexByMidi[midi] = index
        }
        return indexByMidi
    }

    private static func blackKeyCenterX(midi: Int, whiteKeyWidth: CGFloat) -> CGFloat {
        let leftWhite = midi - 1
        guard let idx = whiteMidiIndexByMidi[leftWhite] else { return 0 }
        return (CGFloat(idx) + 1) * whiteKeyWidth
    }

    private static var fitsFullKeyboard: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    private static let labels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    private static func isBlackKey(_ midi: Int) -> Bool {
        switch ((midi % 12) + 12) % 12 {
        case 1, 3, 6, 8, 10:
            return true
        default:
            return false
        }
    }

    private static func shouldLabelC(midi: Int) -> Bool {
        let pc = ((midi % 12) + 12) % 12
        return pc == 0
    }

    private static func midiLabel(_ midi: Int) -> String {
        let pc = ((midi % 12) + 12) % 12
        let octave = midi / 12 - 1
        return "\(labels[pc])\(octave)"
    }
}

private struct PianoKeyButton: View {
    private static let marigold = Color(red: 0.93, green: 0.62, blue: 0.13)
    private static let marigoldLight = Color(red: 0.98, green: 0.86, blue: 0.45)
    private static let marigoldLightPressed = Color(red: 0.95, green: 0.75, blue: 0.30)
    private static let marigoldDark = Color(red: 0.42, green: 0.26, blue: 0.06)
    private static let marigoldDarkPressed = Color(red: 0.55, green: 0.35, blue: 0.10)

    let label: String
    let isBlack: Bool
    let isHinted: Bool
    let isHintCompleted: Bool
    let isMidiHeld: Bool
    let width: CGFloat
    let height: CGFloat
    let onPress: () -> Void
    let onRelease: () -> Void

    @State private var isPressing: Bool = false

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(fillColor)
                .overlay(
                    RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                        .stroke(Color.black.opacity(0.85), lineWidth: 1)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                        .stroke(hintBorderColor, lineWidth: hintBorderWidth)
                )
            if !label.isEmpty {
                Text(label)
                    .font(.system(size: 9, weight: .semibold))
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
                        onPress()
                    }
                }
                .onEnded { _ in
                    if isPressing {
                        isPressing = false
                        onRelease()
                    }
                }
        )
    }

    private var hintBorderWidth: CGFloat {
        ((isHinted && !isHintCompleted) || isHintCompleted) ? 3 : 0
    }

    private var hintBorderColor: Color {
        if isHintCompleted { return .green }
        if isHinted { return Self.marigold }
        return .clear
    }

    private var fillColor: Color {
        let held = isPressing || isMidiHeld
        if isBlack {
            if isHintCompleted {
                return held
                    ? Color(red: 0.15, green: 0.55, blue: 0.25)
                    : Color(red: 0.10, green: 0.40, blue: 0.18)
            }
            if isHinted {
                return held ? Self.marigoldDarkPressed : Self.marigoldDark
            }
            return held ? Color(white: 0.35) : Color.black
        }
        if isHintCompleted {
            return held
                ? Color(red: 0.55, green: 0.90, blue: 0.55)
                : Color(red: 0.78, green: 1.0, blue: 0.78)
        }
        if isHinted {
            return held ? Self.marigoldLightPressed : Self.marigoldLight
        }
        return held ? Color(white: 0.78) : Color.white
    }
}
