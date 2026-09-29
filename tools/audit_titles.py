#!/usr/bin/env python3
"""Find likely duplicate works across batches by normalised title (and title + first creator).

Usage: python3 tools/audit_titles.py
Prints groups of work ids whose titles normalise to the same string, with their batch files.
"""
import json
import re
from collections import defaultdict
from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"


def norm(title: str) -> str:
    t = re.split(r"[:–—(]", title.lower())[0]
    return re.sub(r"[^a-z0-9]", "", t)


def main() -> None:
    groups: dict[str, list] = defaultdict(list)
    for f in sorted(RAW.glob("*.json")):
        for w in json.loads(f.read_text()).get("works", []):
            key = norm(w.get("title", ""))
            if len(key) >= 4:
                groups[key].append((w["id"], f.stem, w.get("year"), (w.get("paper") or {}).get("doi", "")))
    dup = {k: v for k, v in groups.items() if len({i for i, *_ in v}) > 1}
    for k, v in sorted(dup.items()):
        print(k)
        for row in v:
            print("   ", *row)
    print(f"{len(dup)} title groups with more than one work id")


if __name__ == "__main__":
    main()
