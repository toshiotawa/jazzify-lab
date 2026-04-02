import SwiftUI

struct OTPVerifyView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let email: String

    @State private var otpCode = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    /// 6 桁に達したときの自動検証が二重に走ると OTP は1回しか使えず 2 回目が「token invalid」になる
    @State private var didFireAutoVerifyForLengthSix = false
    @FocusState private var isCodeFocused: Bool

    private var locale: AppLocale { appState.locale }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "0f172a"), .black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                VStack(spacing: 12) {
                    Image(systemName: "envelope.badge")
                        .font(.system(size: 48))
                        .foregroundStyle(.purple)

                    Text(locale == .ja ? "認証コードを入力" : "Enter verification code")
                        .font(.title2.bold())
                        .foregroundStyle(.white)

                    Text(locale == .ja
                         ? "\(email) に送信された6桁のコードを入力してください"
                         : "Enter the 6-digit code sent to \(email)")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                VStack(spacing: 16) {
                    TextField("000000", text: $otpCode)
                        .textFieldStyle(.plain)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.center)
                        .font(.system(size: 32, weight: .bold, design: .monospaced))
                        .padding(16)
                        .background(Color(hex: "374151"))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(hex: "4b5563"), lineWidth: 1)
                        )
                        .foregroundStyle(.white)
                        .focused($isCodeFocused)
                        .onChange(of: otpCode) { newValue in
                            let filtered = newValue.filter(\.isNumber)
                            if filtered.count > 6 {
                                otpCode = String(filtered.prefix(6))
                            } else if filtered != newValue {
                                otpCode = filtered
                            }
                            if otpCode.count != 6 {
                                didFireAutoVerifyForLengthSix = false
                            } else if !didFireAutoVerifyForLengthSix {
                                didFireAutoVerifyForLengthSix = true
                                handleVerify()
                            }
                        }

                    Button(action: handleVerify) {
                        Group {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text(locale == .ja ? "認証する" : "Verify")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                    .disabled(isLoading || otpCode.count != 6)

                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
                .padding(.horizontal, 32)

                VStack(spacing: 8) {
                    let lines = locale == .ja
                        ? ["認証コードが届かない場合:", "1. スパムフォルダを確認", "2. メールアドレスを再確認", "3. 数分待ってから再試行"]
                        : ["If the code does not arrive:", "1. Check your spam folder", "2. Confirm the email address", "3. Wait a few minutes and try again"]

                    ForEach(lines, id: \.self) { line in
                        Text(line)
                            .font(.caption2)
                            .foregroundStyle(Color(hex: "6b7280"))
                    }
                }

                Spacer()
            }
        }
        .navigationBarBackButtonHidden(false)
        .onAppear {
            isCodeFocused = true
        }
    }

    private func handleVerify() {
        guard otpCode.count == 6, !isLoading else { return }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await SupabaseService.shared.verifyOTP(
                    email: email,
                    token: otpCode
                )
                await appState.bootstrap()
            } catch {
                didFireAutoVerifyForLengthSix = false
                errorMessage = locale == .ja
                    ? "認証に失敗しました: \(error.localizedDescription)"
                    : "Verification failed: \(error.localizedDescription)"
            }
            isLoading = false
        }
    }
}
