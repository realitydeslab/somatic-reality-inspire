"""Markdown catalog of the gallery for AI assistants (llms.txt convention).

catalog_md(data, lang) -> every field and sub-category with its works, then every creator.
llms_txt(data)         -> short index pointing to the full files.
"""
SITE = "https://somatic.reality.design"

T = {
    "en": {
        "title": "Somatic Reality Inspire — catalog",
        "intro": ("A catalog of soma design and somaesthetic interaction design, centred on Kristina Höök's lineage: research prototypes, design methods, somatic practices, artworks, performances and theory that treat body and mind as one soma, felt from within. Fields: foundations (somaesthetics, phenomenology, East Asian body-mind thought), somatic practices, soma design methods, somaesthetic interaction design, affective loops and biodata, movement and somatic art, intimate and feminist soma design, health and care, social soma, and soma with machines, AI and XR. Compiled by Reality Design Lab as idea material for designers, researchers, artists and students. Each work lists its core idea, how it works, and links to its paper, video and images."),
        "how": "How an AI assistant should use this file",
        "how_items": [
            "Ground ideas in the specific works below and name the work and creator you draw on.",
            "Cite papers with the DOI / URL given here; do not invent references.",
            "Combine body senses, methods and fields across works to propose new directions.",
            "Do not invent details that are not stated here; the links are the reference.",
        ],
        "creators": "Creators", "orgs": "Resources & links: people, institutions and websites", "idea": "Idea", "what": "What it is", "method": "How it works",
        "paper": "Paper", "video": "Video", "images": "Images", "page": "Project page", "code": "Code",
        "modalities": "Body & senses", "kind": "Type", "known": "Known for", "lenses": "Lens", "exhibited": "Shown at",
    },
    "zh": {
        "title": "Somatic Reality Inspire — 作品目录",
        "intro": ("以 Kristina Höök 一脉为中心的身体设计（soma design）与身体美学交互设计目录：把身与心当作同一个从内部被感受的身体的研究原型、设计方法、身体修习、艺术作品、表演与理论。领域包括：奠基（身体美学、现象学、东亚身心思想）、身体修习、身体设计方法、身体美学交互设计、情感回路与生物数据、运动与身体艺术、亲密与女性主义身体设计、健康与照护、社会身体，以及身体与机器、AI 与扩展现实。由 Reality Design Lab 整理，作为设计师、研究者、艺术家和学生的灵感库。每件作品都列出核心想法、实现方式，以及论文、视频和图片链接。"),
        "how": "AI 助手应如何使用这个文件",
        "how_items": [
            "提出想法时，以下面的具体作品为依据，并说明借鉴的是哪件作品、哪位创作者。",
            "引用论文时使用这里给出的 DOI 或链接，不要编造参考文献。",
            "把不同作品的身体感官、方法和领域组合起来，提出新的方向。",
            "不要编造这里没有写到的细节，以链接为准。",
        ],
        "creators": "创作者", "orgs": "资源与链接：人物、机构与网站", "idea": "核心想法", "what": "作品内容", "method": "实现方式",
        "paper": "论文", "video": "视频", "images": "图片", "page": "项目主页", "code": "代码",
        "modalities": "身体与感官", "kind": "类型", "known": "代表作", "lenses": "视角", "exhibited": "展出与获奖",
    },
}


def _yr(y: int, zh: bool) -> str:
    """Years before the common era (Zhuangzi, Mencius) read as 300 BCE / 公元前300."""
    return (f"公元前{-y}" if zh else f"{-y} BCE") if y < 0 else str(y)


def _label(pairs: list, key: str, zh: bool) -> str:
    row = next((p for p in pairs if p[0] == key), None)
    return (row[2] if zh else row[1]) if row else key


def _work(w: dict, lang: str, names: dict, tax: dict) -> str:
    s, zh = T[lang], lang == "zh"
    who = ", ".join(names.get(c, c) for c in w["creator_ids"])
    p = w.get("paper") or {}
    lines = [
        f"#### {(w['title_zh'] + '（' + w['title'] + '）') if zh and w.get('title_zh') and w['title_zh'] != w['title'] else w['title']} — {who}" + (f" ({_yr(w['year'], zh)})" if w.get("year") else ""),
        f"- {s['kind']}: {_label(tax['kinds'], w.get('kind', ''), zh)} · {s["modalities"]}: "
        + ", ".join(_label(tax["modalities"], o, zh) for o in w.get("modalities", [])),
        f"- {s['idea']}: {w.get('idea_zh' if zh else 'idea_en', '')}",
        f"- {s['what']}: {w.get('description_zh' if zh else 'description', '')}",
        f"- {s['method']}: {w.get('method_zh' if zh else 'method', '')}",
        f"- {s['lenses']}: " + ", ".join(_label(tax.get("lenses", []), x, zh) for x in w["lenses"]) if w.get("lenses") else "",
        f"- {s['exhibited']}: {'; '.join(w['exhibited'])}" if w.get("exhibited") else "",
        f"- {s['paper']}: {p['url']}" + (f" ({p['venue']})" if p.get("venue") else "") if p.get("url") else "",
        f"- {s['video']}: {w['video']['url']}" if w.get("video") else "",
        f"- {s['images']}: {' '.join(w['images'])}" if w.get("images") else "",
        f"- {s['page']}: {w['source_url']}" if w.get("source_url") else "",
        f"- {s['code']}: {w['code_url']}" if w.get("code_url") else "",
    ]
    return "\n".join(x for x in lines if x)


def catalog_md(data: dict, lang: str) -> str:
    s, zh = T[lang], lang == "zh"
    tax = data["taxonomy"]
    names = {c["id"]: (c.get("name_zh") if zh and c.get("name_zh") else c["name"]) for c in data["creators"]}
    counts = (f"{len(data['creators'])} 位创作者 · {len(data['works'])} 件作品" if zh
              else f"{len(data['creators'])} creators · {len(data['works'])} works")
    out = [f"# {s['title']}", "", s["intro"], "", f"{SITE} · {data['generated']} · {counts}", "", f"## {s['how']}", ""]
    out += [f"- {x}" for x in s["how_items"]] + [""]
    for f in tax["fields"]:
        fw = [w for w in data["works"] if w["field"] == f["id"]]
        if not fw:
            continue
        out += [f"## {f['zh'] if zh else f['en']}", "", f["desc_zh" if zh else "desc_en"], ""]
        for sub in f["subs"]:
            sw = [w for w in fw if w.get("sub") == sub["id"]]
            if not sw:
                continue
            out += [f"### {sub['zh'] if zh else sub['en']}", "", sub["desc_zh" if zh else "desc_en"], ""]
            out += ["\n\n".join(_work(w, lang, names, tax) for w in sw), ""]
    orgs = data.get("orgs") or []
    if orgs:
        out += [f"## {s['orgs']}", ""]
        for ot in tax.get("org_types", []):
            group = [o for o in orgs if o.get("type") == ot[0]]
            if not group:
                continue
            out += [f"### {ot[2] if zh else ot[1]}", ""]
            for o in group:
                desc = o.get("description_zh" if zh else "description", "")
                based = o.get("based_zh" if zh else "based", "")
                name = o["name"] + (f" / {o['name_zh']}" if o.get("name_zh") and o["name_zh"] != o["name"] else "")
                life = f"{o['born']}–{o.get('died', '')}" if o.get("born") else ""
                meta = ", ".join(x for x in (based, life) if x)
                known = f" {s['known']}: {'; '.join(o['known_for'])}." if o.get("known_for") else ""
                out.append(f"- **{name}**" + (f" ({meta})" if meta else "") + f" — {desc}{known} {o['url']}")
            out.append("")
    out += [f"## {s['creators']}", ""]
    for c in sorted(data["creators"], key=lambda c: (-c.get("work_count", 0), c["name"])):
        role = c.get("role_zh" if zh else "role", "")
        bio = c.get("bio_zh" if zh else "bio", "")
        site = (c.get("links") or {}).get("site", "")
        out.append(f"- **{c['name']}** ({c.get('work_count', 0)}) — {role}. {bio}" + (f" {site}" if site else ""))
    return "\n".join(out).rstrip() + "\n"


def llms_txt(data: dict) -> str:
    fields = ", ".join(f"{f['en']} ({sum(w['field'] == f['id'] for w in data['works'])})" for f in data["taxonomy"]["fields"])
    return "\n".join([
        "# Somatic Reality Inspire",
        "",
        f"> {T['en']['intro']}",
        "",
        f"{len(data['creators'])} creators, {len(data['works'])} works ({fields}), "
        f"{sum(bool(w.get('paper')) for w in data['works'])} with papers, {len(data.get('orgs') or [])} people, institutions & websites, updated {data['generated']}. "
        "Bilingual (English / Simplified Chinese).",
        "",
        "## Full catalog",
        "",
        f"- [English catalog]({SITE}/catalog.md): every field and sub-category with all works, then all creators",
        f"- [Chinese catalog]({SITE}/catalog.zh.md): 中文版完整目录",
        f"- [Raw data (JSON)]({SITE}/data/entries.json)",
        "",
        "## Website",
        "",
        f"- [{SITE}]({SITE}): images and videos, paper links, filters by field, body sense, lens and type, starring and SKILL.md export",
        "",
    ])
