# Research brief (for every research agent)

Project: **Somatic Reality Inspire** — a bilingual (English / Simplified Chinese) gallery at somatic.reality.design of
**soma design**: its research prototypes, design METHODS, somatic practices, artworks, performances and theory. Made by
Reality Design Lab as idea material for designers, researchers, artists and students.
The core is **Kristina Höök's lineage** (KTH Royal Institute of Technology, Stockholm; *Designing with the Body:
Somaesthetic Interaction Design*, MIT Press 2018): her lab, students, co-authors and the communities around them
(Shusterman's somaesthetics, Schiphorst, Loke & Robertson, Isbister, Mueller's Exertion Games Lab, Benford & Tennent,
Márquez Segura, Wilde, Tsaknaki, Sanches, Søndergaard, Balaam, La Delfa, …), plus the foundations and practices they draw on.
The curatorial stance is **body-mind unity**: "soma" (Thomas Hanna) is the body-mind as one living whole, felt from within.
Prefer framings that treat feeling, thinking, emotion and movement as one process; name dualist assumptions when a work
challenges them. East Asian body-mind thought (身心一如, 气, 修身; Yuasa Yasuo, Ichikawa Hiroshi, tai chi, qigong, zazen)
belongs here as a first-class source, not as decoration.
Working dir: `/Users/amber/Projects/HoloKit/HoloKit2/somatic-inspire`.

Read first: `data/SCHEMA.md` (JSON format, language rule), `data/taxonomy.json` (fields / subs / modalities / lenses /
kinds / collections / disciplines) and `plan/AGENTS.md` (which batch owns what).

## Inclusion rule
- IN: works whose subject is **the felt, lived body-mind and designing from it**: soma design and somaesthetic
  interaction design prototypes; embodied / first-person / somatic design methods and toolkits; affective loops and
  biodata made felt; movement-based interaction, dance-tech, exertion and somatic play; intimate, feminist and queer soma
  design; somatic approaches to health and care; social touch and shared biosignals; soma design with robots, drones,
  AI, XR; somatic and participatory art; the somatic practices (Feldenkrais, BMC, Alexander, tai chi, qigong, yoga,
  zazen, contact improvisation…) and the philosophy (somaesthetics, phenomenology, enactivism, East Asian body-mind
  thought) that soma designers train in and cite.
- OUT: generic fitness trackers and quantified-self products with no felt, first-person angle; generic VR/haptics
  engineering papers that do not engage with lived experience; wellness marketing; works that only use the body as an
  input device for control (e.g. gesture remote control) without attention to how it feels.
  If in doubt, ask: *does the work make you feel, attend to, or rethink your own body-mind, or teach how to design that way?*
- **Salience over volume.** Prefer works that are canonical (cited, awarded, taught, discussed in Höök 2018 or the
  first-person / non-dualism papers) or unusually sharp. For each key researcher, add their 3–8 most important soma-related
  works (prototypes, methods, key papers), not everything they published.
- **Methods are first-class.** A method, toolkit, card deck or exercise that designers can use (e.g. estrangement,
  soma trajectories, Soma Bits, somaesthetic appreciation exercises, micro-phenomenological interview, embodied
  sketching, the Sensual Evaluation Instrument) gets its own work with `kind: "method"` and its paper.
- Balance: women and queer researchers are central in this field; include East Asian, Global South and non-Western
  body-mind traditions; the Chinese audience should find Chinese-language practices and researchers represented.

## Every work
- Bilingual text, a correct classification (`field`, `sub`, 1–3 `modalities`, 1–3 `lenses`, `kind`), and as many of:
  **video** (YouTube / Vimeo / mp4 — conference talk or demo videos on the ACM SIGCHI YouTube channel are fine),
  **images** (1–3 direct image URLs), **paper** (DOI / arXiv / publisher URL, with venue; for books: publisher page or DOI),
  `source_url` (project, lab or artist page).
- Aim for a visual on every prototype, artwork and practice. Good image sources: the project / lab page `og:image`
  (`python3 tools/check_media.py --og <page>`), researcher homepages, KTH / RISE / university news pages, Wikimedia Commons
  (`upload.wikimedia.org`), YouTube thumbnails are generated automatically when a video is present. Avoid Instagram /
  Pinterest CDN links (they expire). ACM DL figure images usually block hotlinking — check before using.
- Verify everything with `python3 tools/check_media.py` before writing it: videos and images (`<url>`), DOIs (`--doi`),
  arXiv ids (`--arxiv`). Keep only `"ok": true`. Check that a DOI's returned title really is the work — never guess a DOI.
- Year = year of first publication / showing. `exhibited`: 1–4 key shows, awards (e.g. "CHI 2016 Best Paper") — only if verified.
- Add `collections` ids when verified: `chi`, `dis`, `tei`, `moco`, `nime` (published there),
  `designing-with-the-body` (discussed in Höök's 2018 book), `first-person-soma-2018` (a case in Höök et al. 2018
  Informatics).
- For practices and theory: `kind: "practice"` (a somatic practice / discipline, with a representative video and image)
  or `kind: "publication"` (a book or essay, with publisher page or DOI in `paper`). Year = founding / first publication.

## Writing
- `description`: 1–2 sentences, concrete: what it is and what happens (what the person feels / does, what the system does).
- `idea_en`: the one-line insight a designer should take away about the felt body-mind.
- `method`: how it works (sensors, actuators, materials, practice, study setup), one sentence.
- Chinese versions natural, not word-for-word. Use established Chinese terms: 身体美学 (somaesthetics),
  身体设计 (soma design), 第一人称 (first-person), 陌生化 (estrangement), 内感受 (interoception), 身心一如, 费登奎斯 (Feldenkrais).
- Plain, precise language. No hype ("groundbreaking", "revolutionary", "stunning", "transformative").

## Output
- One file `data/raw/<your-batch>.json` (`"batch": "<your-batch>"`), creators + works + leads; split into
  `<your-batch>-2.json` if large (> ~60 works).
- Chinese titles for your works: `data/title_zh/<your-batch>.json` (see SCHEMA → Chinese titles; keep proper-name
  titles like "Soma Mat", translate descriptive titles, use established Chinese book titles where they exist).
- Creators get `disciplines` (1–2 of taxonomy.disciplines) and `name_zh` when they have a Chinese name.
- Before creating a creator, `grep -ril "<surname>" data/raw/` — parallel agents write too. If another batch has the
  creator, reuse the id. Creator ids: kebab-case ASCII of the name (`kristina-hook`, `anna-stahl`, `marie-louise-juul-sondergaard`).
  Work id: `<first-creator-id>--<short-slug>`. First creator = first author / lead artist.
- Creator records you may copy from the sister sites (same schema, reuse ids, re-write `why` for soma design):
  `/Users/amber/Projects/HoloKit/HoloKit2/{mth-inspire,machinic-inspire,becoming-inspire}/data/raw/*.json`
  (e.g. `char-davies`, `lygia-clark`, `rebecca-horn`, `mel-slater`, `beanotherlab`, `jiabao-li`, `botao-amber-hu`,
  `danielle-wilde`, `florian-mueller`, `rebecca-fiebrink`). Copy the creator, not their off-topic works.
- Run `python3 tools/validate.py data/raw/<file>.json` until it prints ✓.
- `leads`: people / works you found but did not add (for the next round).
- Search: WebSearch / WebFetch and `curl`. Useful: Google Scholar pages via WebSearch, dblp
  (`curl -s "https://dblp.org/search/publ/api?q=<q>&format=json&h=50"`), Crossref (`https://api.crossref.org/works?query=…`),
  Semantic Scholar API, researchers' homepages, KTH DiVA (diva-portal.org), YouTube oEmbed. If WebSearch fails, use curl
  and sparingly `curl -s -A "Mozilla/5.0" "https://html.duckduckgo.com/html/?q=<query>"`.
- Do NOT use the Chrome browser tools (shared). Scratch files: `temp/<your-batch>/` only.
- Do NOT touch files outside `data/raw/`, `data/title_zh/<your-batch>.json` and `temp/<your-batch>/`.

## Report back (short)
File(s) written, number of creators and works (by field and kind), how many have video / images / paper, notable gaps, top leads.
