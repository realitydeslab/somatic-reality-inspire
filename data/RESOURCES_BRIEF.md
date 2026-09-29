# Resources & Links brief (for every resources research agent)

The gallery at somatic.reality.design has a **Resources & Links** tab: the key PEOPLE of soma design (soma design & HCI
researchers, philosophers & theorists, somatic practitioners & teachers, artists / dancers / choreographers) and the
INSTITUTIONS & WEBSITES where the field happens (labs & research groups, somatic schools & trainings, conferences &
workshops, art & dance venues / festivals, journals / books / podcasts, networks & associations, archives & resources).
Working dir: `/Users/amber/Projects/HoloKit/HoloKit2/somatic-inspire`.

Read first: `data/SCHEMA.md` → section **Resource**, `data/taxonomy.json` → `org_types`, `org_themes`, `fields`,
and `data/RESEARCH_BRIEF.md` → project stance (Kristina Höök's lineage; body-mind unity; East Asian body-mind thought).

## Goal: complete for the key figures, selective beyond them
- People: everyone a well-read soma design researcher would expect: Höök and her lab (past and present PhD students,
  postdocs, co-authors), the somaesthetics / phenomenology / enactivism thinkers (Shusterman, Merleau-Ponty, Sheets-Johnstone,
  Gendlin, Varela, Thompson, Johnson, Leder, Hanna, Yuasa Yasuo, Ichikawa Hiroshi…), the embodied interaction researchers
  (Schiphorst, Loke, Robertson, Dourish, Klemmer, Hummels, Svanæs, Isbister, Mueller, Benford, Tennent, Márquez Segura,
  Wilde, Fdili Alaoui, Françoise, Tajadura-Jiménez, Bianchi-Berthouze, Balaam, Homewood, Søndergaard, Campo Woytuk…),
  the founders and key teachers of somatic practices (Feldenkrais, Alexander, Bainbridge Cohen, Laban, Bartenieff, Paxton,
  Halprin, Emilie Conrad, Levine, Kabat-Zinn, Cheng Man-ch'ing…), and artists working through the body (Lygia Clark,
  Char Davies, Rebecca Horn, Stelarc, Wayne McGregor…). Include East Asian and Chinese-speaking people.
- Institutions & websites: every lab, school, conference, venue, journal, network and archive that is a real reference
  point (KTH soma design group, Exertion Games Lab, Mixed Reality Lab Nottingham, UCL Interaction Centre, SFU SIAT,
  MOCO, TEI, Journal of Somaesthetics, Feldenkrais Guild, BMC School, ISMETA, Dagstuhl seminars on soma design…).
  Snowball through "people", "partners", "alumni", "committee" pages; record `found_via`.
- One record per person / institution. Big institutions only as the relevant unit (e.g. "KTH — Soma Design group", not "KTH").
- `url` must load (`python3 tools/check_media.py --og <url>` also returns image candidates for `image`).
  People: personal / lab page; if none, Wikipedia. Add Wikipedia / Google Scholar / interview in `links` (0–4).
- Bilingual `description` / `description_zh` (1–2 concrete sentences: who / what, and why it matters for soma design).
  `name_zh` for people and institutions with a Chinese name (and established Chinese transliterations such as 梅洛-庞蒂,
  费登奎斯, 舒斯特曼). `known_for`: 2–4 key works or books for people.
- `creator_id`: if the person / org exists as a creator in the works data (`grep -ril "<name>" data/raw/`), put its id.
  Agents writing works run in parallel; do a final grep pass right before you finish.
- `image`: prefer a representative photo (og:image) over a tiny logo; skip if none passes check_media.

## Output
- Your file only: `data/orgs/<your-batch>.json` (`{"batch": "...", "orgs": [...]}`); split into -2, -3 if large.
- Ids: people `person--<kebab-name>`, institutions `<kebab-name>`.
- Before adding, grep `data/orgs/*.json` for the name/url — parallel agents write too; do not duplicate.
- Validate: `python3 tools/validate_orgs.py data/orgs/<file>.json` until ✓.
- Search: WebSearch / WebFetch, curl, Wikipedia API; sparingly `curl -s -A "Mozilla/5.0" "https://html.duckduckgo.com/html/?q=<query>"`.
- No Chrome browser tools. Scratch: `temp/<your-batch>/`.

## Report back (short)
File(s), number of records by type and theme, directories harvested, notable gaps, leads.
