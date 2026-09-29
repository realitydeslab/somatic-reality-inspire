#!/usr/bin/env python3
"""Validate research batch files before they enter the gallery (see data/SCHEMA.md).

- required fields present (bilingual), English fields without CJK, Chinese fields with CJK
- field / sub / modalities / lenses / kind come from data/taxonomy.json
- at least one of video, images, paper; kind "paper" needs a paper link
- creator_ids resolve; no work id, creator id or video reused by another batch

Usage:
  python3 tools/validate.py data/raw/<batch>.json [more.json ...]
  python3 tools/validate.py --all
Exit code 1 if any error is found.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from check_video import parse as parse_video  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
TAX = json.loads((ROOT / "data" / "taxonomy.json").read_text())
FIELDS = {f["id"]: {s["id"] for s in f["subs"]} for f in TAX["fields"]}
MODALITIES = {o[0] for o in TAX["modalities"]}
KINDS = {k[0] for k in TAX["kinds"]}
LENSES = {x[0] for x in TAX.get("lenses", [])}
DISCIPLINES = {x[0] for x in TAX.get("disciplines", [])}
COLLECTIONS = {c["id"] for c in TAX.get("collections", [])} | {
    c["id"] for f in (ROOT / "data" / "collections" / "defs").glob("*.json") for c in json.loads(f.read_text())}
LEGACY: dict = {}  # (old field, old sub) -> (new field, new sub) for moved categories
CJK = re.compile(r"[㐀-鿿]")

WORK_EN = ("title", "description", "idea_en", "method")
WORK_ZH = ("description_zh", "idea_zh", "method_zh")
CREATOR_EN = ("name", "role", "bio", "why")
CREATOR_ZH = ("role_zh", "bio_zh", "why_zh")
CREATOR_KINDS = {"person", "lab", "studio", "company"}
LEAD_STATUS = {"open", "no_media", "off_topic", "duplicate"}


def video_key(v: dict | None) -> str | None:
    url = (v or {}).get("url", "")
    plat, vid = parse_video(url)
    return f"{plat}:{vid}" if plat else (f"mp4:{url}" if url else None)


def _others(exclude: Path) -> tuple[set, set, set]:
    cids, wids, vkeys = set(), set(), set()
    for f in RAW.glob("*.json"):
        if f.resolve() == exclude.resolve():
            continue
        try:
            d = json.loads(f.read_text())
        except json.JSONDecodeError:
            continue
        cids |= {c["id"] for c in d.get("creators", []) if c.get("id")}
        for w in d.get("works", []):
            wids.add(w.get("id"))
            if video_key(w.get("video")):
                vkeys.add(video_key(w.get("video")))
    return cids, wids, vkeys


def _lang(errs: list, who: str, obj: dict, en: tuple, zh: tuple, skip: tuple = ("name", "title")) -> None:
    for f in en:
        if not obj.get(f):
            errs.append(f"{who}: missing {f}")
        elif f not in skip and CJK.search(obj[f]):
            errs.append(f"{who}: {f} must be English (found Chinese)")
    for f in zh:
        if not obj.get(f):
            errs.append(f"{who}: missing {f}")
        elif not CJK.search(obj[f]):
            errs.append(f"{who}: {f} must be Chinese")


def validate(path: Path) -> list[str]:
    try:
        d = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return [f"invalid JSON: {e}"]
    errs: list[str] = []
    other_cids, other_wids, other_vkeys = _others(path)
    known = {c.get("id") for c in d.get("creators", [])} | other_cids

    for c in d.get("creators", []):
        cid = c.get("id", "?")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", cid):
            errs.append(f"creator {cid}: id must be kebab-case")
        if c.get("kind") not in CREATOR_KINDS:
            errs.append(f"creator {cid}: kind must be one of {sorted(CREATOR_KINDS)}")
        if any(x not in DISCIPLINES for x in c.get("disciplines") or []):
            errs.append(f"creator {cid}: disciplines must be ids from {sorted(DISCIPLINES)}")
        _lang(errs, f"creator {cid}", c, CREATOR_EN, CREATOR_ZH)
        if cid in other_cids:  # build merges records by id; keep only when this batch adds information
            print(f"   note: creator {cid} also defined in another batch (records are merged at build)")

    seen_w, seen_v = set(), set()
    for w in d.get("works", []):
        wid = w.get("id", "?")
        who = f"work {wid}"
        _lang(errs, who, w, WORK_EN, WORK_ZH)
        if not isinstance(w.get("year"), int):
            errs.append(f"{who}: year must be an integer")
        if (w.get("field"), w.get("sub")) in LEGACY:  # moved categories: accepted, remapped at build
            w = {**w, **dict(zip(("field", "sub"), LEGACY[(w["field"], w["sub"])]))}
        if w.get("field") not in FIELDS:
            errs.append(f"{who}: field must be one of {sorted(FIELDS)}")
        elif w.get("sub") not in FIELDS[w["field"]]:
            errs.append(f"{who}: sub must be one of {sorted(FIELDS[w['field']])}")
        if any(a not in FIELDS or a == w.get("field") for a in w.get("also") or []):
            errs.append(f"{who}: also must list other field ids, got {w.get('also')}")
        orgs = w.get("modalities") or []
        if not 1 <= len(orgs) <= 3 or any(o not in MODALITIES for o in orgs):
            errs.append(f"{who}: modalities must be 1–3 of {sorted(MODALITIES)}, got {orgs}")
        lz = w.get("lenses") or []
        if not 1 <= len(lz) <= 3 or any(x not in LENSES for x in lz):
            errs.append(f"{who}: lenses must be 1–3 of {sorted(LENSES)}, got {lz}")
        if any(c not in COLLECTIONS for c in w.get("collections") or []):
            errs.append(f"{who}: collections must be ids from data/taxonomy.json {sorted(COLLECTIONS)}")
        if w.get("kind") not in KINDS:
            errs.append(f"{who}: kind must be one of {sorted(KINDS)}")
        paper = w.get("paper") or {}
        if not (w.get("video") or w.get("images") or paper.get("url") or paper.get("doi") or paper.get("arxiv")):
            errs.append(f"{who}: needs at least one of video, images, paper")
        if w.get("kind") == "paper" and not (paper.get("url") or paper.get("doi") or paper.get("arxiv")):
            errs.append(f"{who}: kind 'paper' needs paper.url, paper.doi or paper.arxiv")
        if paper.get("doi") and not re.match(r"^10\.\d{4,9}/\S+$", paper["doi"]):
            errs.append(f"{who}: paper.doi must look like 10.xxxx/… (no https://doi.org/ prefix)")
        if not isinstance(w.get("images", []), list) or len(w.get("images") or []) > 4:
            errs.append(f"{who}: images must be a list of at most 4 URLs")
        for cid in w.get("creator_ids") or ["<none>"]:
            if cid not in known:
                errs.append(f"{who}: creator id {cid} not found")
        key = video_key(w.get("video"))
        if w.get("video") and key and key in other_vkeys | seen_v:
            errs.append(f"{who}: video {key} already used by another work")
        if wid in other_wids or wid in seen_w:
            errs.append(f"{who}: duplicate work id")
        seen_w.add(wid)
        if key:
            seen_v.add(key)

    for lead in d.get("leads", []):
        if lead.get("status", "open") not in LEAD_STATUS:
            errs.append(f"lead {lead.get('name')}: status must be one of {sorted(LEAD_STATUS)}")
    return errs


def main() -> int:
    args = sys.argv[1:]
    files = sorted(RAW.glob("*.json")) if args == ["--all"] else [Path(a) for a in args]
    if not files:
        print(__doc__)
        return 2
    bad = 0
    for f in files:
        errs = validate(f)
        try:
            d = json.loads(f.read_text())
        except json.JSONDecodeError:
            d = {}
        summary = f"{len(d.get('creators', []))} creators, {len(d.get('works', []))} works"
        if errs:
            bad += 1
            print(f"✗ {f.name} ({summary}) — {len(errs)} problem(s):")
            for e in errs[:40]:
                print(f"   - {e}")
            if len(errs) > 40:
                print(f"   … and {len(errs) - 40} more")
        else:
            print(f"✓ {f.name} ({summary})")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
