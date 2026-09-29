#!/usr/bin/env python3
"""Validate organization batches (data/orgs/*.json) against data/SCHEMA.md.

Usage: python3 tools/validate_orgs.py data/orgs/<file>.json [...] | --all
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORGS = ROOT / "data" / "orgs"
TAX = json.loads((ROOT / "data" / "taxonomy.json").read_text())
TYPES = {t[0] for t in TAX["org_types"]}
THEMES = {t[0] for t in TAX["org_themes"]}
FIELDS = {f["id"] for f in TAX["fields"]}
PERSON_TYPES = {t[0] for t in TAX["org_types"] if t[-1] == "person"}
CJK = re.compile(r"[㐀-鿿]")


def validate(path: Path, other_ids: set) -> list[str]:
    try:
        d = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return [f"invalid JSON: {e}"]
    errs, seen = [], set()
    for o in d.get("orgs", []):
        oid = o.get("id", "?")
        who = f"org {oid}"
        if not re.fullmatch(r"(person--)?[a-z0-9]+(-[a-z0-9]+)*", oid):  # people: "person--<name>" (SCHEMA.md)
            errs.append(f"{who}: id must be kebab-case")
        if oid in seen or oid in other_ids:
            errs.append(f"{who}: duplicate id (also in this or another batch)")
        seen.add(oid)
        for f in ("name", "description", "url"):
            if not o.get(f):
                errs.append(f"{who}: missing {f}")
        if o.get("description") and CJK.search(o["description"]):
            errs.append(f"{who}: description must be English")
        if not o.get("description_zh") or not CJK.search(o["description_zh"]):
            errs.append(f"{who}: description_zh must be Chinese")
        if o.get("type") not in TYPES:
            errs.append(f"{who}: type must be one of {sorted(TYPES)}")
        th = o.get("themes") or []
        if not 1 <= len(th) <= 4 or any(x not in THEMES for x in th):
            errs.append(f"{who}: themes must be 1–4 of {sorted(THEMES)}, got {th}")
        if any(x not in FIELDS for x in o.get("fields") or []):
            errs.append(f"{who}: fields must be ids from {sorted(FIELDS)}")
        for k in ("founded", "born", "died"):
            if o.get(k) is not None and not isinstance(o[k], int):
                errs.append(f"{who}: {k} must be an integer")
        if o.get("type") in PERSON_TYPES and o.get("founded") is not None:
            errs.append(f"{who}: people use born / died, not founded")
        if not str(o.get("url", "")).startswith("http"):
            errs.append(f"{who}: url must start with http")
    return errs


def main() -> int:
    args = sys.argv[1:]
    files = sorted(ORGS.glob("*.json")) if args == ["--all"] else [Path(a) for a in args]
    bad = 0
    for f in files:
        others = set()
        for g in ORGS.glob("*.json"):
            if g.resolve() != f.resolve():
                try:
                    others |= {o.get("id") for o in json.loads(g.read_text()).get("orgs", [])}
                except json.JSONDecodeError:
                    pass
        errs = validate(f, others)
        n = len(json.loads(f.read_text()).get("orgs", [])) if not (errs and errs[0].startswith("invalid")) else 0
        print(("✗ " if errs else "✓ ") + f"{f.name} ({n} orgs)" + (f" — {len(errs)} problem(s):" if errs else ""))
        for e in errs[:40]:
            print("   -", e)
        bad += bool(errs)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
