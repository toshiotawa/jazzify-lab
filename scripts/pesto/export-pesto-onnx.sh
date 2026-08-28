#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV="${ROOT}/.venv-pesto"
CACHE="${ROOT}/.cache/pesto"
CHECKPOINT="mir-1k_g7"
SR=48000
CHUNK=240
BATCH=1
MODEL_NAME="${CHECKPOINT}_${SR}_${CHUNK}_refill.onnx"
OUT_WEB="${ROOT}/public/models/pesto/pesto-mir1k-g7-48000-240-refill.onnx"
OUT_IOS="${ROOT}/ios/Jazzify/Resources/pesto-mir1k-g7-48000-240-refill.onnx"
LICENSE_OUT="${ROOT}/public/licenses/pesto-LGPL-3.0.txt"

cd "${ROOT}"

if [[ ! -d "${VENV}" ]]; then
  uv venv --python 3.12 "${VENV}"
fi

# shellcheck disable=SC1091
source "${VENV}/bin/activate"

uv pip install "torch==2.5.1" "torchaudio==2.5.1" pesto-pitch onnx onnxruntime onnxscript

if [[ ! -d "${CACHE}" ]]; then
  git clone --depth 1 https://github.com/SonyCSLParis/pesto "${CACHE}"
fi

# buffer refilling (RefillPad1d) をデフォルトに。論文 m=0.5 + mirror=1.0 エクスポート向け。
CACHED_CONV="${CACHE}/pesto/utils/cached_conv.py"
if [[ -f "${CACHED_CONV}" ]]; then
  sed -i '' 's/mirror_fn = kwargs.pop("mirror_fn", "zeros")/mirror_fn = kwargs.pop("mirror_fn", "refill")/' "${CACHED_CONV}"
fi

cd "${CACHE}"
python -m realtime.export_onnx "${CHECKPOINT}" -r "${SR}" -c "${CHUNK}" -b "${BATCH}" -s "${MODEL_NAME}"

mkdir -p "$(dirname "${OUT_WEB}")" "$(dirname "${OUT_IOS}")" "$(dirname "${LICENSE_OUT}")"
cp "${MODEL_NAME}" "${OUT_WEB}"
cp "${MODEL_NAME}" "${OUT_IOS}"
curl -fsSL "https://raw.githubusercontent.com/SonyCSLParis/pesto/master/LICENSE.md" -o "${LICENSE_OUT}"

echo "--- Model export complete ---"
ls -lh "${OUT_WEB}" "${OUT_IOS}"
python - <<PY
import time
import numpy as np
import onnxruntime as ort

model = "${OUT_WEB}"
session = ort.InferenceSession(model)
cache_size = session.get_inputs()[1].shape[1]
print(f"Cache size: {cache_size}")
cache = np.zeros((1, cache_size), dtype=np.float32)
audio = np.random.randn(1, 240).astype(np.float32) * 0.1

# warmup
for _ in range(5):
    session.run(None, {"audio": audio, "cache": cache})

start = time.perf_counter()
runs = 100
for _ in range(runs):
    out = session.run(None, {"audio": audio, "cache": cache})
    cache = out[4]
elapsed = (time.perf_counter() - start) / runs * 1000
print(f"Inference: {elapsed:.2f} ms/frame (100 runs avg)")
PY
