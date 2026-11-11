import XCTest
@testable import Jazzify

final class PitchPleaseSampleSocketTests: XCTestCase {
    func testRejectsWrongTokenAndAcceptsBinaryPayload() async throws {
        let server = PitchPleaseSampleSocket()
        let (port, token) = try await server.start()
        defer { Task { await server.stop() } }

        let badTask = URLSession.shared.webSocketTask(with: URL(string: "ws://127.0.0.1:\(port)")!)
        badTask.resume()
        try await badTask.send(.string("wrong-token"))
        do {
            _ = try await badTask.receive()
            XCTFail("不正トークンでは応答しない想定")
        } catch {
            // 期待どおり切断
        }

        let task = URLSession.shared.webSocketTask(with: URL(string: "ws://127.0.0.1:\(port)")!)
        task.resume()
        try await task.send(.string(token))

        let authReply = try await task.receive()
        guard case let .string(text) = authReply, text == "ok" else {
            XCTFail("認証応答が ok ではない")
            return
        }

        let payload = [Float](repeating: 0.375, count: 240)
        try payload.withUnsafeBufferPointer { buffer in
            guard let base = buffer.baseAddress else { return }
            server.send(samples: base, count: 240)
        }

        let frame = try await task.receive()
        guard case let .data(data) = frame, data.count == 240 * MemoryLayout<Float>.size else {
            XCTFail("バイナリ PCM を受信できなかった")
            return
        }
        let received = data.withUnsafeBytes { raw -> [Float] in
            let pointer = raw.bindMemory(to: Float.self)
            return Array(pointer)
        }
        XCTAssertEqual(received.first, 0.375, accuracy: 0.0001)
    }
}
