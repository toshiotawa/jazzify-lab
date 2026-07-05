import SwiftUI

struct TaskClearNextStepSheet: View {
    let nextTaskTitle: String
    let locale: AppLocale
    let onNext: () -> Void
    let onQuestList: () -> Void
    let onStopForToday: () -> Void

    private var isJapanese: Bool { locale == .ja }

    private var heading: String {
        isJapanese ? "課題クリア！" : "Task cleared!"
    }

    private var bodyText: String {
        isJapanese ? "次の課題に進みましょう。" : "Next up — keep the momentum going."
    }

    var body: some View {
        VStack(spacing: 20) {
            Text("🎉")
                .font(.system(size: 44))
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
                Button(isJapanese ? "次の課題へ" : "Next task", action: onNext)
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
