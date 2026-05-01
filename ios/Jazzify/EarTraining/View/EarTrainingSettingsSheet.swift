import SwiftUI

/// 耳コピバトル ゲーム画面の設定モーダル。Web `EarTrainingSettingsModal.tsx` と項目を一致させる:
/// - MIDI デバイス選択
/// - マスター / フレーズ音源 / 入力ピアノ / 効果音 のスライダー
struct EarTrainingSettingsSheet: View {
    let isEnglishCopy: Bool
    let audio: EarTrainingAudio
    let onDismiss: () -> Void
    let onExit: () -> Void

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
                Text(isEnglishCopy ? "Settings" : "設定")
                    .font(.title3.bold())
                    .foregroundStyle(.white)

                volumeBlock
                midiSection

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
        }
        .onDisappear {
            applyAll()
            persistAll()
        }
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
