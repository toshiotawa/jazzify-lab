import SwiftUI

struct ProfileSetupView: View {
    @EnvironmentObject var appState: AppState

    let email: String

    @State private var nickname = ""
    @State private var agreed = false
    @State private var isSubmitting = false
    @FocusState private var isNicknameFocused: Bool

    private var locale: AppLocale { appState.locale }
    private var trimmedNickname: String {
        nickname.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    private var termsURL: URL { Config.webAppBaseURL.appendingPathComponent("terms") }
    private var privacyURL: URL { Config.webAppBaseURL.appendingPathComponent("privacy") }

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
                        Spacer()
                            .frame(height: 40)

                        VStack(spacing: 12) {
                            Image(systemName: "person.crop.circle.badge.plus")
                                .font(.system(size: 52))
                                .foregroundStyle(.purple)

                            Text(locale == .ja ? "プロフィール登録" : "Complete your profile")
                                .font(.title2.bold())
                                .foregroundStyle(.white)

                            Text(locale == .ja
                                 ? "ログインできました。続行するにはニックネームを登録してください。"
                                 : "You are signed in. Add a nickname to continue.")
                                .font(.subheadline)
                                .foregroundStyle(.gray)
                                .multilineTextAlignment(.center)

                            Text(email)
                                .font(.caption)
                                .foregroundStyle(Color(hex: "9ca3af"))
                        }
                        .padding(.horizontal, 24)

                        VStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(locale == .ja ? "ニックネーム" : "Nickname")
                                    .font(.subheadline)
                                    .foregroundStyle(.gray)

                                TextField(
                                    locale == .ja ? "ニックネームを入力" : "Enter a nickname",
                                    text: $nickname
                                )
                                .textFieldStyle(.plain)
                                .padding(12)
                                .background(Color(hex: "374151"))
                                .cornerRadius(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color(hex: "4b5563"), lineWidth: 1)
                                )
                                .foregroundStyle(.white)
                                .focused($isNicknameFocused)
                            }

                            Toggle(isOn: $agreed) {
                                Text(
                                    locale == .ja
                                        ? "利用規約とプライバシーポリシーに同意します"
                                        : "I agree to the Terms of Service and Privacy Policy."
                                )
                                .font(.footnote)
                                .foregroundStyle(.white)
                            }
                            .tint(.purple)

                            HStack(spacing: 16) {
                                Link(locale == .ja ? "利用規約" : "Terms of Service", destination: termsURL)
                                    .font(.caption)
                                Link(locale == .ja ? "プライバシーポリシー" : "Privacy Policy", destination: privacyURL)
                                    .font(.caption)
                            }
                            .foregroundStyle(.purple)

                            if let error = appState.profileSetupError {
                                Text(error)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }

                            Button(action: handleSubmit) {
                                Group {
                                    if isSubmitting {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Text(locale == .ja ? "登録して開始" : "Create profile")
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.purple)
                            .disabled(isSubmitting || trimmedNickname.isEmpty || !agreed)

                            Button(action: handleSignOut) {
                                Text(locale == .ja ? "ログアウト" : "Sign out")
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 44)
                            }
                            .buttonStyle(.bordered)
                            .tint(.gray)
                            .disabled(isSubmitting)
                        }
                        .padding(24)
                        .background(Color(hex: "1f2937"))
                        .cornerRadius(12)
                        .padding(.horizontal, 24)

                        Spacer()
                    }
                }
            }
            .navigationBarBackButtonHidden(true)
            .onAppear {
                isNicknameFocused = true
            }
        }
    }

    private func handleSubmit() {
        guard !isSubmitting else { return }

        isSubmitting = true

        Task {
            await appState.createProfile(nickname: trimmedNickname, agreed: agreed)
            isSubmitting = false
        }
    }

    private func handleSignOut() {
        guard !isSubmitting else { return }

        Task {
            await appState.signOut()
        }
    }
}
