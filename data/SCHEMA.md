# Data schema — Somatic Reality Inspire

Each research batch writes one file: `data/raw/<batch>.json`

```json
{
  "batch": "hook-lab",
  "creators": [ Creator, ... ],
  "works":    [ Work, ... ],
  "leads":    [ Lead, ... ]
}
```

## Creator (a person, a lab, a studio or a company)
```json
{
  "id": "kristina-hook",                     // kebab-case, unique across all batches
  "name": "Kristina Höök",
  "name_zh": "",                             // optional: Chinese name if the person has one (e.g. 汤浅泰雄 for Yuasa Yasuo)
  "kind": "person",                          // person | lab | studio | company
  "role": "Professor of Interaction Design, KTH Royal Institute of Technology",
  "based": "Stockholm, SE",
  "bio": "1-2 sentences, English.",
  "why": "Why they matter for soma design / somatic interaction (1 sentence).",
  "disciplines": ["hci"],                    // 1–2 of taxonomy.disciplines
  "links": { "site": "", "scholar": "", "x": "", "instagram": "", "vimeo": "", "youtube": "", "github": "" },
  "role_zh": "…", "bio_zh": "…", "why_zh": "…", "based_zh": "斯德哥尔摩，瑞典",   // REQUIRED Chinese versions
  "connected_to": ["anna-stahl"],         // other creator ids (collaborators, same lab, advisor)
  "discovered_via": "seed"                   // creator id that led to this one, or "seed"
}
```

## Work (one artwork, performance, film, project, prototype, paper or book)
```json
{
  "id": "anna-stahl--soma-mat",             // <first-creator-id>--<slug>, unique
  "creator_ids": ["anna-stahl", "kristina-hook"],
  "title": "Soma Mat",                       // original title
  "title_zh": "",                            // optional here; Chinese titles normally live in data/title_zh/*.json (see below)
  "year": 2016,
  "field": "somaesthetic",                   // primary field id (data/taxonomy.json → fields)
  "sub": "appreciation",                     // one sub-category id of that field
  "also": ["methods"],                       // optional: other fields it clearly belongs to
  "modalities": ["heat", "whole-soma"],       // 1-3 from taxonomy.modalities: which body senses / signals the work works with
  "lenses": ["attunement", "touching-back"],  // 1-3 from taxonomy.lenses: the somatic lens
  "kind": "prototype",                       // prototype | method | practice | artwork | performance | film | product | paper | publication
  "description": "1-2 sentences, English: what it is and what happens.",
  "description_zh": "中文描述（自然流畅，不逐字翻译）",
  "idea_en": "One-line core idea in English: what the work reveals about the felt body-mind, or how to design from it.",
  "idea_zh": "一句话中文：核心想法",
  "method": "One English sentence: how it works (sensors, actuators, materials, practice, study setup). Mark guesses with 'likely'.",
  "method_zh": "中文：它是怎么做到的。",
  "keywords": ["body scan", "Feldenkrais", "heat", "somaesthetic appreciation"],   // free keywords, proper nouns in original

  "video":  { "url": "https://vimeo.com/…" },          // optional: YouTube | Vimeo | X | direct .mp4
  "images": ["https://…/hero.jpg"],                     // optional: 1-4 direct image URLs (jpg/png/webp/gif)
  "paper":  { "url": "https://doi.org/…", "doi": "10.…", "arxiv": "", "venue": "CHI 2016", "title": "…" },
            // optional; title = the paper's / book's own title; REQUIRED when kind = paper or publication
  "source_url": "https://…",                            // project / lab / artist page (strongly recommended)
  "code_url": "",                                       // optional repository
  "collections": ["designing-with-the-body", "chi"],    // optional: collection ids from data/taxonomy.json
  "exhibited": ["CHI 2016 Best Paper"]                  // optional: key exhibitions / awards (free text, original names)
}
```

Rules:
- Every work needs **at least one** of `video`, `images`, `paper`. Aim for a visual (video or image) on every work;
  a paper-only work shows a typographic card.
- `paper.doi` is checked against Crossref and `paper.arxiv` against arXiv at build time: use the real DOI, never a guess.
- Images: direct URLs to image files (`og:image` of the project page is usually best). Must return `image/*`.
- Videos: prefer the creator's own upload.

Verify media before writing (all must print `"ok": true`):
```
python3 tools/check_media.py <video-or-image-url> ...
python3 tools/check_media.py --doi 10.1145/2702123.2702611
python3 tools/check_media.py --arxiv 2301.01234
python3 tools/check_media.py --og <project-page-url>      # lists og:image / twitter:image / large <img> candidates
```

## Collections
A collection is a named set of works: the works of a landmark exhibition, the winners of an award, the artworks of an archive/database.
Defined in `data/taxonomy.json` → `collections` (`id, type, en, zh, desc_en, desc_zh, url`, optional `work` = the survey paper's work id). `type`: `exhibition` | `award` | `archive` | `survey` | `venue`.
A work joins by listing the id in its `collections`, or by adding its work id to `data/collections/<collection-id>.json`
(a JSON list of work ids — use this for works that already exist in another batch). Awards are collections, never creators.
New collections: do not edit taxonomy.json concurrently — define them in `data/collections/defs/<your-batch>.json` (a JSON list of collection objects); the build merges them.

## Chinese titles (`data/title_zh/<name>.json`)
`{ "<work-id>": {"zh": "蜻蜓之眼", "src": "original|established|translated|keep"} }` — shown as the main title in the Chinese
interface, with the original title below. Priority: the work's own Chinese title → an established Chinese title (film release,
Chinese book edition, Chinese exhibition label) → a faithful translation. Proper names (Soma Mat, eMoto, Brightr) are usually kept.
Every new work should get one (`/add-work` writes `data/title_zh/add-<creator-id>.json`).

## Extra media (`data/media/<name>.json`)
Images or a video found later for existing works, kept out of the research batches so passes never edit each other's files:
`{ "<work-id>": { "images": ["https://…"], "video": { "url": "https://…" } } }` — images are appended (max 4), a video is used only when the work has none.

## Resource (`data/orgs/<batch>.json` → `{ "batch": "...", "orgs": [ Resource, ... ] }`)
The **Resources & Links** tab lists key PEOPLE (researchers, philosophers, somatic practitioners, artists) and INSTITUTIONS & WEBSITES
(labs, somatic schools, conferences, venues, journals, networks, archives). One record per person or institution.
`type` is one of `taxonomy.org_types` (the 6th column says `person` or `org`).
```json
{
  "id": "person--richard-shusterman",                 // kebab-case, unique across data/orgs; people: "person--<name>"
  "name": "Richard Shusterman",
  "name_zh": "",                                       // optional Chinese name (汤浅泰雄、市川浩 …)
  "type": "thinker",                                   // researcher | thinker | practitioner | artist | lab | school | conference | venue | media | network | archive
  "themes": ["somaesthetics", "phenomenology"],        // 1–4 of taxonomy.org_themes
  "fields": ["foundations"],                           // 0–3 related gallery fields
  "description": "1–2 sentences, English: who they are / what it does, and why it matters here.",
  "description_zh": "中文：是谁 / 做什么，为什么重要。",
  "known_for": ["Pragmatist Aesthetics (1992)", "Body Consciousness (2008)"],   // people: 2–4 key works / books; orgs: optional
  "url": "https://…",                                  // REQUIRED, must load: personal / official site, else Wikipedia
  "links": [ { "label": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Richard_Shusterman" } ],   // optional 0–4 extra links
  "image": "https://…/og.jpg",                         // optional: og:image / portrait / logo (check_media ok)
  "based": "Boca Raton, US", "based_zh": "博卡拉顿，美国",     // optional ("Online" / "线上" allowed)
  "born": 1949,                                        // people: optional integers born / died
  "founded": 2019,                                     // institutions: optional integer
  "people": [],                                        // institutions: optional key people
  "creator_id": "richard-shusterman",                  // optional: matching creator id in the works data (links to their works)
  "found_via": "https://…"                             // optional: directory where it was found
}
```
Validate with `python3 tools/validate_orgs.py data/orgs/<file>.json` (or `--all`).

## Lead (person/lab found but not researched in this batch)
```json
{ "name": "…", "why": "…", "link": "…", "found_via": "creator id", "status": "open" }   // open | no_media | off_topic | duplicate
```

## Language rule
Every user-facing text exists in BOTH languages, never mixed inside one field (proper nouns — titles,
people, labs, products — stay in the original).
English fields: description, idea_en, method, role, bio, why, based.
Chinese fields: description_zh, idea_zh, method_zh, role_zh, bio_zh, why_zh, based_zh.
Run `python3 tools/validate.py data/raw/<file>.json` before building.
