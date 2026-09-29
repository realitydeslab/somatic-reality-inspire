#!/usr/bin/env python3
"""Turn agent membership notes (temp/*/members.json) into data/collections/<id>.json.

Rows: {"collection", "title", "year", "artist", optional "work_id"}. A row resolves to a work by work_id,
else by normalised title (+ year within 1). Unresolved rows are listed so they can become leads.
Usage: python3 tools/merge_members.py [extra.json ...]
"""
import difflib
import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALIAS: dict = {}  # old collection id -> new id


def norm(t: str) -> str:
    return re.sub(r"[^a-z0-9]", "", re.sub(r"\(.*?\)", "", (t or "").lower()))


def main(extra: list[str]) -> None:
    works = [w for f in glob.glob(str(ROOT / "data/raw/*.json")) for w in json.loads(Path(f).read_text())["works"]]
    ids = {w["id"] for w in works}
    tax = json.loads((ROOT / "data/taxonomy.json").read_text())
    cols = {c["id"] for c in tax["collections"]} | {c["id"] for f in glob.glob(str(ROOT / "data/collections/defs/*.json"))
                                                   for c in json.loads(Path(f).read_text())}
    rows = [r for f in sorted(glob.glob(str(ROOT / "temp/*/members.json"))) + extra for r in json.loads(Path(f).read_text())]
    out: dict[str, set] = {}
    missing = []
    for r in rows:
        col = ALIAS.get(r["collection"], r["collection"])
        wid = r.get("work_id") if r.get("work_id") in ids else None
        if not wid:
            t = norm(r.get("title"))
            cands = [w for w in works if t and difflib.SequenceMatcher(None, t, norm(w["title"])).ratio() > 0.88
                     and (not r.get("year") or abs((w.get("year") or 0) - r["year"]) <= 1)]
            wid = cands[0]["id"] if len(cands) == 1 else None
        if col not in cols:
            missing.append(("unknown collection", col, r.get("title")))
        elif wid:
            out.setdefault(col, set()).add(wid)
        else:
            missing.append((col, r.get("artist"), r.get("title"), r.get("year")))
    for col, s in out.items():
        p = ROOT / "data/collections" / f"{col}.json"
        old = set(json.loads(p.read_text())) if p.exists() else set()
        p.write_text(json.dumps(sorted(old | s), indent=1) + "\n")
        print(f"{col}: {len(old | s)} ({len(s - old)} new)")
    (ROOT / "temp/unmatched_members.json").write_text(json.dumps(missing, ensure_ascii=False, indent=1))
    print(f"unmatched rows: {len(missing)} → temp/unmatched_members.json")


if __name__ == "__main__":
    import sys
    main(sys.argv[1:])
