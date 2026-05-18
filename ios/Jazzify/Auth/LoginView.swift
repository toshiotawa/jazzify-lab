import Darwin
import SwiftUI
import UIKit

struct LoginView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var midiManager = MIDIManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var showPasswordField = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showOTPVerify = false
    @State private var authMode: AuthMode = .login
    @State private var showDemoLP = false
    /// デモサバイバルの起動時 `hintMode`。リザルトからの「ヒントなしで挑戦」等で書き換える。
    @State private var demoSurvivalHintMode: Bool = true

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

                        demoButtons

                        Spacer()
                    }
                    .padding(.horizontal, 24)
                }
            }
            .navigationDestination(isPresented: $showOTPVerify) {
                OTPVerifyView(email: normalizedEmail)
            }
            .fullScreenCover(isPresented: $showDemoLP) {
                SurvivalGameView(
                    stage: SurvivalDemoStage.definition,
                    hintMode: demoSurvivalHintMode,
                    characterId: "fai",
                    locale: locale,
                    onClose: { showDemoLP = false },
                    isDemo: true,
                    configOverride: SurvivalDemoStage.config
                )
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
                demoSurvivalHintMode = true
                showDemoLP = true
            } label: {
                Label(
                    locale == .ja ? "サバイバル" : "Survival",
                    systemImage: "flame.fill"
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

private struct MidiConnectionGuideView: View {
    let locale: AppLocale

    @Environment(\.dismiss) private var dismiss
    @State private var selectedSlideIndex = 0
    @State private var deviceProfile = MidiConnectionDeviceProfile.localFallback()

    private var slides: [MidiConnectionGuideSlide] {
        MidiConnectionGuideSlide.makeSlides(for: deviceProfile, locale: locale)
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "0f172a"), .black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 18) {
                    deviceSummary

                    TabView(selection: $selectedSlideIndex) {
                        ForEach(slides.indices, id: \.self) { index in
                            slideView(slides[index])
                                .tag(index)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .always))
                    .frame(height: 560)

                    slideControls
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)
                .padding(.bottom, 28)
            }
        }
        .navigationTitle(locale == .ja ? "接続ガイド" : "Connection Guide")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(locale == .ja ? "閉じる" : "Close") {
                    dismiss()
                }
                .foregroundStyle(.white)
            }
        }
        .task {
            await loadDeviceProfile()
        }
    }

    private var deviceSummary: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.purple.opacity(0.18))
                    .frame(width: 44, height: 44)
                Image(systemName: deviceProfile.deviceFamily == .ipad ? "ipad" : "iphone")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.purple)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(deviceProfile.title(locale: locale))
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(deviceProfile.detail(locale: locale))
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .fixedSize(horizontal: false, vertical: true)
                Text(deviceProfile.sourceMessage(locale: locale))
                    .font(.caption2)
                    .foregroundStyle(deviceProfile.source == .databaseExact ? Color.green : Color.yellow)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color(hex: "111827").opacity(0.92))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }

    private var slideControls: some View {
        HStack(spacing: 12) {
            Button {
                selectedSlideIndex = max(0, selectedSlideIndex - 1)
            } label: {
                Label(locale == .ja ? "前へ" : "Previous", systemImage: "chevron.left")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .tint(.purple)
            .disabled(selectedSlideIndex == 0)

            Button {
                if selectedSlideIndex >= slides.count - 1 {
                    dismiss()
                } else {
                    selectedSlideIndex = min(slides.count - 1, selectedSlideIndex + 1)
                }
            } label: {
                Label(
                    selectedSlideIndex >= slides.count - 1
                        ? (locale == .ja ? "完了" : "Done")
                        : (locale == .ja ? "次へ" : "Next"),
                    systemImage: selectedSlideIndex >= slides.count - 1 ? "checkmark" : "chevron.right"
                )
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.purple)
        }
    }

    private func slideView(_ slide: MidiConnectionGuideSlide) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(slide.title)
                .font(.title3.bold())
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)

            if let imageName = slide.imageName {
                Image(imageName)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: 260)
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.white.opacity(0.04))
                    )
                    .accessibilityHidden(true)
            }

            Text(slide.body)
                .font(.subheadline)
                .foregroundStyle(.gray)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 10) {
                ForEach(slide.bullets, id: \.self) { bullet in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .font(.caption)
                            .padding(.top, 2)
                        Text(bullet)
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.86))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .padding(18)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(hex: "1e293b"))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
        .padding(.horizontal, 2)
    }

    private func loadDeviceProfile() async {
        let identifier = IOSDeviceHardware.currentIdentifier()
        let fallbackFamily = IOSDeviceHardware.currentFamily()

        do {
            if let row = try await SupabaseService.shared.fetchIosMidiDeviceModel(
                modelIdentifier: identifier,
                deviceFamily: fallbackFamily.rawValue
            ) {
                deviceProfile = MidiConnectionDeviceProfile(
                    row: row,
                    requestedIdentifier: identifier,
                    fallbackFamily: fallbackFamily
                )
                selectedSlideIndex = 0
                return
            }
        } catch {
            deviceProfile = MidiConnectionDeviceProfile.localFallback(
                identifier: identifier,
                family: fallbackFamily,
                source: .localFallback
            )
            selectedSlideIndex = 0
            return
        }

        deviceProfile = MidiConnectionDeviceProfile.localFallback(
            identifier: identifier,
            family: fallbackFamily,
            source: .localFallback
        )
        selectedSlideIndex = 0
    }
}

private enum IOSDeviceHardware {
    static func currentIdentifier() -> String {
        if let simulatorIdentifier = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"],
           !simulatorIdentifier.isEmpty {
            return simulatorIdentifier
        }

        var size = 0
        guard sysctlbyname("hw.machine", nil, &size, nil, 0) == 0, size > 0 else {
            return "unknown"
        }
        var machine = [CChar](repeating: 0, count: size)
        guard sysctlbyname("hw.machine", &machine, &size, nil, 0) == 0 else {
            return "unknown"
        }
        return String(cString: machine)
    }

    static func currentFamily() -> MidiDeviceFamily {
        switch UIDevice.current.userInterfaceIdiom {
        case .pad:
            return .ipad
        case .phone:
            return .iphone
        default:
            let identifier = currentIdentifier()
            return identifier.hasPrefix("iPad") ? .ipad : .iphone
        }
    }
}

private struct MidiConnectionDeviceProfile: Equatable {
    let modelIdentifier: String
    let deviceFamily: MidiDeviceFamily
    let marketingName: String
    let connectorType: MidiConnectorType
    let source: MidiConnectionProfileSource

    init(
        row: SupabaseService.IOSMidiDeviceModelRow,
        requestedIdentifier: String,
        fallbackFamily: MidiDeviceFamily
    ) {
        self.modelIdentifier = requestedIdentifier
        self.deviceFamily = MidiDeviceFamily(rawValue: row.deviceFamily) ?? fallbackFamily
        self.marketingName = row.isDefault ? fallbackFamily.defaultMarketingName : row.marketingName
        self.connectorType = MidiConnectorType(rawValue: row.connectorType) ?? .usbC
        self.source = row.isDefault ? .databaseDefault : .databaseExact
    }

    static func localFallback(
        identifier: String = IOSDeviceHardware.currentIdentifier(),
        family: MidiDeviceFamily = IOSDeviceHardware.currentFamily(),
        source: MidiConnectionProfileSource = .localFallback
    ) -> MidiConnectionDeviceProfile {
        MidiConnectionDeviceProfile(
            modelIdentifier: identifier,
            deviceFamily: family,
            marketingName: family.defaultMarketingName,
            connectorType: .usbC,
            source: source
        )
    }

    private init(
        modelIdentifier: String,
        deviceFamily: MidiDeviceFamily,
        marketingName: String,
        connectorType: MidiConnectorType,
        source: MidiConnectionProfileSource
    ) {
        self.modelIdentifier = modelIdentifier
        self.deviceFamily = deviceFamily
        self.marketingName = marketingName
        self.connectorType = connectorType
        self.source = source
    }

    func title(locale: AppLocale) -> String {
        switch locale {
        case .ja:
            return "\(marketingName) は \(connectorType.localizedName(locale: locale)) 接続です"
        case .en:
            return "\(marketingName) uses \(connectorType.localizedName(locale: locale))"
        }
    }

    func detail(locale: AppLocale) -> String {
        switch locale {
        case .ja:
            return "端末識別子: \(modelIdentifier)"
        case .en:
            return "Device identifier: \(modelIdentifier)"
        }
    }

    func sourceMessage(locale: AppLocale) -> String {
        switch source {
        case .databaseExact:
            return locale == .ja ? "Supabaseの端末DBで機種を確認しました" : "Matched from the Supabase device database."
        case .databaseDefault:
            return locale == .ja ? "新しい機種向けのDB標準設定を使っています" : "Using the database default for newer devices."
        case .localFallback:
            return locale == .ja ? "端末DBに接続できないため標準設定を使っています" : "Using the local default because the device database is unavailable."
        }
    }
}

private enum MidiDeviceFamily: String, Equatable {
    case iphone
    case ipad

    var defaultMarketingName: String {
        switch self {
        case .iphone:
            return "iPhone"
        case .ipad:
            return "iPad"
        }
    }

    var assetPrefix: String {
        switch self {
        case .iphone:
            return "midi_iphone"
        case .ipad:
            return "midi_ipad"
        }
    }
}

private enum MidiConnectorType: String, Equatable {
    case usbC = "usb_c"
    case lightning

    func localizedName(locale: AppLocale) -> String {
        switch self {
        case .usbC:
            return locale == .ja ? "USB Type-C" : "USB-C"
        case .lightning:
            return "Lightning"
        }
    }
}

private enum MidiConnectionProfileSource: Equatable {
    case databaseExact
    case databaseDefault
    case localFallback
}

private struct MidiConnectionGuideSlide: Identifiable, Equatable {
    let id: String
    let title: String
    let body: String
    let imageName: String?
    let bullets: [String]

    static func makeSlides(
        for profile: MidiConnectionDeviceProfile,
        locale: AppLocale
    ) -> [MidiConnectionGuideSlide] {
        switch profile.connectorType {
        case .lightning:
            return makeLightningSlides(for: profile, locale: locale)
        case .usbC:
            return makeUsbCSlides(for: profile, locale: locale)
        }
    }

    private static func makeLightningSlides(
        for profile: MidiConnectionDeviceProfile,
        locale: AppLocale
    ) -> [MidiConnectionGuideSlide] {
        let imageName = "\(profile.deviceFamily.assetPrefix)_lightning_adapter"
        if locale == .ja {
            return [
                MidiConnectionGuideSlide(
                    id: "lightning-adapter",
                    title: "Lightning - USBカメラアダプタを使います",
                    body: "Lightning端子のiPhone/iPadでは、Apple純正またはMIDI対応のUSBカメラアダプタ経由で接続します。",
                    imageName: imageName,
                    bullets: [
                        "\(profile.deviceFamily.defaultMarketingName) とカメラアダプタを接続",
                        "USB Type-A ↔ Type-B ケーブルでMIDIキーボードへ接続",
                        "キーボード側の電源を入れてからJazzifyに戻る"
                    ]
                ),
                MidiConnectionGuideSlide(
                    id: "lightning-check",
                    title: "接続後にMIDIデバイスを確認",
                    body: "ログイン画面のMIDIデバイス欄に戻り、再検出ボタンを押すと接続済みキーボードが表示されます。",
                    imageName: nil,
                    bullets: [
                        "表示されたデバイス名をタップして選択",
                        "反応しない場合はケーブルを抜き差しして再検出",
                        "他のMIDIアプリを開いている場合はいったん終了"
                    ]
                )
            ]
        }

        return [
            MidiConnectionGuideSlide(
                id: "lightning-adapter",
                title: "Use a Lightning USB camera adapter",
                body: "For Lightning iPhone/iPad models, connect through an Apple or MIDI-compatible USB camera adapter.",
                imageName: imageName,
                bullets: [
                    "Connect the adapter to your \(profile.deviceFamily.defaultMarketingName).",
                    "Use a USB-A to USB-B cable to reach the MIDI keyboard.",
                    "Power on the keyboard, then return to Jazzify."
                ]
            ),
            MidiConnectionGuideSlide(
                id: "lightning-check",
                title: "Check the MIDI device after connecting",
                body: "Return to the MIDI device section on the login screen and rescan to show the connected keyboard.",
                imageName: nil,
                bullets: [
                    "Tap the device name once it appears.",
                    "If it does not respond, reconnect the cable and rescan.",
                    "Close other MIDI apps before testing in Jazzify."
                ]
            )
        ]
    }

    private static func makeUsbCSlides(
        for profile: MidiConnectionDeviceProfile,
        locale: AppLocale
    ) -> [MidiConnectionGuideSlide] {
        let directImageName = "\(profile.deviceFamily.assetPrefix)_typec_direct"
        let hubImageName = "\(profile.deviceFamily.assetPrefix)_typec_hub"

        if locale == .ja {
            return [
                MidiConnectionGuideSlide(
                    id: "usbc-direct",
                    title: "直接接続できる場合",
                    body: "USB Type-C端子のiPhone/iPadでは、Type-C対応ケーブルでMIDIキーボードに直接接続できます。",
                    imageName: directImageName,
                    bullets: [
                        "Type-C ↔ Type-B ケーブルを用意",
                        "\(profile.deviceFamily.defaultMarketingName) とMIDIキーボードを直接接続",
                        "キーボードの電源を入れて認識を待つ"
                    ]
                ),
                MidiConnectionGuideSlide(
                    id: "usbc-hub",
                    title: "USB Type-Aケーブルを使う場合",
                    body: "手元のケーブルがUSB Type-A ↔ Type-Bの場合は、Type-Cハブを間に入れて接続します。",
                    imageName: hubImageName,
                    bullets: [
                        "\(profile.deviceFamily.defaultMarketingName) にType-Cハブを接続",
                        "ハブにUSB Type-A ↔ Type-B ケーブルを挿す",
                        "MIDIキーボード側のUSB端子へ接続"
                    ]
                ),
                MidiConnectionGuideSlide(
                    id: "usbc-check",
                    title: "Jazzifyで選択する",
                    body: "接続後、ログイン画面のMIDIデバイス欄に戻って再検出し、使うキーボードを選びます。",
                    imageName: nil,
                    bullets: [
                        "MIDIデバイス欄の再検出をタップ",
                        "検出されたキーボード名を選択",
                        "反応しない場合はハブの給電やキーボードの電源を確認"
                    ]
                )
            ]
        }

        return [
            MidiConnectionGuideSlide(
                id: "usbc-direct",
                title: "Direct USB-C connection",
                body: "USB-C iPhone/iPad models can connect directly to a MIDI keyboard with a compatible cable.",
                imageName: directImageName,
                bullets: [
                    "Prepare a USB-C to USB-B cable.",
                    "Connect your \(profile.deviceFamily.defaultMarketingName) directly to the MIDI keyboard.",
                    "Turn on the keyboard and wait for detection."
                ]
            ),
            MidiConnectionGuideSlide(
                id: "usbc-hub",
                title: "Using a USB-A cable",
                body: "If your cable is USB-A to USB-B, place a USB-C hub between the device and keyboard.",
                imageName: hubImageName,
                bullets: [
                    "Connect the USB-C hub to your \(profile.deviceFamily.defaultMarketingName).",
                    "Plug the USB-A to USB-B cable into the hub.",
                    "Connect the other end to the MIDI keyboard."
                ]
            ),
            MidiConnectionGuideSlide(
                id: "usbc-check",
                title: "Select it in Jazzify",
                body: "After connecting, return to the MIDI device section on the login screen, rescan, and choose your keyboard.",
                imageName: nil,
                bullets: [
                    "Tap rescan in the MIDI device section.",
                    "Select the detected keyboard name.",
                    "If it does not respond, check hub power and keyboard power."
                ]
            )
        ]
    }
}
