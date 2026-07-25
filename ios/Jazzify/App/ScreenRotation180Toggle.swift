import SwiftUI

/// 設定画面・ゲーム内設定モーダル共通の 180° 回転トグル。
struct ScreenRotation180Toggle: View {
    let locale: AppLocale
    var tint: Color = .purple
    var labelColor: Color = .white
    var footerColor: Color = Color.white.opacity(0.65)
    var showsFooter: Bool = true

    @State private var rotateScreen180 = ScreenRotationPreferences.load()

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle(isOn: $rotateScreen180) {
                Text(locale == .ja ? "画面を180°回転" : "Rotate screen 180°")
                    .foregroundStyle(labelColor)
            }
            .tint(tint)
            .onChange(of: rotateScreen180) { enabled in
                ScreenRotationPreferences.save(enabled)
                ScreenRotationApplier.shared.applyCurrentPreference()
            }

            if showsFooter {
                Text(
                    locale == .ja
                        ? "端末を上下反転して使うときに有効にしてください。充電ケーブルを上にしたり、MIDI 鍵盤を手前に置いたりする用途向けです。"
                        : "Turn this on when using the device upside down, for example with the charging cable at the top or a MIDI keyboard in front of you."
                )
                .font(.caption)
                .foregroundStyle(footerColor)
                .fixedSize(horizontal: false, vertical: true)
            }
        }
        .onAppear {
            rotateScreen180 = ScreenRotationPreferences.load()
            ScreenRotationApplier.shared.applyCurrentPreference()
        }
    }
}
