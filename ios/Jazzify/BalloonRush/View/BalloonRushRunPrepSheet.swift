import SwiftUI

struct BalloonRushRunPrepSheet: View {
    let stage: BalloonRushStageDefinition
    let locale: AppLocale
    let initialHintMode: Bool
    let onCancel: () -> Void
    let onConfirm: (Bool) -> Void

    @State private var hintDraft: Bool

    init(
        stage: BalloonRushStageDefinition,
        locale: AppLocale,
        initialHintMode: Bool,
        onCancel: @escaping () -> Void,
        onConfirm: @escaping (Bool) -> Void
    ) {
        self.stage = stage
        self.locale = locale
        self.initialHintMode = initialHintMode
        self.onCancel = onCancel
        self.onConfirm = onConfirm
        _hintDraft = State(initialValue: initialHintMode)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        infoRow(
                            label: locale == .en ? "Stage" : "ステージ",
                            value: stage.localizedTitle(locale)
                        )
                        infoRow(
                            label: locale == .en ? "Mode" : "出題",
                            value: stage.runPrepModeLabel(locale: locale)
                        )
                        Text(stage.runPrepClearSummary(locale: locale))
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text(locale == .en ? "Run mode" : "プレイモード")
                            .font(.subheadline.bold())
                            .foregroundStyle(Color(hex: "7dd3fc"))

                        runModeRow(
                            title: locale == .en ? "Performance" : "本番",
                            selected: !hintDraft
                        ) { hintDraft = false }

                        runModeRow(
                            title: locale == .en ? "Practice (HINT)" : "練習（HINT）",
                            selected: hintDraft
                        ) { hintDraft = true }
                    }

                    Button {
                        onConfirm(hintDraft)
                    } label: {
                        Text(locale == .en ? "Start" : "開始")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(hex: "38bdf8"))
                            .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
                .padding(20)
            }
            .background(Color(hex: "0f172a").ignoresSafeArea())
            .navigationTitle(locale == .en ? "Start balloon rush" : "風船ラッシュを開始")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(locale == .en ? "Back" : "戻る", action: onCancel)
                        .foregroundStyle(.gray)
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text("\(label):")
                .foregroundStyle(.gray)
            Text(value)
                .foregroundStyle(.white)
        }
        .font(.subheadline)
    }

    private func runModeRow(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(selected ? Color(hex: "38bdf8") : .gray)
                Text(title)
                    .foregroundStyle(.white)
                Spacer()
            }
            .padding(12)
            .background(selected ? Color(hex: "0c4a6e").opacity(0.5) : Color.white.opacity(0.05))
            .cornerRadius(10)
        }
        .buttonStyle(.plain)
    }
}
