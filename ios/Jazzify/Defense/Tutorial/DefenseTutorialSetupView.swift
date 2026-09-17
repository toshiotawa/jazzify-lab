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

    private struct KeyOption: Identifiable {
        let id: Int
        let label: String
        let transposition: Int
    }

    private struct ClefOption: Identifiable {
        let value: NotationInstrumentClef
        let labelJa: String
        let labelEn: String
        var id: String { value.rawValue }
    }

    private let keyOptions: [KeyOption] = [
        KeyOption(id: 0, label: "C", transposition: 0),
        KeyOption(id: 1, label: "B♭", transposition: -2),
        KeyOption(id: 2, label: "E♭", transposition: -9),
        KeyOption(id: 3, label: "F", transposition: -7),
    ]

    private let clefOptions: [ClefOption] = [
        ClefOption(value: .treble, labelJa: "ト音記号", labelEn: "Treble clef"),
        ClefOption(value: .bass, labelJa: "ヘ音記号", labelEn: "Bass clef"),
        ClefOption(value: .grand, labelJa: "大譜表", labelEn: "Grand staff"),
    ]

    var body: some View {
        if mode == .confirm {
            confirmBody
        } else {
            editBody
        }
    }

    private var confirmBody: some View {
        VStack(spacing: 24) {
            Text(isEnglishCopy
                 ? "Your sheet music will be shown like this."
                 : "楽譜は次の設定で表示されます。")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Text(DefenseTutorialNotation.formatTutorialNotationLabel(settings, isEnglishCopy: isEnglishCopy))
                .font(.title2.bold())
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
                 ? "Choose the sheet music you usually read."
                 : "普段使っている楽譜を選んでください。")
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

            VStack(alignment: .leading, spacing: 8) {
                Text(isEnglishCopy ? "Written key" : "記譜キー")
                    .font(.caption.weight(.semibold))
                Picker(isEnglishCopy ? "Written key" : "記譜キー", selection: transpositionBinding) {
                    ForEach(keyOptions) { option in
                        Text(option.label).tag(option.transposition)
                    }
                }
                .pickerStyle(.segmented)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(isEnglishCopy ? "Clef" : "音部記号")
                    .font(.caption.weight(.semibold))
                Picker(isEnglishCopy ? "Clef" : "音部記号", selection: clefBinding) {
                    ForEach(clefOptions) { option in
                        Text(isEnglishCopy ? option.labelEn : option.labelJa).tag(option.value)
                    }
                }
                .pickerStyle(.segmented)
            }

            Button(isEnglishCopy ? "Continue" : "次へ", action: onConfirm)
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

    private var transpositionBinding: Binding<Int> {
        Binding(
            get: { DefenseTutorialNotation.resolveTransposition(settings) },
            set: { newValue in
                var copy = settings
                copy.transpositionOverride = newValue
                onChange(copy)
            }
        )
    }

    private var clefBinding: Binding<NotationInstrumentClef> {
        Binding(
            get: { DefenseTutorialNotation.resolveClef(settings) },
            set: { newValue in
                var copy = settings
                copy.clefOverride = newValue
                onChange(copy)
            }
        )
    }
}
