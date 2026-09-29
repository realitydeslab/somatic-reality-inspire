# Somatic Reality Inspire

**https://somatic.reality.design**

You don't have a body, you are one. A bilingual (English / 中文) gallery of **soma design**: the research prototypes, design methods, somatic practices, artworks, performances and theory that treat body and mind as one soma, felt from within. It is centred on **Kristina Höök's lineage** (KTH Royal Institute of Technology; *Designing with the Body: Somaesthetic Interaction Design*, MIT Press 2018) and reaches out to the philosophy and practices it draws on: somaesthetics, phenomenology, enactivism, Feldenkrais and other somatic practices, and East Asian body-mind thought (身心一如, qi, self-cultivation). Built by [Reality Design Lab](https://reality.design) as idea material for designers, researchers, artists and students. Sibling of [Machinic Reality Inspire](https://machinic.reality.design) and [More than Human Inspire](https://more-than-human.reality.design).

## What's inside

- **Atlas**: the eleven fields and their sub-categories, the fourteen lenses, and collections.
- **Eleven fields**, each grouped by sub-category:
  - Foundations: somaesthetics, phenomenology of the lived body, embodied & enactive mind, body-mind oneness in East Asian thought, embodied interaction theory.
  - Somatic Practices: movement education (Feldenkrais, Alexander, BMC, Laban), qi / tai chi / yoga / zen, meditation & breath, somatic dance & improvisation, somatic therapy.
  - Soma Design Methods: first-person methods, estrangement, somatic training of the designer, bodystorming & embodied sketching, soma-based material exploration, articulating & evaluating felt experience, strong concepts & felt ethics.
  - Somaesthetic Interaction Design: appreciation & attunement, breath, heat / vibration / shape-change, sound & voice, garments.
  - Augmented & Transhuman Soma: extra limbs & prostheses, new senses & sensory substitution, human–computer integration (EMS, GVS), superhuman sports & augmented performance, cyborg & posthuman art, transhuman & posthuman thought.
  - Affective Loops & Biodata: affective loops, biosignals as design material, interoception, body data & ambiguity.
  - Movement, Dance & Somatic Art: dance & technology, movement & computing, exertion & play, performance, somatic & participatory art.
  - Intimate, Feminist & Queer Soma: menstruation, pleasure, women's health, menopause & life transitions, queer & trans bodies.
  - Health, Care & Wellbeing: chronic pain & rehabilitation, stress & mental health, neurodiversity & motor conditions, ageing & care.
  - Social & Collective Soma: mediated touch, shared breath & heartbeat, collective somatics.
  - Soma with Machines, AI & XR: somaesthetic robots & drones, machine learning, virtual bodies, more-than-human soma.
- **All works**: filter by field, body & senses (breath, touch, heat, movement, heartbeat, EDA…), lens (body-mind unity, extended body, first-person, attunement, estrangement, technology that touches back, intercorporeality…), type (prototype, method, practice, artwork, performance, paper, book…), collection and era; full-text search.
- **Collections**: the cases of *Designing with the Body* and of "Embracing First-Person Perspectives in Soma-Based Design" (2018); venues (CHI, DIS, TEI, MOCO, NIME).
- **Resources & Links**: the researchers, philosophers, somatic teachers and artists of the field, and its labs, schools, conferences, journals and networks.
- **Papers**, **Creators**, **Starred** (export as `SKILL.md`, `README.md` or a reading list with DOIs).

## For AI assistants

- [`llms.txt`](llms.txt): index
- [`catalog.md`](catalog.md) / [`catalog.zh.md`](catalog.zh.md): full catalog in English / Chinese
- [`data/entries.json`](data/entries.json): raw data

## Maintain it with AI

Open this folder in [Claude Code](https://claude.com/claude-code) and run:

```text
/add-work Thecla Schiphorst
/add-work https://doi.org/10.1145/2858036.2858583
/add-work Body-Mind Centering
```

`/add-work` (in [`.claude/commands/`](.claude/commands/)) researches the person, work, method, practice or paper, adds every salient soma-related work in both languages with verified video / image / paper links, rebuilds and publishes. The inclusion rule and research rules are in [`data/RESEARCH_BRIEF.md`](data/RESEARCH_BRIEF.md), the data format in [`data/SCHEMA.md`](data/SCHEMA.md), the Resources tab brief in [`data/RESOURCES_BRIEF.md`](data/RESOURCES_BRIEF.md).

| Script | Purpose |
|---|---|
| `python3 tools/check_media.py <url>…` / `--doi` / `--arxiv` / `--og <page>` | Check videos, images, DOIs and arXiv ids; list image candidates on a page |
| `python3 tools/validate.py data/raw/<file>.json` (or `--all`) | Check a batch: bilingual fields, taxonomy ids (field, sub, modalities, lenses), duplicates |
| `python3 tools/validate_orgs.py --all` | Check the Resources & Links records |
| `python3 tools/build_data.py [--recheck]` | Merge batches, verify every link, write `data/entries.*`, catalogs and `llms.txt` |
| `python3 tools/audit_titles.py` | List same-title works across batches (possible duplicates) |
| `tools/publish.sh "<message>"` | Validate all, rebuild, refuse on errors or unexpected removals, commit and push |

## Run locally

```bash
./serve.sh   # rebuilds data/ and serves http://localhost:8936
```

## Data layout

| Path | Contents |
|---|---|
| `data/taxonomy.json` | Fields and sub-categories, body modalities, lenses, work types, collections, disciplines, resource types |
| `data/raw/*.json` | Research batches: creators, works, leads |
| `data/orgs/*.json` | Resources & Links: people, institutions and websites |
| `data/title_zh/*.json` | Chinese titles of works |
| `data/collections/*.json` | Extra members of a collection (lists of work ids); `defs/` adds collections |
| `data/entries.json`, `data/entries.js` | Built dataset used by the site |
| `data/media_cache.json`, `data/dropped.json` | Link-check results; dead links and DOI/title mismatches |
| `data/leads.json` | People and works found but not yet researched |

## Credits

Images and videos are linked from the researchers, artists, labs and publishers and remain theirs. To suggest a correction or an addition, please open an issue.

---

# Somatic Reality Inspire（中文）

**https://somatic.reality.design**

你不是拥有身体，你就是身体。这是一个中英双语的**身体设计（soma design）**作品库：收录把身与心当作同一个从内部被感受的身体的研究原型、设计方法、身体修习、艺术作品、表演与理论。以 **Kristina Höök 一脉**（瑞典皇家理工学院 KTH；《用身体设计：身体美学交互设计》，MIT 出版社 2018）为中心，并延伸到它所依托的哲学与修习：身体美学、现象学、生成认知、Feldenkrais 等身体修习，以及东亚的身心思想（身心一如、气、修身）。由 [Reality Design Lab](https://reality.design) 整理，是 [Machinic Reality Inspire](https://machinic.reality.design) 与 [More than Human Inspire](https://more-than-human.reality.design) 的姊妹站。

- **总览**：十一个领域及其子类、十四种视角与各个合集。
- **十一个领域**：奠基：身心与身体美学；身体修习；身体设计方法；身体美学交互设计；增强与超人类的身体；情感回路与生物数据；运动、舞蹈与身体艺术；亲密、女性主义与酷儿身体；健康、照护与安适；社会与集体身体；身体与机器、AI 与扩展现实。
- **全部作品**：按领域、身体与感官、视角、类型、合集和年代筛选，支持全文搜索。
- **合集**：《用身体设计》及两篇关键论文里的案例，以及 CHI、DIS、TEI、MOCO、NIME 等发表平台。
- **资源与链接**：这个领域的研究者、哲学家、身体修习教师与艺术家，以及实验室、学校、会议、期刊与网络。
- **论文**、**创作者**、**收藏**（可导出 `SKILL.md`、`README.md` 或附 DOI 的阅读清单）。

在 Claude Code 中打开本仓库，输入 `/add-work <名字、作品链接或 DOI>` 即可让 AI 调研并添加新作品。本地运行：`./serve.sh`。

图片与视频版权归原作者、实验室和出版方所有。如需更正或补充，欢迎提交 issue。
