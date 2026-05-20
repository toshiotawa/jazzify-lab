import SwiftUI

/// レッスン全体でタップ送り UI（吹き出しより前面）。子シーンは `waitForTapOrTimeout` を await する。
@MainActor
final class SurvivalTutorialTapAdvanceHub: ObservableObject {
    @Published private(set) var isWaiting = false

    private var advanceHandler: (() -> Void)?
    private var timeoutTask: Task<Void, Never>?

    func userTappedAdvance() {
        advanceHandler?()
    }

    func cancelWait() {
        timeoutTask?.cancel()
        timeoutTask = nil
        let handler = advanceHandler
        advanceHandler = nil
        isWaiting = false
        handler?()
    }

    /// 固定秒またはタップのどちらか先で完了（Web `waitForTapOrTimeout` 相当）。
    func waitForTapOrTimeout(seconds: Double) async {
        if seconds <= 0 {
            return
        }

        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            isWaiting = true
            var settled = false

            let settle: () -> Void = {
                guard !settled else { return }
                settled = true
                self.timeoutTask?.cancel()
                self.timeoutTask = nil
                self.advanceHandler = nil
                self.isWaiting = false
                cont.resume()
            }

            advanceHandler = settle

            timeoutTask = Task { @MainActor in
                let ns = UInt64(seconds * 1_000_000_000)
                try? await Task.sleep(nanoseconds: ns)
                guard !Task.isCancelled else { return }
                settle()
            }
        }
    }
}

/// 右下 ▶ 点滅（Web `TutorialTapAdvanceCue` 相当）。
struct SurvivalTutorialTapAdvanceCue: View {
    let onTap: () -> Void
    @State private var pulse = false

    var body: some View {
        Button(action: onTap) {
            Text("▶︎")
                .font(.title3.weight(.bold))
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(Color.black.opacity(0.55))
                .overlay(
                    Circle()
                        .stroke(Color.white.opacity(0.3), lineWidth: 1)
                )
                .clipShape(Circle())
        }
        .buttonStyle(.plain)
        .opacity(pulse ? 1 : 0.4)
        .animation(.easeInOut(duration: 0.65).repeatForever(autoreverses: true), value: pulse)
        .onAppear { pulse = true }
        .accessibilityLabel("次へ")
    }
}
