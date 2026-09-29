/* Somatic Reality Inspire — language-aware field access and Markdown export (SKILL.md / README.md / reading list). */
(() => {
  "use strict";
  const SITE = "https://somatic.reality.design";

  const text = {
    work(w, lang) {
      const zh = lang === "zh";
      return { description: zh ? w.description_zh : w.description, idea: zh ? w.idea_zh : w.idea_en, method: zh ? w.method_zh : w.method };
    },
    creator(c, lang) {
      const zh = lang === "zh";
      return { role: zh ? c.role_zh : c.role, bio: zh ? c.bio_zh : c.bio, why: zh ? c.why_zh : c.why, based: zh ? c.based_zh : c.based };
    },
  };

  const L = {
    en: {
      skillDesc: (n) => `${n} works I starred in Somatic Reality Inspire (${SITE}): soma design prototypes, methods, somatic practices, artworks and theory that treat body and mind as one — somaesthetic appreciation, breath, touch and heat, affective loops and biodata, movement, intimate and feminist soma design, care, and soma with machines. For each: what it is, its core idea, how it works, and paper / video links. Use when brainstorming embodied or somaesthetic interaction projects, planning a soma design workshop, writing related work, or preparing a course or studio brief.`,
      skillTitle: "Somatic reality: my starred works",
      source: (d, n) => `Source: ${SITE} · exported ${d} · ${n} works.`,
      howTitle: "How to use this skill",
      how: [
        "Start from these works and name the work and creator you build on.",
        "Propose new directions by combining body senses, methods and fields from two or more works.",
        "Cite papers only with the DOI / URL listed here; do not invent references.",
        "Do not invent details that are not described here.",
      ],
      field: "Field", modalities: "Body & senses", idea: "Idea", what: "What it is", method: "How it works",
      paper: "Paper", video: "Video", page: "Project page",
      readmeTitle: "My picks from Somatic Reality Inspire",
      readmeIntro: (n) => `${n} works I starred on ${SITE}. For an AI assistant, load the companion SKILL.md.`,
      listTitle: "Reading list — Somatic Reality Inspire",
    },
    zh: {
      skillDesc: (n) => `我在 Somatic Reality Inspire（${SITE}）收藏的 ${n} 件作品：把身与心当作一体的身体设计原型、方法、身体修习、艺术作品与理论，涵盖身体美学鉴赏、呼吸、触碰与热、情感回路与生物数据、运动、亲密与女性主义身体设计、照护，以及身体与机器。每件作品包括：内容、核心想法、实现方式，以及论文和视频链接。在构思具身或身体美学交互项目、策划身体设计工作坊、撰写相关研究综述、准备课程或设计课题时使用。`,
      skillTitle: "身体现实：我的收藏",
      source: (d, n) => `来源：${SITE} · 导出于 ${d} · 共 ${n} 件作品。`,
      howTitle: "如何使用这个 skill",
      how: [
        "从这些作品出发，并说明借鉴的是哪件作品、哪位创作者。",
        "把两件或更多作品的身体感官、方法和领域组合起来，提出新的方向。",
        "引用论文时只使用这里列出的 DOI 或链接，不要编造参考文献。",
        "不要编造这里没有描述的细节。",
      ],
      field: "领域", modalities: "身体与感官", idea: "核心想法", what: "作品内容", method: "实现方式",
      paper: "论文", video: "视频", page: "项目主页",
      readmeTitle: "我在 Somatic Reality Inspire 的收藏",
      readmeIntro: (n) => `我在 ${SITE} 收藏的 ${n} 件作品。给 AI 助手使用时，请加载配套的 SKILL.md。`,
      listTitle: "阅读清单 — Somatic Reality Inspire",
    },
  };

  const label = (pairs, k, zh) => { const r = pairs.find((p) => p[0] === k); return r ? (zh ? r[2] : r[1]) : k; };
  const fieldName = (data, id, zh) => { const f = data.taxonomy.fields.find((x) => x.id === id); return f ? (zh ? f.zh : f.en) : id; };
  const subName = (data, w, zh) => {
    const f = data.taxonomy.fields.find((x) => x.id === w.field);
    const s = f && f.subs.find((x) => x.id === w.sub);
    return s ? (zh ? s.zh : s.en) : "";
  };
  const names = (w, data) => w.creator_ids.map((id) => (data.creators.find((c) => c.id === id) || {}).name || id).join(", ");

  function block(w, data, lang) {
    const s = L[lang], zh = lang === "zh", t = text.work(w, lang);
    const p = w.paper || {};
    return [
      `### ${zh && w.title_zh && w.title_zh !== w.title ? `${w.title_zh}（${w.title}）` : w.title} — ${names(w, data)}${w.year ? ` (${w.year < 0 ? (zh ? `公元前${-w.year}` : `${-w.year} BCE`) : w.year})` : ""}`,
      `- ${s.field}: ${fieldName(data, w.field, zh)} / ${subName(data, w, zh)}`,
      `- ${s.modalities}: ${(w.modalities || []).map((o) => label(data.taxonomy.modalities, o, zh)).join(", ")}`,
      t.idea ? `- ${s.idea}: ${t.idea}` : "",
      t.description ? `- ${s.what}: ${t.description}` : "",
      t.method ? `- ${s.method}: ${t.method}` : "",
      p.url ? `- ${s.paper}: ${p.url}${p.venue ? ` (${p.venue})` : ""}` : "",
      w.video && w.video.url ? `- ${s.video}: ${w.video.url}` : "",
      w.source_url ? `- ${s.page}: ${w.source_url}` : "",
    ].filter(Boolean).join("\n");
  }
  const today = () => new Date().toISOString().slice(0, 10);

  function skillMd(list, data, lang) {
    const s = L[lang];
    return [
      "---", "name: somatic-reality-inspiration", `description: ${s.skillDesc(list.length)}`, "---", "",
      `# ${s.skillTitle}`, "", s.source(today(), list.length), "", `## ${s.howTitle}`, "",
      ...s.how.map((x) => `- ${x}`), "", ...list.map((w) => block(w, data, lang) + "\n"),
    ].join("\n");
  }
  function readmeMd(list, data, lang) {
    const s = L[lang];
    return [`# ${s.readmeTitle}`, "", s.readmeIntro(list.length), "", ...list.map((w) => block(w, data, lang) + "\n")].join("\n");
  }
  function readingList(list, data, lang) {
    const s = L[lang];
    const rows = list.filter((w) => w.paper && w.paper.url).sort((a, b) => (a.year || 0) - (b.year || 0))
      .map((w) => `- ${names(w, data)} (${w.year ? (w.year < 0 ? `${-w.year} BCE` : w.year) : "n.d."}). *${w.title}*.${w.paper.venue ? ` ${w.paper.venue}.` : ""} ${w.paper.doi ? `https://doi.org/${w.paper.doi}` : w.paper.url}`);
    return [`# ${s.listTitle}`, "", s.source(today(), rows.length), "", ...rows, ""].join("\n");
  }

  window.MthText = text;
  window.MthExport = { skillMd, readmeMd, readingList };
})();
