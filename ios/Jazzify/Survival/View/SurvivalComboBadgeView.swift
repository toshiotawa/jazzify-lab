import SwiftUI

/// 鍵盤付近に重ねる A/B コンボ数表示（途切れで非表示）。
struct SurvivalComboBadgeView: View, Equatable {
    let comboCount: Int

    var body: some View {
        if comboCount > 0 {
            HStack(spacing: 4) {
                Text("COMBO")
                    .font(.caption.bold())
                    .foregroundStyle(.white.opacity(0.85))
                Text("\(comboCount)")
                    .font(.title2.bold())
                    .foregroundStyle(.yellow)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.black.opacity(0.55), in: Capsule())
            .overlay(
                Capsule()
                    .stroke(.yellow.opacity(0.6), lineWidth: 1)
            )
        }
    }
}
