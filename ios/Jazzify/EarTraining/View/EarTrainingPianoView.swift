import SwiftUI
import UIKit

private let earTrainingPianoNoteNameLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

private func earTrainingPianoIsBlackKey(_ midi: Int) -> Bool {
    switch ((midi % 12) + 12) % 12 {
    case 1, 3, 6, 8, 10:
        return true
    default:
        return false
    }
}

private struct EarTrainingPianoKeyboardLayout {
    let whiteMidiNotes: [Int]
    let blackMidiNotes: [Int]
    let whiteMidiIndexByMidi: [Int: Int]

    static let phone = EarTrainingPianoKeyboardLayout(firstMidi: 48, lastMidi: 83)
    static let tablet = EarTrainingPianoKeyboardLayout(firstMidi: 21, lastMidi: 108)

    static var current: EarTrainingPianoKeyboardLayout {
        UIDevice.current.userInterfaceIdiom == .pad ? tablet : phone
    }

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

/// 耳コピバトル ゲーム画面の鍵盤。`SurvivalChordPadView` のレイアウト/インタラクションを踏襲しつつ、
/// ヒント (緑グロー) は無効化し、押下時に `handleNoteOn/Off` を呼ぶ。
/// iPhone は 36 鍵 (C3〜B5 / MIDI 48〜83)、iPad は 88 鍵 (A0〜C8 / MIDI 21〜108)。
struct EarTrainingPianoView<Player: EarTrainingPianoPlayable>: View {
    @ObservedObject var player: Player

    private let keyboardHeight: CGFloat = 76
    private let blackKeyHeightRatio: CGFloat = 0.6
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let keyboardLayout = EarTrainingPianoKeyboardLayout.current
            let whites = keyboardLayout.whiteMidiNotes
            let whiteKeyWidth = proxy.size.width / CGFloat(max(whites.count, 1))
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let totalWidth = proxy.size.width

            ZStack(alignment: .topLeading) {
                HStack(spacing: 0) {
                    ForEach(whites, id: \.self) { midi in
                        EarTrainingPianoKeyButton(
                            midi: midi,
                            label: Self.shouldLabelC(midi: midi) ? Self.midiLabel(midi) : "",
                            isBlack: false,
                            isMidiHeld: player.midiHeldKeys.contains(midi),
                            voicingHint: player.voicingHintsByMidi[midi],
                            width: whiteKeyWidth,
                            height: keyboardHeight,
                            onPress: { player.handleNoteOn(midi: $0, velocity: 100, playAudio: true) },
                            onRelease: { player.handleNoteOff(midi: $0, playAudio: true) }
                        )
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
            .background(Color.black.opacity(0.55))
        }
        .frame(height: keyboardHeight)
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
