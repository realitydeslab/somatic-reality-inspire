---
description: Research one or more researchers, artists, practices, works, methods or papers for Somatic Reality Inspire, add their salient soma design works (bilingual, classified, with video / images / paper), rebuild the site and catalogs, and publish.
argument-hint: <researcher, artist, practice, work URL or paper DOI> [, another …] [--no-push]
---

# Add to Somatic Reality Inspire

Input: `$ARGUMENTS` — one or more researchers, labs, artists, somatic practices, works (project URL), methods or papers (DOI / arXiv / URL), comma-separated. `--no-push` = build and preview locally, do not commit or publish.

The gallery collects soma design: prototypes, methods, somatic practices, artworks, performances and theory that treat **body and mind as one soma**, centred on Kristina Höök's lineage. Works that only use the body as an input device, or generic fitness tracking, are OUT.
Read `data/SCHEMA.md`, `data/taxonomy.json` and `data/RESEARCH_BRIEF.md` (inclusion rule) first.

## Steps

1. **Sync.** `git pull --ff-only`.
2. **Identify.** Resolve each input to a creator. `grep -i "<name>" data/creators_index.txt` — if they exist, reuse the id and add only missing works. For a single work or paper, add it under its first author / artist.
   Several inputs → one subagent each, in parallel, each writing its own file.
3. **Research the salient soma-related works** (lab and personal pages, ACM DL, DiVA, YouTube / Vimeo talk and demo videos, Google Scholar). For each: video, 1–3 images, paper (DOI, venue, own title), key venues / awards. A method or toolkit gets its own work with `kind: "method"`.
   Verify with `python3 tools/check_media.py <url>…`, `--doi <doi>`, `--arxiv <id>`, `--og <page>` (image candidates). Keep only `"ok": true`; check that a DOI's title is the right paper.
4. **Write** `data/raw/add-<creator-id>.json` with creators (with `disciplines`, `name_zh` if any), works (field / sub / modalities / lenses / kind from the taxonomy, English + Chinese text), leads.
   If the person should also appear in **Resources & Links**, add a record to `data/orgs/add-<creator-id>.json` (see SCHEMA → Resource) with `creator_id`.
   Chinese titles for the new works: `data/title_zh/add-<creator-id>.json` (see SCHEMA → Chinese titles).
5. **Validate.** `python3 tools/validate.py data/raw/add-<creator-id>.json` (and `python3 tools/validate_orgs.py --all`) until ✓.
6. **Build.** `python3 tools/build_data.py`. Check `data/dropped.json` (dead media, DOI title mismatches) and fix what is yours.
7. **Preview** (optional): `./serve.sh`, open `http://localhost:8936/#view=works&q=<name>`.
8. **Check duplicates**: `python3 tools/audit_titles.py` — resolve any same-title works that are yours.
9. **Publish** (skip with `--no-push`): `tools/publish.sh "feat(data): add <name> (<n> works)"`
   It validates every batch, rebuilds, refuses to publish if validation fails or works disappeared, then commits and pushes.
   GitHub Pages redeploys https://somatic.reality.design in about a minute.
10. **Report**: what was added (counts per field), notable works, what was left out and why, new leads, live URL.
