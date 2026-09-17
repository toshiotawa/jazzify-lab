import SwiftUI

struct DefenseTutorialInputChoiceView: View {
    let isEnglishCopy: Bool
    let onSelect: (NoteInputMethod) -> Void

    var body: some View {
        VStack(spacing: 16) {
            choiceButton(
                title: "MIDI",
                subtitle: isEnglishCopy ? "Electronic piano / MIDI keyboard" : "電子ピアノ・MIDIキーボード",
                method: .midi
            )
            choiceButton(
                title: isEnglishCopy ? "Microphone" : "マイク",
                subtitle: isEnglishCopy ? "Play into the mic" : "楽器の音をマイクで読み取る",
                method: .voice
            )
            choiceButton(
                title: isEnglishCopy ? "On-screen keyboard" : "画面鍵盤",
                subtitle: isEnglishCopy ? "Tap keys on screen" : "画面の鍵盤をタップ",
                method: .touch
            )
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 24)
        .frame(maxWidth: 560)
        .frame(maxWidth: .infinity)
    }

    private func choiceButton(title: String, subtitle: String, method: NoteInputMethod) -> some View {
        Button {
            onSelect(method)
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.18), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct DefenseTutorialInputPanelView: View {
    let inputMethod: NoteInputMethod
    let isEnglishCopy: Bool
    let onReady: () -> Void

    @ObservedObject private var midiManager = MIDIManager.shared
    @State private var micSensitivity = Double(NoteInputPreferences.micSensitivity)
    @State private var voiceFastResponse = NoteInputPreferences.voiceFastResponse
    @State private var midiVolume = Double(NoteInputPreferences.midiVolume)

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if inputMethod == .touch {
                Text(isEnglishCopy
                     ? "Tap C, D, and E on the keyboard below while listening to the demo."
                     : "下の鍵盤でド・レ・ミをタップして演奏しましょう。")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                InputMethodSection(isEnglishCopy: isEnglishCopy)
                    .onAppear {
                        NoteInputManager.shared.inputMethod = inputMethod
                    }
            }

            if inputMethod == .voice {
                Toggle(isEnglishCopy ? "Fast response" : "高速反応", isOn: $voiceFastResponse)
                    .onChange(of: voiceFastResponse) { newValue in
                        NoteInputPreferences.voiceFastResponse = newValue
                        PitchInputEngine.shared.setPitchStableFrames(NoteInputPreferences.pitchStableFrames)
                    }
            }

            if inputMethod == .midi {
                VStack(alignment: .leading, spacing: 6) {
                    Text(isEnglishCopy ? "Keyboard volume" : "鍵盤音量")
                        .font(.caption)
                    Slider(value: $midiVolume, in: 0...1)
                        .onChange(of: midiVolume) { newValue in
                            NoteInputPreferences.midiVolume = Float(newValue)
                        }
                }
            }

            Button(isEnglishCopy ? "Start" : "始める", action: onReady)
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 24)
        .frame(maxWidth: 520)
        .frame(maxWidth: .infinity)
        .onAppear {
            NoteInputManager.shared.inputMethod = inputMethod
            micSensitivity = Double(NoteInputPreferences.micSensitivity)
            voiceFastResponse = NoteInputPreferences.voiceFastResponse
            midiVolume = Double(NoteInputPreferences.midiVolume)
        }
    }
}
