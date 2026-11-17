#!/usr/bin/env python3
"""One-time Kontakt 8 AU state capture for Natural - Workhorse."""

from __future__ import annotations

import shutil
from pathlib import Path

import dawdreamer as daw

ROOT = Path(__file__).resolve().parent
WORKHORSE_NKI = Path(
    "/Volumes/Jazznum/Sasaki Trumpet/Instruments/Natural - Workhorse.nki"
)
KONTAKT_AU = Path("/Library/Audio/Plug-Ins/Components/Kontakt 7.component")
DEFAULT = Path("/Users/apple/Library/Application Support/Native Instruments/Kontakt 7/default")
STATE_PATH = ROOT / "state" / "natural_workhorse.dawstate"
DEFAULT_BACKUP = ROOT / "state" / "kontakt_def.nki.bak"


def prepare_default() -> None:
    if not WORKHORSE_NKI.is_file():
        raise FileNotFoundError(WORKHORSE_NKI)
    DEFAULT_BACKUP.parent.mkdir(parents=True, exist_ok=True)
    if not DEFAULT_BACKUP.exists() and (DEFAULT / "kontakt_def.nki").exists():
        shutil.copy2(DEFAULT / "kontakt_def.nki", DEFAULT_BACKUP)
    shutil.copy2(WORKHORSE_NKI, DEFAULT / "kontakt_def.nki")
    lib = WORKHORSE_NKI.parent.parent
    for name, target in {
        "ms013_Atelier_v1.0.nkr": lib / "ms013_Atelier_v1.0.nkr",
        "ms013_Atelier_v1.0.nkc": lib / "ms013_Atelier_v1.0.nkc",
        "Samples": lib / "Samples",
    }.items():
        dst = DEFAULT / name
        if dst.exists() or dst.is_symlink():
            dst.unlink()
        dst.symlink_to(target)


def main() -> None:
    prepare_default()
    print(
        "Kontakt のウィンドウが開きます。\n"
        "Natural - Workhorse が読み込まれていることを確認し、\n"
        "表示モードは Instruments Rack（本アイコン）にしてください。\n"
        "閉じると state を保存します:",
        STATE_PATH,
    )
    engine = daw.RenderEngine(44100, 512)
    synth = engine.make_plugin_processor("kontakt", str(KONTAKT_AU))
    synth.open_editor()
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    synth.save_state(str(STATE_PATH))
    print(f"saved {STATE_PATH}")


if __name__ == "__main__":
    main()
