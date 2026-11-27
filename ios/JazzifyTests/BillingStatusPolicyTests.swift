import XCTest
@testable import Jazzify

final class BillingStatusPolicyTests: XCTestCase {
    func testDecodesStripeBillingStatusWithCoachingAndFractionalIso8601Dates() throws {
        let json = """
        {
          "provider": "stripe",
          "status": "active",
          "entitlement_state": "active",
          "plan_code": "core_yearly",
          "trial_used": true,
          "current_period_ends_at": "2027-01-15T12:34:56.789123+00:00",
          "coaching_subscription": {
            "provider": "stripe",
            "status": "canceled",
            "entitlement_state": "cancelled_but_active_until_end",
            "current_period_ends_at": "2027-01-10T00:00:00Z",
            "pending_cancel_effective_at": "2027-01-10T00:00:00.000Z"
          }
        }
        """

        let decoded = try BillingService.decodeBillingStatus(from: Data(json.utf8))

        XCTAssertEqual(decoded.provider, .stripe)
        XCTAssertEqual(decoded.status, .active)
        XCTAssertEqual(decoded.entitlementState, .active)
        XCTAssertEqual(decoded.planCode, "core_yearly")
        XCTAssertTrue(decoded.trialUsed)
        XCTAssertNotNil(decoded.currentPeriodEndsAt)
        XCTAssertEqual(decoded.coachingSubscription?.provider, .stripe)
        XCTAssertEqual(decoded.coachingSubscription?.status, .canceled)
        XCTAssertEqual(decoded.coachingSubscription?.entitlementState, .cancelledButActiveUntilEnd)
        XCTAssertNotNil(decoded.coachingSubscription?.currentPeriodEndsAt)
        XCTAssertNotNil(decoded.coachingSubscription?.pendingCancelEffectiveAt)
    }

    func testDecodesUnknownProviderWithoutThrowingAndAllowsMissingCoachingField() throws {
        let json = """
        {
          "provider": "future_provider",
          "status": "expired",
          "entitlement_state": "expired",
          "plan_code": "unknown",
          "trial_used": false,
          "current_period_ends_at": null
        }
        """

        let decoded = try BillingService.decodeBillingStatus(from: Data(json.utf8))

        XCTAssertEqual(decoded.provider, .unknown)
        XCTAssertNil(decoded.coachingSubscription)
        XCTAssertTrue(decoded.canShowIAP)
        XCTAssertTrue(decoded.canDeleteAccount)
    }

    func testCanShowIAPBlocksActiveWebProvidersAndAllowsExpiredOrApple() {
        let activeStripe = makeBillingStatus(provider: .stripe, entitlementState: .active)
        let graceStripe = makeBillingStatus(provider: .stripe, entitlementState: .paymentIssueWithAccess)
        let cancelledUntilEndStripe = makeBillingStatus(provider: .stripe, entitlementState: .cancelledButActiveUntilEnd)
        let expiredStripe = makeBillingStatus(provider: .stripe, entitlementState: .expired)
        let stoppedStripe = makeBillingStatus(provider: .stripe, entitlementState: .paymentIssueNoAccess)
        let activeLemon = makeBillingStatus(provider: .lemon, entitlementState: .active)
        let activeApple = makeBillingStatus(provider: .apple, entitlementState: .active)
        let freeNone = makeBillingStatus(provider: .none, entitlementState: .expired)

        XCTAssertFalse(activeStripe.canShowIAP)
        XCTAssertFalse(graceStripe.canShowIAP)
        XCTAssertFalse(cancelledUntilEndStripe.canShowIAP)
        XCTAssertTrue(expiredStripe.canShowIAP)
        XCTAssertTrue(stoppedStripe.canShowIAP)
        XCTAssertFalse(activeLemon.canShowIAP)
        XCTAssertTrue(activeApple.canShowIAP)
        XCTAssertTrue(freeNone.canShowIAP)
    }

    func testCanDeleteAccountRequiresBothMainAndCoachingExpired() {
        let bothExpired = makeBillingStatus(
            provider: .stripe,
            entitlementState: .expired,
            coaching: CoachingBillingStatus(
                provider: .stripe,
                status: .expired,
                entitlementState: .expired,
                currentPeriodEndsAt: nil,
                pendingCancelEffectiveAt: nil
            )
        )
        let mainExpiredCoachingActive = makeBillingStatus(
            provider: .stripe,
            entitlementState: .expired,
            coaching: CoachingBillingStatus(
                provider: .stripe,
                status: .active,
                entitlementState: .active,
                currentPeriodEndsAt: nil,
                pendingCancelEffectiveAt: nil
            )
        )
        let mainExpiredCoachingCancelledUntilEnd = makeBillingStatus(
            provider: .none,
            entitlementState: .expired,
            coaching: CoachingBillingStatus(
                provider: .stripe,
                status: .canceled,
                entitlementState: .cancelledButActiveUntilEnd,
                currentPeriodEndsAt: nil,
                pendingCancelEffectiveAt: nil
            )
        )
        let mainActiveNoCoaching = makeBillingStatus(provider: .stripe, entitlementState: .active)
        let freeNoCoaching = makeBillingStatus(provider: .none, entitlementState: .expired)

        XCTAssertTrue(bothExpired.canDeleteAccount)
        XCTAssertFalse(mainExpiredCoachingActive.canDeleteAccount)
        XCTAssertFalse(mainExpiredCoachingCancelledUntilEnd.canDeleteAccount)
        XCTAssertFalse(mainActiveNoCoaching.canDeleteAccount)
        XCTAssertTrue(freeNoCoaching.canDeleteAccount)
    }

    func testPaymentIssueBannerKindCoversStripeLemonCoachingAndApple() {
        let stripeIssue = makeBillingStatus(provider: .stripe, entitlementState: .paymentIssueWithAccess)
        let lemonIssue = makeBillingStatus(provider: .lemon, entitlementState: .paymentIssueWithAccess)
        let appleIssue = makeBillingStatus(provider: .apple, entitlementState: .paymentIssueNoAccess)
        let coachingIssue = makeBillingStatus(
            provider: .stripe,
            entitlementState: .active,
            coaching: CoachingBillingStatus(
                provider: .stripe,
                status: .pastDue,
                entitlementState: .paymentIssueWithAccess,
                currentPeriodEndsAt: nil,
                pendingCancelEffectiveAt: nil
            )
        )
        let healthy = makeBillingStatus(provider: .stripe, entitlementState: .active)

        XCTAssertEqual(stripeIssue.paymentIssueBannerKind, .webWithAccess)
        XCTAssertEqual(lemonIssue.paymentIssueBannerKind, .webWithAccess)
        XCTAssertEqual(appleIssue.paymentIssueBannerKind, .appleNoAccess)
        XCTAssertEqual(coachingIssue.paymentIssueBannerKind, .webWithAccess)
        XCTAssertNil(healthy.paymentIssueBannerKind)
    }

    func testChapterCompleteTrialUsedSubtitleMatchesSelectedPeriod() {
        XCTAssertEqual(
            SubscriptionCopy.chapterCompleteTrialUsedSubtitle(locale: .ja, isYearly: false, displayPrice: "¥3,980"),
            "無料トライアルは利用済みです。購入時に月額¥3,980が請求されます。"
        )
        XCTAssertEqual(
            SubscriptionCopy.chapterCompleteTrialUsedSubtitle(locale: .ja, isYearly: true, displayPrice: "¥34,800"),
            "無料トライアルは利用済みです。購入時に年額¥34,800が請求されます。"
        )
        XCTAssertEqual(
            SubscriptionCopy.chapterCompleteTrialUsedSubtitle(locale: .en, isYearly: false, displayPrice: "$24.99"),
            "Your free trial has already been used. You will be charged $24.99/month at purchase."
        )
        XCTAssertEqual(
            SubscriptionCopy.chapterCompleteTrialUsedSubtitle(locale: .en, isYearly: true, displayPrice: "$199.00"),
            "Your free trial has already been used. You will be charged $199.00/year at purchase."
        )
    }

    private func makeBillingStatus(
        provider: BillingProvider,
        entitlementState: EntitlementState,
        coaching: CoachingBillingStatus? = nil
    ) -> BillingStatusResponse {
        BillingStatusResponse(
            provider: provider,
            status: entitlementState == .expired ? .expired : .active,
            entitlementState: entitlementState,
            planCode: "core_monthly",
            trialUsed: false,
            currentPeriodEndsAt: nil,
            coachingSubscription: coaching
        )
    }
}
