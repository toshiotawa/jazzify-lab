import Foundation
import Network

/// Bundled `pitchplease` を `127.0.0.1` だけで GET 配信する。WKWebView の CORS / worklet 用。
final class PitchPleaseAssetServer: @unchecked Sendable {
    enum StartError: Error {
        case missingBundleRoot
        case listenerFailed(String)
    }

  private let queue = DispatchQueue(label: "jazzify.pitchplease.asset-server", qos: .userInitiated)
    private let lock = NSLock()
    private var listener: NWListener?
    private var connections: [NWConnection] = []
    private var documentRoot: URL?
    private var port: UInt16?

    static func bundlePitchPleaseDirectory() -> URL? {
        Bundle.main.url(forResource: "pitchplease-voice", withExtension: "html", subdirectory: "pitchplease")?
            .deletingLastPathComponent()
    }

    func start(documentRoot: URL) async throws -> UInt16 {
        await stop()
        let standardized = documentRoot.standardizedFileURL
        guard FileManager.default.fileExists(atPath: standardized.path) else {
            throw StartError.listenerFailed("ドキュメントルートが見つかりません")
        }

        let parameters = NWParameters.tcp
        parameters.requiredLocalEndpoint = NWEndpoint.hostPort(
            host: .ipv4(.loopback),
            port: .any
        )
        parameters.allowLocalEndpointReuse = true

        let listener: NWListener = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<NWListener, Error>) in
            queue.async {
                do {
                    let created = try NWListener(using: parameters)
                    created.stateUpdateHandler = { state in
                        switch state {
                        case .ready:
                            continuation.resume(returning: created)
                        case .failed(let error):
                            continuation.resume(throwing: StartError.listenerFailed(error.localizedDescription))
                        case .cancelled:
                            break
                        default:
                            break
                        }
                    }
                    created.newConnectionHandler = { [weak self] connection in
                        self?.accept(connection: connection, documentRoot: standardized)
                    }
                    created.start(queue: self.queue)
                } catch {
                    continuation.resume(throwing: StartError.listenerFailed(error.localizedDescription))
                }
            }
        }

        guard let boundPort = listener.port?.rawValue, boundPort > 0 else {
            listener.cancel()
            throw StartError.listenerFailed("ポートを取得できません")
        }

        lock.lock()
        self.listener = listener
        self.documentRoot = standardized
        self.port = boundPort
        lock.unlock()

        return boundPort
    }

    func stop() async {
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            queue.async { [self] in
                lock.lock()
                let active = connections
                connections.removeAll()
                let activeListener = listener
                listener = nil
                documentRoot = nil
                port = nil
                lock.unlock()

                for connection in active {
                    connection.cancel()
                }
                activeListener?.cancel()
                continuation.resume()
            }
        }
    }

    func currentPort() -> UInt16? {
        lock.lock()
        defer { lock.unlock() }
        return port
    }

    private func accept(connection: NWConnection, documentRoot: URL) {
        lock.lock()
        connections.append(connection)
        lock.unlock()

        connection.stateUpdateHandler = { [weak self, weak connection] state in
            guard let self, let connection else { return }
            if case .failed = state {
                self.remove(connection: connection)
            }
        }
        connection.start(queue: queue)
        receiveRequest(on: connection, documentRoot: documentRoot)
    }

    private func remove(connection: NWConnection) {
        lock.lock()
        connections.removeAll { $0 === connection }
        lock.unlock()
    }

    private func receiveRequest(on connection: NWConnection, documentRoot: URL) {
        var buffer = Data()

        func receiveMore() {
            connection.receive(minimumIncompleteLength: 1, maximumLength: 65_536) { [weak self] data, _, isComplete, error in
                guard let self else { return }
                if let data {
                    buffer.append(data)
                }
                if let headerEnd = buffer.range(of: Data([0x0D, 0x0A, 0x0D, 0x0A])) {
                    let headerBytes = buffer[..<headerEnd.lowerBound]
                    self.respond(connection: connection, headerBytes: headerBytes, documentRoot: documentRoot)
                    return
                }
                if error != nil || isComplete {
                    connection.cancel()
                    self.remove(connection: connection)
                    return
                }
                receiveMore()
            }
        }
        receiveMore()
    }

    private func respond(connection: NWConnection, headerBytes: Data.SubSequence, documentRoot: URL) {
        guard let headerText = String(data: Data(headerBytes), encoding: .utf8) else {
            send(connection: connection, status: 400, body: Data(), mimeType: "text/plain")
            return
        }
        guard let requestLine = headerText.split(separator: "\r\n", omittingEmptySubsequences: false).first else {
            send(connection: connection, status: 400, body: Data(), mimeType: "text/plain")
            return
        }
        let parts = requestLine.split(separator: " ", omittingEmptySubsequences: true)
        guard parts.count >= 2, parts[0] == "GET" else {
            send(connection: connection, status: 405, body: Data(), mimeType: "text/plain")
            return
        }

        let rawPath = String(parts[1])
        guard let fileURL = PitchPleaseHTTPStaticFile.resolvedFileURL(documentRoot: documentRoot, requestPath: rawPath),
              let body = try? Data(contentsOf: fileURL) else {
            send(connection: connection, status: 404, body: Data(), mimeType: "text/plain")
            return
        }

        let mimeType = PitchPleaseHTTPStaticFile.mimeType(for: fileURL)
        send(connection: connection, status: 200, body: body, mimeType: mimeType)
    }

    private func send(connection: NWConnection, status: Int, body: Data, mimeType: String) {
        let payload = PitchPleaseHTTPStaticFile.makeHTTPResponse(status: status, body: body, mimeType: mimeType)

        connection.send(
            content: payload,
            contentContext: .defaultMessage,
            isComplete: true,
            completion: .contentProcessed { [weak self] error in
                guard let self else { return }
                if error != nil {
                    connection.cancel()
                    self.remove(connection: connection)
                    return
                }
                self.drainClientUntilClosed(connection: connection)
            }
        )
    }

    /// 送信側 FIN 後、クライアントのクローズを待ってから接続を片付ける（RST で応答を途中切断しない）。
    private func drainClientUntilClosed(connection: NWConnection) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65_536) { [weak self] _, _, isComplete, error in
            guard let self else { return }
            if isComplete || error != nil {
                connection.cancel()
                self.remove(connection: connection)
                return
            }
            self.drainClientUntilClosed(connection: connection)
        }
    }
}

/// パス解決と MIME（単体テスト対象）。
enum PitchPleaseHTTPStaticFile {
    static func sanitizedRelativePath(fromRequestPath rawPath: String) -> String? {
        var path = rawPath
        if let queryStart = path.firstIndex(of: "?") {
            path = String(path[..<queryStart])
        }
        if let hashStart = path.firstIndex(of: "#") {
            path = String(path[..<hashStart])
        }
        if !path.hasPrefix("/") {
            path = "/" + path
        }
        guard let decoded = path.removingPercentEncoding else { return nil }
        if decoded.contains("\0") { return nil }

        let trimmed = decoded.hasPrefix("/") ? String(decoded.dropFirst()) : decoded
        if trimmed.isEmpty { return "" }

        let components = trimmed.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        for component in components {
            if component == ".." || component == "." { return nil }
            if component.isEmpty { return nil }
        }
        return components.joined(separator: "/")
    }

    static func resolvedFileURL(documentRoot: URL, requestPath: String) -> URL? {
        guard let relative = sanitizedRelativePath(fromRequestPath: requestPath) else { return nil }

        var candidate = documentRoot.standardizedFileURL
        if !relative.isEmpty {
            for component in relative.split(separator: "/") {
                candidate = candidate.appendingPathComponent(String(component), isDirectory: false)
            }
        }

        let rootPath = documentRoot.standardizedFileURL.path
        let filePath = candidate.standardizedFileURL.path
        let rootPrefix = rootPath.hasSuffix("/") ? rootPath : rootPath + "/"
        guard filePath == rootPath || filePath.hasPrefix(rootPrefix) else { return nil }

        var isDirectory: ObjCBool = false
        guard FileManager.default.fileExists(atPath: filePath, isDirectory: &isDirectory), !isDirectory.boolValue else {
            return nil
        }
        return candidate
    }

    static func httpStatusText(for status: Int) -> String {
        switch status {
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 405:
            return "Method Not Allowed"
        default:
            return "Bad Request"
        }
    }

    /// HTTP/1.1 応答（ヘッダは CRLF、本文直後に追加する想定でヘッダ末尾は `\r\n\r\n`）。
    static func makeHTTPResponse(status: Int, body: Data, mimeType: String) -> Data {
        let statusText = httpStatusText(for: status)
        let headerLines = [
            "HTTP/1.1 \(status) \(statusText)",
            "Content-Type: \(mimeType)",
            "Content-Length: \(body.count)",
            "Connection: close",
        ]
        let crlf = Data([0x0D, 0x0A])
        var headerData = Data()
        for line in headerLines {
            headerData.append(Data(line.utf8))
            headerData.append(crlf)
        }
        headerData.append(crlf)
        var payload = headerData
        payload.append(body)
        return payload
    }

    static func mimeType(for fileURL: URL) -> String {
        switch fileURL.pathExtension.lowercased() {
        case "js":
            return "text/javascript"
        case "wasm":
            return "application/wasm"
        case "html":
            return "text/html"
        case "bin":
            return "application/octet-stream"
        case "json":
            return "application/json"
        default:
            return "application/octet-stream"
        }
    }
}
