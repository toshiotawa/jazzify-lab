import Foundation

enum AnalyticsTracker {
    private static let session = URLSession.shared

    static func trackFirstOpenIfNeeded() {
        guard AnalyticsClientID.consumeFirstOpenIfNeeded() else { return }
        sendGa4Event(name: "first_open", params: ["platform": "ios"])
    }

    static func trackSignUpClick() {
        sendGa4Event(name: "sign_up_click", params: ["method": "email_otp", "platform": "ios"])
    }

    static func trackSignUp() {
        sendGa4Event(name: "sign_up", params: ["method": "email_otp", "platform": "ios"])
    }

    static func trackTutorialBegin(userId: UUID, tutorialName: String) {
        sendGa4Event(name: "tutorial_begin", params: [
            "tutorial_name": tutorialName,
            "platform": "ios",
        ])
        recordMilestone(userId: userId, milestone: "first_play")
    }

    static func trackTutorialComplete(userId: UUID, tutorialName: String) {
        sendGa4Event(name: "tutorial_complete", params: [
            "tutorial_name": tutorialName,
            "platform": "ios",
        ])
        recordMilestone(userId: userId, milestone: "first_success")
    }

    static func trackPaywallView(userId: UUID, source: String) {
        sendGa4Event(name: "paywall_view", params: [
            "source": source,
            "platform": "ios",
        ])
        recordMilestone(userId: userId, milestone: "free_tier_wall_view", source: source)
    }

    static func trackBeginCheckout(userId: UUID) {
        sendGa4Event(name: "begin_checkout", params: ["platform": "ios"])
        recordMilestone(userId: userId, milestone: "checkout_click")
    }

    static func trackPurchase(
        userId: UUID,
        transactionId: String,
        value: Double,
        currency: String
    ) {
        sendGa4Event(name: "purchase", params: [
            "transaction_id": transactionId,
            "value": value,
            "currency": currency,
            "platform": "ios",
        ])
        recordMilestone(userId: userId, milestone: "paid")
    }

    @MainActor
    static func trackAssignmentStart(
        userId: UUID,
        lessonId: UUID,
        lessonSongId: UUID,
        isPractice: Bool
    ) {
        let inputSnapshot = AssignmentInputSnapshot.current()
        sendGa4Event(name: "assignment_start", params: [
            "lesson_id": lessonId.uuidString,
            "lesson_song_id": lessonSongId.uuidString,
            "platform": "ios",
            "is_practice": isPractice,
            "input_method": inputSnapshot.inputMethod,
            "midi_api_available": inputSnapshot.midiApiAvailable,
            "midi_device_count": inputSnapshot.midiDeviceCount,
            "midi_connected": inputSnapshot.midiConnected,
        ])
        Task {
            try? await SupabaseService.shared.recordAssignmentStart(
                userId: userId,
                lessonId: lessonId,
                lessonSongId: lessonSongId,
                isPractice: isPractice,
                inputSnapshot: inputSnapshot
            )
        }
    }

    private static func sendGa4Event(name: String, params: [String: Any] = [:]) {
        let url = Config.iosAnalyticsEventURL
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        var payload: [String: Any] = [
            "client_id": AnalyticsClientID.current(),
            "event_name": name,
        ]
        if !params.isEmpty {
            payload["params"] = params
        }

        guard let body = try? JSONSerialization.data(withJSONObject: payload) else {
            return
        }
        request.httpBody = body

        Task {
            _ = try? await session.data(for: request)
        }
    }

    private static func recordMilestone(userId: UUID, milestone: String, source: String? = nil) {
        Task {
            try? await SupabaseService.shared.recordUserMilestone(
                userId: userId,
                milestone: milestone,
                source: source
            )
        }
    }
}
