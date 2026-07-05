import SwiftUI

enum TaskClearPromptMode {
    case afterClear
    case entry
}

struct TaskClearNextStepSheet: View {
    let nextTaskTitle: String
    let locale: AppLocale
    var mode: TaskClearPromptMode = .afterClear
    let onNext: () -> Void
    let onQuestList: () -> Void
    let onStopForToday: () -> Void

    private var isJapanese: Bool { locale == .ja }

    private var heading: String {
        switch mode {
        case .afterClear:
            return isJapanese ? "課題クリア！" : "Task cleared!"
        case .entry:
            return isJapanese ? "始めましょう" : "Let's begin!"
        }
    }

    private var bodyText: String {
        switch mode {
        case .afterClear:
            return isJapanese ? "次の課題に進みましょう。" : "Next up — keep the momentum going."
        case .entry:
            return isJapanese ? "次の課題に挑戦しましょう。" : "Ready for the next task."
        }
    }

    private var primaryButtonTitle: String {
        switch mode {
        case .afterClear:
            return isJapanese ? "次の課題へ" : "Next task"
        case .entry:
            return isJapanese ? "課題を始める" : "Start task"
        }
    }

    var body: some View {
        VStack(spacing: 20) {
            if mode == .afterClear {
                Text("🎉")
                    .font(.system(size: 44))
            }
            Text(heading)
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text(bodyText)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Text(nextTaskTitle)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color(hex: "93c5fd"))
                .multilineTextAlignment(.center)
            VStack(spacing: 12) {
                Button(primaryButtonTitle, action: onNext)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)
                Button(isJapanese ? "クエスト一覧を見る" : "View quest list", action: onQuestList)
                    .buttonStyle(.bordered)
                    .frame(maxWidth: .infinity)
                Button(isJapanese ? "今日はここまで" : "Stop for today", action: onStopForToday)
                    .buttonStyle(.borderless)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(24)
        .presentationDetents([.medium])
    }
}
