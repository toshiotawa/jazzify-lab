import SwiftUI

/// サバイバル画面の一時停止 / 設定モーダル。
/// - 一時停止中の BGM / SFX 音量調整 (`SurvivalGameAudio` へ直接反映)
/// - ミュート切替 (UserDefaults 永続化)
/// - 「再開」「マップに戻る」アクション
///
/// `SurvivalGameView` の `pauseOverlay` から呼び出され、
/// スライダー操作は即時反映 (`onEditingChanged` 不要) とするため `@State` で現在値を保持し、
/// 変更毎に `SurvivalGameAudio` の set API を呼ぶ。
struct SurvivalPauseSettingsSheet: View {
    let locale: AppLocale
    let onResume: () -> Void
    let onExit: () -> Void

    @State private var bgmVolume: Float = SurvivalGameAudio.shared.bgmVolume
    @State private var sfxVolume: Float = SurvivalGameAudio.shared.sfxVolume
    @State private var isMuted: Bool = SurvivalGameAudio.shared.isMuted

    var body: some View {
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
                    Text(locale == .ja ? "マップに戻る" : "Back to Map")
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
