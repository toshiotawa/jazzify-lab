import Foundation

/// `NWListener.stateUpdateHandler` から `CheckedContinuation` への二重 resume を防ぐ。
final class ListenerResumeGuard: @unchecked Sendable {
    private let lock = NSLock()
    private var resumed = false

    func tryResumeSuccess() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        guard !resumed else { return false }
        resumed = true
        return true
    }

    func tryResumeFailure() -> Bool {
        tryResumeSuccess()
    }
}