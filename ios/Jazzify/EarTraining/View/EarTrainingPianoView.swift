import SwiftUI
import UIKit

private extension Color {
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

private struct EarTrainingPianoKeyboardLayout {
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

/// 耳コピバトル ゲーム画面の鍵盤。表示レンジ全体を画面幅へフィットさせる。
struct EarTrainingPianoView<Player: EarTrainingPianoPlayable>: View {
    @ObservedObject var player: Player
    let displayRange: PianoStagePitchRange

    private let keyboardHeight: CGFloat = 76
    private let blackKeyHeightRatio: CGFloat = 0.6
    private let blackKeyWidthRatio: CGFloat = 0.6

    var body: some View {
        GeometryReader { proxy in
            let keyboardLayout = EarTrainingPianoKeyboardLayout(displayRange: displayRange)
            let whites = keyboardLayout.whiteMidiNotes
            let viewportWidth = max(1, proxy.size.width)
            let whiteKeyCount = max(1, whites.count)
            let whiteKeyWidth = viewportWidth / CGFloat(whiteKeyCount)
            let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
            let blackKeyHeight = keyboardHeight * blackKeyHeightRatio
            let totalWidth = viewportWidth

            keyboardStack(
                keyboardLayout: keyboardLayout,
                whites: whites,
                whiteKeyWidth: whiteKeyWidth,
                blackKeyWidth: blackKeyWidth,
                blackKeyHeight: blackKeyHeight,
                totalWidth: totalWidth
            )
            .frame(width: totalWidth, height: keyboardHeight)
            .background(Color.black.opacity(0.55))
        }
        .frame(height: keyboardHeight)
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
    let voicingHintIntensity: VoicingHintIntensity?
    let voicingHint: VoicingHintState?
    let width: CGFloat
    let height: CGFloat
    let onPress: (Int) -> Void
    let onRelease: (Int) -> Void

    @State private var isPressing: Bool = false

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                .fill(fillColor)
                .overlay(activeKeyOverlay)
                .overlay(
                    RoundedRectangle(cornerRadius: isBlack ? 2 : 4)
                        .stroke(Color.black.opacity(0.85), lineWidth: 1)
                )
            if !label.isEmpty {
                Text(label)
                    .font(.system(size: 8, weight: .semibold))
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
            let base = isBlack ? PianoKeyboardTheme.blackKey : PianoKeyboardTheme.whiteKey
            return Color.earTrainingLerp(from: base, toward: PianoKeyboardTheme.voicingHintPending, t: alpha)
        }
        switch voicingHint {
        case .completed:
            return PianoKeyboardTheme.voicingHintCompleted
        case .pending:
            return PianoKeyboardTheme.voicingHintPending
        case .none:
            return isBlack ? PianoKeyboardTheme.blackKey : PianoKeyboardTheme.whiteKey
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
