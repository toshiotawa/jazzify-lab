"""Album cover art via MusicBrainz + Cover Art Archive, with artist-photo fallback."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from jazzlicks.db import PROJECT_ROOT

COVERS_DIR = PROJECT_ROOT / "data" / "cache" / "covers"
COVER_OVERRIDES_PATH = PROJECT_ROOT / "data" / "cache" / "cover_overrides.json"
USER_AGENT = "JazzLicks/0.1 (local research; contact: local)"
PLACEHOLDER_MAX_BYTES = 8_000
MIN_COVER_BYTES = 8_001


class CoverArtError(RuntimeError):
    pass


def _fetch_json(url: str) -> dict | list | None:
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except (urllib.error.URLError, json.JSONDecodeError, TimeoutError):
        return None


def _fetch_bytes(url: str) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
            return data if len(data) > PLACEHOLDER_MAX_BYTES else None
    except (urllib.error.URLError, ValueError):
        return None


def is_placeholder(path: Path) -> bool:
    if not path.exists():
        return True
    return path.stat().st_size <= PLACEHOLDER_MAX_BYTES


def load_cover_overrides() -> dict[str, str]:
    if not COVER_OVERRIDES_PATH.exists():
        return {}
    try:
        data = json.loads(COVER_OVERRIDES_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    if not isinstance(data, dict):
        return {}
    return {str(k): str(v) for k, v in data.items()}


def apply_cover_override(slug: str, dest: Path) -> Path | None:
    overrides = load_cover_overrides()
    rel = overrides.get(slug)
    if not rel:
        return None
    src = Path(rel)
    if not src.is_absolute():
        src = PROJECT_ROOT / rel
    if not src.is_file():
        return None
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    dest.with_suffix(".txt").unlink(missing_ok=True)
    return dest


def performer_token(performer: str) -> str:
    return performer.lower().replace(".", "").split()[0]


def _square_jpeg_from_bytes(data: bytes, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".img", delete=False) as tmp:
        tmp.write(data)
        src = Path(tmp.name)
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(src),
                "-vf",
                "scale=800:800:force_original_aspect_ratio=increase,crop=800:800",
                "-q:v",
                "3",
                str(dest),
            ],
            check=True,
        )
        return dest.stat().st_size > PLACEHOLDER_MAX_BYTES
    except (subprocess.CalledProcessError, OSError):
        return False
    finally:
        src.unlink(missing_ok=True)


def fetch_deezer_artist_picture(performer: str) -> bytes | None:
    q = urllib.parse.quote(performer)
    data = _fetch_json(f"https://api.deezer.com/search/artist?q={q}&limit=8")
    if not data or not isinstance(data, dict):
        return None
    artists = data.get("data") or []
    perf_l = performer.lower()
    token = performer_token(performer)
    for artist in artists:
        name = (artist.get("name") or "").lower()
        if token in name or name in perf_l or perf_l in name:
            url = artist.get("picture_xl") or artist.get("picture_big")
            if url:
                img = _fetch_bytes(str(url))
                if img:
                    return img
    if artists:
        url = artists[0].get("picture_xl") or artists[0].get("picture_big")
        if url:
            return _fetch_bytes(str(url))
    return None


def fetch_wikipedia_artist_picture(performer: str) -> bytes | None:
    title = urllib.parse.quote(performer.replace(" ", "_"))
    api = (
        "https://en.wikipedia.org/w/api.php"
        f"?action=query&titles={title}&prop=pageimages&piprop=original&format=json&redirects=1"
    )
    data = _fetch_json(api)
    if not data or not isinstance(data, dict):
        return None
    pages = (data.get("query") or {}).get("pages") or {}
    for page in pages.values():
        original = (page.get("original") or {}).get("source")
        if original:
            return _fetch_bytes(str(original))
    return None


def fetch_artist_image_bytes(performer: str) -> bytes | None:
    img = fetch_deezer_artist_picture(performer)
    if img:
        return img
    return fetch_wikipedia_artist_picture(performer)


def release_mbids_for_recording(recording_mbid: str) -> list[str]:
    if not recording_mbid:
        return []
    time.sleep(1.05)
    data = _fetch_json(
        f"https://musicbrainz.org/ws/2/recording/{recording_mbid}"
        "?inc=releases&fmt=json"
    )
    if not data or "releases" not in data:
        return []
    releases = sorted(
        data["releases"],
        key=lambda r: r.get("date") or "0000",
        reverse=True,
    )
    return [r["id"] for r in releases if r.get("id")]


def search_release_mbid(artist: str, release_title: str) -> str | None:
    if not release_title:
        return None
    short = release_title.split(",")[0].strip()[:80]
    queries: list[str] = []
    if artist:
        queries.append(f'artist:"{artist}" AND release:"{short}"')
        if short.lower() not in release_title.lower():
            queries.append(f'artist:"{artist}" AND release:"{release_title[:80]}"')
    queries.append(f'release:"{short}"')
    first = performer_token(artist) if artist else ""
    if first:
        queries.append(f"artist:{first} AND release:\"{short}\"")
    seen_q: set[str] = set()
    for qraw in queries:
        if qraw in seen_q:
            continue
        seen_q.add(qraw)
        time.sleep(1.05)
        q = urllib.parse.quote(qraw)
        data = _fetch_json(
            f"https://musicbrainz.org/ws/2/release?query={q}&fmt=json&limit=8"
        )
        if not data or not data.get("releases"):
            continue
        if artist:
            perf_l = performer_token(artist)
            for rel in data["releases"]:
                ac = rel.get("artist-credit") or []
                names = " ".join(a.get("name", "") for a in ac).lower()
                if perf_l in names:
                    return rel.get("id")
        return data["releases"][0].get("id")
    return None


def search_recording_mbid(performer: str, title: str) -> str | None:
    time.sleep(1.05)
    q = urllib.parse.quote(f'recording:"{title}" AND artist:"{performer}"')
    data = _fetch_json(
        f"https://musicbrainz.org/ws/2/recording?query={q}&fmt=json&limit=8"
    )
    if not data or not data.get("recordings"):
        return None
    title_l = title.lower()
    perf_l = performer.lower().split()[0]
    for rec in data["recordings"]:
        rec_title = (rec.get("title") or "").lower()
        artists = [a.get("name", "").lower() for a in rec.get("artist-credit", [])]
        if title_l in rec_title or rec_title in title_l:
            if any(perf_l in a for a in artists):
                return rec.get("id")
    return data["recordings"][0].get("id")


def try_download_front(release_id: str) -> bytes | None:
    time.sleep(0.35)
    for suffix in ("front-500", "front", "front-250"):
        img = _fetch_bytes(
            "https://coverartarchive.org/release/"
            f"{urllib.parse.quote(release_id, safe='')}/{suffix}"
        )
        if img:
            return img
    return None


def fetch_album_cover_bytes(
    *,
    track_mbzid: str = "",
    record_mbzid: str = "",
    performer: str = "",
    title: str = "",
    record_title: str = "",
) -> bytes | None:
    mbids: list[str] = []
    if track_mbzid:
        mbids.append(track_mbzid)
    if not mbids and performer and title:
        found = search_recording_mbid(performer, title)
        if found:
            mbids.append(found)

    if record_mbzid:
        img = try_download_front(record_mbzid)
        if img:
            return img

    release_ids: list[str] = []
    for mbid in mbids:
        release_ids.extend(release_mbids_for_recording(mbid))
    seen: set[str] = set()
    for rid in release_ids:
        if rid in seen:
            continue
        seen.add(rid)
        img = try_download_front(rid)
        if img:
            return img

    if performer and record_title:
        rid = search_release_mbid(performer, record_title)
        if rid:
            img = try_download_front(rid)
            if img:
                return img
    return None


def _write_cover_bytes(dest: Path, data: bytes, *, from_artist: bool) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if from_artist:
        tmp = dest.with_suffix(".tmp.jpg")
        if _square_jpeg_from_bytes(data, tmp):
            if dest.exists():
                dest.unlink()
            tmp.replace(dest)
            dest.with_suffix(".txt").unlink(missing_ok=True)
            return dest
        tmp.unlink(missing_ok=True)
        raise CoverArtError(f"failed to square-crop artist image for {dest.name}")
    dest.write_bytes(data)
    dest.with_suffix(".txt").unlink(missing_ok=True)
    return dest


def download_cover_for_recording(
    recording_mbid: str,
    dest: Path,
    *,
    performer: str,
    title: str,
    record_mbzid: str = "",
    record_title: str = "",
    force: bool = False,
    slug: str = "",
) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)

    if slug:
        over = apply_cover_override(slug, dest)
        if over is not None and not force and not is_placeholder(dest):
            return dest

    if dest.exists() and not force and not is_placeholder(dest):
        return dest

    img = fetch_album_cover_bytes(
        track_mbzid=recording_mbid,
        record_mbzid=record_mbzid,
        performer=performer,
        title=title,
        record_title=record_title,
    )
    if img:
        return _write_cover_bytes(dest, img, from_artist=False)

    artist_img = fetch_artist_image_bytes(performer)
    if artist_img:
        return _write_cover_bytes(dest, artist_img, from_artist=True)

    if dest.exists() and not is_placeholder(dest):
        return dest

    raise CoverArtError(
        f"no cover or artist image for {performer} / {title} ({dest.name})"
    )
