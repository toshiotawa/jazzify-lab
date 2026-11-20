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
