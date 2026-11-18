#!/usr/bin/env python3
"""Fetch Dig That Lick pattern-search audio + CSV for a lick definition."""

from __future__ import annotations

import argparse
import csv
import html
import http.cookiejar
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from jazzlicks.licks import load_lick

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
SEARCH_URL = "https://dig-that-lick.hfm-weimar.de/pattern_search/"


def fetch_search_results(lick_pattern: str) -> tuple[str, str]:
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    req = urllib.request.Request(SEARCH_URL, headers={"User-Agent": UA})
    with opener.open(req, timeout=60) as r:
        page = r.read().decode("utf-8", "replace")
    token_m = re.search(r'name="csrfmiddlewaretoken" value="([^"]+)"', page)
    if not token_m:
        raise RuntimeError("CSRF token not found on pattern search page")
    token = token_m.group(1)
    data = urllib.parse.urlencode(
        {
            "csrfmiddlewaretoken": token,
            "database_name": "wjazzd",
            "search_id": "",
            "created_at": "",
            "n_gram_pitch": "",
            "primary_pattern": lick_pattern,
            "primary_transformation": "interval",
            "generate_audio": "True",
            "context_size_pre": "0",
            "context_size_post": "0",
        }
    ).encode()
    post = urllib.request.Request(
        "https://dig-that-lick.hfm-weimar.de/pattern_search/search",
        data=data,
        headers={
            "User-Agent": UA,
            "Referer": SEARCH_URL,
            "Origin": "https://dig-that-lick.hfm-weimar.de",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with opener.open(post, timeout=120) as r:
        result_html = r.read().decode("utf-8", "replace")
    redirect_url = r.geturl()
    search_id_m = re.search(r"[?&]id=(\d+)", redirect_url)
    if not search_id_m:
        search_id_m = re.search(
            r'<input[^>]*\bname="search_id"[^>]*\bvalue="(\d+)"',
            result_html,
        )
    if not search_id_m:
        search_id_m = re.search(
            r'<input[^>]*\bid="search_id"[^>]*\bvalue="(\d+)"',
            result_html,
        )
    if not search_id_m:
        raise RuntimeError(f"search id not found in {redirect_url}")
    search_id = search_id_m.group(1)
    if "id=" not in redirect_url:
        redirect_url = (
            f"https://dig-that-lick.hfm-weimar.de/pattern_search/search?id={search_id}"
        )
    progress_url = f"https://dig-that-lick.hfm-weimar.de/pattern_search/get_progress?id={search_id}"
    for _ in range(60):
        preq = urllib.request.Request(
            progress_url,
            headers={"User-Agent": UA, "Referer": redirect_url},
        )
        with opener.open(preq, timeout=30) as pr:
            prog = json.loads(pr.read().decode())
        if prog.get("melpat_completed") and prog.get("audio_generation_completed"):
            break
        if prog.get("melpat_completed") and not prog.get("real_frequency"):
            break
        time.sleep(4)
    return search_id, redirect_url


def download_csv(search_id: str, dest: Path) -> None:
    url = f"https://dig-that-lick.hfm-weimar.de/pattern_search/export_result_as_csv?search_id={search_id}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        dest.write_bytes(r.read())


def parse_results_html(html_text: str) -> list[dict]:
    rows = re.findall(r'<tr class="tr_result">(.*?)</tr>', html_text, re.S)
    out: list[dict] = []
    for row in rows:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)

        def clean(s: str) -> str:
            s = re.sub(r"<[^>]+>", " ", s)
            return html.unescape(re.sub(r"\s+", " ", s)).strip()

        texts = [clean(c) for c in cells]
        m = re.search(r'data-filepath="([^"]+)"', row)
        if not m:
            continue
        out.append(
            {
                "performer": texts[1] if len(texts) > 1 else "",
                "title": texts[2] if len(texts) > 2 else "",
                "year": texts[3] if len(texts) > 3 else "",
                "start_time": texts[4] if len(texts) > 4 else "",
                "start_position": texts[5] if len(texts) > 5 else "",
                "metrical": texts[6] if len(texts) > 6 else "",
                "audio_url": html.unescape(m.group(1)),
            }
        )
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lick", default="somisira")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    lick = load_lick(args.lick)
    out_dir = lick.audio_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / "dig_that_lick_results.csv"
    manifest_path = out_dir / "manifest.csv"

    if csv_path.exists() and manifest_path.exists() and not args.force:
        print("already fetched:", out_dir)
        return 0

    search_id, result_url = fetch_search_results(lick.dig_that_lick_pattern)
    download_csv(search_id, csv_path)

    req = urllib.request.Request(result_url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        html_text = r.read().decode("utf-8", "replace")
    parsed = parse_results_html(html_text)

    manifest_rows: list[dict[str, str]] = []
    for i, row in enumerate(parsed, 1):
        safe = re.sub(r"[^A-Za-z0-9]+", "", row["performer"] + row["title"])
        pos = re.sub(r"[^0-9]", "", row["start_position"]) or str(i)
        fname = f"{i:02d}_{safe[:40]}_{pos}.mp3"
        dest = out_dir / fname
        if not dest.exists() or args.force:
            areq = urllib.request.Request(row["audio_url"], headers={"User-Agent": UA})
            with urllib.request.urlopen(areq, timeout=120) as ar:
                dest.write_bytes(ar.read())
        manifest_rows.append(
            {
                "file": fname,
                "performer": row["performer"],
                "title": row["title"],
                "start_position": pos,
                "search_id": search_id,
                "pattern": lick.dig_that_lick_pattern,
            }
        )

    with manifest_path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(
            fh,
            fieldnames=[
                "file",
                "performer",
                "title",
                "start_position",
                "search_id",
                "pattern",
            ],
        )
        w.writeheader()
        w.writerows(manifest_rows)
    print("wrote", len(manifest_rows), "clips to", out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
