#!/usr/bin/env python3
"""Check that media and paper links are real and live.

Usage:
  python3 tools/check_media.py <url> [<url> ...]     # video (YouTube/Vimeo/X/mp4) or image URL
  python3 tools/check_media.py --doi <doi> [...]     # Crossref lookup: title, year, venue
  python3 tools/check_media.py --arxiv <id> [...]    # arXiv lookup: title, year
  python3 tools/check_media.py --og <page-url>       # image candidates on a project page
Prints one JSON line per item with "ok".
"""
import html as htmllib
import json
import re
import sys
import time
import urllib.parse
import urllib.request

from check_video import UA, check as check_video, parse as parse_video

IMG_EXT = re.compile(r"\.(jpe?g|png|webp|gif|avif)(\?|#|$)", re.I)


TRANSIENT = re.compile(r"HTTP Error (429|5\d\d)|timed out|Temporary failure|Connection reset|RemoteDisconnected|nodename nor servname|Name or service not known|getaddrinfo failed")


# Wikimedia rejects browser-like user agents from scripts (robot policy); it wants an identifying one.
BOT_UA = {"User-Agent": "SomaticRealityInspire/1.0 (https://somatic.reality.design; link checker)"}


def _open(url: str, headers: dict | None = None, timeout: int = 20, tries: int = 3):
    """urlopen with retry and backoff on rate limits and server errors."""
    base = BOT_UA if "wikimedia.org" in url or "wikipedia.org" in url else UA
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={**base, **(headers or {})}), timeout=timeout)
        except Exception as e:  # noqa: BLE001 - retried only when transient
            if i == tries - 1 or not TRANSIENT.search(f"{type(e).__name__}: {e}"):
                raise
            time.sleep(2 * (i + 1))
    raise RuntimeError("unreachable")


def transient(res: dict) -> bool:
    """A failure that says nothing about the link itself (rate limit, server hiccup, timeout)."""
    return not res.get("ok") and bool(TRANSIENT.search(res.get("error") or ""))


def _is_image(head: bytes) -> bool:
    """PNG, JPEG, GIF or WebP magic bytes."""
    return head.startswith((b"\x89PNG", b"\xff\xd8\xff", b"GIF8")) or (head[:4] == b"RIFF" and head[8:12] == b"WEBP")


def check_image(url: str) -> dict:
    """An image URL is ok when it answers 200/206 with an image content type."""
    try:
        with _open(url, {"Range": "bytes=0-2047", "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"}) as r:
            ctype = r.headers.get("Content-Type", "")
            head = r.read(16)
            # some hosts (e.g. figures.semanticscholar.org) label images binary/octet-stream; browsers still render them
            sniffed = ctype.split(";")[0].strip() in ("binary/octet-stream", "application/octet-stream") and _is_image(head)
            ok = r.status in (200, 206) and (ctype.startswith("image/") or sniffed)
            return {"url": url, "ok": ok, "type": "image", "content_type": ctype, **({} if ok else {"error": f"content-type {ctype}"})}
    except Exception as e:  # noqa: BLE001 - any failure means the image is not usable
        return {"url": url, "ok": False, "type": "image", "error": f"{type(e).__name__}: {e}"}


def check_url(url: str) -> dict:
    if parse_video(url)[0] or re.search(r"\.(mp4|webm|mov)(\?|$)", url) or "github.com/user-attachments/assets/" in url:
        return {**check_video(url), "type": "video"}
    return check_image(url)


def check_doi(doi: str) -> dict:
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi.strip())
    try:
        with _open(f"https://api.crossref.org/works/{urllib.parse.quote(doi)}", {"User-Agent": "somatic-inspire/1.0 (mailto:hello@reality.design)"}) as r:
            m = json.loads(r.read())["message"]
        year = next((m[k]["date-parts"][0][0] for k in ("published-print", "published-online", "issued", "created") if m.get(k, {}).get("date-parts", [[None]])[0][0]), None)
        return {"doi": doi, "ok": True, "type": "doi", "title": htmllib.unescape(re.sub(r"<[^>]+>", "", (m.get("title") or [""])[0])),
                "year": year, "venue": (m.get("container-title") or [""])[0], "url": f"https://doi.org/{doi}"}
    except Exception as e:  # noqa: BLE001 - unknown DOI or network failure
        return {"doi": doi, "ok": False, "type": "doi", "error": f"{type(e).__name__}: {e}"}


def check_arxiv(aid: str) -> dict:
    aid = re.sub(r"^https?://arxiv\.org/(abs|pdf)/", "", aid.strip()).removesuffix(".pdf")
    aid = re.sub(r"v\d+$", "", aid)
    try:
        with _open(f"https://export.arxiv.org/api/query?id_list={urllib.parse.quote(aid)}") as r:
            xml = r.read().decode("utf-8", "replace")
        entry = xml.split("<entry>", 1)[1] if "<entry>" in xml else ""
        title = re.search(r"<title>(.*?)</title>", entry, re.S)
        pub = re.search(r"<published>(\d{4})", entry)
        if not title or "Error" in title.group(1):
            return {"arxiv": aid, "ok": False, "type": "arxiv", "error": "not found"}
        return {"arxiv": aid, "ok": True, "type": "arxiv", "title": re.sub(r"\s+", " ", title.group(1)).strip(),
                "year": int(pub.group(1)) if pub else None, "url": f"https://arxiv.org/abs/{aid}"}
    except Exception as e:  # noqa: BLE001
        return {"arxiv": aid, "ok": False, "type": "arxiv", "error": f"{type(e).__name__}: {e}"}


def og_images(page: str) -> dict:
    """Image candidates on a page: og:image, twitter:image, then large-looking <img> sources."""
    try:
        with _open(page) as r:
            html = r.read(600_000).decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return {"url": page, "ok": False, "error": f"{type(e).__name__}: {e}"}
    found: list[str] = []
    for pat in (r'<meta[^>]+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']',
                r'<img[^>]+src=["\']([^"\']+)["\']'):
        for m in re.findall(pat, html, re.I):
            u = urllib.parse.urljoin(page, htmllib.unescape(m))
            if u.startswith("http") and u not in found and not re.search(r"(logo|icon|avatar|sprite|pixel|badge)", u, re.I):
                found.append(u)
    checked = [check_image(u) for u in found[:8]]
    return {"url": page, "ok": any(c["ok"] for c in checked), "candidates": [c["url"] for c in checked if c["ok"]]}


if __name__ == "__main__":
    args = sys.argv[1:]
    mode, fn = "url", check_url
    for a in args:
        if a in ("--doi", "--arxiv", "--og"):
            mode, fn = a, {"--doi": check_doi, "--arxiv": check_arxiv, "--og": og_images}[a]
            continue
        print(json.dumps(fn(a), ensure_ascii=False))
