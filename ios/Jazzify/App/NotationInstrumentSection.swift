import SwiftUI

/// Web `NotationInstrumentSection.tsx` 相当。
struct NotationInstrumentSection: View {
    let locale: AppLocale
    var tint: Color = .yellow
    var labelColor: Color = .white
    var footerColor: Color = Color.white.opacity(0.65)

    @EnvironmentObject private var appState: AppState
    @State private var instrumentId = NotationInstrumentPreferences.loadInstrumentId()
    @State private var octaveShift = Double(NotationInstrumentPreferences.loadOctaveShift())

    private var isEnglishCopy: Bool { locale == .en }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(isEnglishCopy ? "Notation instrument" : "移調楽器（記譜）")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(labelColor)

            Text(isEnglishCopy
                 ? "Sheet music is transposed for your instrument. The on-screen piano always shows concert pitch."
                 : "楽譜は選択した楽器向けの記譜で表示されます。画面上のピアノは常にコンサート（実音）です。")
                .font(.caption)
                .foregroundStyle(footerColor)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 6) {
                Text(isEnglishCopy ? "Instrument" : "楽器")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(labelColor)
                Picker(isEnglishCopy ? "Instrument" : "楽器", selection: $instrumentId) {
                    ForEach(NotationInstrumentCatalog.presets, id: \.id) { preset in
                        Text(isEnglishCopy ? preset.labelEn : preset.labelJa)
                            .tag(preset.id)
                    }
                }
                .pickerStyle(.menu)
                .tint(tint)
                .onChange(of: instrumentId) { newValue in
                    guard newValue != NotationInstrumentPreferences.loadInstrumentId() else { return }
                    NotationInstrumentPreferences.saveInstrumentId(newValue)
                    Task { await appState.updateNotationInstrument(newValue) }
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(isEnglishCopy ? "Written octave shift" : "記譜オクターブ")
                        .font(.caption.weight(.medium))
                    Spacer()
                    Text(octaveShiftLabel)
                        .font(.caption.monospacedDigit())
                }
                .foregroundStyle(labelColor)

                Slider(
                    value: $octaveShift,
                    in: Double(NotationInstrumentCatalog.octaveShiftMin)...Double(NotationInstrumentCatalog.octaveShiftMax),
                    step: 1
                )
                .tint(tint)
                .onChange(of: octaveShift) { newValue in
                    let clamped = NotationInstrumentCatalog.clampOctaveShift(Int(newValue.rounded()))
                    guard clamped != NotationInstrumentPreferences.loadOctaveShift() else { return }
                    NotationInstrumentPreferences.saveOctaveShift(clamped)
                }
            }

            Text(footerSummary)
                .font(.caption)
                .foregroundStyle(footerColor)
                .fixedSize(horizontal: false, vertical: true)
        }
        .onAppear {
            syncFromPreferences()
        }
        .onReceive(NotificationCenter.default.publisher(for: .notationInstrumentDidChange)) { _ in
            syncFromPreferences()
        }
    }

    private var selectedPreset: NotationInstrumentPreset {
        NotationInstrumentCatalog.preset(for: instrumentId)
    }

    private var writtenOffset: Int {
        NotationInstrumentCatalog.writtenSemitoneOffset(
            preset: selectedPreset,
            userOctaveShift: Int(octaveShift.rounded())
        )
    }

    private var octaveShiftLabel: String {
        let shift = Int(octaveShift.rounded())
        let sign = shift > 0 ? "+" : ""
        return isEnglishCopy ? "\(sign)\(shift) oct" : "\(sign)\(shift) オクターブ"
    }

    private var footerSummary: String {
        let offsetLabel = NotationInstrumentCatalog.formatWrittenOffsetLabel(writtenOffset, isEnglishCopy: isEnglishCopy)
        let clefLabel = NotationInstrumentCatalog.formatClefLabel(selectedPreset.clef, isEnglishCopy: isEnglishCopy)
        return "\(offsetLabel) · \(clefLabel)"
    }

    private func syncFromPreferences() {
        instrumentId = NotationInstrumentPreferences.loadInstrumentId()
        octaveShift = Double(NotationInstrumentPreferences.loadOctaveShift())
    }
}
