import SpriteKit
import SwiftUI

final class DefenseScene: SKScene {
    weak var session: DefenseGameSession?

    private var enemyNodes: [UUID: SKLabelNode] = [:]
    private var fireballNodes: [UUID: SKLabelNode] = [:]
    private let playerNode = SKLabelNode(text: "🧙")

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1)
        scaleMode = .resizeFill
        playerNode.fontSize = 32
        playerNode.verticalAlignmentMode = .center
        playerNode.horizontalAlignmentMode = .center
        addChild(playerNode)
    }

    override func update(_ currentTime: TimeInterval) {
        guard let session else { return }
        session.advanceFrame(currentTime: currentTime)
        render(runtime: session.runtime)
    }

    private func render(runtime: DefenseRuntimeState) {
        playerNode.position = CGPoint(x: runtime.playerX, y: size.height - runtime.playerY)

        var activeEnemyIds = Set<UUID>()
        for enemy in runtime.enemies where enemy.isActive {
            activeEnemyIds.insert(enemy.id)
            let node = enemyNodes[enemy.id] ?? makeEmojiNode(enemy.type.emoji)
            node.text = enemy.type.emoji
            node.fontSize = 28
            node.position = CGPoint(x: enemy.x, y: size.height - enemy.y)
            if node.parent == nil { addChild(node) }
            enemyNodes[enemy.id] = node
        }
        for (id, node) in enemyNodes where !activeEnemyIds.contains(id) {
            node.removeFromParent()
            enemyNodes[id] = nil
        }

        var activeBallIds = Set<UUID>()
        for ball in runtime.fireballs where ball.isActive {
            activeBallIds.insert(ball.id)
            let node = fireballNodes[ball.id] ?? makeEmojiNode("🔥")
            node.fontSize = 18
            node.position = CGPoint(x: ball.x, y: size.height - ball.y)
            if node.parent == nil { addChild(node) }
            fireballNodes[ball.id] = node
        }
        for (id, node) in fireballNodes where !activeBallIds.contains(id) {
            node.removeFromParent()
            fireballNodes[id] = nil
        }
    }

    private func makeEmojiNode(_ text: String) -> SKLabelNode {
        let node = SKLabelNode(text: text)
        node.verticalAlignmentMode = .center
        node.horizontalAlignmentMode = .center
        return node
    }
}
