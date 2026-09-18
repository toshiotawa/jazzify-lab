import SwiftUI

struct DefenseTutorialSetupView: View {
    let settings: DefenseTutorialNotationSettings
    let isEnglishCopy: Bool
    let mode: Mode
    let onChange: (DefenseTutorialNotationSettings) -> Void
    let onConfirm: () -> Void
    let onBackToEdit: (() -> Void)?

    enum Mode {
        case edit
        case confirm
    }

    var body: some View {
        if mode == .confirm {
            confirmBody
        } else {
            editBody
        }
    }

    private var confirmBody: some View {
        let preset = NotationInstrumentCatalog.preset(for: settings.notationInstrumentId)
        let instrumentLabel = isEnglishCopy ? preset.labelEn : preset.labelJa
        return VStack(spacing: 24) {
            Text(isEnglishCopy
                 ? "Your sheet music will be shown like this."
                 : "楽譜は次の設定で表示されます。")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Text(instrumentLabel)
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            Text(DefenseTutorialNotation.formatTutorialNotationLabel(settings, isEnglishCopy: isEnglishCopy))
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            HStack(spacing: 12) {
                if let onBackToEdit {
                    Button(isEnglishCopy ? "Change" : "変更する", action: onBackToEdit)
                        .buttonStyle(.bordered)
                }
                Button(isEnglishCopy ? "Continue with this setup" : "この設定で進む", action: onConfirm)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 32)
        .frame(maxWidth: 480)
        .frame(maxWidth: .infinity)
    }

    private var editBody: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(isEnglishCopy
                 ? "If you want to read in your instrument's key, choose that instrument. If you want concert pitch (no transposition), choose Melody (Concert key)."
                 : "あなたの楽器のキーで譜面を読みたい方は、その楽器を選んでください。コンサートキー（移調なし）で読みたい方は「単音楽器（コンサートキー）」を選んでください。")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .center)

            VStack(alignment: .leading, spacing: 8) {
                Text(isEnglishCopy ? "Instrument" : "楽器")
                    .font(.caption.weight(.semibold))
                Picker(isEnglishCopy ? "Instrument" : "楽器", selection: instrumentBinding) {
                    ForEach(NotationInstrumentCatalog.presets, id: \.id) { preset in
                        Text(isEnglishCopy ? preset.labelEn : preset.labelJa).tag(preset.id)
                    }
                }
                .pickerStyle(.menu)
            }

            Button(isEnglishCopy ? "Next" : "次へ", action: onConfirm)
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 8)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 32)
        .frame(maxWidth: 520)
        .frame(maxWidth: .infinity)
    }

    private var instrumentBinding: Binding<String> {
        Binding(
            get: { settings.notationInstrumentId },
            set: { newId in
                let preset = NotationInstrumentCatalog.preset(for: newId)
                onChange(DefenseTutorialNotationSettings(
                    notationInstrumentId: newId,
                    notationOctaveShift: settings.notationOctaveShift,
                    clefOverride: preset.clef,
                    transpositionOverride: preset.transposition
                ))
            }
        )
    }
}
