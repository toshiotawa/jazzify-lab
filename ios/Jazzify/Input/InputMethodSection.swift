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
    @State private var monitorVolume: Double = 0
    @State private var monitorNoteName: String?
    @State private var monitorError: String?
    @State private var monitorCaptureMs: Double?
    @State private var monitorInferenceMs: Double?
    @State private var engineActive = false
    @State private var monitorTimer: Timer?

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
                guard newValue == .voice else {
                    stopVoicePreviewIfNeeded()
                    stopMonitorTimer()
                    return
                }
                Task {
                    await PitchInputEngine.ensureMicrophonePermission()
                    permission = PitchInputEngine.microphonePermission
                    await startVoicePreviewIfNeeded()
                    startMonitorTimer()
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
            if inputMethod == .voice {
                Task {
                    await startVoicePreviewIfNeeded()
                    startMonitorTimer()
                }
            }
        }
        .onDisappear {
            stopMonitorTimer()
            stopVoicePreviewIfNeeded()
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
                    ? "Echo cancellation is on for the speaker. Lower BGM if detection is unstable."
                    : "スピーカー時はエコーキャンセルが有効です。BGM が大きいと精度が落ちます。",
                systemImage: "headphones"
            )
            .font(.caption)
            .foregroundStyle(.orange)
        }

        VStack(alignment: .leading, spacing: 4) {
            Text(
                isEnglishCopy
                    ? "Input level"
                    : "入力レベル"
            )
            .font(.caption)
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.secondary.opacity(0.2))
                    Capsule()
                        .fill(engineActive ? Color.green : Color.secondary.opacity(0.4))
                        .frame(width: geometry.size.width * CGFloat(min(1, max(0, monitorVolume))))
                }
            }
            .frame(height: 8)

            if let monitorNoteName {
                Text(
                    isEnglishCopy
                        ? "Detected: \(monitorNoteName)"
                        : "検出: \(monitorNoteName)"
                )
                .font(.caption)
                .foregroundStyle(.primary)
            } else if engineActive {
                Text(
                    isEnglishCopy
                        ? "Listening…"
                        : "待機中…"
                )
                .font(.caption)
                .foregroundStyle(.secondary)
            }

            if let monitorError, !engineActive {
                Text(monitorError)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            if engineActive, monitorCaptureMs != nil || monitorInferenceMs != nil {
                Text(
                    isEnglishCopy
                        ? "Input \(formattedLatencyMs(monitorCaptureMs)) / infer \(formattedLatencyMs(monitorInferenceMs))"
                        : "入力 \(formattedLatencyMs(monitorCaptureMs)) / 推論 \(formattedLatencyMs(monitorInferenceMs))"
                )
                .font(.caption2.monospacedDigit())
                .foregroundStyle(.secondary)
            }
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
        hasHeadphones = AudioRouteHelper.hasHeadphoneOutput()
    }

    @MainActor
    private func startVoicePreviewIfNeeded() async {
        guard inputMethod == .voice else { return }
        guard !NoteInputManager.shared.hasActiveSubscribers else { return }
        guard !PitchInputEngine.shared.isActive else {
            refreshMonitor()
            return
        }
        do {
            try await PitchInputEngine.shared.start()
            PitchInputEngine.shared.setSensitivity(NoteInputPreferences.micSensitivity)
        } catch {
            monitorError = error.localizedDescription
        }
        refreshMonitor()
    }

    @MainActor
    private func stopVoicePreviewIfNeeded() {
        guard !NoteInputManager.shared.hasActiveSubscribers else { return }
        PitchInputEngine.shared.stop()
        engineActive = false
        monitorVolume = 0
        monitorNoteName = nil
        monitorCaptureMs = nil
        monitorInferenceMs = nil
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
        engineActive = snapshot.isActive
        monitorVolume = snapshot.volume
        monitorNoteName = snapshot.detectedNoteName
        monitorError = snapshot.lastError
        monitorCaptureMs = snapshot.captureIntervalMs
        monitorInferenceMs = snapshot.inferenceMs
    }

    private func formattedLatencyMs(_ value: Double?) -> String {
        guard let value else { return "—" }
        return String(format: "%.0fms", value)
    }
}
