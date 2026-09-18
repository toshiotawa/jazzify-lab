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
    let onFallbackInput: ((NoteInputMethod) -> Void)?

    @ObservedObject private var midiManager = MIDIManager.shared
    @State private var micSensitivity = Double(NoteInputPreferences.micSensitivity)
    @State private var voiceFastResponse = NoteInputPreferences.voiceFastResponse
    @State private var midiVolume = Double(NoteInputPreferences.midiVolume)
    @State private var permission = PitchInputEngine.MicrophonePermission.undetermined
    @State private var monitorVolume: Double = 0
    @State private var monitorNoteName: String?
    @State private var monitorTimer: Timer?

    init(
        inputMethod: NoteInputMethod,
        isEnglishCopy: Bool,
        onReady: @escaping () -> Void,
        onFallbackInput: ((NoteInputMethod) -> Void)? = nil
    ) {
        self.inputMethod = inputMethod
        self.isEnglishCopy = isEnglishCopy
        self.onReady = onReady
        self.onFallbackInput = onFallbackInput
    }

    private var isMidiConnected: Bool {
        guard let selected = midiManager.selectedDeviceID else { return false }
        return midiManager.availableDevices.contains(where: { $0.uniqueID == selected })
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if inputMethod == .touch {
                    Text(isEnglishCopy
                         ? "Play do, re, and mi on the keyboard below as shown on the staff."
                         : "譜面のド・レ・ミを、下の鍵盤で演奏しましょう。")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else if inputMethod == .midi {
                    midiSetup
                } else {
                    voiceSetup
                }

                Button(isEnglishCopy ? "Start" : "始める", action: onReady)
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity)
                    .disabled(inputMethod == .midi && !isMidiConnected)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 24)
        }
        .frame(maxWidth: 520)
        .frame(maxWidth: .infinity)
        .onAppear {
            NoteInputManager.shared.inputMethod = inputMethod
            NoteInputPreferences.voiceFastResponse = false
            voiceFastResponse = false
            micSensitivity = Double(NoteInputPreferences.micSensitivity)
            midiVolume = Double(NoteInputPreferences.midiVolume)
            permission = PitchInputEngine.microphonePermission
            if inputMethod == .voice {
                Task {
                    await startVoicePreviewIfNeeded()
                    startMonitorTimer()
                }
            }
        }
        .onDisappear {
            stopMonitorTimer()
            if inputMethod == .voice {
                stopVoicePreviewIfNeeded()
            }
        }
    }

    @ViewBuilder
    private var midiSetup: some View {
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

        VStack(alignment: .leading, spacing: 4) {
            Text(isEnglishCopy ? "Keyboard volume" : "鍵盤音量")
                .font(.caption)
            Slider(value: $midiVolume, in: 0...1)
                .onChange(of: midiVolume) { newValue in
                    NoteInputPreferences.midiVolume = Float(newValue)
                }
        }

        if !isMidiConnected, let onFallbackInput {
            VStack(alignment: .leading, spacing: 8) {
                Text(isEnglishCopy
                     ? "No MIDI device detected. You can continue with another input method."
                     : "MIDIデバイスが見つかりません。別の入力方法で続けられます。")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Button(isEnglishCopy ? "Continue with microphone" : "マイク入力で続ける") {
                    onFallbackInput(.voice)
                }
                .buttonStyle(.bordered)
                .frame(maxWidth: .infinity)
                Button(isEnglishCopy ? "Continue with on-screen keyboard" : "今は画面鍵盤で続ける") {
                    onFallbackInput(.touch)
                }
                .buttonStyle(.bordered)
                .frame(maxWidth: .infinity)
            }
            .padding(.top, 8)
        }
    }

    @ViewBuilder
    private var voiceSetup: some View {
        Text(isEnglishCopy
             ? "Headphones are recommended. Speaker bleed can make recognition unstable."
             : "イヤホン・ヘッドホンをおすすめします。スピーカーの音をマイクが拾うと、判定が不安定になることがあります。")
            .font(.subheadline)
            .foregroundStyle(.orange)

        if permission == .denied {
            Text(isEnglishCopy
                 ? "Microphone access is denied. Enable it in Settings > Jazzify."
                 : "マイクが許可されていません。設定アプリの Jazzify から許可してください。")
                .font(.caption)
                .foregroundStyle(.red)
        }

        VStack(alignment: .leading, spacing: 4) {
            Text(isEnglishCopy ? "Input level" : "入力レベル")
                .font(.caption)
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.2))
                    Capsule()
                        .fill(Color.green)
                        .frame(width: geometry.size.width * CGFloat(min(1, max(0, monitorVolume))))
                }
            }
            .frame(height: 8)
            if let monitorNoteName {
                Text(isEnglishCopy ? "Detected: \(monitorNoteName)" : "検出: \(monitorNoteName)")
                    .font(.caption)
            }
        }

        VStack(alignment: .leading, spacing: 4) {
            Text(isEnglishCopy
                 ? "Mic sensitivity: \(Int(micSensitivity))"
                 : "マイク感度: \(Int(micSensitivity))")
                .font(.caption)
            Slider(value: $micSensitivity, in: 1...10, step: 1)
                .onChange(of: micSensitivity) { newValue in
                    let level = Int(newValue.rounded())
                    NoteInputPreferences.micSensitivity = level
                    PitchInputEngine.shared.setSensitivity(level)
                }
            Text(isEnglishCopy
                 ? "Recommended: 5. Higher values detect quieter sounds more easily. Lower if notes are picked up too often."
                 : "おすすめ: 5。高いほど小さな音でも検出されやすくなります。拾いすぎる場合は下げてください。")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }

        Toggle(isEnglishCopy ? "Fast response" : "高速反応", isOn: $voiceFastResponse)
            .font(.caption)
            .onChange(of: voiceFastResponse) { newValue in
                NoteInputPreferences.voiceFastResponse = newValue
                PitchInputEngine.shared.setPitchStableFrames(NoteInputPreferences.pitchStableFrames)
            }
        Text(isEnglishCopy
             ? "Recommended: OFF. Keep it off to start. Turn on only if recognition feels slow. ON reacts faster but may mis-detect more often."
             : "おすすめ: OFF。まずは OFF のまま始めてください。反応が遅いと感じたら ON にしてください。ON は速いですが、誤判定が増えやすくなります。")
            .font(.caption2)
            .foregroundStyle(.secondary)
    }

    @MainActor
    private func startVoicePreviewIfNeeded() async {
        guard !NoteInputManager.shared.hasActiveSubscribers else { return }
        guard !PitchInputEngine.shared.isActive else { return }
        await PitchInputEngine.ensureMicrophonePermission()
        permission = PitchInputEngine.microphonePermission
        try? await PitchInputEngine.shared.start()
        PitchInputEngine.shared.setSensitivity(NoteInputPreferences.micSensitivity)
        refreshMonitor()
    }

    @MainActor
    private func stopVoicePreviewIfNeeded() {
        guard !NoteInputManager.shared.hasActiveSubscribers else { return }
        PitchInputEngine.shared.stop()
    }

    private func startMonitorTimer() {
        stopMonitorTimer()
        monitorTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { _ in
            Task { @MainActor in
                refreshMonitor()
            }
        }
    }

    private func stopMonitorTimer() {
        monitorTimer?.invalidate()
        monitorTimer = nil
    }

    @MainActor
    private func refreshMonitor() {
        let snapshot = PitchInputEngine.shared.monitorSnapshot(
            isActive: PitchInputEngine.shared.isActive
        )
        monitorVolume = snapshot.volume
        monitorNoteName = snapshot.detectedNoteName
    }
}
