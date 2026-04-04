import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var showSubscription = false
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var deleteError: String?
    @State private var showMIDISettings = false

    private var locale: AppLocale { appState.locale }
    private var profile: Profile? { appState.profile }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                List {
                    if let bannerKind = appState.paymentIssueBannerKind {
                        Section {
                            PaymentIssueBannerView(kind: bannerKind, locale: locale)
                                .listRowBackground(Color.clear)
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    }
                    accountSection
                    languageSection
                    midiSection
                    subscriptionSection
                    supportSection
                    dangerSection
                }
                .scrollContentBackground(.hidden)
                .listStyle(.insetGrouped)
            }
            .navigationTitle(locale == .ja ? "設定" : "Settings")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
            }
            .sheet(isPresented: $showMIDISettings) {
                MIDISettingsView()
            }
            .alert(
                locale == .ja ? "アカウント削除" : "Delete Account",
                isPresented: $showDeleteConfirm
            ) {
                Button(locale == .ja ? "キャンセル" : "Cancel", role: .cancel) {}
                Button(locale == .ja ? "削除する" : "Delete", role: .destructive) {
                    Task { await handleDeleteAccount() }
                }
            } message: {
                Text(locale == .ja
                     ? "この操作は取り消せません。アカウント情報は完全に削除されます。"
                     : "This action cannot be undone. Your account data will be permanently deleted.")
            }
        }
    }

    // MARK: - Sections

    private var accountSection: some View {
        Section {
            if let profile {
                NavigationLink {
                    NicknameEditView(initialNickname: profile.nickname)
                } label: {
                    HStack {
                        Text(locale == .ja ? "ニックネーム" : "Nickname")
                            .foregroundStyle(.gray)
                        Spacer()
                        Text(profile.nickname)
                            .foregroundStyle(.white)
                            .lineLimit(1)
                    }
                }

                NavigationLink {
                    EmailEditView(currentEmail: profile.email)
                } label: {
                    HStack {
                        Text(locale == .ja ? "メール" : "Email")
                            .foregroundStyle(.gray)
                        Spacer()
                        Text(profile.email)
                            .foregroundStyle(.white)
                            .lineLimit(1)
                    }
                }

                HStack {
                    Text(locale == .ja ? "プラン" : "Plan")
                        .foregroundStyle(.gray)
                    Spacer()
                    Text(profile.rank.label(locale: locale))
                        .foregroundStyle(profile.rank.isPremium ? .purple : .white)
                }
            }
        } header: {
            Text(locale == .ja ? "アカウント" : "Account")
        }
        .listRowBackground(Color(hex: "1e293b"))
    }

    private var languageSection: some View {
        Section {
            Picker(locale == .ja ? "言語" : "Language", selection: Binding(
                get: { appState.locale },
                set: { newLocale in
                    Task { await appState.updateLocale(newLocale) }
                }
            )) {
                ForEach(AppLocale.allCases, id: \.self) { loc in
                    Text(loc.displayName).tag(loc)
                }
            }
            .foregroundStyle(.white)
        } header: {
            Text(locale == .ja ? "言語設定" : "Language")
        }
        .listRowBackground(Color(hex: "1e293b"))
    }

    private var midiSection: some View {
        Section {
            Button {
                showMIDISettings = true
            } label: {
                HStack {
                    Label(
                        locale == .ja ? "MIDI デバイス" : "MIDI Devices",
                        systemImage: "pianokeys"
                    )
                    .foregroundStyle(.white)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.gray)
                }
            }
        } header: {
            Text("MIDI")
        }
        .listRowBackground(Color(hex: "1e293b"))
    }

    private var subscriptionSection: some View {
        Section {
            Button {
                showSubscription = true
            } label: {
                HStack {
                    Label(
                        locale == .ja ? "サブスクリプション" : "Subscriptions",
                        systemImage: "creditcard.fill"
                    )
                    .foregroundStyle(.white)
                    Spacer()
                    if appState.isPremium {
                        Text(locale == .ja ? "有効" : "Active")
                            .font(.caption)
                            .foregroundStyle(.green)
                    }
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.gray)
                }
            }

            if let billing = appState.billingStatus,
               billing.provider == .apple,
               billing.status == .active || billing.status == .trial {
                Text(locale == .ja
                     ? "サブスクリプションの確認・解約は、設定 → Apple ID → サブスクリプションから行えます。"
                     : "To view or cancel your subscription, go to Settings → Apple ID → Subscriptions.")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.leading)
            }
        } header: {
            Text(locale == .ja ? "課金" : "Billing")
        }
        .listRowBackground(Color(hex: "1e293b"))
    }

    private var supportSection: some View {
        Section {
            NavigationLink(destination: ContactView()) {
                HStack {
                    Label(
                        locale == .ja ? "お問い合わせ" : "Contact Us",
                        systemImage: "envelope.fill"
                    )
                    .foregroundStyle(.white)
                    Spacer()
                }
            }
        } header: {
            Text(locale == .ja ? "サポート" : "Support")
        }
        .listRowBackground(Color(hex: "1e293b"))
    }

    private var dangerSection: some View {
        Section {
            Button {
                if !appState.canDeleteAccount {
                    deleteError = locale == .ja
                        ? "まだサブスクリプションの利用期間が残っています。期間終了後に退会手続きが可能になります。先にサブスクリプションを解約してください。"
                        : "Your subscription period has not ended yet. You can delete your account after the period expires. Please cancel your subscription first."
                } else {
                    showDeleteConfirm = true
                }
            } label: {
                HStack {
                    Label(
                        locale == .ja ? "アカウント削除（退会）" : "Delete Account",
                        systemImage: "trash.fill"
                    )
                    .foregroundStyle(.red)
                    Spacer()
                    if isDeleting {
                        ProgressView()
                            .tint(.red)
                    }
                }
            }
            .disabled(isDeleting)

            if let error = deleteError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.orange)
            }

            Button(role: .destructive) {
                Task { await appState.signOut() }
            } label: {
                Label(
                    locale == .ja ? "ログアウト" : "Log Out",
                    systemImage: "rectangle.portrait.and.arrow.right"
                )
                .foregroundStyle(.red)
            }
        } header: {
            Text(locale == .ja ? "アカウント操作" : "Account Actions")
        } footer: {
            VStack(alignment: .leading, spacing: 4) {
                if !appState.canDeleteAccount {
                    Text(locale == .ja
                         ? "まだ利用期間が残っているため、アカウント削除できません"
                         : "Account deletion is unavailable while your subscription period is active")
                        .foregroundStyle(.orange)
                }

                HStack(spacing: 16) {
                    Link(locale == .ja ? "利用規約" : "Terms",
                         destination: Config.termsIosURL)
                    Link(locale == .ja ? "プライバシーポリシー" : "Privacy",
                         destination: Config.privacyIosURL)
                }
                .font(.caption)
            }
        }
        .listRowBackground(Color(hex: "1e293b"))
    }

    // MARK: - Actions

    private func handleDeleteAccount() async {
        isDeleting = true
        deleteError = nil

        do {
            try await SupabaseService.shared.deleteAccount()
            await appState.signOut()
        } catch {
            deleteError = locale == .ja
                ? "退会処理に失敗しました: \(error.localizedDescription)"
                : "Failed to delete account: \(error.localizedDescription)"
        }
        isDeleting = false
    }

}

// MARK: - ニックネーム（Web の profiles.update と同じ経路）

private struct NicknameEditView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    let initialNickname: String
    @State private var text: String
    @State private var saving = false
    @State private var errorMessage: String?

    init(initialNickname: String) {
        self.initialNickname = initialNickname
        _text = State(initialValue: initialNickname)
    }

    private var locale: AppLocale { appState.locale }

    private var trimmed: String {
        text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            VStack(alignment: .leading, spacing: 16) {
                Text(locale == .ja ? "ニックネーム" : "Nickname")
                    .font(.caption)
                    .foregroundStyle(.gray)

                TextField(
                    locale == .ja ? "1〜20文字" : "1–20 characters",
                    text: $text
                )
                .textContentType(.nickname)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(12)
                .background(Color(hex: "1e293b"))
                .cornerRadius(10)
                .foregroundStyle(.white)
                .disabled(saving)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                Button {
                    Task { await save() }
                } label: {
                    HStack {
                        if saving {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(locale == .ja ? "保存" : "Save")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(canSave ? Color.purple : Color(hex: "334155"))
                    .foregroundStyle(.white)
                    .cornerRadius(12)
                }
                .disabled(!canSave || saving)

                Spacer()
            }
            .padding(20)
        }
        .navigationTitle(locale == .ja ? "ニックネーム" : "Nickname")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
    }

    private var canSave: Bool {
        let initial = initialNickname.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed != initial else { return false }
        return !trimmed.isEmpty && trimmed.count <= 20
    }

    private func save() async {
        errorMessage = nil
        saving = true
        let result = await appState.updateNickname(text)
        saving = false
        if result.ok {
            dismiss()
        } else {
            errorMessage = result.message
        }
    }
}

// MARK: - メール（Web の auth.updateUser と同じ経路）

private struct EmailEditView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    let currentEmail: String
    @State private var newEmail = ""
    @State private var sending = false
    @State private var statusMessage: String?
    @State private var statusIsError = false
    @State private var pendingNewEmail: String?
    @State private var otpCode = ""
    @State private var verifying = false

    private var locale: AppLocale { appState.locale }

    private var trimmedNew: String {
        newEmail.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSendCode: Bool {
        !trimmedNew.isEmpty && trimmedNew != currentEmail && pendingNewEmail == nil
    }

    private var otpDigitsBinding: Binding<String> {
        Binding(
            get: { otpCode },
            set: { newValue in
                let digits = newValue.filter { $0.isNumber }
                otpCode = String(digits.prefix(6))
            }
        )
    }

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(locale == .ja ? "現在のメール" : "Current email")
                        .font(.caption)
                        .foregroundStyle(.gray)
                    Text(currentEmail)
                        .foregroundStyle(.white)
                        .font(.subheadline)
                        .lineLimit(3)

                    Text(locale == .ja ? "新しいメールアドレス" : "New email address")
                        .font(.caption)
                        .foregroundStyle(.gray)
                    TextField(
                        locale == .ja ? "新しいメールアドレス" : "New email address",
                        text: $newEmail
                    )
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(12)
                    .background(Color(hex: "1e293b"))
                    .cornerRadius(10)
                    .foregroundStyle(.white)
                    .disabled(sending || pendingNewEmail != nil)

                    if let pending = pendingNewEmail {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(locale == .ja ? "送信先: \(pending)" : "Sent to: \(pending)")
                                .font(.caption)
                                .foregroundStyle(.gray)
                            Text(locale == .ja ? "6桁の確認コード" : "6-digit code")
                                .font(.caption)
                                .foregroundStyle(.gray)
                            TextField(
                                locale == .ja ? "000000" : "000000",
                                text: otpDigitsBinding
                            )
                            .textContentType(.oneTimeCode)
                            .keyboardType(.numberPad)
                            .padding(12)
                            .background(Color(hex: "1e293b"))
                            .cornerRadius(10)
                            .foregroundStyle(.white)
                            .disabled(verifying)

                            Button {
                                Task { await verifyOtp() }
                            } label: {
                                HStack {
                                    if verifying {
                                        ProgressView()
                                            .tint(.white)
                                    }
                                    Text(locale == .ja ? "確認" : "Verify")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(otpCode.count >= 6 ? Color.purple : Color(hex: "334155"))
                                .foregroundStyle(.white)
                                .cornerRadius(12)
                            }
                            .disabled(otpCode.count < 6 || verifying)

                            HStack(spacing: 16) {
                                Button(locale == .ja ? "コードを再送信" : "Resend code") {
                                    Task { await resendCode() }
                                }
                                .font(.caption)
                                .foregroundStyle(.cyan)
                                .disabled(sending || verifying)

                                Button(locale == .ja ? "キャンセル" : "Cancel") {
                                    pendingNewEmail = nil
                                    otpCode = ""
                                    statusMessage = nil
                                }
                                .font(.caption)
                                .foregroundStyle(.gray)
                                .disabled(verifying)
                            }
                        }
                        .padding(12)
                        .background(Color(hex: "1e293b").opacity(0.6))
                        .cornerRadius(12)
                    }

                    if let statusMessage {
                        Text(statusMessage)
                            .font(.caption)
                            .foregroundStyle(statusIsError ? Color.red : Color.green)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    if pendingNewEmail == nil {
                        Button {
                            Task { await send() }
                        } label: {
                            HStack {
                                if sending {
                                    ProgressView()
                                        .tint(.white)
                                }
                                Text(locale == .ja ? "コードを送信" : "Send code")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(canSendCode ? Color.purple : Color(hex: "334155"))
                            .foregroundStyle(.white)
                            .cornerRadius(12)
                        }
                        .disabled(!canSendCode || sending)
                    }
                }
                .padding(20)
            }
        }
        .navigationTitle(locale == .ja ? "メール変更" : "Change email")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
    }

    private func send() async {
        statusMessage = nil
        sending = true
        let result = await appState.requestEmailChange(newEmail)
        sending = false
        statusIsError = !result.ok
        statusMessage = result.message
        if result.ok {
            pendingNewEmail = trimmedNew
            otpCode = ""
        }
    }

    private func resendCode() async {
        guard let pending = pendingNewEmail else { return }
        newEmail = pending
        statusMessage = nil
        sending = true
        let result = await appState.requestEmailChange(pending)
        sending = false
        statusIsError = !result.ok
        statusMessage = result.message
    }

    private func verifyOtp() async {
        guard let pending = pendingNewEmail else { return }
        statusMessage = nil
        verifying = true
        let result = await appState.verifyEmailChangeOtp(newEmail: pending, token: otpCode)
        verifying = false
        statusIsError = !result.ok
        statusMessage = result.message
        if result.ok {
            otpCode = ""
            pendingNewEmail = nil
            newEmail = ""
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                dismiss()
            }
        }
    }
}

struct MIDISettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @StateObject private var midiManager = MIDIManager.shared

    private var locale: AppLocale { appState.locale }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                List {
                    if midiManager.availableDevices.isEmpty {
                        Section {
                            VStack(spacing: 8) {
                                Image(systemName: "pianokeys")
                                    .font(.title)
                                    .foregroundStyle(.gray)
                                Text(locale == .ja
                                     ? "MIDI デバイスが見つかりません"
                                     : "No MIDI devices found")
                                    .foregroundStyle(.gray)
                                Text(locale == .ja
                                     ? "MIDI キーボードを接続してください"
                                     : "Connect a MIDI keyboard")
                                    .font(.caption)
                                    .foregroundStyle(.gray)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                        }
                        .listRowBackground(Color(hex: "1e293b"))
                    } else {
                        Section {
                            ForEach(midiManager.availableDevices, id: \.uniqueID) { device in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(device.displayName)
                                            .foregroundStyle(.white)
                                        Text(device.manufacturer)
                                            .font(.caption)
                                            .foregroundStyle(.gray)
                                    }
                                    Spacer()
                                    if midiManager.selectedDeviceID == device.uniqueID {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.purple)
                                    }
                                }
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    midiManager.selectDevice(uniqueID: device.uniqueID)
                                }
                            }
                        } header: {
                            Text(locale == .ja ? "接続中のデバイス" : "Connected Devices")
                        }
                        .listRowBackground(Color(hex: "1e293b"))
                    }
                }
                .scrollContentBackground(.hidden)
                .listStyle(.insetGrouped)
            }
            .navigationTitle(locale == .ja ? "MIDI 設定" : "MIDI Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(locale == .ja ? "閉じる" : "Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}
