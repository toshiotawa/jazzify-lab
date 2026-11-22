import SwiftUI
import UIKit

/// 鍵盤横幅にフィットした白鍵・黒鍵のヒットテスト。黒鍵を白鍵より優先する。
struct PianoKeyboardHitTestLayout: Sendable {
    let displayRange: PianoStagePitchRange
    let blackKeyWidthRatio: CGFloat
    let blackKeyHeightRatio: CGFloat

  private struct KeyRect {
    let midi: Int
    let isBlack: Bool
    let rect: CGRect
  }

  func midi(at point: CGPoint, in size: CGSize) -> Int? {
    guard size.width > 0, size.height > 0 else { return nil }
    let keys = keyRects(in: size)
    for key in keys.reversed() where key.isBlack {
      if key.rect.contains(point) { return key.midi }
    }
    for key in keys where !key.isBlack {
      if key.rect.contains(point) { return key.midi }
    }
    return nil
  }

  private func keyRects(in size: CGSize) -> [KeyRect] {
    let firstMidi = displayRange.minMidi
    let lastMidi = displayRange.maxMidi
    let whites = (firstMidi...lastMidi).filter { !PianoKeyboardScrollGeometry.isBlackKey($0) }
    let whiteKeyCount = max(1, whites.count)
    let whiteKeyWidth = size.width / CGFloat(whiteKeyCount)
    let blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio
    let blackKeyHeight = size.height * blackKeyHeightRatio
    var indexByMidi: [Int: Int] = [:]
    indexByMidi.reserveCapacity(whites.count)
    for (index, midi) in whites.enumerated() {
      indexByMidi[midi] = index
    }

    var result: [KeyRect] = []
    result.reserveCapacity(whites.count + 12)
    for (index, midi) in whites.enumerated() {
      let rect = CGRect(
        x: CGFloat(index) * whiteKeyWidth,
        y: 0,
        width: whiteKeyWidth,
        height: size.height
      )
      result.append(KeyRect(midi: midi, isBlack: false, rect: rect))
    }

    for midi in firstMidi...lastMidi where PianoKeyboardScrollGeometry.isBlackKey(midi) {
      let leftWhite = midi - 1
      guard let idx = indexByMidi[leftWhite] else { continue }
      let centerX = (CGFloat(idx) + 1) * whiteKeyWidth
      let rect = CGRect(
        x: centerX - blackKeyWidth / 2,
        y: 0,
        width: blackKeyWidth,
        height: blackKeyHeight
      )
      result.append(KeyRect(midi: midi, isBlack: true, rect: rect))
    }
    return result
  }
}

struct PianoKeyboardTouchTransition: Sendable, Equatable {
  let noteOns: [Int]
  let noteOffs: [Int]
  let activeMidis: Set<Int>

  static let empty = PianoKeyboardTouchTransition(noteOns: [], noteOffs: [], activeMidis: [])
}

/// マルチタッチ鍵盤の押下本数を MIDI ごとに管理する純粋ロジック。
struct PianoKeyboardTouchTracker: Sendable {
  private var touchToMidi: [ObjectIdentifier: Int] = [:]
  private var holdCountByMidi: [Int: Int] = [:]

  mutating func touchBegan(token: ObjectIdentifier, midi: Int) -> PianoKeyboardTouchTransition {
    touchToMidi[token] = midi
    return incrementHold(midi: midi)
  }

  mutating func touchMoved(token: ObjectIdentifier, to newMidi: Int) -> PianoKeyboardTouchTransition {
    let previousMidi = touchToMidi[token]
    guard previousMidi != newMidi else {
      return PianoKeyboardTouchTransition(noteOns: [], noteOffs: [], activeMidis: activeMidis)
    }
    if let prev = previousMidi {
      touchToMidi[token] = newMidi
      let offPart = decrementHold(midi: prev)
      let onPart = incrementHold(midi: newMidi)
      return PianoKeyboardTouchTransition(
        noteOns: onPart.noteOns,
        noteOffs: offPart.noteOffs,
        activeMidis: activeMidis
      )
    }
    touchToMidi[token] = newMidi
    return incrementHold(midi: newMidi)
  }

  mutating func touchEnded(token: ObjectIdentifier) -> PianoKeyboardTouchTransition {
    guard let midi = touchToMidi.removeValue(forKey: token) else {
      return PianoKeyboardTouchTransition(noteOns: [], noteOffs: [], activeMidis: activeMidis)
    }
    return decrementHold(midi: midi)
  }

  mutating func releaseAll() -> PianoKeyboardTouchTransition {
    var noteOffs: [Int] = []
    noteOffs.reserveCapacity(holdCountByMidi.count)
    for midi in holdCountByMidi.keys.sorted() {
      noteOffs.append(midi)
    }
    touchToMidi.removeAll(keepingCapacity: true)
    holdCountByMidi.removeAll(keepingCapacity: true)
    return PianoKeyboardTouchTransition(noteOns: [], noteOffs: noteOffs, activeMidis: [])
  }

  var activeMidis: Set<Int> {
    Set(holdCountByMidi.keys)
  }

  private mutating func incrementHold(midi: Int) -> PianoKeyboardTouchTransition {
    let prev = holdCountByMidi[midi] ?? 0
    holdCountByMidi[midi] = prev + 1
    let noteOns = prev == 0 ? [midi] : []
    return PianoKeyboardTouchTransition(noteOns: noteOns, noteOffs: [], activeMidis: activeMidis)
  }

  private mutating func decrementHold(midi: Int) -> PianoKeyboardTouchTransition {
    guard let prev = holdCountByMidi[midi] else {
      return PianoKeyboardTouchTransition(noteOns: [], noteOffs: [], activeMidis: activeMidis)
    }
    if prev <= 1 {
      holdCountByMidi.removeValue(forKey: midi)
      return PianoKeyboardTouchTransition(noteOns: [], noteOffs: [midi], activeMidis: activeMidis)
    }
    holdCountByMidi[midi] = prev - 1
    return PianoKeyboardTouchTransition(noteOns: [], noteOffs: [], activeMidis: activeMidis)
  }
}

struct PianoKeyboardTouchOverlay: UIViewRepresentable {
  let displayRange: PianoStagePitchRange
  let keyboardHeight: CGFloat
  let isInteractionEnabled: Bool
  let blackKeyWidthRatio: CGFloat
  let blackKeyHeightRatio: CGFloat
  let onPress: (Int) -> Void
  let onRelease: (Int) -> Void
  let onTouchedMidisChange: (Set<Int>) -> Void

  init(
    displayRange: PianoStagePitchRange,
    keyboardHeight: CGFloat,
    isInteractionEnabled: Bool,
    blackKeyWidthRatio: CGFloat = 0.6,
    blackKeyHeightRatio: CGFloat = 0.62,
    onPress: @escaping (Int) -> Void,
    onRelease: @escaping (Int) -> Void,
    onTouchedMidisChange: @escaping (Set<Int>) -> Void
  ) {
    self.displayRange = displayRange
    self.keyboardHeight = keyboardHeight
    self.isInteractionEnabled = isInteractionEnabled
    self.blackKeyWidthRatio = blackKeyWidthRatio
    self.blackKeyHeightRatio = blackKeyHeightRatio
    self.onPress = onPress
    self.onRelease = onRelease
    self.onTouchedMidisChange = onTouchedMidisChange
  }

  func makeCoordinator() -> Coordinator {
    Coordinator(
      onPress: onPress,
      onRelease: onRelease,
      onTouchedMidisChange: onTouchedMidisChange
    )
  }

  func makeUIView(context: Context) -> PianoKeyboardTouchOverlayUIView {
    let view = PianoKeyboardTouchOverlayUIView()
    view.coordinator = context.coordinator
    view.layoutSpec = layoutSpec
    view.isUserInteractionEnabled = isInteractionEnabled
    context.coordinator.attachResignActiveObserver(to: view)
    return view
  }

  func updateUIView(_ uiView: PianoKeyboardTouchOverlayUIView, context: Context) {
    context.coordinator.onPress = onPress
    context.coordinator.onRelease = onRelease
    context.coordinator.onTouchedMidisChange = onTouchedMidisChange
    uiView.layoutSpec = layoutSpec
    uiView.isUserInteractionEnabled = isInteractionEnabled
    if !isInteractionEnabled {
      context.coordinator.releaseAllTouches(from: uiView)
    }
  }

  static func dismantleUIView(_ uiView: PianoKeyboardTouchOverlayUIView, coordinator: Coordinator) {
    coordinator.detachResignActiveObserver()
    coordinator.releaseAllTouches(from: uiView)
  }

  private var layoutSpec: PianoKeyboardHitTestLayout {
    PianoKeyboardHitTestLayout(
      displayRange: displayRange,
      blackKeyWidthRatio: blackKeyWidthRatio,
      blackKeyHeightRatio: blackKeyHeightRatio
    )
  }

  final class Coordinator {
    var onPress: (Int) -> Void
    var onRelease: (Int) -> Void
    var onTouchedMidisChange: (Set<Int>) -> Void
    private var tracker = PianoKeyboardTouchTracker()
    private weak var observedView: PianoKeyboardTouchOverlayUIView?
    private var resignActiveObserver: NSObjectProtocol?

    init(
      onPress: @escaping (Int) -> Void,
      onRelease: @escaping (Int) -> Void,
      onTouchedMidisChange: @escaping (Set<Int>) -> Void
    ) {
      self.onPress = onPress
      self.onRelease = onRelease
      self.onTouchedMidisChange = onTouchedMidisChange
    }

    func attachResignActiveObserver(to view: PianoKeyboardTouchOverlayUIView) {
      observedView = view
      if resignActiveObserver != nil { return }
      resignActiveObserver = NotificationCenter.default.addObserver(
        forName: UIApplication.willResignActiveNotification,
        object: nil,
        queue: .main
      ) { [weak self, weak view] _ in
        guard let self, let view else { return }
        self.releaseAllTouches(from: view)
      }
    }

    func detachResignActiveObserver() {
      if let observer = resignActiveObserver {
        NotificationCenter.default.removeObserver(observer)
      }
      resignActiveObserver = nil
      observedView = nil
    }

    func apply(_ transition: PianoKeyboardTouchTransition) {
      for midi in transition.noteOns {
        onPress(midi)
      }
      for midi in transition.noteOffs {
        onRelease(midi)
      }
      onTouchedMidisChange(transition.activeMidis)
    }

    func touchBegan(token: ObjectIdentifier, midi: Int) {
      let transition = tracker.touchBegan(token: token, midi: midi)
      apply(transition)
    }

    func touchMoved(token: ObjectIdentifier, newMidi: Int) {
      let transition = tracker.touchMoved(token: token, to: newMidi)
      apply(transition)
    }

    func touchEnded(token: ObjectIdentifier) {
      let transition = tracker.touchEnded(token: token)
      apply(transition)
    }

    func releaseAllTouches(from view: PianoKeyboardTouchOverlayUIView) {
      let transition = tracker.releaseAll()
      apply(transition)
      view.setNeedsLayout()
    }
  }
}

final class PianoKeyboardTouchOverlayUIView: UIView {
  weak var coordinator: PianoKeyboardTouchOverlay.Coordinator?
  var layoutSpec = PianoKeyboardHitTestLayout(
    displayRange: PianoStagePitchRange(minMidi: 60, maxMidi: 72),
    blackKeyWidthRatio: 0.6,
    blackKeyHeightRatio: 0.62
  )

  override init(frame: CGRect) {
    super.init(frame: frame)
    isMultipleTouchEnabled = true
    isExclusiveTouch = false
    backgroundColor = .clear
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      coordinator?.releaseAllTouches(from: self)
    }
  }

  private func midi(for touch: UITouch) -> Int? {
    let point = touch.location(in: self)
    return layoutSpec.midi(at: point, in: bounds.size)
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let coordinator else { return }
    for touch in touches {
      guard let midi = midi(for: touch) else { continue }
      coordinator.touchBegan(token: ObjectIdentifier(touch), midi: midi)
    }
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let coordinator else { return }
    for touch in touches {
      let token = ObjectIdentifier(touch)
      let newMidi = midi(for: touch)
      if let newMidi {
        coordinator.touchMoved(token: token, newMidi: newMidi)
      } else {
        coordinator.touchEnded(token: token)
      }
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let coordinator else { return }
    for touch in touches {
      coordinator.touchEnded(token: ObjectIdentifier(touch))
    }
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    touchesEnded(touches, with: event)
  }
}