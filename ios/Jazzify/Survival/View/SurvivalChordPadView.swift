import SwiftUI

/// 鍵盤 UI に閉じた入力 (`hintMidis` / `midiHeldKeys` / `isEnabled`)。親が差分のみで構築し `.equatable()` で再評価を抑える。
struct SurvivalChordPadSnapshot: Equatable, Sendable {
    let hintMidis: Set<Int>
    let midiHeldKeys: Set<Int>
    let isEnabled: Bool
}

/// 画面右下のピアノ鍵盤（WEB モバイル版と同様に A0〜C8 の 52 白鍵をスクロール表示、14 鍵程度が見える）。
/// - `@ObservedObject` は使わず `SurvivalChordPadSnapshot` とコールバックのみ受け取る（controller 全体の publish から隔離）。
/// - ヒント MIDI は親が `SurvivalGameController.currentHintHighlightMidis` で組み立てて渡す。
struct SurvivalChordPadView: View, Equatable {
    let snapshot: SurvivalChordPadSnapshot
    let onPress: (Int) -> Void
    let onRelease: (Int) -> Void

    static func == (lhs: SurvivalChordPadView, rhs: SurvivalChordPadView) -> Bool {
        lhs.snapshot == rhs.snapshot
    }

    private let firstMidi: Int = 21
    private let lastMidi: Int = 108
    private let visibleWhiteKeys: CGFloat = 14
    private let keyboardHeight: CGFloat = 120
    private let blackKeyHeightRatio: CGFloat = 0.62
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let whiteKeyWidth = max(24, proxy.size.width / visibleWhiteKeys)
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let whites = Self.whiteMidiNotes(first: firstMidi, last: lastMidi)
            let totalWidth = CGFloat(whites.count) * whiteKeyWidth

            ScrollViewReader { scrollProxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    ZStack(alignment: .topLeading) {
                        HStack(spacing: 0) {
                            ForEach(Array(whites.enumerated()), id: \.offset) { _, midi in
                                PianoKeyButton(
                                    midi: midi,
                                    label: Self.shouldLabelC(midi: midi) ? Self.midiLabel(midi) : "",
                                    isBlack: false,
                                    isHinted: snapshot.hintMidis.contains(midi),
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

                        ForEach(Self.blackMidiNotes(first: firstMidi, last: lastMidi), id: \.self) { midi in
                            let x = Self.blackKeyCenterX(midi: midi, whiteKeyWidth: whiteKeyWidth, firstMidi: firstMidi, lastMidi: lastMidi)
                            PianoKeyButton(
                                midi: midi,
                                label: "",
                                isBlack: true,
                                isHinted: snapshot.hintMidis.contains(midi),
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
                    scrollProxy.scrollTo(60, anchor: .center)
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

    private static func blackKeyCenterX(midi: Int, whiteKeyWidth: CGFloat, firstMidi: Int, lastMidi: Int) -> CGFloat {
        let leftWhite = midi - 1
        let whites = whiteMidiNotes(first: firstMidi, last: lastMidi)
        guard let idx = whites.firstIndex(of: leftWhite) else { return 0 }
        return (CGFloat(idx) + 1) * whiteKeyWidth
    }

    private static let labels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    private static func isBlackKey(_ midi: Int) -> Bool {
        let pc = ((midi % 12) + 12) % 12
        return [1, 3, 6, 8, 10].contains(pc)
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
    let midi: Int
    let label: String
    let isBlack: Bool
    let isHinted: Bool
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
                        .stroke(Color.green, lineWidth: isHinted ? 3 : 0)
                        .shadow(color: isHinted ? Color.green.opacity(0.85) : .clear, radius: isHinted ? 4 : 0)
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

    private var fillColor: Color {
        let held = isPressing || isMidiHeld
        if isBlack {
            if isHinted {
                return held
                    ? Color(red: 0.15, green: 0.55, blue: 0.25)
                    : Color(red: 0.10, green: 0.40, blue: 0.18)
            }
            return held ? Color(white: 0.35) : Color.black
        } else {
            if isHinted {
                return held
                    ? Color(red: 0.55, green: 0.90, blue: 0.55)
                    : Color(red: 0.75, green: 1.0, blue: 0.75)
            }
            return held ? Color(white: 0.78) : Color.white
        }
    }
}
