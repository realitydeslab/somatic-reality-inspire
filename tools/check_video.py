#!/usr/bin/env python3
"""Check that a YouTube / Vimeo / X video URL is live and return its metadata.

Usage: python3 tools/check_video.py <url> [<url> ...]
Prints one JSON line per URL: {"url","ok","platform","id","title","author","thumbnail","error"}
"""
import html as htmllib
import json
import math
import re
import sys
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/126 Safari/537.36"}


def _get(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def _x_token(tweet_id: str) -> str:
    """Token expected by cdn.syndication.twimg.com (mirrors the JS used by react-tweet)."""
    n = (int(tweet_id) / 1e15) * math.pi
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    ip, fp, head, tail = int(n), n - int(n), "", ""
    while ip:
        head, ip = digits[ip % 36] + head, ip // 36
    for _ in range(12):
        fp *= 36
        tail += digits[int(fp)]
        fp -= int(fp)
    return re.sub(r"(0+|\.)", "", (head or "0") + "." + tail)


def _check_x(url: str, vid: str) -> dict:
    """Use the public syndication endpoint: confirms the post exists and returns the video poster."""
    try:
        d = json.loads(_get(f"https://cdn.syndication.twimg.com/tweet-result?id={vid}&lang=en&token={_x_token(vid)}"))
        if d.get("__typename") == "Tweet":
            poster = (d.get("video") or {}).get("poster") or next(
                (m.get("media_url_https") for m in d.get("mediaDetails", []) if m.get("type") in ("video", "animated_gif")), "")
            return {"ok": True, "author": (d.get("user") or {}).get("name"), "title": (d.get("text") or "")[:200],
                    "thumbnail": poster, "has_video": bool(poster), "date": d.get("created_at")}
    except Exception:  # noqa: BLE001 - fall back to oEmbed below
        pass
    q = urllib.parse.quote(url, safe="")
    d = json.loads(_get(f"https://publish.twitter.com/oembed?url={q}&omit_script=1"))
    text = re.sub(r"<[^>]+>", " ", d.get("html", ""))
    return {"ok": True, "author": d.get("author_name"), "title": re.sub(r"\s+", " ", text).strip()[:200]}


def parse(url: str) -> tuple[str, str]:
    m = re.search(r"(?:youtube\.com/(?:watch\?v=|embed/|shorts/|live/)|youtu\.be/)([\w-]{11})", url)
    if m:
        return "youtube", m.group(1)
    m = re.search(r"vimeo\.com/(?:video/|channels/[\w-]+/|groups/[\w-]+/videos/)?(\d+)", url)
    if m:
        return "vimeo", m.group(1)
    m = re.search(r"(?:x|twitter)\.com/\w+/status/(\d+)", url)
    if m:
        return "x", m.group(1)
    return "", ""


def check(url: str) -> dict:
    if re.match(r"https://github\.com/user-attachments/assets/", url) or re.search(r"\.(mp4|webm|mov)(\?|$)", url):
        from build_data import _check_mp4  # noqa: PLC0415 - direct video files (e.g. GitHub README attachments)
        return _check_mp4(url)
    platform, vid = parse(url)
    out = {"url": url, "ok": False, "platform": platform, "id": vid}
    try:
        if platform == "youtube":
            q = urllib.parse.quote(f"https://www.youtube.com/watch?v={vid}", safe="")
            d = json.loads(_get(f"https://www.youtube.com/oembed?url={q}&format=json"))
            out.update(ok=True, title=d.get("title"), author=d.get("author_name"),
                       thumbnail=f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg")
        elif platform == "vimeo":
            html = _get(f"https://vimeo.com/{vid}")
            t = re.search(r'property="og:title" content="([^"]*)"', html) or re.search(r"<title>([^<]*)</title>", html)
            th = re.search(r'property="og:image" content="([^"]*)"', html)
            embeddable = True
            try:
                q = urllib.parse.quote(f"https://vimeo.com/{vid}", safe="")
                oe = json.loads(_get(f"https://vimeo.com/api/oembed.json?url={q}"))
                embeddable = oe.get("domain_status_code") != 403
            except Exception:  # noqa: BLE001 - oEmbed failure means private/unlisted; page check decides ok
                embeddable = False
            out["embeddable"] = embeddable
            out.update(ok=bool(t), title=htmllib.unescape(t.group(1)) if t else None,
                       thumbnail=th.group(1).replace("&amp;", "&").replace("&amp;", "&") if th else None)
        elif platform == "x":
            out.update(_check_x(url, vid))
        else:
            out["error"] = "unsupported url"
    except Exception as e:  # noqa: BLE001 - report any network/parse failure per URL
        out["error"] = f"{type(e).__name__}: {e}"
    return out


if __name__ == "__main__":
    for u in sys.argv[1:]:
        print(json.dumps(check(u), ensure_ascii=False))
