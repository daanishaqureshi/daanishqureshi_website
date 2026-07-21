#!/usr/bin/env python3
"""Verify every internal href/src in the site's HTML files resolves to a
real file or in-page anchor. External URLs are reported but not failed on."""
import re
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "journey.html", "research.html", "leadership.html"]
REF_RE = re.compile(r'(?:href|src)="([^"]+)"')
ID_RE = re.compile(r'id="([^"]+)"')

def check_external(url):
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": "check-links/1.0"})
        with urlopen(req, timeout=10) as resp:
            return resp.status < 400
    except (URLError, HTTPError):
        return False

def main():
    broken = []
    warnings = []
    for page in PAGES:
        path = ROOT / page
        text = path.read_text()
        ids_in_page = set(ID_RE.findall(text))
        for ref in REF_RE.findall(text):
            if ref.startswith(("mailto:", "http://", "https://")):
                if ref.startswith("https://lh3.googleusercontent.com"):
                    warnings.append(f"{page}: external Stitch image (pre-launch follow-up): {ref}")
                elif ref.startswith("https://www.cell.com/"):
                    warnings.append(f"{page}: publisher blocks automated checks, verified manually (Cell Press bot protection): {ref}")
                elif ref.startswith(("http://", "https://")) and not check_external(ref):
                    broken.append(f"{page}: external reference unreachable: {ref}")
                continue
            if ref == "#":
                continue
            if "#" in ref:
                file_part, anchor = ref.split("#", 1)
            else:
                file_part, anchor = ref, None
            if file_part and "?" in file_part:
                # Strip cache-busting query strings (e.g. journey.css?v=7)
                # before checking the file exists on disk.
                file_part = file_part.split("?", 1)[0]
            if file_part:
                target = (ROOT / file_part) if not file_part.startswith("assets/") else (ROOT / file_part)
                if not target.exists():
                    broken.append(f"{page}: missing local file: {ref}")
                    continue
            if anchor and not file_part:
                if anchor not in ids_in_page:
                    broken.append(f"{page}: missing in-page anchor: #{anchor}")
            elif anchor and file_part in PAGES:
                other_text = (ROOT / file_part).read_text()
                if anchor not in set(ID_RE.findall(other_text)):
                    broken.append(f"{page}: missing anchor '{anchor}' in {file_part}")

    for w in warnings:
        print(f"WARN: {w}")
    if broken:
        for b in broken:
            print(f"BROKEN: {b}")
        return 1
    print("All internal links and assets resolve.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
