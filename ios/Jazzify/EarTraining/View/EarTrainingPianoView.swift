import SwiftUI

/// 耳コピバトル ゲーム画面の鍵盤。`SurvivalChordPadView` のレイアウト/インタラクションを踏襲しつつ、
/// ヒント (緑グロー) は無効化し、押下時に `EarTrainingBattleController.handleNoteOn/Off` を呼ぶ。
/// iOS 版は 36 鍵 (連続 36 音 = C2〜B4 / MIDI 36〜71) に固定し、従来の C4 付近中心より低音域をカバーする。
struct EarTrainingPianoView: View {
    @ObservedObject var controller: EarTrainingBattleController

    /// C2 (36) 〜 B4 (71) の 36 鍵。Salamander サンプラーの下限付近からメロディ域まで。
    private let firstMidi: Int = 36
    private let lastMidi: Int = 71
    private let keyboardHeight: CGFloat = 100
    private let blackKeyHeightRatio: CGFloat = 0.6
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let whites = whiteMidiNotes
            let whiteKeyWidth = proxy.size.width / CGFloat(max(whites.count, 1))
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let totalWidth = proxy.size.width

            ZStack(alignment: .topLeading) {
                HStack(spacing: 0) {
                    ForEach(Array(whites.enumerated()), id: \.offset) { _, midi in
                        EarTrainingPianoKeyButton(
                            midi: midi,
                            label: Self.shouldLabelC(midi: midi) ? Self.midiLabel(midi) : "",
                            isBlack: false,
                            isMidiHeld: controller.midiHeldKeys.contains(midi),
                            width: whiteKeyWidth,
                            height: keyboardHeight,
                            onPress: { controller.handleNoteOn(midi: $0) },
                            onRelease: { controller.handleNoteOff(midi: $0) }
                        )
                    }
                }
                .frame(width: totalWidth, height: keyboardHeight)

                ForEach(blackKeyMidiNotes, id: \.self) { midi in
                    let x = blackKeyCenterX(midi: midi, whiteKeyWidth: whiteKeyWidth)
                    EarTrainingPianoKeyButton(
                        midi: midi,
                        label: "",
                        isBlack: true,
                        isMidiHeld: controller.midiHeldKeys.contains(midi),
                        width: blackKeyWidth,
                        height: blackKeyHeight,
                        onPress: { controller.handleNoteOn(midi: $0) },
                        onRelease: { controller.handleNoteOff(midi: $0) }
                    )
                    .offset(x: x - blackKeyWidth / 2, y: 0)
                }
            }
            .frame(width: totalWidth, height: keyboardHeight)
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
    let isMidiHeld: Bool
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
        let held = isPressing || isMidiHeld
        if isBlack {
            return held ? Color(white: 0.35) : Color.black
        }
        return held ? Color(white: 0.78) : Color.white
    }
}
