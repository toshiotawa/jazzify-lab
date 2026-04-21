import SwiftUI
import UIKit

/// SwiftUI の `ScrollView` では `.position()` 配置のコンテンツに対して
/// `ScrollViewReader.scrollTo(id:anchor:)` が狙った位置にスクロールしないことがあるため、
/// UIKit の `UIScrollView` を `UIViewRepresentable` でラップして
/// `contentOffset` を ピクセル単位で直接制御できるようにする。
///
/// - `contentSize`: SwiftUI 側で算出したコンテンツサイズ (点)
/// - `scrollTargetY`: 指定すると「y が viewport 中央に来る」ようにスクロールする。
///   スクロール完了後は `nil` にリセットされる。
/// - `animated`: スクロール時にスプリングアニメーションを行うか。
struct UIKitVerticalScrollView<Content: View>: UIViewRepresentable {
    let contentSize: CGSize
    @Binding var scrollTargetY: CGFloat?
    let animated: Bool
    let content: Content

    init(
        contentSize: CGSize,
        scrollTargetY: Binding<CGFloat?>,
        animated: Bool,
        @ViewBuilder content: () -> Content
    ) {
        self.contentSize = contentSize
        self._scrollTargetY = scrollTargetY
        self.animated = animated
        self.content = content()
    }

    final class Coordinator {
        var host: UIHostingController<Content>?
        var widthConstraint: NSLayoutConstraint?
        var heightConstraint: NSLayoutConstraint?
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> UIScrollView {
        let scrollView = UIScrollView()
        scrollView.backgroundColor = .clear
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.alwaysBounceVertical = true
        scrollView.bounces = true
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.delaysContentTouches = false

        let host = UIHostingController(rootView: content)
        host.view.backgroundColor = .clear
        host.view.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(host.view)

        let widthConstraint = host.view.widthAnchor.constraint(equalToConstant: max(1, contentSize.width))
        let heightConstraint = host.view.heightAnchor.constraint(equalToConstant: max(1, contentSize.height))

        NSLayoutConstraint.activate([
            host.view.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            host.view.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
            host.view.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
            widthConstraint,
            heightConstraint,
        ])

        context.coordinator.host = host
        context.coordinator.widthConstraint = widthConstraint
        context.coordinator.heightConstraint = heightConstraint

        return scrollView
    }

    func updateUIView(_ uiView: UIScrollView, context: Context) {
        context.coordinator.host?.rootView = content

        let newWidth = max(1, contentSize.width)
        let newHeight = max(1, contentSize.height)
        if context.coordinator.widthConstraint?.constant != newWidth {
            context.coordinator.widthConstraint?.constant = newWidth
        }
        if context.coordinator.heightConstraint?.constant != newHeight {
            context.coordinator.heightConstraint?.constant = newHeight
        }

        if let targetY = scrollTargetY {
            // UIScrollView の layout 確定を待ってから contentOffset を設定する。
            let animated = self.animated
            let apply: (UIScrollView) -> Void = { sv in
                let viewport = sv.bounds.height
                guard viewport > 0 else { return }
                let contentH = sv.contentSize.height
                let rawOffset = targetY - viewport / 2
                let maxOffset = max(0, contentH - viewport)
                let clamped = max(0, min(maxOffset, rawOffset))
                sv.setContentOffset(CGPoint(x: 0, y: clamped), animated: animated)
            }
            DispatchQueue.main.async {
                apply(uiView)
                // レイアウト未確定のケースに対するフォールバック
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    apply(uiView)
                }
                scrollTargetY = nil
            }
        }
    }
}
