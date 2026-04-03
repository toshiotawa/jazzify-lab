import SwiftUI

enum PaymentIssueBannerKind {
    case lemonWithAccess
    case appleNoAccess
}

struct PaymentIssueBannerView: View {
    let kind: PaymentIssueBannerKind
    let locale: AppLocale

    private var message: String {
        switch (kind, locale) {
        case (.lemonWithAccess, .ja):
            return "お支払いに問題があります。現在は利用できます。支払い情報を更新してください。"
        case (.lemonWithAccess, .en):
            return "There is an issue with your payment. You still have access. Please update your payment information."
        case (.appleNoAccess, .ja):
            return "お支払いに問題があります。現在ご利用を停止しています。支払い情報を更新してください。"
        case (.appleNoAccess, .en):
            return "There is an issue with your payment. Your access is currently paused. Please update your payment information."
        }
    }

    private var style: (border: Color, bg: Color, icon: Color) {
        switch kind {
        case .lemonWithAccess:
            return (.orange.opacity(0.55), .orange.opacity(0.12), .orange)
        case .appleNoAccess:
            return (.red.opacity(0.55), .red.opacity(0.12), .red)
        }
    }

    var body: some View {
        let s = style
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(s.icon)
                .font(.body)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(s.bg)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(s.border, lineWidth: 1)
        )
        .cornerRadius(10)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(message)
    }
}
