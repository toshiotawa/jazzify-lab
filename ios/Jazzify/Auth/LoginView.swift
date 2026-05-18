import SwiftUI
import UIKit

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    var onOnboardingRequested: () -> Void = {}

    @StateObject private var midiManager = MIDIManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var showPasswordField = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showOTPVerify = false
    @State private var authMode: AuthMode = .login
    @State private var didRequestAutomaticOnboarding = false

    private var locale: AppLocale { appState.locale }

    /// sendOTP / verify と同一の正規化（改行・全角スペース等の差で OTP が不一致にならないようにする）
    private var normalizedEmail: String {
        email.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isReviewAccount: Bool {
        normalizedEmail == Config.reviewEmail
    }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0f172a"), .black],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        Spacer().frame(height: 40)

                        VStack(spacing: 8) {
                            Image("default-avater")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 64, height: 64)
                                .clipShape(Circle())
                            Text("Jazzify")
                                .font(.largeTitle.bold())
                                .foregroundStyle(.white)
                        }

                        authModePicker

                        loginForm

                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                                .padding(.horizontal)
                        }

                        midiSection

                        midiConnectionGuideLink

                        midiKeyboardBuyingGuideLink

                        demoButtons

                        Spacer()
                    }
                    .padding(.horizontal, 24)
                }
            }
            .navigationDestination(isPresented: $showOTPVerify) {
                OTPVerifyView(email: normalizedEmail)
            }
            .onAppear {
                guard !didRequestAutomaticOnboarding else { return }
                didRequestAutomaticOnboarding = true
                if OnboardingPreferences.shouldShowAutomatically() {
                    onOnboardingRequested()
                }
            }
        }
    }

    // MARK: - Subviews

    private var authModePicker: some View {
        Picker("", selection: $authMode) {
            Text(locale == .ja ? "ログイン" : "Log In")
                .tag(AuthMode.login)
            Text(locale == .ja ? "会員登録" : "Sign Up")
                .tag(AuthMode.signup)
        }
        .pickerStyle(.segmented)
        .padding(.horizontal)
    }

    private var loginForm: some View {
        VStack(spacing: 16) {
            Text(authMode == .login
                 ? (locale == .ja ? "ログイン" : "Log In")
                 : (locale == .ja ? "会員登録" : "Create Account"))
                .font(.title2.bold())
                .foregroundStyle(.white)

            VStack(alignment: .leading, spacing: 8) {
                Text(locale == .ja ? "メールアドレス" : "Email address")
                    .font(.subheadline)
                    .foregroundStyle(.gray)

                TextField("you@example.com", text: $email)
                    .textFieldStyle(.plain)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .padding(12)
                    .background(Color(hex: "374151"))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(hex: "4b5563"), lineWidth: 1)
                    )
                    .foregroundStyle(.white)
                    .onChange(of: email) { newValue in
                        if showPasswordField && newValue.lowercased().trimmingCharacters(in: .whitespaces) != Config.reviewEmail {
                            showPasswordField = false
                            password = ""
                        }
                    }
            }

            if showPasswordField {
                VStack(alignment: .leading, spacing: 8) {
                    Text(locale == .ja ? "パスワード" : "Password")
                        .font(.subheadline)
                        .foregroundStyle(.gray)

                    SecureField("••••••••", text: $password)
                        .textFieldStyle(.plain)
                        .padding(12)
                        .background(Color(hex: "374151"))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color(hex: "4b5563"), lineWidth: 1)
                        )
                        .foregroundStyle(.white)
                }
            }

            Button(action: handleSubmit) {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text(submitButtonLabel)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            }
            .buttonStyle(.borderedProminent)
            .tint(.purple)
            .disabled(isLoading || email.isEmpty || (showPasswordField && password.isEmpty))

            Text(locale == .ja
                 ? "認証コードは6桁の数字で送信されます"
                 : "A 6-digit verification code will be sent to your email.")
                .font(.caption)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
        }
        .padding(24)
        .background(Color(hex: "1f2937"))
        .cornerRadius(12)
    }

    private var midiConnectionGuideLink: some View {
        NavigationLink {
            MidiConnectionGuideView(locale: locale)
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.purple.opacity(0.18))
                        .frame(width: 38, height: 38)
                    Image(systemName: "cable.connector")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.purple)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(locale == .ja ? "MIDIキーボード接続ガイド" : "MIDI Keyboard Connection Guide")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    Text(locale == .ja
                         ? "端末に合わせたケーブルと接続手順を見る"
                         : "See the cable and setup steps for this device.")
                        .font(.caption)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 8)

                Image(systemName: "chevron.right")
                    .font(.caption.bold())
                    .foregroundStyle(.gray)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: "111827"))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.purple.opacity(0.28), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(locale == .ja ? "MIDIキーボード接続ガイドを開く" : "Open MIDI keyboard connection guide")
    }

    private var midiKeyboardBuyingGuideLink: some View {
        NavigationLink {
            MidiKeyboardBuyingGuideView(locale: locale)
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.purple.opacity(0.18))
                        .frame(width: 38, height: 38)
                    Image(systemName: "pianokeys")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.purple)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(locale == .ja ? "MIDIキーボードの選び方" : "Choosing a MIDI Keyboard")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    Text(locale == .ja
                         ? "鍵数の目安と参考機種・注意事項をまとめて読む"
                         : "Key counts, suggested boards, and what MIDI means.")
                        .font(.caption)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 8)

                Image(systemName: "chevron.right")
                    .font(.caption.bold())
                    .foregroundStyle(.gray)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: "111827"))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.purple.opacity(0.28), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(locale == .ja ? "MIDIキーボードの選び方を開く" : "Open MIDI keyboard buying guide")
    }

    // MARK: - MIDI

    private var midiSection: some View {
        VStack(spacing: 10) {
            HStack {
                Image(systemName: "pianokeys")
                    .foregroundStyle(.purple)
                Text(locale == .ja ? "MIDI デバイス" : "MIDI Device")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                Spacer()
                Button {
                    midiManager.refreshDevices()
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
            }

            if midiManager.availableDevices.isEmpty {
                Text(locale == .ja
                     ? "MIDI キーボードを接続してください"
                     : "Connect a MIDI keyboard")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
            } else {
                ForEach(midiManager.availableDevices) { device in
                    Button {
                        midiManager.selectDevice(uniqueID: device.uniqueID)
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(device.displayName)
                                    .font(.caption)
                                    .foregroundStyle(.white)
                                if !device.manufacturer.isEmpty {
                                    Text(device.manufacturer)
                                        .font(.caption2)
                                        .foregroundStyle(.gray)
                                }
                            }
                            Spacer()
                            if midiManager.selectedDeviceID == device.uniqueID {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.purple)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    // MARK: - Demo

    private var demoButtons: some View {
        VStack(spacing: 12) {
            Text(locale == .ja ? "アカウントなしで体験" : "Try without an account")
                .font(.subheadline)
                .foregroundStyle(.gray)

            Button {
                onOnboardingRequested()
            } label: {
                Label(
                    locale == .ja ? "デモプレイ" : "Demo play",
                    systemImage: "play.circle.fill"
                )
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            }
            .buttonStyle(.bordered)
            .tint(.purple)
        }
    }

    // MARK: - Logic

    private var submitButtonLabel: String {
        if showPasswordField {
            return locale == .ja ? "ログイン" : "Sign In"
        }
        return locale == .ja ? "認証コードを送信" : "Send verification code"
    }

    private func handleSubmit() {
        guard !email.isEmpty else { return }

        if isReviewAccount && !showPasswordField {
            showPasswordField = true
            return
        }

        if isReviewAccount && showPasswordField {
            handlePasswordLogin()
            return
        }

        handleOTPSend()
    }

    private func handleOTPSend() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let shouldCreate = authMode == .signup
                try await SupabaseService.shared.sendOTP(
                    email: normalizedEmail,
                    shouldCreateUser: shouldCreate
                )
                showOTPVerify = true
            } catch {
                errorMessage = otpSendErrorMessage(for: error)
            }
            isLoading = false
        }
    }

    private func handlePasswordLogin() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await SupabaseService.shared.signInWithPassword(
                    email: normalizedEmail,
                    password: password
                )
                await appState.bootstrap()
            } catch {
                errorMessage = locale == .ja
                    ? "ログインに失敗しました: \(error.localizedDescription)"
                    : "Login failed: \(error.localizedDescription)"
            }
            isLoading = false
        }
    }

    private func otpSendErrorMessage(for error: Error) -> String {
        let message = error.localizedDescription.lowercased()

        if message.contains("signups not allowed") {
            if authMode == .login {
                return locale == .ja
                    ? "このメールアドレスのアカウントは見つかりません。会員登録をお試しください。"
                    : "No account was found for this email address. Please try Sign Up."
            }
            return locale == .ja
                ? "現在、新規アカウント登録を受け付けていません。"
                : "New account sign-ups are currently unavailable."
        }

        if message.contains("invalid email") {
            return locale == .ja
                ? "メールアドレスの形式が正しくありません。"
                : "Please enter a valid email address."
        }

        if message.contains("rate limit") {
            return locale == .ja
                ? "送信回数の上限に達しました。しばらく待ってから再試行してください。"
                : "Too many attempts. Please wait a moment and try again."
        }

        return locale == .ja
            ? "認証コード送信に失敗しました: \(error.localizedDescription)"
            : "Failed to send the verification code: \(error.localizedDescription)"
    }
}

enum AuthMode {
    case login
    case signup
}
