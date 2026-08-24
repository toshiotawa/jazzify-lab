import AVFoundation
import SwiftUI

/// 入力方式（MIDI / マイク）の共通設定ブロック。
/// List と VStack のどちらに置かれても崩れないよう `Section` ではなく `VStack` で構成する。
struct InputMethodSection: View {
    let isEnglishCopy: Bool

    @ObservedObject private var midiManager = MIDIManager.shared
    @State private var inputMethod: NoteInputMethod = NoteInputPreferences.inputMethod
    @State private var ignoreOctave: Bool = NoteInputPreferences.ignoreOctave
    @State private var micSensitivity: Double = Double(NoteInputPreferences.micSensitivity)
    @State private var permission: PitchInputEngine.MicrophonePermission = .undetermined
    @State private var hasHeadphones = true

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(isEnglishCopy ? "Note input" : "入力方式")
                .font(.subheadline.weight(.semibold))

            Picker(isEnglishCopy ? "Note input" : "入力方式", selection: $inputMethod) {
                Text("MIDI").tag(NoteInputMethod.midi)
                Text(isEnglishCopy ? "Microphone" : "マイク").tag(NoteInputMethod.voice)
            }
            .pickerStyle(.segmented)
            .onChange(of: inputMethod) { newValue in
                NoteInputManager.shared.inputMethod = newValue
                guard newValue == .voice else { return }
                Task {
                    await PitchInputEngine.ensureMicrophonePermission()
                    permission = PitchInputEngine.microphonePermission
                }
            }

            if inputMethod == .midi {
                midiDeviceList
            } else {
                voiceSettings
            }

            Divider().opacity(0.3)

            Toggle(
                isEnglishCopy ? "Ignore octave differences" : "オクターブ違いを無視",
                isOn: $ignoreOctave
            )
            .onChange(of: ignoreOctave) { newValue in
                NoteInputPreferences.ignoreOctave = newValue
            }

            Text(
                isEnglishCopy
                    ? "Affects Precision mode. Other modes already compare pitch classes."
                    : "オクターブ無視は主に Precision モード向けです。他モードは既にピッチクラス判定です。"
            )
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .onAppear {
            inputMethod = NoteInputPreferences.inputMethod
            ignoreOctave = NoteInputPreferences.ignoreOctave
            micSensitivity = Double(NoteInputPreferences.micSensitivity)
            permission = PitchInputEngine.microphonePermission
            refreshHeadphoneState()
        }
        .onReceive(
            NotificationCenter.default.publisher(for: AVAudioSession.routeChangeNotification)
        ) { _ in
            refreshHeadphoneState()
        }
    }

    @ViewBuilder
    private var midiDeviceList: some View {
        if midiManager.availableDevices.isEmpty {
            Text(isEnglishCopy ? "No MIDI device found" : "MIDIデバイスが見つかりません")
                .font(.caption)
                .foregroundStyle(.secondary)
        } else {
            ForEach(midiManager.availableDevices) { device in
                Button {
                    midiManager.selectDevice(uniqueID: device.uniqueID)
                } label: {
                    HStack {
                        Text(device.displayName)
                        Spacer()
                        if midiManager.selectedDeviceID == device.uniqueID {
                            Image(systemName: "checkmark")
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder
    private var voiceSettings: some View {
        if permission == .denied {
            Text(
                isEnglishCopy
                    ? "Microphone access is denied. Enable it in Settings > Jazzify."
                    : "マイクが許可されていません。設定アプリの Jazzify から許可してください。"
            )
            .font(.caption)
            .foregroundStyle(.red)
        }

        Text(
            isEnglishCopy
                ? "Monophonic only. Chord modes detect one note at a time."
                : "単音入力専用です。和音モードでは1音ずつしか判定されません。"
        )
        .font(.caption)
        .foregroundStyle(.secondary)

        if !hasHeadphones {
            Label(
                isEnglishCopy
                    ? "Headphones recommended to avoid speaker bleed."
                    : "スピーカーの回り込みを防ぐため、ヘッドホンを推奨します。",
                systemImage: "headphones"
            )
            .font(.caption)
            .foregroundStyle(.orange)
        }

        VStack(alignment: .leading, spacing: 4) {
            Text(
                isEnglishCopy
                    ? "Sensitivity: \(Int(micSensitivity))"
                    : "感度: \(Int(micSensitivity))"
            )
            .font(.caption)
            Slider(value: $micSensitivity, in: 1...10, step: 1)
                .onChange(of: micSensitivity) { newValue in
                    let level = Int(newValue.rounded())
                    NoteInputPreferences.micSensitivity = level
                    PitchInputEngine.shared.setSensitivity(level)
                }
        }
    }

    private func refreshHeadphoneState() {
        let outputs = AVAudioSession.sharedInstance().currentRoute.outputs
        hasHeadphones = outputs.contains { output in
            output.portType == .headphones
                || output.portType == .bluetoothA2DP
                || output.portType == .bluetoothHFP
                || output.portType == .usbAudio
        }
    }
}
