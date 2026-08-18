import SwiftUI

private struct ContactSubmissionPayload: Encodable {
    let name: String
    let email: String
    let message: String
    let botField: String
    let source: String
    let locale: String
    let appVersion: String?
}

struct ContactView: View {
    @EnvironmentObject var appState: AppState
    @State private var name = ""
    @State private var email = ""
    @State private var message = ""
    @State private var isSending = false
    @State private var showSuccessAlert = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""

    private var locale: AppLocale { appState.locale }

    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
        && !email.trimmingCharacters(in: .whitespaces).isEmpty
        && email.contains("@")
        && !message.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    headerSection
                    formSection
                    sendButton
                }
                .padding()
            }
        }
        .navigationTitle(locale == .ja ? "お問い合わせ" : "Contact Us")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .onAppear {
            if let profile = appState.profile {
                if name.isEmpty { name = profile.nickname }
                if email.isEmpty { email = profile.email }
            }
        }
        .alert(
            locale == .ja ? "送信完了" : "Sent Successfully",
            isPresented: $showSuccessAlert
        ) {
            Button("OK") {
                name = appState.profile?.nickname ?? ""
                email = appState.profile?.email ?? ""
                message = ""
            }
        } message: {
            Text(locale == .ja
                 ? "お問い合わせを受け付けました。内容を確認の上、ご連絡いたします。"
                 : "Your inquiry has been received. We will review it and get back to you.")
        }
        .alert(
            locale == .ja ? "送信エラー" : "Send Error",
            isPresented: $showErrorAlert
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    private var headerSection: some View {
        VStack(spacing: 8) {
            Image(systemName: "envelope.open.fill")
                .font(.system(size: 40))
                .foregroundStyle(
                    LinearGradient(colors: [.blue, .purple], startPoint: .leading, endPoint: .trailing)
                )

            Text(locale == .ja
                 ? "ご質問やご意見がありましたら、お気軽にお問い合わせください。"
                 : "Feel free to reach out with any questions or feedback.")
                .font(.subheadline)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 8)
    }

    private var formSection: some View {
        VStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text(locale == .ja ? "お名前" : "Name")
                    .font(.caption.bold())
                    .foregroundStyle(.gray)
                TextField(locale == .ja ? "お名前を入力" : "Enter your name", text: $name)
                    .textFieldStyle(ContactTextFieldStyle())
                    .textContentType(.name)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(locale == .ja ? "メールアドレス" : "Email")
                    .font(.caption.bold())
                    .foregroundStyle(.gray)
                TextField(locale == .ja ? "メールアドレスを入力" : "Enter your email", text: $email)
                    .textFieldStyle(ContactTextFieldStyle())
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(locale == .ja ? "お問い合わせ内容" : "Message")
                    .font(.caption.bold())
                    .foregroundStyle(.gray)
                TextEditor(text: $message)
                    .frame(minHeight: 150)
                    .scrollContentBackground(.hidden)
                    .padding(12)
                    .background(Color(hex: "1e293b"))
                    .cornerRadius(10)
                    .foregroundStyle(.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color(hex: "374151"), lineWidth: 1)
                    )
            }
        }
    }

    private var sendButton: some View {
        Button {
            Task { await submitForm() }
        } label: {
            Group {
                if isSending {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text(locale == .ja ? "送信する" : "Send")
                        .font(.headline)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
        }
        .buttonStyle(.borderedProminent)
        .tint(.purple)
        .disabled(!isFormValid || isSending)
    }

    private func submitForm() async {
        isSending = true
        defer { isSending = false }

        let payload = ContactSubmissionPayload(
            name: name.trimmingCharacters(in: .whitespaces),
            email: email.trimmingCharacters(in: .whitespaces),
            message: message.trimmingCharacters(in: .whitespaces),
            botField: "",
            source: "ios",
            locale: locale == .ja ? "ja" : "en",
            appVersion: currentAppVersion()
        )

        var request = URLRequest(url: Config.submitContactURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = try? await SupabaseService.shared.accessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        do {
            request.httpBody = try JSONEncoder().encode(payload)
            let (_, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200..<300).contains(httpResponse.statusCode) else {
                errorMessage = locale == .ja
                    ? "送信に失敗しました。もう一度お試しください。"
                    : "Failed to send. Please try again."
                showErrorAlert = true
                return
            }
            showSuccessAlert = true
        } catch {
            errorMessage = locale == .ja
                ? "ネットワークエラーが発生しました: \(error.localizedDescription)"
                : "Network error: \(error.localizedDescription)"
            showErrorAlert = true
        }
    }

    private func currentAppVersion() -> String? {
        guard let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
              !version.isEmpty else {
            return nil
        }
        return version
    }
}

struct ContactTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(12)
            .background(Color(hex: "1e293b"))
            .cornerRadius(10)
            .foregroundStyle(.white)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color(hex: "374151"), lineWidth: 1)
            )
    }
}
