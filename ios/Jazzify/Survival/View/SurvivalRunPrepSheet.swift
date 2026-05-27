import SwiftUI

/// ステージ開始前の本番 / 練習（HINT）選択。Web 版 `SurvivalRunPrepModal` 相当。
struct SurvivalRunPrepSheet: View {
    let stage: SurvivalStageDefinition
    let locale: AppLocale
    let initialHintMode: Bool
    let onCancel: () -> Void
    let onConfirm: (Bool) -> Void
    private let balloonStage: BalloonRushStageDefinition?

    @State private var hintDraft: Bool

    private var isEnglishCopy: Bool { locale == .en }

    init(
        stage: SurvivalStageDefinition,
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
        self.balloonStage = nil
        _hintDraft = State(initialValue: initialHintMode)
    }

    init(
        balloonStage: BalloonRushStageDefinition,
        locale: AppLocale,
        initialHintMode: Bool,
        onCancel: @escaping () -> Void,
        onConfirm: @escaping (Bool) -> Void
    ) {
        self.stage = BalloonRushSurvivalBridge.presentationStage(from: balloonStage)
        self.locale = locale
        self.initialHintMode = initialHintMode
        self.onCancel = onCancel
        self.onConfirm = onConfirm
        self.balloonStage = balloonStage
        _hintDraft = State(initialValue: initialHintMode)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        infoRow(
                            label: isEnglishCopy ? "Stage" : "ステージ",
                            value: balloonStage?.localizedTitle(locale) ?? stage.localizedName(locale)
                        )
                        infoRow(
                            label: isEnglishCopy ? "Mode" : "出題",
                            value: balloonStage?.runPrepModeLabel(locale: locale)
                                ?? stage.runPrepModeLabel(locale: locale)
                        )
                        if balloonStage == nil {
                            infoRow(
                                label: isEnglishCopy ? "Encounter" : "戦闘",
                                value: stage.runPrepEncounterLabel(locale: locale)
                            )
                        }
                        Text(clearSummaryText)
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text(isEnglishCopy ? "Run mode" : "プレイモード")
                            .font(.subheadline.bold())
                            .foregroundStyle(Color(hex: "fde68a"))

                        runModeRow(
                            title: isEnglishCopy ? "Performance" : "本番",
                            selected: !hintDraft
                        ) {
                            hintDraft = false
                        }

                        runModeRow(
                            title: isEnglishCopy ? "Practice (HINT)" : "練習（HINT）",
                            selected: hintDraft
                        ) {
                            hintDraft = true
                        }
                    }

                    Button {
                        onConfirm(hintDraft)
                    } label: {
                        Text(isEnglishCopy ? "Start" : "開始")
                            .font(.headline)
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(hex: "f59e0b"))
                            .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
                .padding(20)
            }
            .background(Color(hex: "0a0610").ignoresSafeArea())
            .navigationTitle(
                balloonStage != nil
                    ? (isEnglishCopy ? "Start balloon rush" : "風船ラッシュを開始")
                    : (isEnglishCopy ? "Start stage" : "ステージを開始")
            )
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(isEnglishCopy ? "Back" : "戻る") {
                        onCancel()
                    }
                    .foregroundStyle(.gray)
                }
            }
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .preferredColorScheme(.dark)
    }

    private var clearSummaryText: String {
        if let br = balloonStage {
            return br.runPrepClearSummary(locale: locale)
        }
        return stage.runPrepClearSummary(locale: locale)
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text("\(label):")
                .font(.subheadline)
                .foregroundStyle(.gray)
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
        }
    }

    private func runModeRow(title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(selected ? Color(hex: "f59e0b") : .gray)
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Spacer(minLength: 0)
            }
            .padding(12)
            .background(Color.white.opacity(0.06))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(selected ? Color(hex: "f59e0b").opacity(0.5) : Color.white.opacity(0.1), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
    }
}
