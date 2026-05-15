import SwiftUI
import UIKit

fileprivate final class PendingScrollUIScrollView: UIScrollView {
    var pendingTargetY: CGFloat?
    var pendingAnimated = false
    var onApplied: (() -> Void)?
    /// `true` のとき、子ビュー（SwiftUI `Button` など）に既にタッチが渡っていても
    /// パン開始でキャンセルする。Specific Courses と同じ挙動を再現するために使う。
    var alwaysCancelContentTouches = false

    override func layoutSubviews() {
        super.layoutSubviews()
        applyPendingIfReady()
    }

    override func touchesShouldCancel(in view: UIView) -> Bool {
        if alwaysCancelContentTouches { return true }
        return super.touchesShouldCancel(in: view)
    }

    func applyPendingIfReady() {
        guard let targetY = pendingTargetY else { return }
        let viewport = bounds.height
        let contentH = contentSize.height
        guard viewport > 0, contentH > 0 else { return }
        let rawOffset = targetY - viewport / 2
        let maxOffset = max(0, contentH - viewport)
        let clamped = max(0, min(maxOffset, rawOffset))
        setContentOffset(CGPoint(x: 0, y: clamped), animated: pendingAnimated)
        pendingTargetY = nil
        let cb = onApplied
        onApplied = nil
        cb?()
    }
}

struct UIKitVerticalViewport: Equatable {
    var offsetY: CGFloat = 0
    var height: CGFloat = 0

    static let zero = UIKitVerticalViewport()
}

/// SwiftUI の `ScrollView` では `.position()` 配置のコンテンツに対して
/// `ScrollViewReader.scrollTo(id:anchor:)` が狙った位置にスクロールしないことがあるため、
/// UIKit の `UIScrollView` を `UIViewRepresentable` でラップして
/// `contentOffset` を ピクセル単位で直接制御できるようにする。
///
/// - `contentSize`: SwiftUI 側で算出したコンテンツサイズ (点)
/// - `scrollTargetY`: 指定すると「y が viewport 中央に来る」ようにスクロールする。
///   スクロール完了後は `nil` にリセットされる。
/// - `viewport`: 現在の可視領域（重いマップの culling 用）
/// - `animated`: スクロール時にスプリングアニメーションを行うか。
/// - `delaysContentTouches`: `true` のとき子ビュー（例: SwiftUI `Button`）のタッチを短時間遅延し、
///   スクロールパンと誤タップを区別しやすくする。さらに、押下後のドラッグでも子のタップを
///   キャンセルする（`touchesShouldCancel(in:)` を常に許可）。マップ等の即応タップが必要な箇所は
///   `false`（デフォルト）。
struct UIKitVerticalScrollView<Content: View>: UIViewRepresentable {
    let contentSize: CGSize
    @Binding var scrollTargetY: CGFloat?
    @Binding var viewport: UIKitVerticalViewport
    let animated: Bool
    let delaysContentTouches: Bool
    let content: Content

    init(
        contentSize: CGSize,
        scrollTargetY: Binding<CGFloat?>,
        viewport: Binding<UIKitVerticalViewport> = .constant(.zero),
        animated: Bool,
        delaysContentTouches: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.contentSize = contentSize
        self._scrollTargetY = scrollTargetY
        self._viewport = viewport
        self.animated = animated
        self.delaysContentTouches = delaysContentTouches
        self.content = content()
    }

    final class Coordinator: NSObject, UIScrollViewDelegate {
        var host: UIHostingController<Content>?
        var widthConstraint: NSLayoutConstraint?
        var heightConstraint: NSLayoutConstraint?

        var scrollTargetYBinding: Binding<CGFloat?>
        var viewportBinding: Binding<UIKitVerticalViewport>

        private var lastPublishedViewport: UIKitVerticalViewport = .zero
        /// 1px 単位で publish すると SwiftUI 再評価が多すぎるので粗く丸める
        private let viewportStep: CGFloat = 160

        init(
            scrollTargetY: Binding<CGFloat?>,
            viewport: Binding<UIKitVerticalViewport>
        ) {
            self.scrollTargetYBinding = scrollTargetY
            self.viewportBinding = viewport
        }

        func scrollViewDidScroll(_ scrollView: UIScrollView) {
            publishViewportIfNeeded(from: scrollView)
        }

        func publishViewportIfNeeded(from scrollView: UIScrollView) {
            let viewportHeight = max(0, scrollView.bounds.height)
            guard viewportHeight > 0 else { return }

            let rawOffsetY = max(0, scrollView.contentOffset.y)
            let snappedOffsetY = floor(rawOffsetY / viewportStep) * viewportStep
            let snappedHeight = ceil(viewportHeight / viewportStep) * viewportStep

            let next = UIKitVerticalViewport(
                offsetY: snappedOffsetY,
                height: snappedHeight
            )
            guard next != lastPublishedViewport else { return }
            lastPublishedViewport = next

            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                if self.viewportBinding.wrappedValue != next {
                    self.viewportBinding.wrappedValue = next
                }
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(scrollTargetY: $scrollTargetY, viewport: $viewport)
    }

    func makeUIView(context: Context) -> UIScrollView {
        let scrollView = PendingScrollUIScrollView()
        scrollView.backgroundColor = .clear
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.alwaysBounceVertical = true
        scrollView.bounces = true
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.delaysContentTouches = delaysContentTouches
        scrollView.canCancelContentTouches = true
        scrollView.alwaysCancelContentTouches = delaysContentTouches
        scrollView.delegate = context.coordinator

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
        context.coordinator.scrollTargetYBinding = $scrollTargetY
        context.coordinator.viewportBinding = $viewport
        context.coordinator.host?.rootView = content

        let newWidth = max(1, contentSize.width)
        let newHeight = max(1, contentSize.height)
        if context.coordinator.widthConstraint?.constant != newWidth {
            context.coordinator.widthConstraint?.constant = newWidth
        }
        if context.coordinator.heightConstraint?.constant != newHeight {
            context.coordinator.heightConstraint?.constant = newHeight
        }

        context.coordinator.publishViewportIfNeeded(from: uiView)

        uiView.delaysContentTouches = delaysContentTouches

        guard let targeted = uiView as? PendingScrollUIScrollView else { return }

        targeted.alwaysCancelContentTouches = delaysContentTouches

        if let targetY = scrollTargetY {
            targeted.pendingTargetY = targetY
            targeted.pendingAnimated = animated
            targeted.onApplied = { [weak coordinator = context.coordinator] in
                // SwiftUI の view update / layout サイクル中に Binding を書き戻すと
                // "Modifying state during view update" 警告になるので必ず次の runloop に逃がす。
                DispatchQueue.main.async {
                    guard let coordinator else { return }
                    if coordinator.scrollTargetYBinding.wrappedValue != nil {
                        coordinator.scrollTargetYBinding.wrappedValue = nil
                    }
                }
            }
            targeted.layoutIfNeeded()
            targeted.applyPendingIfReady()
            DispatchQueue.main.async {
                targeted.applyPendingIfReady()
                context.coordinator.publishViewportIfNeeded(from: targeted)
            }
        }
    }
}
