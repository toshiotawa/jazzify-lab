import SwiftUI

extension View {
    /// 設定変更時に `@State` の表示モードを UserDefaults と同期する。
    func syncPianoKeyboardDisplayMode(_ displayMode: Binding<PianoKeyboardDisplayMode>) -> some View {
        onReceive(NotificationCenter.default.publisher(for: .pianoKeyboardDisplayModeDidChange)) { _ in
            displayMode.wrappedValue = PianoKeyboardDisplayPreferences.load()
        }
    }
}

/// 鍵盤表示モード（全モード共通）。
struct PianoKeyboardDisplayModeSection: View {
    @Binding var displayMode: PianoKeyboardDisplayMode
    let isEnglishCopy: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(isEnglishCopy ? "Keyboard display" : "鍵盤表示")
                .font(.subheadline.weight(.semibold))
            Picker(isEnglishCopy ? "Keyboard display" : "鍵盤表示", selection: $displayMode) {
                Text(isEnglishCopy ? "Fit to question range" : "出題音域フィット")
                    .tag(PianoKeyboardDisplayMode.questionRangeFit)
                Text(isEnglishCopy ? "Full 88 keys" : "88鍵盤")
                    .tag(PianoKeyboardDisplayMode.full88Keys)
            }
            .pickerStyle(.segmented)
            .onChange(of: displayMode) { newValue in
                PianoKeyboardDisplayPreferences.save(newValue)
            }
        }
    }
}
