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
                HStack {
                    Text(locale == .ja ? "ニックネーム" : "Nickname")
                        .foregroundStyle(.gray)
                    Spacer()
                    Text(profile.nickname)
                        .foregroundStyle(.white)
                }

                HStack {
                    Text(locale == .ja ? "メール" : "Email")
                        .foregroundStyle(.gray)
                    Spacer()
                    Text(profile.email)
                        .foregroundStyle(.white)
                        .lineLimit(1)
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
