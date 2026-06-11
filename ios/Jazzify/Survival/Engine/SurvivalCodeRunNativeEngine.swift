import Combine
import CoreGraphics
import Foundation
import QuartzCore
import SwiftUI
import UIKit

enum SurvivalCodeRunNativeTileKind: String, Sendable {
    case ground
    case brick
    case platform
    case block
}

struct SurvivalCodeRunNativeSolid: Sendable {
    let kind: SurvivalCodeRunNativeTileKind
    let rect: CGRect
}

struct SurvivalCodeRunNativeEnemy: Identifiable, Equatable {
    let id: String
    var rect: CGRect
    var vx: CGFloat
    let minX: CGFloat
    let maxX: CGFloat
    var alive: Bool = true
    var anim: CGFloat = 0
}

enum SurvivalCodeRunEnemyContactOutcome: Equatable {
    case none
    case stomped(enemies: [SurvivalCodeRunNativeEnemy])
    case damaged(sourceCenterX: CGFloat)
}

enum SurvivalCodeRunNativeEngine {
    static func rectsOverlap(_ a: CGRect, _ b: CGRect) -> Bool {
        a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
    }

    static func solidCollisions(rect: CGRect, solids: [SurvivalCodeRunNativeSolid]) -> [SurvivalCodeRunNativeSolid] {
        solids.filter { rectsOverlap(rect, $0.rect) }
    }

    static func moveEnemies(
        enemies: [SurvivalCodeRunNativeEnemy],
        solids: [SurvivalCodeRunNativeSolid],
        step: CGFloat
    ) -> [SurvivalCodeRunNativeEnemy] {
        enemies.map { enemy in
            guard enemy.alive else { return enemy }
            var next = enemy
            var vx = next.vx
            var x = next.rect.origin.x + vx * step
            if x < next.minX || x + next.rect.width > next.maxX {
                vx *= -1
                x = max(next.minX, min(next.maxX - next.rect.width, x))
            }
            var probe = next.rect
            probe.origin.x = x
            if !solidCollisions(rect: probe, solids: solids).isEmpty {
                vx *= -1
                x = next.rect.origin.x + vx * step
            }
            next.rect.origin.x = x
            next.vx = vx
            next.anim += 0.15 * step
            return next
        }
    }

    static func resolveEnemyContact(
        enemies: [SurvivalCodeRunNativeEnemy],
        playerRect: CGRect,
        playerVy: CGFloat,
        step: CGFloat
    ) -> SurvivalCodeRunEnemyContactOutcome {
        for (index, enemy) in enemies.enumerated() where enemy.alive && rectsOverlap(playerRect, enemy.rect) {
            let bottomBefore = playerRect.maxY - playerVy * step
            if playerVy > 0 && bottomBefore <= enemy.rect.minY + 12 {
                var next = enemies
                next[index].alive = false
                return .stomped(enemies: next)
            }
            return .damaged(sourceCenterX: enemy.rect.midX)
        }
        return .none
    }
}

@MainActor
final class SurvivalCodeRunFrameClock: ObservableObject {
    let publisher = PassthroughSubject<TimeInterval, Never>()
}

final class SurvivalCodeRunDisplayLinkTicker: NSObject {
    weak var frameClock: SurvivalCodeRunFrameClock?

    private var link: CADisplayLink?
    private var lastTimestamp: TimeInterval = 0
    private var activeObserver: NSObjectProtocol?

    func start(frameClock: SurvivalCodeRunFrameClock) {
        self.frameClock = frameClock
        stop()
        lastTimestamp = 0
        let displayLink = CADisplayLink(target: self, selector: #selector(step(_:)))
        displayLink.preferredFrameRateRange = CAFrameRateRange(minimum: 30, maximum: 60, preferred: 60)
        displayLink.add(to: .main, forMode: .common)
        link = displayLink
        activeObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.resumeIfNeeded()
            }
        }
    }

    func stop() {
        link?.invalidate()
        link = nil
        lastTimestamp = 0
        frameClock = nil
        if let observer = activeObserver {
            NotificationCenter.default.removeObserver(observer)
        }
        activeObserver = nil
    }

    @MainActor
    private func resumeIfNeeded() {
        guard let frameClock, link == nil else { return }
        start(frameClock: frameClock)
    }

    @objc private func step(_ link: CADisplayLink) {
        let now = link.timestamp
        let dt = lastTimestamp > 0 ? now - lastTimestamp : 0
        lastTimestamp = now
        let clock = frameClock
        Task { @MainActor in
            clock?.publisher.send(dt)
        }
    }
}

final class SurvivalCodeRunDisplayLinkHolder {
    let ticker = SurvivalCodeRunDisplayLinkTicker()

    func stop() {
        ticker.stop()
    }
}

struct SurvivalCodeRunDisplayLinkDriver: UIViewRepresentable {
    let frameClock: SurvivalCodeRunFrameClock

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.isUserInteractionEnabled = false
        view.isHidden = true
        context.coordinator.attach(frameClock: frameClock)
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        context.coordinator.attach(frameClock: frameClock)
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        coordinator.detach()
    }

    final class Coordinator {
        private let holder = SurvivalCodeRunDisplayLinkHolder()
        private var isRunning = false

        func attach(frameClock: SurvivalCodeRunFrameClock) {
            holder.ticker.frameClock = frameClock
            guard !isRunning else { return }
            isRunning = true
            holder.ticker.start(frameClock: frameClock)
        }

        func detach() {
            isRunning = false
            holder.stop()
        }
    }
}
