import SwiftUI

/// 鍵盤 UI に閉じた入力。親が差分のみで構築し `.equatable()` で再評価を抑える。
struct SurvivalChordPadSnapshot: Equatable, Sendable {
    let hintMidis: Set<Int>
    let completedHintMidis: Set<Int>
    let hintPendingOpacity: CGFloat
    let midiHeldKeys: Set<Int>
    let isEnabled: Bool
    /// 互換用（スクロール廃止後もスナップショット形状を維持）。
    let scrollAnchorMidi: Int?
}

/// 画面右下のピアノ鍵盤。表示レンジ全体を画面幅へフィットさせる。
struct SurvivalChordPadView: View, Equatable {
    let snapshot: SurvivalChordPadSnapshot
    let displayRange: PianoStagePitchRange
    let onPress: (Int) -> Void
    let onRelease: (Int) -> Void

    static func == (lhs: SurvivalChordPadView, rhs: SurvivalChordPadView) -> Bool {
        lhs.snapshot == rhs.snapshot && lhs.displayRange == rhs.displayRange
    }

    private let keyboardHeight: CGFloat = 120
    private let blackKeyHeightRatio: CGFloat = 0.62
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let layout = SurvivalChordPadKeyboardLayout(displayRange: displayRange)
            let whites = layout.whiteMidiNotes
            let viewportWidth = max(1, proxy.size.width)
            let whiteKeyCount = max(1, whites.count)
            let whiteKeyWidth = viewportWidth / CGFloat(whiteKeyCount)
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio

            ZStack(alignment: .topLeading) {
                HStack(spacing: 0) {
                    ForEach(whites, id: \.self) { midi in
                        PianoKeyButton(
                            label: Self.shouldLabelC(midi: midi) ? Self.midiLabel(midi) : "",
                            isBlack: false,
                            isHinted: snapshot.hintMidis.contains(midi),
                            isHintCompleted: snapshot.completedHintMidis.contains(midi),
                            hintPendingOpacity: snapshot.hintPendingOpacity,
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
                .frame(width: viewportWidth, height: keyboardHeight)

                ForEach(layout.blackMidiNotes, id: \.self) { midi in
                    let x = Self.blackKeyCenterX(
                        midi: midi,
                        whiteKeyWidth: whiteKeyWidth,
                        layout: layout
                    )
                    PianoKeyButton(
                        label: "",
                        isBlack: true,
                        isHinted: snapshot.hintMidis.contains(midi),
                        isHintCompleted: snapshot.completedHintMidis.contains(midi),
                        hintPendingOpacity: snapshot.hintPendingOpacity,
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
            .frame(width: viewportWidth, height: keyboardHeight)
            .background(Color.black.opacity(0.55))
        }
        .frame(height: keyboardHeight)
    }

    private struct SurvivalChordPadKeyboardLayout {
        let whiteMidiNotes: [Int]
        let blackMidiNotes: [Int]
        let whiteMidiIndexByMidi: [Int: Int]

        init(displayRange: PianoStagePitchRange) {
            let firstMidi = displayRange.minMidi
            let lastMidi = displayRange.maxMidi
            let midiRange = firstMidi...lastMidi
            let whites = midiRange.filter { !PianoKeyboardScrollGeometry.isBlackKey($0) }
            var indexByMidi: [Int: Int] = [:]
            indexByMidi.reserveCapacity(whites.count)
            for (index, midi) in whites.enumerated() {
                indexByMidi[midi] = index
            }
            self.whiteMidiNotes = whites
            self.blackMidiNotes = midiRange.filter { PianoKeyboardScrollGeometry.isBlackKey($0) }
            self.whiteMidiIndexByMidi = indexByMidi
        }
    }

    private static func blackKeyCenterX(
        midi: Int,
        whiteKeyWidth: CGFloat,
        layout: SurvivalChordPadKeyboardLayout
    ) -> CGFloat {
        let leftWhite = midi - 1
        guard let idx = layout.whiteMidiIndexByMidi[leftWhite] else { return 0 }
        return (CGFloat(idx) + 1) * whiteKeyWidth
    }

    private static let labels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

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
    let label: String
    let isBlack: Bool
    let isHinted: Bool
    let isHintCompleted: Bool
    let hintPendingOpacity: CGFloat
    let isMidiHeld: Bool
    let width: CGFloat
    let height: CGFloat
    let onPress: () -> Void
    let onRelease: () -> Void

    @State private var isPressing: Bool = false

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(isBlack ? PianoKeyboardTheme.blackKey : PianoKeyboardTheme.whiteKey)
                .overlay(hintOverlay)
                .overlay(activeKeyOverlay)
                .overlay(
                    RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                        .stroke(Color.black.opacity(0.85), lineWidth: 1)
                )
            if !label.isEmpty {
                Text(label)
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(PianoKeyboardTheme.noteNameLabel)
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

    @ViewBuilder
    private var hintOverlay: some View {
        if isHintCompleted {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(
                    PianoKeyboardTheme.voicingHintCompleted.opacity(
                        Double(PianoKeyboardTheme.voicingHintOverlayOpacity)
                    )
                )
        } else if isHinted {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(
                    PianoKeyboardTheme.voicingHintPending.opacity(
                        Double(PianoKeyboardTheme.voicingHintOverlayOpacity * hintPendingOpacity)
                    )
                )
        }
    }

    @ViewBuilder
    private var activeKeyOverlay: some View {
        if isPressing || isMidiHeld {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(
                    PianoKeyboardTheme.activeKey.opacity(
                        Double(isBlack
                            ? PianoKeyboardTheme.activeKeyOverlayOpacityBlack
                            : PianoKeyboardTheme.activeKeyOverlayOpacityWhite)
                    )
                )
        }
    }
}
