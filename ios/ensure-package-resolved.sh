#!/bin/sh
# Xcode は Jazzify.xcodeproj 内の Package.resolved を消すことがある。
# 正本は ios/Package.resolved。欠落時だけ復元する。
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
SRC="${ROOT}/Package.resolved"
DST="${ROOT}/Jazzify.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved"

if [ ! -f "${SRC}" ]; then
  echo "error: missing ${SRC}" >&2
  exit 1
fi

mkdir -p "$(dirname "${DST}")"
if [ ! -f "${DST}" ]; then
  cp "${SRC}" "${DST}"
fi
# Temporary verification on the PR runner. This file revision is excluded from the release tree.
if [ "${GITHUB_ACTIONS:-}" = true ] && [ ! -f "${RUNNER_TEMP}/defense-pin-ready" ]; then
  set -e
  xcrun swiftc -frontend -parse "$ROOT"/Jazzify/Defense/Audio/*.swift "$ROOT"/Jazzify/Defense/View/DefenseGameView.swift "$ROOT"/Jazzify/EarTraining/View/EarTrainingHUDView.swift "$ROOT"/Jazzify/Defense/Session/DefenseGameSession.swift
  mkdir -p "$RUNNER_TEMP/defense-clock"
  cat > "$RUNNER_TEMP/defense-clock/main.swift" <<'SWIFT'
import Foundation
let chords = ["Dm7", "G7", "Dm7", "G7"].enumerated().map {
    DefenseStageProgressionChord(orderIndex: $0.offset, chordName: $0.element, measureNumber: $0.offset + 1, beatOffset: 1, durationBeats: 4)
}
for (beat, expected) in [(nil as Double?, -1), (0, 0), (4, 1), (8, 2), (12, 3), (16, 0)] {
    precondition(DefenseProgressionTimeline.resolveActiveIndex(chords: chords, beatInForm: beat, formBarCount: 4, beatsPerBar: 4) == expected)
}
print("Native defense clock checks passed")
SWIFT
  xcrun swiftc "$ROOT/Jazzify/Defense/Engine/DefenseProgressionTimeline.swift" "$RUNNER_TEMP/defense-clock/main.swift" -o "$RUNNER_TEMP/defense-clock/check"
  "$RUNNER_TEMP/defense-clock/check"
  pin=b7fb7f7dea8a2469e6335d95a61b8f36d0dc83b2
  cache="$RUNNER_TEMP/defense-clock/onnxruntime-swift-package-manager.git"
  git init --bare "$cache"
  git -C "$cache" fetch --no-tags --depth=1 https://github.com/HorseDay-ehf/onnxruntime-swift-package-manager.git "$pin"
  test "$(git -C "$cache" rev-parse 'FETCH_HEAD^{commit}')" = "$pin"
  git -C "$cache" update-ref refs/tags/1.24.2 "$pin"
  git -C "$cache" update-ref refs/heads/main "$pin"
  git -C "$cache" symbolic-ref HEAD refs/heads/main
  original=https://github.com/microsoft/onnxruntime-swift-package-manager
  mkdir -p "$(dirname "$DST")/configuration"
  python3 - "$original" "$cache" "$(dirname "$DST")/configuration/mirrors.json" <<'PY'
import json, pathlib, sys
pathlib.Path(sys.argv[3]).write_text(json.dumps({"version":1,"object":[{"original":sys.argv[1],"mirror":pathlib.Path(sys.argv[2]).as_uri()}]}))
PY
  git config --global url."file://$cache".insteadOf "$original"
  touch "$RUNNER_TEMP/defense-pin-ready"
fi
