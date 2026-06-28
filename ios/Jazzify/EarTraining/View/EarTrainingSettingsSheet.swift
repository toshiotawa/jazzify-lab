import SwiftUI

/// レッスン経由時の本番 / 練習切替＋最初から再開（Web `practiceRunMode` / Survival `SurvivalStageRunModeConfig` 相当）。
struct EarTrainingStageRunModeConfig {
    let practiceMode: Bool
    let onApplyPracticeModeAndRestart: (Bool) -> Void
}

/// OSMD 練習移調（Web `practiceTranspose` prop 相当）。
struct EarTrainingPracticeTransposeConfig {
    let enabled: Bool
    let practiceMode: Bool
    let originalKeyFifths: Int
    let originalKeyName: String
    let appliedOffset: Int
}

/// OSMD 練習速度（Web `practiceSpeed` prop 相当）。
struct EarTrainingPracticeSpeedConfig {
    let practiceMode: Bool
    let appliedSpeedPercent: Int
    let onApplyAndRestart: (_ offset: Int, _ speedPercent: Int) -> Void
}

/// OSMD タイミング調整（Web `osmdTimingAdjustment` prop 相当）。
struct EarTrainingOsmdTimingAdjustmentConfig {
    let appliedOffsetMs: Int
    let onChange: (_ offsetMs: Int) -> Void
}

/// 耳コピバトル ゲーム画面の設定モーダル。Web `EarTrainingSettingsModal.tsx` と項目を一致させる:
/// - （任意）練習 / 本番 + 最初から挑戦
/// - MIDI デバイス選択
/// - マスター / フレーズ音源 / 入力ピアノ / 効果音 のスライダー
struct EarTrainingSettingsSheet: View {
    let isEnglishCopy: Bool
    let audio: EarTrainingAudio
    var stageRunMode: EarTrainingStageRunModeConfig?
    var practiceTranspose: EarTrainingPracticeTransposeConfig?
    var practiceSpeed: EarTrainingPracticeSpeedConfig?
    var osmdTimingAdjustment: EarTrainingOsmdTimingAdjustmentConfig?
    let onDismiss: () -> Void
    let onExit: () -> Void

    @State private var practiceDraft: Bool = false
    @State private var transposeDraft: Double = 0
    @State private var speedDraft: Double = 100
    @State private var timingAdjustmentDraft: Double = Double(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsDefault)
    @State private var masterVolume: Double = Self.loadDouble(key: Self.masterKey, fallback: 1.0)
    @State private var musicVolume: Double = Self.loadDouble(key: Self.musicKey, fallback: 0.7)
    @State private var pianoVolume: Double = Double(SurvivalGameAudio.shared.pianoVolume)
    @State private var sfxVolume: Double = Double(SurvivalGameAudio.shared.sfxVolume)
    @StateObject private var midiManager = MIDIManager.shared

    static let masterKey = "earTraining.master"
    static let musicKey = "earTraining.music"

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text(isEnglishCopy ? "Battle mode settings" : "バトルモード設定")
                    .font(.title3.bold())
                    .foregroundStyle(.white)

                if let stageRunMode {
                    stageRunModeSection(
                        stageRunMode,
                        showPlaybackHint: practiceSpeed != nil || practiceTranspose?.enabled == true
                    )
                } else if practiceSpeed != nil || practiceTranspose?.enabled == true {
                    playbackHintOnlySection
                }

                volumeBlock
                midiSection

                if let osmdTimingAdjustment {
                    osmdTimingAdjustmentSection(osmdTimingAdjustment)
                }

                if let practiceSpeed {
                    practicePlaybackSection(practiceSpeed)
                } else if let practiceTranspose, practiceTranspose.enabled {
                    practiceTransposeLegacyHintSection
                }

                VStack(spacing: 10) {
                    Button(action: { applyAll(); onDismiss() }) {
                        Text(isEnglishCopy ? "Done" : "完了")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.yellow)
                            .cornerRadius(10)
                    }
                    Button(action: onExit) {
                        Text(isEnglishCopy ? "Quit battle" : "バトルを終了")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.85))
                    }
                }
            }
            .padding(22)
            .frame(maxWidth: 360)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(Color(red: 0.08, green: 0.09, blue: 0.14).opacity(0.95))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(Color.yellow.opacity(0.4), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.4), radius: 12, x: 0, y: 6)
            .padding(.horizontal, 24)
            .padding(.vertical, 20)
        }
        .onAppear {
            midiManager.refreshDevices()
            if let stageRunMode {
                practiceDraft = stageRunMode.practiceMode
            }
            if let practiceTranspose {
                transposeDraft = Double(practiceTranspose.appliedOffset)
            }
            if let practiceSpeed {
                speedDraft = Double(practiceSpeed.appliedSpeedPercent)
            }
            if let osmdTimingAdjustment {
                timingAdjustmentDraft = Double(osmdTimingAdjustment.appliedOffsetMs)
            }
        }
        .onChange(of: stageRunMode?.practiceMode) { newValue in
            if let newValue {
                practiceDraft = newValue
            }
        }
        .onChange(of: practiceTranspose?.appliedOffset) { newValue in
            if let newValue {
                transposeDraft = Double(newValue)
            }
        }
        .onChange(of: practiceSpeed?.appliedSpeedPercent) { newValue in
            if let newValue {
                speedDraft = Double(newValue)
            }
        }
        .onChange(of: osmdTimingAdjustment?.appliedOffsetMs) { newValue in
            if let newValue {
                timingAdjustmentDraft = Double(newValue)
            }
        }
        .onDisappear {
            applyAll()
            persistAll()
        }
    }

    private var playbackHintOnlySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(isEnglishCopy
                 ? "In practice mode, you can change playback speed (and transpose when enabled for the task). Not available in performance mode."
                 : "練習モードでは再生速度を変更できます（移調を有効にした課題ではキーも変更可能。本番では利用できません）。")
                .font(.caption)
                .foregroundStyle(Color(hex: "67e8f9").opacity(0.85))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.cyan.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.cyan.opacity(0.35), lineWidth: 1)
        )
    }

    private func stageRunModeSection(_ config: EarTrainingStageRunModeConfig, showPlaybackHint: Bool) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(isEnglishCopy ? "Practice / Performance" : "練習 / 本番")
                .font(.subheadline.bold())
                .foregroundStyle(Color(hex: "67e8f9"))

            runModeRadio(title: isEnglishCopy ? "Performance" : "本番", selected: !practiceDraft) {
                practiceDraft = false
            }
            runModeRadio(title: isEnglishCopy ? "Practice" : "練習", selected: practiceDraft) {
                practiceDraft = true
            }

            Button {
                config.onApplyPracticeModeAndRestart(practiceDraft)
            } label: {
                Text(isEnglishCopy ? "Restart from beginning" : "適用して最初から挑戦")
                    .font(.subheadline.bold())
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color(hex: "06b6d4"))
                    .cornerRadius(10)
            }
            .buttonStyle(.plain)

            Text(isEnglishCopy
                 ? "Practice mode does not save lesson progress."
                 : "練習モードではレッスン進捗は保存されません。")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.55))

            if showPlaybackHint {
                Text(isEnglishCopy
                     ? "In practice mode, you can change playback speed (and transpose when enabled for the task). Not available in performance mode."
                     : "練習モードでは再生速度を変更できます（移調を有効にした課題ではキーも変更可能。本番では利用できません）。")
                    .font(.caption)
                    .foregroundStyle(Color(hex: "67e8f9").opacity(0.85))
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.cyan.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.cyan.opacity(0.35), lineWidth: 1)
        )
    }

    private func runModeRadio(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(selected ? Color(hex: "06b6d4") : .gray)
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Spacer(minLength: 0)
            }
        }
        .buttonStyle(.plain)
    }

    private func osmdTimingAdjustmentSection(_ config: EarTrainingOsmdTimingAdjustmentConfig) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(isEnglishCopy
                 ? "Timing adjustment (judgment & effects)"
                 : "タイミング調整（判定・演出同期）")
                .font(.subheadline.bold())
                .foregroundStyle(Color(hex: "fcd34d"))

            Text(isEnglishCopy
                 ? "Shift judgment, hammers, and hints relative to phrase audio (earlier: −, later: +)."
                 : "音源に対して判定・ハンマー・ヒントを早く/遅く調整します（早く: −, 遅く: +）。")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.75))

            HStack {
                Text(isEnglishCopy ? "Offset" : "補正量")
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Spacer()
                Text(EarTrainingOsmdTimingAdjustment.formatTimingAdjustmentLabel(Int(timingAdjustmentDraft.rounded())))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.white.opacity(0.85))
            }

            Slider(
                value: $timingAdjustmentDraft,
                in: Double(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMin)...Double(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMax),
                step: Double(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsStep)
            )
            .tint(Color(hex: "fbbf24"))
            .onChange(of: timingAdjustmentDraft) { newValue in
                let clamped = EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(Int(newValue.rounded()))
                if clamped != Int(newValue.rounded()) {
                    timingAdjustmentDraft = Double(clamped)
                }
                config.onChange(clamped)
            }

            HStack {
                Text("\(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMin)ms")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.55))
                Spacer()
                Text("0ms")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.55))
                Spacer()
                Text("\(EarTrainingOsmdTimingAdjustment.timingAdjustmentMsMax)ms")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.55))
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.orange.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.orange.opacity(0.35), lineWidth: 1)
        )
    }

    private func practicePlaybackSection(_ speedConfig: EarTrainingPracticeSpeedConfig) -> some View {
        let controlsActive = speedConfig.practiceMode
        let draftInt = EarTrainingMusicXmlTransposer.normalizeSignedSemitoneOffset(
            Int(transposeDraft.rounded())
        )
        let transposeConfig = practiceTranspose
        let sectionTitle: String = {
            if transposeConfig?.enabled == true {
                return isEnglishCopy ? "Transpose & Speed" : "移調 & 速度変更"
            }
            return isEnglishCopy ? "Speed" : "速度変更"
        }()
        let targetKey = transposeConfig.map {
            EarTrainingMusicXmlTransposer.targetKeyName(
                originalFifths: $0.originalKeyFifths,
                semitoneOffset: draftInt
            )
        }
        let offsetLabel = draftInt > 0 ? "+\(draftInt)" : "\(draftInt)"
        let keyLabel: String? = transposeConfig.map {
            draftInt == 0 ? $0.originalKeyName : "\(targetKey ?? $0.originalKeyName) (\(offsetLabel))"
        }

        return VStack(alignment: .leading, spacing: 10) {
            Text(sectionTitle)
                .font(.subheadline.bold())
                .foregroundStyle(Color(hex: "c4b5fd"))

            HStack {
                Text(isEnglishCopy ? "Speed" : "速度")
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Spacer()
                Text("\(EarTrainingPracticeSpeed.clampPracticeSpeedPercent(Int(speedDraft.rounded())))%")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.white.opacity(0.85))
            }

            Slider(
                value: $speedDraft,
                in: Double(EarTrainingPracticeSpeed.practiceSpeedMinPercent)...Double(EarTrainingPracticeSpeed.practiceSpeedMaxPercent),
                step: 1
            )
            .tint(Color(hex: "a78bfa"))
            .disabled(!controlsActive)

            if let transposeConfig, transposeConfig.enabled {
                Text(isEnglishCopy
                     ? "Original key: \(transposeConfig.originalKeyName) (0)"
                     : "原調: \(transposeConfig.originalKeyName) (0)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))

                HStack {
                    Text(isEnglishCopy ? "Semitones" : "半音")
                        .font(.subheadline)
                        .foregroundStyle(.white)
                    Spacer()
                    Text(keyLabel ?? transposeConfig.originalKeyName)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.white.opacity(0.85))
                }

                Slider(
                    value: $transposeDraft,
                    in: Double(EarTrainingMusicXmlTransposer.practiceTransposeMin)...Double(EarTrainingMusicXmlTransposer.practiceTransposeMax),
                    step: 1
                )
                .tint(Color(hex: "a78bfa"))
                .disabled(!controlsActive)
            }

            if !controlsActive {
                Text(isEnglishCopy
                     ? "Switch to practice mode to change playback settings."
                     : "再生設定を変更するには練習モードに切り替えてください。")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.55))
            }

            Button {
                let speed = EarTrainingPracticeSpeed.clampPracticeSpeedPercent(Int(speedDraft.rounded()))
                let offset = EarTrainingMusicXmlTransposer.clampPracticeTransposeOffset(draftInt)
                speedConfig.onApplyAndRestart(offset, speed)
            } label: {
                Text(isEnglishCopy ? "Apply and restart" : "適用して最初から")
                    .font(.subheadline.bold())
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color(hex: "a78bfa"))
                    .cornerRadius(10)
            }
            .buttonStyle(.plain)
            .disabled(!controlsActive)
            .opacity(controlsActive ? 1 : 0.45)

            Text(isEnglishCopy
                 ? "Applies to phrase audio and sheet music (when transposed), then restarts from the beginning."
                 : "フレーズ音源と楽譜（移調時）に反映し、最初から再読み込みします。")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.55))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.purple.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.purple.opacity(0.35), lineWidth: 1)
        )
    }

    private var practiceTransposeLegacyHintSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(isEnglishCopy
                 ? "In practice mode, you can transpose this stage when transposition is enabled for the task (not available in performance mode)."
                 : "練習モードでは、移調を有効にした課題でキーを変更できます（本番では利用できません）。")
                .font(.caption)
                .foregroundStyle(Color(hex: "67e8f9").opacity(0.85))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.purple.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.purple.opacity(0.35), lineWidth: 1)
        )
    }

    private var volumeBlock: some View {
        VStack(spacing: 12) {
            volumeRow(icon: "speaker.wave.3.fill",
                      label: isEnglishCopy ? "Master" : "マスター",
                      binding: bind($masterVolume, apply: applyAll))
            volumeRow(icon: "music.note",
                      label: isEnglishCopy ? "Phrase audio" : "フレーズ音源",
                      binding: bind($musicVolume, apply: applyAll))
            volumeRow(icon: "pianokeys",
                      label: isEnglishCopy ? "Input piano" : "入力ピアノ",
                      binding: bind($pianoVolume, apply: applyAll))
            volumeRow(icon: "waveform",
                      label: isEnglishCopy ? "Effects" : "効果音",
                      binding: bind($sfxVolume, apply: applyAll))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
    }

    private var midiSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "pianokeys.inverse")
                    .foregroundStyle(.white)
                Text(isEnglishCopy ? "MIDI Keyboard" : "MIDI キーボード")
                    .foregroundStyle(.white)
                    .font(.subheadline.bold())
                Spacer()
                Button { midiManager.refreshDevices() } label: {
                    Image(systemName: "arrow.clockwise")
                        .foregroundStyle(.white.opacity(0.7))
                        .font(.subheadline)
                }
                .buttonStyle(.plain)
            }
            if midiManager.availableDevices.isEmpty {
                Text(isEnglishCopy
                     ? "No MIDI devices found. Connect a keyboard."
                     : "MIDI デバイスが見つかりません。キーボードを接続してください。")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                VStack(spacing: 6) {
                    ForEach(midiManager.availableDevices, id: \.uniqueID) { device in
                        midiDeviceRow(device: device)
                    }
                    if midiManager.selectedDeviceID != nil {
                        Button {
                            midiManager.selectDevice(uniqueID: nil)
                        } label: {
                            Text(isEnglishCopy ? "Disconnect" : "接続を解除")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.7))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 6)
                                .background(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.white.opacity(0.25), lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.18), lineWidth: 1)
        )
    }

    private func midiDeviceRow(device: MIDIDeviceInfo) -> some View {
        let isSelected = midiManager.selectedDeviceID == device.uniqueID
        return Button {
            if isSelected {
                midiManager.selectDevice(uniqueID: nil)
            } else {
                midiManager.selectDevice(uniqueID: device.uniqueID)
            }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? Color.yellow : Color.white.opacity(0.5))
                VStack(alignment: .leading, spacing: 2) {
                    Text(device.displayName)
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    if !device.manufacturer.isEmpty {
                        Text(device.manufacturer)
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.6))
                            .lineLimit(1)
                    }
                }
                Spacer()
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? Color.yellow.opacity(0.15) : Color.white.opacity(0.05))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.yellow.opacity(0.5) : Color.white.opacity(0.12), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func volumeRow(icon: String, label: String, binding: Binding<Double>) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(.white.opacity(0.9))
                .frame(width: 22)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white)
                .frame(width: 100, alignment: .leading)
            Slider(value: binding, in: 0...1)
                .tint(.yellow)
            Text("\(Int((binding.wrappedValue * 100).rounded()))")
                .font(.caption.monospacedDigit())
                .foregroundStyle(.white.opacity(0.8))
                .frame(width: 32, alignment: .trailing)
        }
    }

    private func applyAll() {
        audio.setVolumes(master: masterVolume, music: musicVolume, piano: pianoVolume, sfx: sfxVolume)
    }

    private func persistAll() {
        UserDefaults.standard.set(masterVolume, forKey: Self.masterKey)
        UserDefaults.standard.set(musicVolume, forKey: Self.musicKey)
    }

    private func bind(_ source: Binding<Double>, apply: @escaping () -> Void) -> Binding<Double> {
        Binding(
            get: { source.wrappedValue },
            set: { newValue in
                source.wrappedValue = newValue
                apply()
            }
        )
    }

    private static func loadDouble(key: String, fallback: Double) -> Double {
        let stored = UserDefaults.standard.object(forKey: key) as? Double
        return stored ?? fallback
    }
}
