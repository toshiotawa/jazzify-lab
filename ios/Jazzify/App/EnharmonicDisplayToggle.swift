import SwiftUI

/// 設定画面・ゲーム内設定モーダル共通の「異名同音の簡略表示」トグル。
struct EnharmonicDisplayToggle: View {
    let locale: AppLocale
    var tint: Color = .purple
    var labelColor: Color = .white
    var footerColor: Color = Color.white.opacity(0.65)
    var showsFooter: Bool = true

    @EnvironmentObject private var appState: AppState
    @State private var simpleEnharmonicDisplay = EnharmonicDisplayPreferences.load()

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle(isOn: $simpleEnharmonicDisplay) {
                Text(locale == .ja ? "異名同音の簡略表示" : "Simplified enharmonic spelling")
                    .foregroundStyle(labelColor)
            }
            .tint(tint)
            .onChange(of: simpleEnharmonicDisplay) { enabled in
                // 外部同期（ログイン時など）で state が追従した場合は保存済みなので再保存しない
                guard enabled != EnharmonicDisplayPreferences.load() else { return }
                Task { await appState.updateSimpleEnharmonicDisplay(enabled) }
            }

            if showsFooter {
                Text(
                    locale == .ja
                        ? "楽譜上のダブルシャープ・ダブルフラット、および白鍵の #/b（E#, B#, Fb, Cb）を白鍵表記にします。"
                        : "Re-spells double sharps/flats and white-key accidentals (E#, B#, Fb, Cb) as natural notes on sheet music."
                )
                .font(.caption)
                .foregroundStyle(footerColor)
                .fixedSize(horizontal: false, vertical: true)
            }
        }
        .onAppear {
            simpleEnharmonicDisplay = EnharmonicDisplayPreferences.load()
        }
        .onReceive(NotificationCenter.default.publisher(for: .enharmonicDisplayDidChange)) { _ in
            simpleEnharmonicDisplay = EnharmonicDisplayPreferences.load()
        }
    }
}
