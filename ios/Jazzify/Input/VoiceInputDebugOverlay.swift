import SwiftUI

#if DEBUG
struct VoiceInputDebugOverlay: View {
    let detail: String?
    let enabled: Bool

    var body: some View {
        Group {
            if enabled, let detail, !detail.isEmpty {
                Text(detail)
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(Color(red: 1, green: 0.92, blue: 0.75))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.orange.opacity(0.4), lineWidth: 1)
                    )
                    .frame(maxWidth: 320, alignment: .leading)
            }
        }
    }
}
#endif
