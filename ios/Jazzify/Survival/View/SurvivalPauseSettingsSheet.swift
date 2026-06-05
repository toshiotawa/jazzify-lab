import SwiftUI

/// サバイバル画面の一時停止 / 設定モーダル。
/// - 一時停止中の BGM / SFX 音量調整 (`SurvivalGameAudio` へ直接反映)
/// - ミュート切替 (UserDefaults 永続化)
/// - 「再開」「マップに戻る」アクション
///
/// `SurvivalGameView` の `pauseOverlay` から呼び出され、
/// スライダー操作は即時反映 (`onEditingChanged` 不要) とするため `@State` で現在値を保持し、
/// 変更毎に `SurvivalGameAudio` の set API を呼ぶ。
/// ステージモード時の本番 / HINT 切替＋最初から再開（Web `SurvivalSettingsModal` `stageRunMode` 相当）。
struct SurvivalStageRunModeConfig {
    let hintMode: Bool
    let onApplyHintModeAndRestart: (Bool) -> Void
}

struct SurvivalAudioVolumeSection: View {
    let locale: AppLocale
    var title: String?

    @State private var pianoVolume: Float = SurvivalGameAudio.shared.pianoVolume
    @State private var sfxVolume: Float = SurvivalGameAudio.shared.sfxVolume
    @State private var bgmVolume: Float = SurvivalGameAudio.shared.bgmVolume

    private var isEnglishCopy: Bool { locale == .en }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let title {
                Text(title)
                    .font(.subheadline.bold())
                    .foregroundStyle(Color(hex: "fde68a"))
            }

            volumeRow(
                icon: "pianokeys",
                label: isEnglishCopy ? "Piano" : "ピアノ",
                value: pianoBinding
            )

            volumeRow(
                icon: "waveform",
                label: isEnglishCopy ? "SFX" : "効果音",
                value: sfxBinding
            )

            volumeRow(
                icon: "music.note",
                label: isEnglishCopy ? "BGM" : "BGM",
                value: bgmBinding
            )
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.06))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.12), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .onAppear(perform: syncVolumes)
    }

    private var pianoBinding: Binding<Float> {
        Binding(
            get: { pianoVolume },
            set: { newValue in
                pianoVolume = newValue
                SurvivalGameAudio.shared.setPianoVolume(newValue)
            }
        )
    }

    private var sfxBinding: Binding<Float> {
        Binding(
            get: { sfxVolume },
            set: { newValue in
                sfxVolume = newValue
                SurvivalGameAudio.shared.setSfxVolume(newValue)
            }
        )
    }

    private var bgmBinding: Binding<Float> {
        Binding(
            get: { bgmVolume },
            set: { newValue in
                bgmVolume = newValue
                SurvivalGameAudio.shared.setBgmVolume(newValue)
            }
        )
    }

    private func syncVolumes() {
        pianoVolume = SurvivalGameAudio.shared.pianoVolume
        sfxVolume = SurvivalGameAudio.shared.sfxVolume
        bgmVolume = SurvivalGameAudio.shared.bgmVolume
    }

    private func volumeRow(icon: String, label: String, value: Binding<Float>) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(.white.opacity(0.9))
                .frame(width: 22)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white)
                .frame(width: 58, alignment: .leading)
            Slider(value: value, in: 0...1)
                .tint(.yellow)
            Text("\(Int((value.wrappedValue * 100).rounded()))")
                .font(.caption.monospacedDigit())
                .foregroundStyle(.white.opacity(0.8))
                .frame(width: 32, alignment: .trailing)
        }
    }
}

struct SurvivalPauseSettingsSheet: View {
    let locale: AppLocale
    /// デモプレイ中は「タイトルに戻る」表記にする。
    var isDemo: Bool = false
    var stageRunMode: SurvivalStageRunModeConfig?
    let onResume: () -> Void
    let onExit: () -> Void

    @State private var bgmVolume: Float = SurvivalGameAudio.shared.bgmVolume
    @State private var sfxVolume: Float = SurvivalGameAudio.shared.sfxVolume
    @State private var pianoVolume: Float = SurvivalGameAudio.shared.pianoVolume
    @State private var isMuted: Bool = SurvivalGameAudio.shared.isMuted
    @StateObject private var midiManager = MIDIManager.shared
    @State private var hintDraft: Bool = false

    private var isEnglishCopy: Bool { locale == .en }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                Text(locale == .ja ? "一時停止 / 設定" : "Paused / Settings")
                    .font(.title3.bold())
                    .foregroundStyle(.white)

                VStack(alignment: .leading, spacing: 14) {
                    Toggle(isOn: muteBinding) {
                        HStack(spacing: 8) {
                            Image(systemName: isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                                .foregroundStyle(.white)
                            Text(locale == .ja ? "ミュート" : "Mute")
                                .foregroundStyle(.white)
                                .font(.subheadline)
                        }
                    }
                    .tint(.yellow)

                    volumeRow(
                        icon: "music.note",
                        label: locale == .ja ? "BGM" : "Music",
                        value: bgmBinding
                    )

                    volumeRow(
                        icon: "waveform",
                        label: locale == .ja ? "効果音" : "SFX",
                        value: sfxBinding
                    )

                    volumeRow(
                        icon: "pianokeys",
                        label: locale == .ja ? "ピアノ" : "Piano",
                        value: pianoBinding
                    )
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

                midiSection

                if let stageRunMode, !isDemo {
                    stageRunModeSection(stageRunMode)
                }

                VStack(spacing: 10) {
                    Button(action: onResume) {
                        Text(locale == .ja ? "再開" : "Resume")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.yellow)
                            .cornerRadius(10)
                    }

                    Button(action: onExit) {
                        Text(exitLabel)
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
                hintDraft = stageRunMode.hintMode
            }
        }
        .onChange(of: stageRunMode?.hintMode) { newValue in
            if let newValue {
                hintDraft = newValue
            }
        }
    }

    // MARK: - Run mode (HINT)

    private func stageRunModeSection(_ config: SurvivalStageRunModeConfig) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(isEnglishCopy ? "Practice / Performance" : "練習 / 本番")
                .font(.subheadline.bold())
                .foregroundStyle(Color(hex: "fde68a"))

            runModeRadio(title: isEnglishCopy ? "Performance" : "本番", selected: !hintDraft) {
                hintDraft = false
            }
            runModeRadio(title: isEnglishCopy ? "Practice (HINT)" : "練習（HINT）", selected: hintDraft) {
                hintDraft = true
            }

            Button {
                config.onApplyHintModeAndRestart(hintDraft)
            } label: {
                Text(isEnglishCopy ? "Apply & restart from beginning" : "適用して最初から挑戦")
                    .font(.subheadline.bold())
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color(hex: "f59e0b"))
                    .cornerRadius(10)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.yellow.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.yellow.opacity(0.35), lineWidth: 1)
        )
    }

    private func runModeRadio(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(selected ? Color(hex: "f59e0b") : .gray)
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Spacer(minLength: 0)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - MIDI Section

    private var midiSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "pianokeys.inverse")
                    .foregroundStyle(.white)
                Text(locale == .ja ? "MIDI キーボード" : "MIDI Keyboard")
                    .foregroundStyle(.white)
                    .font(.subheadline.bold())
                Spacer()
                Button {
                    midiManager.refreshDevices()
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .foregroundStyle(.white.opacity(0.7))
                        .font(.subheadline)
                }
                .buttonStyle(.plain)
            }

            if midiManager.availableDevices.isEmpty {
                Text(locale == .ja
                     ? "MIDI デバイスが見つかりません。キーボードを接続してください。"
                     : "No MIDI devices found. Connect a keyboard.")
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
                            Text(locale == .ja ? "接続を解除" : "Disconnect")
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

    // MARK: - Exit label

    /// デモ中はマップ画面が存在しないためタイトル画面への戻りとなる。
    private var exitLabel: String {
        if isDemo {
            return locale == .ja ? "タイトルに戻る" : "Back to Title"
        }
        return locale == .ja ? "マップに戻る" : "Back to Map"
    }

    // MARK: - Bindings (SurvivalGameAudio へ即時反映)

    private var bgmBinding: Binding<Float> {
        Binding(
            get: { bgmVolume },
            set: { newValue in
                bgmVolume = newValue
                SurvivalGameAudio.shared.setBgmVolume(newValue)
            }
        )
    }

    private var sfxBinding: Binding<Float> {
        Binding(
            get: { sfxVolume },
            set: { newValue in
                sfxVolume = newValue
                SurvivalGameAudio.shared.setSfxVolume(newValue)
            }
        )
    }

    private var pianoBinding: Binding<Float> {
        Binding(
            get: { pianoVolume },
            set: { newValue in
                pianoVolume = newValue
                SurvivalGameAudio.shared.setPianoVolume(newValue)
            }
        )
    }

    private var muteBinding: Binding<Bool> {
        Binding(
            get: { isMuted },
            set: { newValue in
                isMuted = newValue
                SurvivalGameAudio.shared.setMuted(newValue)
            }
        )
    }

    // MARK: - Volume row

    private func volumeRow(icon: String, label: String, value: Binding<Float>) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(.white.opacity(0.9))
                .frame(width: 22)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white)
                .frame(width: 64, alignment: .leading)
            Slider(value: value, in: 0...1)
                .tint(.yellow)
                .disabled(isMuted)
                .opacity(isMuted ? 0.4 : 1)
            Text("\(Int((value.wrappedValue * 100).rounded()))")
                .font(.caption.monospacedDigit())
                .foregroundStyle(.white.opacity(0.8))
                .frame(width: 32, alignment: .trailing)
        }
    }
}
