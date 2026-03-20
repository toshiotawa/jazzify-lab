import Foundation
import StoreKit

@MainActor
final class StoreManager: ObservableObject {
    static let shared = StoreManager()

    @Published var product: Product?
    @Published var purchaseState: PurchaseState = .idle
    @Published var isSubscribed = false
    @Published var currentSubscription: Transaction?
    /// Apple ID には有効な購読があるが、`appAccountToken` がログイン中の会員と一致しない
    @Published var subscriptionBelongsToOtherAccount = false

    private var transactionListener: Task<Void, Error>?
    private var currentUserId: UUID?

    private init() {}

    /// ログイン中の Supabase ユーザー ID（購入・エンタイトルメント照合に使用）
    func setCurrentUserId(_ id: UUID?) {
        currentUserId = id
        if id == nil {
            subscriptionBelongsToOtherAccount = false
            isSubscribed = false
            currentSubscription = nil
        }
    }

    func loadProduct() async {
        do {
            let products = try await Product.products(for: [Config.iapProductID])
            self.product = products.first
        } catch {
            self.product = nil
        }
    }

    func listenForTransactions() async {
        transactionListener?.cancel()
        transactionListener = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                await self.handleTransactionResult(result)
            }
        }

        await checkCurrentEntitlements()
    }

    func purchase() async throws {
        guard let product else {
            throw StoreError.productNotAvailable
        }
        guard let userId = currentUserId else {
            throw StoreError.notSignedIn
        }

        purchaseState = .purchasing

        do {
            let result = try await product.purchase(options: [.appAccountToken(userId)])

            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await transaction.finish()
                await handleSuccessfulPurchase(transaction)
                purchaseState = .purchased

            case .userCancelled:
                purchaseState = .idle

            case .pending:
                purchaseState = .pending

            @unknown default:
                purchaseState = .idle
            }
        } catch {
            purchaseState = .failed(error.localizedDescription)
            throw error
        }
    }

    func restorePurchases() async {
        purchaseState = .restoring
        do {
            try await AppStore.sync()
            await checkCurrentEntitlements()
            purchaseState = isSubscribed ? .purchased : .idle
        } catch {
            purchaseState = .failed(error.localizedDescription)
        }
    }

    private func checkCurrentEntitlements() async {
        var foundActive = false
        var mismatch = false
        var matchedTransaction: Transaction?

        for await result in Transaction.currentEntitlements {
            if let transaction = try? checkVerified(result) {
                guard transaction.productID == Config.iapProductID else { continue }
                switch entitlementAlignment(for: transaction) {
                case .matches:
                    foundActive = true
                    matchedTransaction = transaction
                case .wrongAccount:
                    mismatch = true
                case .notForThisProduct:
                    break
                }
            }
        }

        subscriptionBelongsToOtherAccount = mismatch
        isSubscribed = foundActive
        currentSubscription = matchedTransaction
    }

    private enum EntitlementAlignment {
        case matches
        case wrongAccount
        case notForThisProduct
    }

    private func entitlementAlignment(for transaction: Transaction) -> EntitlementAlignment {
        guard transaction.productID == Config.iapProductID else {
            return .notForThisProduct
        }
        guard let uid = currentUserId else {
            return .notForThisProduct
        }
        if let token = transaction.appAccountToken {
            if token != uid {
                return .wrongAccount
            }
            return .matches
        }
        // トークンなし（移行前の取引など）はエンタイトルメントは信頼し、サーバー同期で整合を取る
        return .matches
    }

    private func handleTransactionResult(_ result: VerificationResult<Transaction>) async {
        guard let transaction = try? checkVerified(result) else { return }
        await transaction.finish()

        if transaction.productID == Config.iapProductID {
            if transaction.revocationDate != nil {
                isSubscribed = false
                currentSubscription = nil
                subscriptionBelongsToOtherAccount = false
            } else {
                switch entitlementAlignment(for: transaction) {
                case .matches:
                    isSubscribed = true
                    currentSubscription = transaction
                    subscriptionBelongsToOtherAccount = false
                case .wrongAccount:
                    isSubscribed = false
                    currentSubscription = nil
                    subscriptionBelongsToOtherAccount = true
                case .notForThisProduct:
                    break
                }
            }
        }

        if transaction.revocationDate == nil,
           entitlementAlignment(for: transaction) == .matches {
            await syncWithServer(transaction)
        }
    }

    private func handleSuccessfulPurchase(_ transaction: Transaction) async {
        isSubscribed = true
        currentSubscription = transaction
        subscriptionBelongsToOtherAccount = false
        await syncWithServer(transaction)
    }

    private func syncWithServer(_ transaction: Transaction) async {
        do {
            let token = try await SupabaseService.shared.accessToken()
            guard let userId = currentUserId else { return }
            let url = Config.supabaseURL
                .appendingPathComponent("functions")
                .appendingPathComponent("v1")
                .appendingPathComponent("apple-webhook")

            struct SyncPayload: Encodable {
                let transactionId: String
                let productId: String
                let originalTransactionId: String
                let appAccountToken: String
                let action: String
            }

            let payload = SyncPayload(
                transactionId: String(transaction.id),
                productId: transaction.productID,
                originalTransactionId: String(transaction.originalID),
                appAccountToken: userId.uuidString.lowercased(),
                action: "client_sync"
            )

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(payload)

            _ = try await URLSession.shared.data(for: request)
        } catch {
            // server sync failure is non-fatal
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.verificationFailed
        case .verified(let value):
            return value
        }
    }

    deinit {
        transactionListener?.cancel()
    }
}

enum PurchaseState: Equatable {
    case idle
    case purchasing
    case restoring
    case pending
    case purchased
    case failed(String)
}

enum StoreError: LocalizedError {
    case productNotAvailable
    case verificationFailed
    case notSignedIn

    var errorDescription: String? {
        switch self {
        case .productNotAvailable:
            return "Product is not available"
        case .verificationFailed:
            return "Transaction verification failed"
        case .notSignedIn:
            return "Not signed in"
        }
    }
}
