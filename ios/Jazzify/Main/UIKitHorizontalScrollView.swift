import SwiftUI
import UIKit

fileprivate final class PendingHorizontalScrollUIScrollView: UIScrollView {
    var pendingTargetX: CGFloat?
    var pendingAnimated = false
    var onApplied: (() -> Void)?

    override func layoutSubviews() {
        super.layoutSubviews()
        applyPendingIfReady()
    }

    func applyPendingIfReady() {
        guard let targetX = pendingTargetX else { return }
        let viewport = bounds.width
        let contentW = contentSize.width
        guard viewport > 0, contentW > 0 else { return }
        let maxOffset = max(0, contentW - viewport)
        let clamped = max(0, min(maxOffset, targetX))
        setContentOffset(CGPoint(x: clamped, y: 0), animated: pendingAnimated)
        pendingTargetX = nil
        let cb = onApplied
        onApplied = nil
        cb?()
    }
}

/// ピアノ鍵盤用の横 `UIScrollView`。`isUserScrollingEnabled == false` で鍵盤上のパンを無効化し、
/// スクロールバーまたは `scrollTargetX` から `contentOffset` を制御する。
struct UIKitHorizontalScrollView<Content: View>: UIViewRepresentable {
    let contentSize: CGSize
    @Binding var scrollOffsetX: CGFloat
    @Binding var scrollTargetX: CGFloat?
    let isUserScrollingEnabled: Bool
    let delaysContentTouches: Bool
    let contentToken: AnyHashable?
    let content: Content

    init(
        contentSize: CGSize,
        scrollOffsetX: Binding<CGFloat>,
        scrollTargetX: Binding<CGFloat?>,
        isUserScrollingEnabled: Bool = false,
        delaysContentTouches: Bool = true,
        contentToken: AnyHashable? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.contentSize = contentSize
        self._scrollOffsetX = scrollOffsetX
        self._scrollTargetX = scrollTargetX
        self.isUserScrollingEnabled = isUserScrollingEnabled
        self.delaysContentTouches = delaysContentTouches
        self.contentToken = contentToken
        self.content = content()
    }

    final class Coordinator: NSObject, UIScrollViewDelegate {
        var host: UIHostingController<Content>?
        var widthConstraint: NSLayoutConstraint?
        var heightConstraint: NSLayoutConstraint?

        var scrollOffsetXBinding: Binding<CGFloat>
        var scrollTargetXBinding: Binding<CGFloat?>
        var lastContentToken: AnyHashable?
        private var isApplyingProgrammaticOffset = false

        init(scrollOffsetX: Binding<CGFloat>, scrollTargetX: Binding<CGFloat?>) {
            self.scrollOffsetXBinding = scrollOffsetX
            self.scrollTargetXBinding = scrollTargetX
        }

        func scrollViewDidScroll(_ scrollView: UIScrollView) {
            guard !isApplyingProgrammaticOffset else { return }
            let next = max(0, scrollView.contentOffset.x)
            if scrollOffsetXBinding.wrappedValue != next {
                DispatchQueue.main.async { [weak self] in
                    guard let self else { return }
                    if self.scrollOffsetXBinding.wrappedValue != next {
                        self.scrollOffsetXBinding.wrappedValue = next
                    }
                }
            }
        }

        func applyOffset(_ x: CGFloat, to scrollView: UIScrollView, animated: Bool) {
            let viewport = scrollView.bounds.width
            let contentW = scrollView.contentSize.width
            let maxOffset = max(0, contentW - viewport)
            let clamped = max(0, min(maxOffset, x))
            isApplyingProgrammaticOffset = true
            scrollView.setContentOffset(CGPoint(x: clamped, y: 0), animated: animated)
            isApplyingProgrammaticOffset = false
            if scrollOffsetXBinding.wrappedValue != clamped {
                scrollOffsetXBinding.wrappedValue = clamped
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(scrollOffsetX: $scrollOffsetX, scrollTargetX: $scrollTargetX)
    }

    func makeUIView(context: Context) -> UIScrollView {
        let scrollView = PendingHorizontalScrollUIScrollView()
        scrollView.backgroundColor = .clear
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.alwaysBounceHorizontal = false
        scrollView.alwaysBounceVertical = false
        scrollView.bounces = false
        scrollView.isScrollEnabled = isUserScrollingEnabled
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.delaysContentTouches = delaysContentTouches
        scrollView.canCancelContentTouches = true
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
        context.coordinator.scrollOffsetXBinding = $scrollOffsetX
        context.coordinator.scrollTargetXBinding = $scrollTargetX

        let shouldUpdateRootView: Bool
        if let contentToken {
            shouldUpdateRootView = context.coordinator.lastContentToken != contentToken
            if shouldUpdateRootView {
                context.coordinator.lastContentToken = contentToken
            }
        } else {
            shouldUpdateRootView = true
        }
        if shouldUpdateRootView {
            context.coordinator.host?.rootView = content
        }

        let newWidth = max(1, contentSize.width)
        let newHeight = max(1, contentSize.height)
        if context.coordinator.widthConstraint?.constant != newWidth {
            context.coordinator.widthConstraint?.constant = newWidth
        }
        if context.coordinator.heightConstraint?.constant != newHeight {
            context.coordinator.heightConstraint?.constant = newHeight
        }

        uiView.isScrollEnabled = isUserScrollingEnabled
        uiView.delaysContentTouches = delaysContentTouches

        let currentOffset = max(0, scrollOffsetX)
        if abs(uiView.contentOffset.x - currentOffset) > 0.5 {
            context.coordinator.applyOffset(currentOffset, to: uiView, animated: false)
        }

        guard let targeted = uiView as? PendingHorizontalScrollUIScrollView else { return }

        if let targetX = scrollTargetX {
            targeted.pendingTargetX = targetX
            targeted.pendingAnimated = false
            targeted.onApplied = { [weak coordinator = context.coordinator] in
                DispatchQueue.main.async {
                    guard let coordinator else { return }
                    if coordinator.scrollTargetXBinding.wrappedValue != nil {
                        coordinator.scrollTargetXBinding.wrappedValue = nil
                    }
                }
            }
            targeted.layoutIfNeeded()
            targeted.applyPendingIfReady()
            DispatchQueue.main.async {
                targeted.applyPendingIfReady()
                let coordinator = context.coordinator
                let applied = max(0, targeted.contentOffset.x)
                if coordinator.scrollOffsetXBinding.wrappedValue != applied {
                    coordinator.scrollOffsetXBinding.wrappedValue = applied
                }
            }
        }
    }
}
