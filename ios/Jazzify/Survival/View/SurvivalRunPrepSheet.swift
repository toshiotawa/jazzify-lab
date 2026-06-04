import SwiftUI

enum SurvivalRunPrepVariant: Equatable {
    case lesson
    case map
    case balloonRush
}

/// ステージ開始前の本番 / 練習（HINT）選択。Web 版 `SurvivalRunPrepModal` 相当。
struct SurvivalRunPrepSheet: View {
    let stage: SurvivalStageDefinition
    let locale: AppLocale
    let variant: SurvivalRunPrepVariant
    let initialHintMode: Bool
    let lessonRuntime: ResolvedSurvivalLessonRuntime?
    let onCancel: () -> Void
    let onConfirm: (Bool) -> Void
    private let balloonStage: BalloonRushStageDefinition?

    @State private var hintDraft: Bool

    private var isEnglishCopy: Bool { locale == .en }

    init(
        stage: SurvivalStageDefinition,
        locale: AppLocale,
        variant: SurvivalRunPrepVariant = .map,
        initialHintMode: Bool,
        lessonRuntime: ResolvedSurvivalLessonRuntime? = nil,
        onCancel: @escaping () -> Void,
        onConfirm: @escaping (Bool) -> Void
    ) {
        self.stage = stage
        self.locale = locale
        self.variant = variant
        self.initialHintMode = initialHintMode
        self.lessonRuntime = lessonRuntime
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
        self.variant = .balloonRush
        self.initialHintMode = initialHintMode
        self.lessonRuntime = nil
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
                        if isCompositeLocked {
                            Text(isEnglishCopy
                                ? "This composite phrase boss stage is performance-only."
                                : "複合フレーズボス専用ステージです。練習（HINT）は利用できません。")
                                .font(.caption2)
                                .foregroundStyle(Color(hex: "fde68a"))
                                .padding(10)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(hex: "451a03").opacity(0.35))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }

                    if !isCompositeLocked {
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
                    }

                    Button {
                        onConfirm(isCompositeLocked ? false : hintDraft)
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
            .navigationTitle(navigationTitleText)
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

    private var isCompositeLocked: Bool {
        stage.playMode != .codeRun
            && (stage.survivalUsesCompositePhrasePattern || stage.blockKey.rawValue == "lesson_composite")
    }

    private var clearSummaryText: String {
        if let br = balloonStage {
            return br.runPrepClearSummary(locale: locale)
        }
        if stage.playMode == .codeRun {
            let limit = lessonRuntime?.timeLimitSec
                ?? TimeInterval(stage.runTimeLimitSec ?? Int(SurvivalConstants.stageTimeLimitSec))
            let limitText = codeRunClockText(seconds: limit)
            if variant == .lesson {
                return isEnglishCopy
                    ? "Clear: reach the goal within \(limitText) (performance mode saves lesson progress)."
                    : "クリア条件: \(limitText)以内にゴール（本番時のみレッスン進捗が保存されます）。"
            }
            return isEnglishCopy
                ? "Objective: reach the goal within \(limitText) (HINT does not record clears)."
                : "目標: \(limitText)以内にゴール（HINT時はクリア記録されません）。"
        }

        let limit = Int(lessonRuntime?.timeLimitSec ?? SurvivalConstants.stageTimeLimitSec)
        let killQuota = lessonRuntime?.killQuota ?? stage.stageKillQuota
        let isBossEncounter = stage.survivalUsesCompositePhrasePattern
            || stage.blockKey.rawValue == "lesson_composite"
            || SurvivalBossEngine.isBlockLastStage(stageNumber: stage.stageNumber, in: stage.mapCategory)
        if isBossEncounter {
            return isEnglishCopy
                ? "Clear: defeat the boss (performance mode saves lesson progress)."
                : "クリア条件: ボス撃破（本番時のみレッスン進捗が保存されます）。"
        }
        if variant == .lesson {
            return isEnglishCopy
                ? "Clear: survive \(limit)s and defeat \(killQuota) enemies (performance mode saves lesson progress)."
                : "クリア条件: \(limit)秒生存 + \(killQuota)体撃破（本番時のみレッスン進捗が保存されます）。"
        }
        return isEnglishCopy
            ? "Objective: \(limit)s survival + \(killQuota) defeats (HINT does not record clears)."
            : "目標: \(limit)秒生存 + \(killQuota)体撃破（HINT時はクリア記録されません）。"
    }

    private var navigationTitleText: String {
        switch variant {
        case .balloonRush:
            return isEnglishCopy ? "Start balloon rush" : "風船ラッシュを開始"
        case .lesson:
            if stage.playMode == .codeRun {
                return isEnglishCopy ? "Start code run task" : "コードラン課題を開始"
            }
            return isEnglishCopy ? "Start survival task" : "サバイバル課題を開始"
        case .map:
            return isEnglishCopy ? "Start stage" : "ステージを開始"
        }
    }

    private func codeRunClockText(seconds: TimeInterval) -> String {
        let totalSeconds = max(0, Int(ceil(seconds)))
        let minutes = totalSeconds / 60
        let remainingSeconds = totalSeconds % 60
        return String(format: "%d:%02d", minutes, remainingSeconds)
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
