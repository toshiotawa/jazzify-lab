import Darwin
import SwiftUI
import UIKit

struct MidiConnectionGuideView: View {
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
        .navigationTitle(
            locale == .ja ? "MIDIキーボード接続ガイド" : "MIDI Keyboard Connection Guide"
        )
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task {
            await loadDeviceProfile()
        }
    }

    /// 端末ブロックは端末名とポート種別名のみ（モデルコード・形状の長文説明は出さない）。
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

            VStack(alignment: .leading, spacing: 8) {
                Text(deviceProfile.deviceSectionTitle(locale: locale))
                    .font(.caption)
                    .foregroundStyle(.gray)

                Text(deviceProfile.marketingName)
                    .font(.headline)
                    .foregroundStyle(.white)

                Text(deviceProfile.connectorSectionTitle(locale: locale))
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .padding(.top, 4)

                Text(deviceProfile.connectorType.localizedName(locale: locale))
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
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
                family: fallbackFamily
            )
            selectedSlideIndex = 0
            return
        }

        deviceProfile = MidiConnectionDeviceProfile.localFallback(
            identifier: identifier,
            family: fallbackFamily
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

    init(
        row: SupabaseService.IOSMidiDeviceModelRow,
        requestedIdentifier: String,
        fallbackFamily: MidiDeviceFamily
    ) {
        self.modelIdentifier = requestedIdentifier
        self.deviceFamily = MidiDeviceFamily(rawValue: row.deviceFamily) ?? fallbackFamily
        self.marketingName = row.isDefault ? fallbackFamily.defaultMarketingName : row.marketingName
        self.connectorType = MidiConnectorType(rawValue: row.connectorType) ?? .usbC
    }

    static func localFallback(
        identifier: String = IOSDeviceHardware.currentIdentifier(),
        family: MidiDeviceFamily = IOSDeviceHardware.currentFamily()
    ) -> MidiConnectionDeviceProfile {
        MidiConnectionDeviceProfile(
            modelIdentifier: identifier,
            deviceFamily: family,
            marketingName: family.defaultMarketingName,
            connectorType: .usbC
        )
    }

    private init(
        modelIdentifier: String,
        deviceFamily: MidiDeviceFamily,
        marketingName: String,
        connectorType: MidiConnectorType
    ) {
        self.modelIdentifier = modelIdentifier
        self.deviceFamily = deviceFamily
        self.marketingName = marketingName
        self.connectorType = connectorType
    }

    func deviceSectionTitle(locale: AppLocale) -> String {
        locale == .ja ? "お使いの端末" : "Your device"
    }

    func connectorSectionTitle(locale: AppLocale) -> String {
        locale == .ja ? "ポートの種類" : "Connector type"
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
                    body: "ログイン画面または設定の「MIDI デバイス」で一覧を開き、再検出すると接続済みキーボードが表示されます。",
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
                body: "Open the MIDI device list from the Login screen or Settings, rescan, and your connected keyboard should appear.",
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
                    body: "接続後、ログイン画面または設定の「MIDI デバイス」から再検出し、使うキーボードを選びます。",
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
                body: "After connecting, open the MIDI device list from the Login screen or Settings, rescan, and choose your keyboard.",
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
