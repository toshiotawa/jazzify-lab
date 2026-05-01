import SwiftUI

/// 耳コピバトル ゲーム画面の鍵盤。`SurvivalChordPadView` のレイアウト/インタラクションを踏襲しつつ、
/// ヒント (緑グロー) は無効化し、押下時に `EarTrainingBattleController.handleNoteOn/Off` を呼ぶ。
struct EarTrainingPianoView: View {
    @ObservedObject var controller: EarTrainingBattleController

    private let firstMidi: Int = 21
    private let lastMidi: Int = 108
    private let visibleWhiteKeys: CGFloat = 14
    private let keyboardHeight: CGFloat = 100
    private let blackKeyHeightRatio: CGFloat = 0.6
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let whiteKeyWidth = max(24, proxy.size.width / visibleWhiteKeys)
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let whites = whiteMidiNotes
            let totalWidth = CGFloat(whites.count) * whiteKeyWidth

            ScrollViewReader { scrollProxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    ZStack(alignment: .topLeading) {
                        HStack(spacing: 0) {
                            ForEach(Array(whites.enumerated()), id: \.offset) { _, midi in
                                EarTrainingPianoKeyButton(
                                    midi: midi,
                                    label: Self.shouldLabelC(midi: midi) ? Self.midiLabel(midi) : "",
                                    isBlack: false,
                                    width: whiteKeyWidth,
                                    height: keyboardHeight,
                                    onPress: { controller.handleNoteOn(midi: $0) },
                                    onRelease: { controller.handleNoteOff(midi: $0) }
                                )
                                .id(midi)
                            }
                        }
                        .frame(width: totalWidth, height: keyboardHeight)

                        ForEach(blackKeyMidiNotes, id: \.self) { midi in
                            let x = blackKeyCenterX(midi: midi, whiteKeyWidth: whiteKeyWidth)
                            EarTrainingPianoKeyButton(
                                midi: midi,
                                label: "",
                                isBlack: true,
                                width: blackKeyWidth,
                                height: blackKeyHeight,
                                onPress: { controller.handleNoteOn(midi: $0) },
                                onRelease: { controller.handleNoteOff(midi: $0) }
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

    private var whiteMidiNotes: [Int] {
        (firstMidi...lastMidi).filter { !Self.isBlackKey($0) }
    }

    private var blackKeyMidiNotes: [Int] {
        (firstMidi...lastMidi).filter { Self.isBlackKey($0) }
    }

    private func blackKeyCenterX(midi: Int, whiteKeyWidth: CGFloat) -> CGFloat {
        let leftWhite = midi - 1
        let whites = whiteMidiNotes
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

private struct EarTrainingPianoKeyButton: View {
    let midi: Int
    let label: String
    let isBlack: Bool
    let width: CGFloat
    let height: CGFloat
    let onPress: (Int) -> Void
    let onRelease: (Int) -> Void

    @State private var isPressing: Bool = false

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
        if isBlack {
            return isPressing ? Color(white: 0.35) : Color.black
        }
        return isPressing ? Color(white: 0.78) : Color.white
    }
}
