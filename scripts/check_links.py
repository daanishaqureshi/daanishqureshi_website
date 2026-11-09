#!/usr/bin/env python3
"""Verify every internal href/src in the site's HTML files resolves to a
real file or in-page anchor. External URLs are reported but not failed on."""
import re
import sys
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "research.html", "cv.html", "industry.html", "journey.html", "leadership.html"]
REF_RE = re.compile(r'(?:href|src)="([^"]+)"')
ID_RE = re.compile(r'id="([^"]+)"')

COMMENT_RE = re.compile(r"<!--.*?-->", re.S)

def check_doi(url):
    # Publisher sites (ASME) refuse scripted requests, so a DOI counts as
    # resolving when the DOI registry has a URL for it.
    handle = url.split("doi.org/", 1)[1]
    try:
        req = Request(f"https://doi.org/api/handles/{handle}", headers={"User-Agent": "check-links/1.0"})
        with urlopen(req, timeout=10) as resp:
            return b'"responseCode":1' in resp.read()
    except (URLError, HTTPError):
        return False

def check_external(url):
    if url.startswith("https://doi.org/"):
        return check_doi(url)
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": "check-links/1.0"})
        with urlopen(req, timeout=10) as resp:
            return resp.status < 400
    except HTTPError as e:
        # Some hosts (zhaoqinresearch.com) answer HEAD with 405, so retry as GET.
        if e.code not in (403, 405, 501):
            return False
    except URLError:
        return False
    try:
        req = Request(url, headers={"User-Agent": "check-links/1.0"})
        with urlopen(req, timeout=10) as resp:
            return resp.status < 400
    except (URLError, HTTPError):
        return False

def main():
    broken = []
    warnings = []
    for page in PAGES:
        path = ROOT / page
        text = COMMENT_RE.sub("", path.read_text())
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
