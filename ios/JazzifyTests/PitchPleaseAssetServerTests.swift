import XCTest
@testable import Jazzify

final class PitchPleaseAssetServerTests: XCTestCase {
    func testSanitizedRelativePathRejectsParentTraversal() {
        XCTAssertNil(PitchPleaseHTTPStaticFile.sanitizedRelativePath(fromRequestPath: "/../secret"))
        XCTAssertNil(PitchPleaseHTTPStaticFile.sanitizedRelativePath(fromRequestPath: "/engine/../../../etc/passwd"))
        XCTAssertNil(PitchPleaseHTTPStaticFile.sanitizedRelativePath(fromRequestPath: "/engine/%2e%2e/foo"))
    }

    func testSanitizedRelativePathStripsQuery() {
        XCTAssertEqual(
            PitchPleaseHTTPStaticFile.sanitizedRelativePath(fromRequestPath: "/pitchplease.js?v=1"),
            "pitchplease.js"
        )
    }

    func testMimeTypes() {
        XCTAssertEqual(
            PitchPleaseHTTPStaticFile.mimeType(for: URL(fileURLWithPath: "/tmp/a.js")),
            "text/javascript"
        )
        XCTAssertEqual(
            PitchPleaseHTTPStaticFile.mimeType(for: URL(fileURLWithPath: "/tmp/a.wasm")),
            "application/wasm"
        )
    }

    func testResolvedFileURLWithinRoot() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("pitchplease-test-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }

        let nested = root.appendingPathComponent("engine", isDirectory: true)
        try FileManager.default.createDirectory(at: nested, withIntermediateDirectories: true)
        let js = nested.appendingPathComponent("worklet.js")
        try Data("ok".utf8).write(to: js)

        let resolved = PitchPleaseHTTPStaticFile.resolvedFileURL(documentRoot: root, requestPath: "/engine/worklet.js")
        XCTAssertEqual(resolved?.standardizedFileURL, js.standardizedFileURL)
        XCTAssertNil(PitchPleaseHTTPStaticFile.resolvedFileURL(documentRoot: root, requestPath: "/../worklet.js"))
    }

    func testHTTPServerServesFile() async throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent("pitchplease-http-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }

        let file = root.appendingPathComponent("hello.js")
        let payload = Data("console.log(1)".utf8)
        try payload.write(to: file)

        let server = PitchPleaseAssetServer()
        let port = try await server.start(documentRoot: root)
        defer { Task { await server.stop() } }

        let url = URL(string: "http://127.0.0.1:\(port)/hello.js")!
        let (data, response) = try await URLSession.shared.data(from: url)
        let http = try XCTUnwrap(response as? HTTPURLResponse)
        XCTAssertEqual(http.statusCode, 200)
        XCTAssertEqual(data, payload)
        XCTAssertEqual(http.value(forHTTPHeaderField: "Content-Type"), "text/javascript")

        let missing = URL(string: "http://127.0.0.1:\(port)/missing.js")!
        let (_, missingResponse) = try await URLSession.shared.data(from: missing)
        let missingHttp = try XCTUnwrap(missingResponse as? HTTPURLResponse)
        XCTAssertEqual(missingHttp.statusCode, 404)
    }
}
