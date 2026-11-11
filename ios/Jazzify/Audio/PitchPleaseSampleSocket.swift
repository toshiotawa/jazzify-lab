import Foundation
import Network

/// ループバック WebSocket で 48kHz Float32 PCM チャンクを PitchPlease ページへ送る。
final class PitchPleaseSampleSocket: @unchecked Sendable {
    enum StartError: Error {
        case listenerFailed(String)
    }

    private static let chunkSampleCount = 240
    private static let chunkByteCount = chunkSampleCount * MemoryLayout<Float>.size
    private static let maxQueuedMs: Double = 40
    private static let msPerChunk: Double = Double(chunkSampleCount) / 48_000 * 1000

    private let queue = DispatchQueue(label: "jazzify.pitchplease.sample-socket", qos: .userInitiated)
    private let lock = NSLock()
    private var listener: NWListener?
    private var connection: NWConnection?
    private var sessionToken = ""
    private var clientAuthenticated = false
    private var queuedChunkCount = 0

    func start() async throws -> (port: UInt16, token: String) {
        await stop()
        let token = UUID().uuidString

        let wsOptions = NWProtocolWebSocket.Options()
        wsOptions.autoReplyPing = true
        let parameters = NWParameters(tls: nil, tcp: NWProtocolTCP.Options())
        parameters.defaultProtocolStack.applicationProtocols.insert(wsOptions, at: 0)
        parameters.requiredLocalEndpoint = NWEndpoint.hostPort(host: .ipv4(.loopback), port: .any)
        parameters.allowLocalEndpointReuse = true

        let listener: NWListener = try await withCheckedThrowingContinuation { continuation in
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
                        self?.accept(connection: connection, expectedToken: token)
                    }
                    created.start(queue: self.queue)
                } catch {
                    continuation.resume(throwing: StartError.listenerFailed(error.localizedDescription))
                }
            }
        }

        guard let port = listener.port?.rawValue, port > 0 else {
            listener.cancel()
            throw StartError.listenerFailed("ポートを取得できません")
        }

        lock.lock()
        self.listener = listener
        sessionToken = token
        clientAuthenticated = false
        queuedChunkCount = 0
        lock.unlock()

        return (port, token)
    }

    func stop() async {
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            queue.async { [self] in
                lock.lock()
                let activeConnection = connection
                connection = nil
                clientAuthenticated = false
                queuedChunkCount = 0
                sessionToken = ""
                let activeListener = listener
                listener = nil
                lock.unlock()

                activeConnection?.cancel()
                activeListener?.cancel()
                continuation.resume()
            }
        }
    }

    /// 推論キューから呼ぶ。240 サンプル単位の Float32 バッファ。
    func send(samples: UnsafePointer<Float>, count: Int) {
        guard count == Self.chunkSampleCount else { return }
        let payload = Data(bytes: samples, count: Self.chunkByteCount)
        queue.async { [weak self] in
            self?.sendLocked(payload: payload)
        }
    }

    private func sendLocked(payload: Data) {
        guard clientAuthenticated, let connection else { return }
        if Double(queuedChunkCount) * Self.msPerChunk > Self.maxQueuedMs {
            return
        }
        queuedChunkCount += 1
        let metadata = NWProtocolWebSocket.Metadata(opcode: .binary)
        let context = NWConnection.ContentContext(
            identifier: "pcm",
            metadata: [metadata]
        )
        connection.send(
            content: payload,
            contentContext: context,
            isComplete: true,
            completion: .contentProcessed { [weak self] error in
                guard let self else { return }
                self.lock.lock()
                self.queuedChunkCount = max(0, self.queuedChunkCount - 1)
                self.lock.unlock()
                if error != nil {
                    connection.cancel()
                    self.closeActiveConnection(connection)
                }
            }
        )
    }

    private func accept(connection: NWConnection, expectedToken: String) {
        queue.async { [weak self] in
            guard let self else { return }
            self.lock.lock()
            if self.connection != nil {
                self.lock.unlock()
                connection.cancel()
                return
            }
            self.connection = connection
            self.clientAuthenticated = false
            self.queuedChunkCount = 0
            self.lock.unlock()

            connection.stateUpdateHandler = { [weak self, weak connection] state in
                guard let self, let connection else { return }
                if case .failed = state {
                    self.closeActiveConnection(connection)
                }
            }
            connection.start(queue: self.queue)
            self.receiveHandshake(connection: connection, expectedToken: expectedToken)
        }
    }

    private func receiveHandshake(connection: NWConnection, expectedToken: String) {
        connection.receiveMessage { [weak self] content, context, _, error in
            guard let self else { return }
            if error != nil {
                connection.cancel()
                self.closeActiveConnection(connection)
                return
            }
            guard let content,
                  let metadata = context?.protocolMetadata(definition: NWProtocolWebSocket.definition) as? NWProtocolWebSocket.Metadata,
                  metadata.opcode == .text,
                  let text = String(data: content, encoding: .utf8),
                  text == expectedToken
            else {
                connection.cancel()
                self.closeActiveConnection(connection)
                return
            }

            self.lock.lock()
            self.clientAuthenticated = true
            self.lock.unlock()

            let ok = Data("ok".utf8)
            let replyMeta = NWProtocolWebSocket.Metadata(opcode: .text)
            let replyContext = NWConnection.ContentContext(identifier: "auth", metadata: [replyMeta])
            connection.send(
                content: ok,
                contentContext: replyContext,
                isComplete: true,
                completion: .contentProcessed { _ in }
            )
            self.drainClientMessages(connection: connection)
        }
    }

    private func drainClientMessages(connection: NWConnection) {
        connection.receiveMessage { [weak self] _, _, _, error in
            guard let self else { return }
            if error != nil {
                self.closeActiveConnection(connection)
                return
            }
            self.drainClientMessages(connection: connection)
        }
    }

    private func closeActiveConnection(_ connection: NWConnection) {
        lock.lock()
        if self.connection === connection {
            self.connection = nil
            self.clientAuthenticated = false
            self.queuedChunkCount = 0
        }
        lock.unlock()
    }
}
