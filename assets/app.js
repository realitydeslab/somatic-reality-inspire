/* Somatic Reality Inspire — gallery app. Data: data/entries.js (window.SRI, light core) + data/entries-detail.js
   (window.SRI_DETAIL: long texts, creators, organizations; loaded after the first paint). Strings: assets/i18n.js. */
(() => {
  "use strict";

  const DATA = window.SRI || { creators: [], works: [], taxonomy: { fields: [], modalities: [], kinds: [] }, generated: "" };
  const I18N = window.SRI_I18N;
  const TX = window.MthText;
  const TAX = DATA.taxonomy;
  const FIELDS = TAX.fields;
  const COLS = TAX.collections || [];
  const APPS = TAX.lenses || [];
  const DISCS = TAX.disciplines || [];
  const ERAS = [["1999", -9999, 1999, "≤1999"], ["2000", 2000, 2009, "2000–09"], ["2010", 2010, 2014, "2010–14"], ["2015", 2015, 2019, "2015–19"], ["2020", 2020, 2030, "2020–26"]];
  const yr = (y) => (y < 0 ? (lang === "zh" ? `公元前${-y}` : `${-y} BCE`) : String(y));  // ancient sources (Zhuangzi, Mencius)
  let ORGS = DATA.orgs || [];
  const OTYPES = TAX.org_types || [];
  const OTHEMES = TAX.org_themes || [];
  const VIEWS = ["atlas", ...FIELDS.map((f) => f.id), "collections", "orgs", "works", "papers", "creators", "starred"];
  const FILTERED = ["works", "papers", "creators"];

  const creatorsById = Object.fromEntries(DATA.creators.map((c) => [c.id, c]));
  const worksById = Object.fromEntries(DATA.works.map((w) => [w.id, w]));
  const fieldById = Object.fromEntries(FIELDS.map((f) => [f.id, f]));

  /* ---------- detail data: long texts, full creator records, organizations (second file, loaded in the background) ---------- */
  let detailReady = !!DATA.orgs;   // a full single-file dataset needs no second request
  let detailPromise = null;
  const hayCache = new Map();
  function ensureDetail() {
    if (detailReady) return Promise.resolve();
    if (!detailPromise) detailPromise = new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = `data/entries-detail.js?v=${DATA.v || ""}`;
      el.onload = () => {
        const D = window.SRI_DETAIL || { works: {}, creators: [], orgs: [] };
        Object.entries(D.works || {}).forEach(([id, x]) => { if (worksById[id]) Object.assign(worksById[id], x); });
        (D.creators || []).forEach((c) => { if (creatorsById[c.id]) Object.assign(creatorsById[c.id], c); });
        ORGS = D.orgs || [];
        detailReady = true;
        hayCache.clear();
        resolve();
      };
      el.onerror = () => { detailPromise = null; resolve(); };
      document.head.appendChild(el);
    });
    return detailPromise;
  }
  const loadingNote = () => `<p class="count mono loading">${esc(S().loading)}</p>`;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- per-viewer storage (never required for the page to work) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  let lang = store.get("sri-lang", (navigator.language || "").startsWith("zh") ? "zh" : "en");
  let stars = new Set(store.get("sri-stars", []).filter((id) => worksById[id]));
  const S = () => I18N[lang];
  const zh = () => lang === "zh";
  const nm = (o) => (zh() ? o.zh : o.en);
  const pair = (list, k) => { const r = list.find((x) => x[0] === k); return r ? (zh() ? r[2] : r[1]) : k; };
  const orgName = (k) => pair(TAX.modalities, k);
  const kindName = (k) => pair(TAX.kinds, k);
  const appName = (k) => pair(APPS, k);
  const discName = (k) => pair(DISCS, k);
  const subOf = (w) => (fieldById[w.field]?.subs || []).find((s) => s.id === w.sub);
  const src = (p) => S().sources[p] || p;

  const state = { view: "atlas", oq: "", otype: "", otheme: "", q: "", apps: new Set(), discs: new Set(), cols: new Set(), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", sort: "new", creator: "", video: false, paper: false, sub: "" };
  let currentList = [];
  let openIndex = -1;
  let mediaIndex = 0;

  /* ---------- state <-> URL hash ---------- */
  const set = (p, k) => new Set((p.get(k) || "").split(",").filter(Boolean));
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    state.view = VIEWS.includes(p.get("view")) ? p.get("view") : "atlas";
    Object.assign(state, { q: p.get("q") || "", apps: set(p, "a"), discs: set(p, "d"), cols: set(p, "col"), fields: set(p, "f"), orgs: set(p, "o"), kinds: set(p, "k"), era: p.get("era") || "",
      sort: p.get("sort") || "new", creator: p.get("c") || "", video: p.get("v") === "1", paper: p.get("p") === "1", sub: p.get("sub") || "" });
    Object.assign(state, { otype: p.get("ot") || "", otheme: p.get("oth") || "", oq: p.get("oq") || "" });
    return { work: p.get("w") };
  }
  function writeHash(workId) {
    const p = new URLSearchParams();
    if (state.view !== "atlas") p.set("view", state.view);
    if (fieldById[state.view] && state.sub) p.set("sub", state.sub);
    if (FILTERED.includes(state.view)) {
      if (state.q) p.set("q", state.q);
      if (state.cols.size) p.set("col", [...state.cols].join(","));
      if (state.apps.size) p.set("a", [...state.apps].join(","));
      if (state.discs.size) p.set("d", [...state.discs].join(","));
      if (state.fields.size) p.set("f", [...state.fields].join(","));
      if (state.orgs.size) p.set("o", [...state.orgs].join(","));
      if (state.kinds.size) p.set("k", [...state.kinds].join(","));
      if (state.era) p.set("era", state.era);
      if (state.sort !== "new") p.set("sort", state.sort);
      if (state.creator) p.set("c", state.creator);
      if (state.video) p.set("v", "1");
      if (state.paper) p.set("p", "1");
    }
    if (state.view === "orgs") {
      if (state.otype) p.set("ot", state.otype);
      if (state.otheme) p.set("oth", state.otheme);
      if (state.oq) p.set("oq", state.oq);
    }
    if (workId) p.set("w", workId);
    history.replaceState(null, "", "#" + p.toString());
  }

  /* ---------- filtering ---------- */
  const creatorNames = (w) => w.creator_ids.map((id) => (zh() && creatorsById[id]?.name_zh) || creatorsById[id]?.name || id);
  const inField = (w, f) => w.field === f || (w.also || []).includes(f);
  function haystack(w) {
    const key = lang + "|" + w.id;
    if (!hayCache.has(key)) hayCache.set(key, buildHaystack(w));
    return hayCache.get(key);
  }
  function buildHaystack(w) {
    return [w.title, w.title_zh, w.description, w.description_zh, w.idea_en, w.idea_zh, w.method, w.method_zh, w.paper?.venue, ...(w.keywords || []),
      ...(w.modalities || []).map((o) => pair(TAX.modalities, o)), ...creatorNames(w), ...w.creator_ids.map((id) => creatorsById[id]?.name_zh || ""), w.year].join(" ").toLowerCase();
  }
  function matches(w, skip = "") {
    if (state.creator && !w.creator_ids.includes(state.creator)) return false;
    if (state.video && !w.video?.url) return false;
    if (state.paper && !w.paper?.url) return false;
    if (skip !== "a" && state.apps.size && !(w.lenses || []).some((x) => state.apps.has(x))) return false;
    if (skip !== "d" && state.discs.size && !(w.disciplines || []).some((x) => state.discs.has(x))) return false;
    if (skip !== "c" && state.cols.size && !(w.collections || []).some((c) => state.cols.has(c))) return false;
    if (skip !== "f" && state.fields.size && ![...state.fields].some((f) => inField(w, f))) return false;
    if (skip !== "o" && state.orgs.size && !(w.modalities || []).some((o) => state.orgs.has(o))) return false;
    if (skip !== "k" && state.kinds.size && !state.kinds.has(w.kind)) return false;
    if (state.era) {
      const e = ERAS.find((x) => x[0] === state.era);
      if (!w.year || w.year < e[1] || w.year > e[2]) return false;
    }
    if (state.q && !haystack(w).includes(state.q.toLowerCase())) return false;
    return true;
  }
  function sorted(list) {
    const arr = [...list];
    if (state.sort === "old") arr.sort((a, b) => (a.year || 9999) - (b.year || 9999));
    else if (state.sort === "creator") arr.sort((a, b) => creatorNames(a)[0].localeCompare(creatorNames(b)[0]) || (a.year || 0) - (b.year || 0));
    else arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    return arr;
  }

  /* ---------- cards ---------- */
  const poster = (w) => w.video?.thumbnail || (w.images || [])[0] || "";
  const ttl = (w) => (zh() && w.title_zh) || w.title;                       // title in the current language
  const ttlOrig = (w) => (zh() && w.title_zh && w.title_zh !== w.title ? w.title : "");   // original title under a Chinese one
  const paperPh = (w) => `<div class="ph ph--paper"><span class="ph__venue mono">${esc(w.paper?.venue || S().paper_card)}</span><span class="ph__title">${esc(ttl(w))}</span></div>`;
  // card-sized variants of large posters (the full size stays in the work viewer); falls back to the original on error
  const small = (u) => u
    .replace(/(i\.ytimg\.com\/vi\/[^/]+\/)maxresdefault\.jpg$/, "$1hqdefault.jpg")
    .replace(/(i\.vimeocdn\.com\/video\/[^?]+-d)(\?|$)/, "$1_640$2")
    .replace(/^(https:\/\/images\.squarespace-cdn\.com\/[^?]+)$/, "$1?format=750w");
  const THUMB_ERR = "if(this.dataset.full){this.src=this.dataset.full;this.removeAttribute('data-full')}else{this.outerHTML=this.dataset.ph}";
  function thumb(w) {
    const p = poster(w);
    if (p) { const s = small(p);
      return `<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${esc(s)}"${s !== p ? ` data-full="${esc(p)}"` : ""} alt="" onerror="${THUMB_ERR}" data-ph="${esc(paperPh(w))}">`; }
    if (w.video?.platform === "mp4") return `<video muted playsinline preload="none" data-src="${esc(w.video.url)}#t=0.8"></video>`;
    return paperPh(w);
  }
  const starBtn = (id, cls = "star") => `<button class="${cls}" type="button" data-star="${esc(id)}" aria-pressed="${stars.has(id)}" aria-label="${esc(S().star_aria)}">${stars.has(id) ? "★" : "☆"}</button>`;
  function card(w) {
    const who = creatorNames(w).join(", ");
    const tags = (w.modalities || []).map((o) => `<span class="tag">${esc(orgName(o))}</span>`).join("");
    const marks = `${w.video?.url ? "▶" : ""}${w.paper?.url ? " ¶" : ""}`.trim();
    return `<div class="cardwrap">
      <button class="card" data-id="${esc(w.id)}" aria-label="${esc(ttl(w))} — ${esc(who)}">
        <div class="card__media">${thumb(w)}
          <span class="br br--tl"></span><span class="br br--tr"></span><span class="br br--bl"></span><span class="br br--br"></span>
          <span class="card__src">${esc(kindName(w.kind))}${marks ? ` · ${marks}` : ""}</span>
          ${w.year ? `<span class="card__year">${yr(w.year)}</span>` : ""}
        </div>
        <div class="card__field mono">${esc(nm(fieldById[w.field] || {}))}${subOf(w) ? ` / ${esc(nm(subOf(w)))}` : ""}</div>
        <div class="card__title">${esc(ttl(w))}${ttlOrig(w) ? `<span class="card__orig">${esc(ttlOrig(w))}</span>` : ""}</div>
        <div class="card__meta">${esc(who)}</div>
        <div class="card__idea">${esc(TX.work(w, lang).idea || "")}</div>
        <div class="tags">${tags}</div>
      </button>${starBtn(w.id)}
    </div>`;
  }

  /* ---------- static text, tabs, chips ---------- */
  function applyStatic() {
    document.documentElement.lang = zh() ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = S()[el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = S()[el.dataset.i18nHtml]; });
    $("#q").placeholder = S().search_ph;
    $("#langToggle").textContent = S().lang_toggle;
    const years = DATA.works.map((w) => w.year).filter(Boolean);
    $("#stats").innerHTML = [
      [S().stat_works, DATA.works.length], [S().stat_creators, DATA.creators.length],
      [S().stat_papers, DATA.works.filter((w) => w.paper?.url).length], [S().stat_video, DATA.works.filter((w) => w.video?.url).length],
      [S().stat_span, years.length ? `${yr(Math.min(...years))}–${Math.max(...years)}` : "—"],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("#tabs").innerHTML = VIEWS.map((v) => `<button role="tab" class="tab" data-view="${v}">${esc(fieldById[v] ? nm(fieldById[v]) : S()["tab_" + v])}${v === "starred" ? ` <span class="tab__count mono" id="starCount"></span>` : ""}</button>`).join("");
    $("#generated").textContent = DATA.generated ? S().updated(DATA.generated) : "";
    $("#empty").textContent = S().empty;
  }
  /* ---------- progressive lists: first batch now, more as the reader nears the end (keeps phones responsive) ---------- */
  const NEAR = 1400;
  const moreIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && e.target._more) e.target._more(); });
  }, { rootMargin: `${NEAR}px 0px` }) : null;
  function fillProgressive(el, items, html, first = 24, step = 36) {
    if (el._sentinel) { moreIO?.unobserve(el._sentinel); el._sentinel.remove(); el._sentinel = null; }
    el.innerHTML = "";
    let i = 0;
    const sentinel = document.createElement("div");
    sentinel.className = "more-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    const add = (n) => {
      if (!el.isConnected) return;
      const chunk = items.slice(i, i + n);
      i += chunk.length;
      el.insertAdjacentHTML("beforeend", chunk.map(html).join(""));
      lazyVideos();
      if (i >= items.length) { moreIO?.unobserve(sentinel); sentinel.remove(); el._sentinel = null; return; }
      requestAnimationFrame(() => { if (sentinel.isConnected && sentinel.getBoundingClientRect().top < innerHeight + NEAR) add(step); });
    };
    sentinel._more = () => add(step);
    if (items.length > first) { el.after(sentinel); el._sentinel = sentinel; }
    add(first);
    if (el._sentinel) { if (moreIO) moreIO.observe(sentinel); else add(items.length); }
  }
  function chipRow(label, items, cur, attr, skip) {
    const base = DATA.works.filter((w) => matches(w, skip));
    return `<div class="chiprow"><span class="chiprow__label mono">${esc(label)}</span><div class="chips">${items.map(([k, text, test]) => {
      const n = base.filter(test).length;
      return n || cur.has(k) ? `<button class="chip" data-${attr}="${esc(k)}" aria-pressed="${cur.has(k)}">${esc(text)}<small>${n}</small></button>` : "";
    }).join("")}</div></div>`;
  }
  function renderChips() {
    $("#facetChips").innerHTML =
      chipRow(S().f_field, FIELDS.map((f) => [f.id, nm(f), (w) => inField(w, f.id)]), state.fields, "field", "f") +
      (APPS.length ? chipRow(S().f_approach, APPS.map(([k]) => [k, appName(k), (w) => (w.lenses || []).includes(k)]), state.apps, "app", "a") : "") +
      (DISCS.length ? chipRow(S().f_discipline, DISCS.map(([k]) => [k, discName(k), (w) => (w.disciplines || []).includes(k)]), state.discs, "disc", "d") : "") +
      chipRow(S().f_modality, TAX.modalities.map(([k]) => [k, orgName(k), (w) => (w.modalities || []).includes(k)]), state.orgs, "org", "o") +
      chipRow(S().f_kind, TAX.kinds.map(([k]) => [k, kindName(k), (w) => w.kind === k]), state.kinds, "kind", "k") +
      (COLS.length ? chipRow(S().f_collection, COLS.map((c) => [c.id, nm(c), (w) => (w.collections || []).includes(c.id)]), state.cols, "col", "c") : "");
    $("#eraChips").innerHTML = ERAS.map(([k, , , label]) => `<button class="chip" data-era="${k}" aria-pressed="${state.era === k}">${label}</button>`).join("");
    const ac = $("#activeCreator");
    ac.hidden = !state.creator;
    if (state.creator) ac.innerHTML = `${esc(S().showing_by)} <strong>${esc(creatorsById[state.creator]?.name || state.creator)}</strong> <button data-clear-creator>${esc(S().clear_creator)}</button>`;
  }

  /* ---------- views ---------- */
  const colCount = (c) => DATA.works.filter((w) => (w.collections || []).includes(c.id)).length;
  const colCard = (c) => { const n = colCount(c); return n ? `<button class="colcard" data-col-go="${esc(c.id)}">
      <span class="colcard__n mono">${n} · ${esc(S().col_types[c.type] || "")}</span><span class="colcard__title">${esc(nm(c))}</span>
      <span class="colcard__desc">${esc(zh() ? c.desc_zh : c.desc_en)}</span></button>` : ""; };
  function renderCollections() {
    currentList = [];
    const groups = ["survey", "exhibition", "award", "archive", "venue"].map((t) => [t, COLS.filter((c) => (c.type || "award") === t && colCount(c))]).filter(([, cs]) => cs.length);
    $("#collectionList").innerHTML = `<div class="starred__head"><h2 class="starred__title">${esc(S().collections)}</h2><p class="starred__lede">${esc(S().collections_lede)}</p></div>` +
      groups.map(([t, cs]) => `<section class="scat"><div class="scat__head"><h3 class="scat__title">${esc(S().col_groups[t])}</h3><span class="scat__n mono">${cs.length}</span></div>
        <div class="cols__grid">${cs.map(colCard).join("")}</div></section>`).join("");
    return groups.length;
  }
  const pairName = (list, k) => { const r = list.find((x) => x[0] === k); return r ? (zh() ? r[2] : r[1]) : k; };
  function renderOrgs() {
    currentList = [];
    if (!detailReady) { $("#orgHead").innerHTML = loadingNote(); $("#orgList").innerHTML = ""; ensureDetail().then(() => state.view === "orgs" && render()); return 1; }
    const q = state.oq.toLowerCase();
    const hit = (o, skip) => (skip === "t" || !state.otype || o.type === state.otype) && (skip === "h" || !state.otheme || (o.themes || []).includes(state.otheme)) &&
      (!q || [o.name, o.name_zh, o.description, o.description_zh, o.based, ...(o.people || []), ...(o.known_for || [])].join(" ").toLowerCase().includes(q));
    const chips = (list, cur, attr, skip, test) => list.map(([k]) => { const n = ORGS.filter((o) => hit(o, skip) && test(o, k)).length;
      return n || cur === k ? `<button class="chip" data-${attr}="${esc(k)}" aria-pressed="${cur === k}">${esc(pairName(list, k))}<small>${n}</small></button>` : ""; }).join("");
    const shown = ORGS.filter((o) => hit(o));
    $("#orgHead").innerHTML = `<div class="starred__head"><h2 class="starred__title">${esc(S().tab_orgs)}</h2><p class="starred__lede">${esc(S().orgs_lede)}</p>
        <p class="count mono">${esc(S().orgs_n(shown.length))}</p></div>
      <label class="search orgsearch"><span class="visually-hidden">${esc(S().search_label)}</span><input id="oq" type="search" autocomplete="off" placeholder="${esc(S().orgs_search)}" value="${esc(state.oq)}"></label>
      <div class="facets"><div class="chiprow"><span class="chiprow__label mono">${esc(S().f_org_type)}</span><div class="chips">${chips(OTYPES, state.otype, "otype", "t", (o, k) => o.type === k)}</div></div>
      <div class="chiprow"><span class="chiprow__label mono">${esc(S().f_org_theme)}</span><div class="chips">${chips(OTHEMES, state.otheme, "otheme", "h", (o, k) => (o.themes || []).includes(k))}</div></div></div>`;
    const card = (o) => {
      const nWorks = o.creator_id ? DATA.works.filter((w) => w.creator_ids.includes(o.creator_id)).length : 0;
      const life = o.born ? (o.died ? `${o.born}–${o.died}` : (zh() ? `${o.born} 年生` : `b. ${o.born}`)) : o.founded;
      const meta = [pairName(OTYPES, o.type), zh() ? o.based_zh || o.based : o.based, life].filter(Boolean).join(" · ");
      return `<article class="org">
        <a class="org__media" href="${esc(o.url)}" target="_blank" rel="noopener">${o.image ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(o.image)}" alt="" onerror="this.remove()">` : ""}<span class="org__mono">${esc((o.name || "?").replace(/^(the|center|centre)\s+/i, "").slice(0, 1))}</span></a>
        <div class="org__body"><h3 class="org__name"><a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.name)}${o.name_zh && o.name_zh !== o.name ? ` <span class="org__zh">${esc(o.name_zh)}</span>` : ""} ↗</a></h3>
          <div class="org__meta mono">${esc(meta)}</div>
          <p class="org__desc">${esc(zh() ? o.description_zh : o.description)}</p>
          ${(o.known_for || []).length ? `<p class="org__known mono">${esc(S().known_for)}: ${esc(o.known_for.join(" · "))}</p>` : ""}
          ${(o.links || []).length ? `<p class="org__links mono">${o.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join(" ")}</p>` : ""}
          <div class="tags">${(o.themes || []).map((k) => `<button class="tag tag--col" data-otheme="${esc(k)}">${esc(pairName(OTHEMES, k))}</button>`).join("")}</div>
          ${nWorks ? `<button class="org__works mono" data-creator="${esc(o.creator_id)}">${esc(S().org_works(nWorks))}</button>` : ""}</div></article>`;
    };
    $("#orgList").innerHTML = OTYPES.map(([k]) => { const g = shown.filter((o) => o.type === k); return g.length ? `<section class="scat"><div class="scat__head"><h3 class="scat__title">${esc(pairName(OTYPES, k))}</h3><span class="scat__n mono">${g.length}</span></div>
      <p class="scat__desc">${esc((OTYPES.find((x) => x[0] === k) || [])[zh() ? 4 : 3] || "")}</p><div class="orgs" data-otype="${esc(k)}"></div></section>` : ""; }).join("");
    document.querySelectorAll("#orgList .orgs[data-otype]").forEach((g, i) => fillProgressive(g, shown.filter((o) => o.type === g.dataset.otype), card, i === 0 ? 12 : 6, 24));
    const inp = $("#oq");
    inp.addEventListener("input", (e) => { clearTimeout(renderOrgs.t); renderOrgs.t = setTimeout(() => { state.oq = e.target.value.trim(); render(); const i = $("#oq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200); });
    return ORGS.length;
  }
  function renderAtlas() {
    currentList = [];
    $("#atlas").innerHTML = `<p class="keys__lede">${esc(S().atlas_lede)}</p><div class="atlas">${FIELDS.map((f, i) => {
      const ws = DATA.works.filter((w) => w.field === f.id);
      const photoFirst = (w) => (w.kind === "paper" || w.kind === "publication" ? 1 : 0) + (w.kind === "film" ? 0.8 : 0) + (w.images?.length ? 0 : 0.5);
      const shots = sorted(ws.filter(poster)).sort((a, b) => photoFirst(a) - photoFirst(b)).slice(0, 3);
      const subs = f.subs.map((s) => { const n = ws.filter((w) => w.sub === s.id).length; return n ? `<li><button data-go="${f.id}" data-go-sub="${s.id}">${esc(nm(s))}<small class="mono">${n}</small></button></li>` : ""; }).join("");
      return `<section class="fieldcard">
        <button class="fieldcard__media" data-go="${f.id}" aria-label="${esc(nm(f))}">${shots.map((w, j) => `<div class="kc__shot kc__shot--${"abc"[j]}">${thumb(w)}</div>`).join("")}
          <span class="br br--tl"></span><span class="br br--tr"></span><span class="br br--bl"></span><span class="br br--br"></span></button>
        <div class="fieldcard__body"><span class="fieldcard__num mono">0${i + 1}</span>
          <h2 class="fieldcard__title"><button data-go="${f.id}">${esc(nm(f))}</button></h2>
          <p class="fieldcard__desc">${esc(zh() ? f.desc_zh : f.desc_en)}</p>
          <ul class="sublist">${subs}</ul>
          <button class="tour__start mono" data-go="${f.id}">${esc(S().atlas_open(ws.length))}</button></div></section>`;
    }).join("")}</div>${APPS.some(([k]) => DATA.works.some((w) => (w.lenses || []).includes(k))) ? `<section class="cols"><h2 class="scat__title">${esc(S().by_approach)}</h2><p class="scat__desc">${esc(S().by_approach_lede)}</p>
      <div class="cols__grid">${APPS.map(([k, en, zh_, dEn, dZh]) => { const n = DATA.works.filter((w) => (w.lenses || []).includes(k)).length; return n ? `<button class="colcard" data-app-go="${esc(k)}">
        <span class="colcard__n mono">${n}</span><span class="colcard__title">${esc(zh() ? zh_ : en)}</span><span class="colcard__desc">${esc(zh() ? dZh : dEn)}</span></button>` : ""; }).join("")}</div></section>` : ""}${COLS.length ? `<section class="cols"><h2 class="scat__title">${esc(S().collections)}</h2><p class="scat__desc">${esc(S().collections_lede)}</p>
      <div class="cols__grid">${COLS.map(colCard).join("")}</div></section>` : ""}`;
    return FIELDS.length;
  }
  function renderField(f) {
    const primary = sorted(DATA.works.filter((w) => w.field === f.id));
    const also = sorted(DATA.works.filter((w) => w.field !== f.id && (w.also || []).includes(f.id)));
    const bySub = (id) => primary.filter((w) => w.sub === id);
    const known = new Set(f.subs.map((s) => s.id));
    const other = primary.filter((w) => !known.has(w.sub));
    const cats = [...f.subs, ...(other.length ? [{ id: "_other", en: S().other_cat, zh: S().other_cat, desc_en: "", desc_zh: "" }] : []),
      ...(also.length ? [{ id: "_also", en: S().also_title, zh: S().also_title, desc_en: S().also_desc, desc_zh: S().also_desc }] : [])];
    const listOf = (id) => (id === "_other" ? other : id === "_also" ? also : bySub(id));
    const chip = (id, label, n) => `<button class="chip" data-sub="${esc(id)}" aria-pressed="${state.sub === id}">${esc(label)}<small>${n}</small></button>`;
    $("#fieldHead").innerHTML = `<div class="starred__head"><h2 class="starred__title">${esc(nm(f))}</h2>
        <p class="starred__lede">${esc(zh() ? f.desc_zh : f.desc_en)}</p><p class="count mono">${esc(S().field_count(primary.length, also.length))}</p></div>
      <div class="chips scat-chips">${chip("", S().all_cats, primary.length + also.length)}${cats.map((c) => { const n = listOf(c.id).length; return n ? chip(c.id, nm(c), n) : ""; }).join("")}</div>`;
    const section = (c) => { const ws = listOf(c.id); return ws.length ? `<section class="scat"><div class="scat__head"><h3 class="scat__title">${esc(nm(c))}</h3><span class="scat__n mono">${ws.length}</span></div>
        <p class="scat__desc">${esc(zh() ? c.desc_zh : c.desc_en)}</p><div class="grid" data-cat="${esc(c.id)}"></div></section>` : ""; };
    const shown = state.sub ? cats.filter((c) => c.id === state.sub) : cats;
    $("#fieldGrid").innerHTML = shown.map(section).join("");
    document.querySelectorAll("#fieldGrid .grid[data-cat]").forEach((g, i) => fillProgressive(g, listOf(g.dataset.cat), card, state.sub ? 24 : (i === 0 ? 12 : 8), 24));
    currentList = shown.flatMap((c) => listOf(c.id));
    return currentList.length;
  }
  function renderWorks() {
    currentList = sorted(DATA.works.filter((w) => matches(w)));
    fillProgressive($("#grid"), currentList, card, 24, 36);
    if (state.q && !detailReady) ensureDetail().then(() => { if (state.q) render(); });
    $("#worksCount").textContent = S().n_works(currentList.length);
    return currentList.length;
  }
  function renderPapers() {
    currentList = sorted(DATA.works.filter((w) => w.paper?.url && matches(w)));
    if (state.q && !detailReady) ensureDetail().then(() => { if (state.q) render(); });
    $("#papersHead").innerHTML = `<p class="count mono">${esc(S().papers_n(currentList.length))} · ${esc(S().papers_lede)}</p>`;
    $("#paperTable").innerHTML = currentList.length ? `<table class="papers"><thead><tr><th>${esc(S().col_year)}</th><th>${esc(S().col_title)}</th><th>${esc(S().col_venue)}</th><th>${esc(S().col_field)}</th></tr></thead><tbody>${currentList.map((w) => `
      <tr><td class="mono">${w.year ? yr(w.year) : ""}</td>
        <td><button class="papers__title" data-open="${esc(w.id)}">${esc(ttl(w))}</button><div class="papers__who">${esc(creatorNames(w).join(", "))}</div></td>
        <td class="papers__venue"><a href="${esc(w.paper.url)}" target="_blank" rel="noopener">${esc(w.paper.venue || (w.paper.doi ? "DOI" : "Link"))} ↗</a></td>
        <td><span class="tag">${esc(nm(fieldById[w.field] || {}))}</span>${subOf(w) ? ` <span class="tag">${esc(nm(subOf(w)))}</span>` : ""}</td></tr>`).join("")}</tbody></table>` : "";
    return currentList.length;
  }
  function renderCreators() {
    if (!detailReady) { $("#creatorList").innerHTML = loadingNote(); ensureDetail().then(() => state.view === "creators" && render()); return 1; }
    const q = state.q.toLowerCase();
    const byCreator = {};   // one pass over the works instead of one per creator
    sorted(DATA.works.filter((w) => matches(w))).forEach((w) => w.creator_ids.forEach((id) => (byCreator[id] ||= []).push(w)));
    const rows = DATA.creators
      .map((c) => ({ c, works: byCreator[c.id] || [] }))
      .filter(({ c, works }) => works.length || (q && [c.name, c.name_zh, c.bio, c.bio_zh, c.role].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => b.works.length - a.works.length || a.c.name.localeCompare(b.c.name));
    currentList = rows.flatMap((r) => r.works);
    fillProgressive($("#creatorList"), rows, ({ c, works }) => {
      const t = TX.creator(c, lang);
      const links = Object.entries(c.links || {}).filter(([, u]) => u).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(k)} ↗</a>`).join("");
      const conn = (c.connected_to || []).filter((id) => creatorsById[id]).map((id) => `<button data-creator="${esc(id)}">${esc(creatorsById[id].name)}</button>`).join("");
      const kind = [c.kind ? S()["kind_" + c.kind] : "", ...(c.disciplines || []).map(discName)].filter(Boolean).join(" · ");
      return `<article class="creator" id="c-${esc(c.id)}"><div>
          <h2 class="creator__name"><button data-creator="${esc(c.id)}">${esc(c.name)}${c.name_zh && c.name_zh !== c.name ? ` <span class="org__zh">${esc(c.name_zh)}</span>` : ""}</button></h2>
          <p class="creator__role">${kind ? esc(kind) + " · " : ""}${esc(t.role || "")}${t.based ? " · " + esc(t.based) : ""} · ${esc(S().n_works(works.length))}</p>
          ${t.bio ? `<p class="creator__bio">${esc(t.bio)}</p>` : ""}
          ${t.why ? `<p class="creator__why">${esc(t.why)}</p>` : ""}
          <div class="links">${links}</div>
          ${conn ? `<div class="web">${esc(S().connected)} ${conn}</div>` : ""}
        </div><div class="strip">${works.map(card).join("")}</div></article>`;
    }, 12, 16);
    return rows.length;
  }
  function renderStarred() {
    const list = DATA.works.filter((w) => stars.has(w.id));
    currentList = list;
    $("#starredHead").innerHTML = `<div class="starred__head">
        <h2 class="starred__title">${esc(S().starred_title)}</h2><p class="starred__lede">${esc(S().starred_lede)}</p>
        ${list.length ? `<div class="starred__actions">
          <button class="btn btn--accent mono" data-export="skill">${esc(S().export_skill)}</button>
          <button class="btn mono" data-export="readme">${esc(S().export_readme)}</button>
          <button class="btn mono" data-export="list">${esc(S().export_bib)}</button>
          <button class="btn mono" data-export="copy">${esc(S().copy_md)}</button>
          <button class="btn btn--quiet mono" data-export="clear">${esc(S().clear_stars)}</button></div>` : `<p class="starred__empty">${esc(S().starred_empty)}</p>`}</div>`;
    fillProgressive($("#starGrid"), list, card, 24, 36);
    return 1;
  }

  function render() {
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.view === state.view));
    const f = fieldById[state.view];
    const pane = f ? "field" : state.view;
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-on", v.id === "view-" + pane));
    $("#q").value = state.q;
    $("#sort").value = state.sort;
    $("#filters").hidden = !FILTERED.includes(state.view);
    $("#hasVideo").setAttribute("aria-pressed", state.video);
    $("#hasPaper").setAttribute("aria-pressed", state.paper);
    $("#starCount").textContent = stars.size ? stars.size : "";
    if (FILTERED.includes(state.view)) renderChips();
    const n = f ? renderField(f) : { atlas: renderAtlas, collections: renderCollections, orgs: renderOrgs, works: renderWorks, papers: renderPapers, creators: renderCreators, starred: renderStarred }[state.view]();
    $("#empty").hidden = n > 0;
    lazyVideos();
    writeHash();
  }

  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.src = e.target.dataset.src; e.target.preload = "metadata"; io.unobserve(e.target); } });
  }, { rootMargin: "300px" }) : null;
  function lazyVideos() { document.querySelectorAll("video[data-src]:not([src])").forEach((v) => (io ? io.observe(v) : (v.src = v.dataset.src))); }

  /* ---------- player ---------- */
  function embed(v) {
    if (v.embeddable === false) {
      return `<a class="offsite" href="${esc(v.url)}" target="_blank" rel="noopener">${v.thumbnail ? `<img referrerpolicy="no-referrer" src="${esc(v.thumbnail)}" alt="">` : ""}
        <span class="offsite__btn mono">${esc(S().play_on(src(v.platform)))}</span><span class="offsite__note mono">${esc(S().only_on(src(v.platform)))}</span></a>`;
    }
    switch (v.platform) {
      case "youtube": return `<iframe class="frame" src="https://www.youtube-nocookie.com/embed/${esc(v.id)}?autoplay=1&rel=0&playsinline=1" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="Video"></iframe>`;
      case "vimeo": return `<iframe class="frame" src="https://player.vimeo.com/video/${esc(v.id)}?autoplay=1&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video"></iframe>`;
      case "x": {
        const light = document.documentElement.dataset.theme === "light" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: light)").matches);
        return `<iframe class="frame frame--tweet" src="https://platform.twitter.com/embed/Tweet.html?id=${esc(v.id)}&theme=${light ? "light" : "dark"}&dnt=true&lang=${lang}" allowfullscreen title="Post"></iframe>`;
      }
      case "mp4": return `<video src="${esc(v.url)}" controls autoplay playsinline></video>`;
      default: return `<a class="watch" href="${esc(v.url)}" target="_blank" rel="noopener">${esc(S().watch_on(src(v.platform)))}</a>`;
    }
  }
  const mediaItems = (w) => [...(w.video?.url ? [{ type: "video" }] : []), ...(w.images || []).map((u) => ({ type: "image", url: u }))];
  function showMedia(w) {
    const items = mediaItems(w);
    const m = items[mediaIndex];
    let main;
    if (!m) main = `<div class="paperview">${w.paper?.venue ? `<span class="mono ph__venue">${esc(w.paper.venue)}</span>` : ""}<h3>${esc(ttl(w))}</h3>
      <p class="mono">${esc(creatorNames(w).join(", "))}${w.year ? ` · ${yr(w.year)}` : ""}</p>${w.paper?.url ? `<a class="btn btn--accent mono" href="${esc(w.paper.url)}" target="_blank" rel="noopener">${esc(S().read_paper)}</a>` : ""}</div>`;
    else if (m.type === "video") main = embed(w.video);
    else main = `<img class="player__img" referrerpolicy="no-referrer" src="${esc(m.url)}" alt="${esc(ttl(w))}">`;
    const strip = items.length > 1 ? `<div class="mstrip">${items.map((it, i) => `<button class="mstrip__item" data-media="${i}" aria-pressed="${i === mediaIndex}">
        ${it.type === "video" ? (w.video.thumbnail ? `<img referrerpolicy="no-referrer" src="${esc(small(w.video.thumbnail))}" alt="">` : "") + '<span class="mstrip__play">▶</span>' : `<img referrerpolicy="no-referrer" src="${esc(it.url)}" alt="">`}</button>`).join("")}</div>` : "";
    $("#playerMedia").innerHTML = `<div class="player__main">${main}</div>${strip}`;
  }
  function openWork(id) {
    const list = currentList.length ? currentList : DATA.works;
    openIndex = list.findIndex((w) => w.id === id);
    const w = list[openIndex] || worksById[id];
    if (!w) return;
    mediaIndex = 0;
    $("#player").dataset.id = w.id;
    showMedia(w);
    fillInfo(w);
    if (!$("#player").open) $("#player").showModal();
    writeHash(w.id);
  }
  function fillInfo(w) {
    if (!detailReady) ensureDetail().then(() => { if ($("#player").open && $("#player").dataset.id === w.id) fillInfo(w); });
    const t = TX.work(w, lang);
    const who = w.creator_ids.map((cid) => `<button data-creator="${esc(cid)}">${esc((zh() && creatorsById[cid]?.name_zh) || creatorsById[cid]?.name || cid)}</button>`).join("");
    const note = (label, body) => (body ? `<div class="note"><b>${esc(label)}</b><p>${esc(body)}</p></div>` : "");
    const f = fieldById[w.field] || {};
    const fieldTags = [`<button class="tag tag--field" data-go="${esc(w.field)}" data-go-sub="${esc(w.sub || "")}">${esc(nm(f))}${subOf(w) ? " / " + esc(nm(subOf(w))) : ""}</button>`,
      ...(w.also || []).map((a) => `<button class="tag tag--field" data-go="${esc(a)}">${esc(nm(fieldById[a] || {}))}</button>`)].join("");
    const orgs = (w.modalities || []).map((o) => `<span class="tag">${esc(orgName(o))}</span>`).join("");
    const kws = (w.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join("");
    const cols = (w.collections || []).map((id) => COLS.find((c) => c.id === id)).filter(Boolean);
    const appTags = (w.lenses || []).map((k) => `<button class="tag tag--col" data-app-go="${esc(k)}">↳ ${esc(appName(k))}</button>`).join("");
    const colTags = cols.map((c) => `<button class="tag tag--col" data-col-go="${esc(c.id)}">◎ ${esc(nm(c))}</button>`).join("");
    const survey = COLS.find((c) => c.work === w.id);
    const surveyN = survey ? DATA.works.filter((x) => (x.collections || []).includes(survey.id) && x.id !== w.id).length : 0;
    const p = w.paper || {};
    $("#playerInfo").innerHTML = `
      <div class="meta">${w.year ? yr(w.year) : ""} · ${esc(kindName(w.kind))}</div>
      <h2>${esc(ttl(w))}</h2>${ttlOrig(w) ? `<div class="orig mono">${esc(ttlOrig(w))}</div>` : ""}
      <div class="who">${who}</div>
      ${starBtn(w.id, "star-inline mono")}
      ${t.description ? `<p>${esc(t.description)}</p>` : ""}
      ${note(S().idea, t.idea)}${note(S().method, t.method)}${(w.exhibited || []).length ? note(S().exhibited, w.exhibited.join(" · ")) : ""}
      ${survey && surveyN ? `<button class="tour__start mono survey-btn" data-col-go="${esc(survey.id)}">${esc(S().survey_works(surveyN))}</button>` : ""}
      <div class="tags">${fieldTags}</div>${appTags ? `<div class="tags">${appTags}</div>` : ""}${colTags ? `<div class="tags">${colTags}</div>` : ""}<div class="tags">${orgs}</div><div class="tags">${kws}</div>
      <div class="actions">
        ${p.url ? `<a class="watch watch--paper" href="${esc(p.url)}" target="_blank" rel="noopener">¶ ${esc(S().read_paper)}${p.title && p.title !== w.title ? `<span class="watch__sub watch__ptitle">${esc(p.title)}</span>` : ""}${p.venue || p.doi ? `<span class="watch__sub">${esc(p.venue || "")}${p.venue && p.doi ? " · " : ""}${p.doi ? "doi:" + esc(p.doi) : ""}</span>` : ""}</a>` : ""}
        ${w.video?.url ? `<a class="watch" href="${esc(w.video.url)}" target="_blank" rel="noopener">${esc(S().watch_on(src(w.video.platform)))}</a>` : ""}
        ${w.source_url ? `<a class="watch" href="${esc(w.source_url)}" target="_blank" rel="noopener">${esc(S().project_page)}</a>` : ""}
        ${w.code_url ? `<a class="watch" href="${esc(w.code_url)}" target="_blank" rel="noopener">${esc(S().source_code)}</a>` : ""}
      </div>`;
    document.querySelectorAll(".star-inline").forEach((b) => { b.textContent = stars.has(w.id) ? S().starred : S().star; });
  }
  function closeWork() { $("#playerMedia").innerHTML = ""; if ($("#player").open) $("#player").close(); writeHash(); }
  function step(d) {
    const list = currentList.length ? currentList : DATA.works;
    if (openIndex < 0) return;
    openWork(list[(openIndex + d + list.length) % list.length].id);
  }

  /* ---------- stars + export ---------- */
  function toggleStar(id) {
    stars.has(id) ? stars.delete(id) : stars.add(id);
    store.set("sri-stars", [...stars]);
    document.querySelectorAll(`[data-star="${CSS.escape(id)}"]`).forEach((b) => {
      b.setAttribute("aria-pressed", stars.has(id));
      b.textContent = b.classList.contains("star-inline") ? (stars.has(id) ? S().starred : S().star) : (stars.has(id) ? "★" : "☆");
    });
    $("#starCount").textContent = stars.size ? stars.size : "";
    if (state.view === "starred" && !$("#player").open) render();
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
  }
  function download(name, body) {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([body], { type: "text/markdown;charset=utf-8" })), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(S().downloaded(name));
  }
  let clearArmed = false;
  function doExport(kind) {
    if (kind !== "clear" && !detailReady) { ensureDetail().then(() => doExport(kind)); return; }   // exports need the long texts
    const list = DATA.works.filter((w) => stars.has(w.id));
    const X = window.MthExport;
    if (kind === "skill") download("SKILL.md", X.skillMd(list, DATA, lang));
    if (kind === "readme") download("README.md", X.readmeMd(list, DATA, lang));
    if (kind === "list") download("reading-list.md", X.readingList(list, DATA, lang));
    if (kind === "copy") { const md = X.skillMd(list, DATA, lang); navigator.clipboard?.writeText(md).then(() => toast(S().copied), () => download("SKILL.md", md)); }
    if (kind === "clear") {
      if (!clearArmed) { clearArmed = true; toast(S().confirm_clear); setTimeout(() => { clearArmed = false; }, 3000); return; }
      stars = new Set(); store.set("sri-stars", []); clearArmed = false; toast(S().cleared); render();
    }
  }

  /* ---------- events ---------- */
  const toggle = (s, k) => (s.has(k) ? s.delete(k) : s.add(k));
  function go(view, sub = "") { state.view = view; state.sub = sub; closeWork(); render(); window.scrollTo({ top: $("#tabs").offsetTop, behavior: "smooth" }); }
  function setCreator(id) { state.creator = id; go("works"); }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    const d = t.dataset;
    if (d.star) return toggleStar(d.star);
    if (d.export) return doExport(d.export);
    if (t.classList.contains("tab")) { state.view = d.view; state.sub = ""; return render(); }
    if (d.go) return go(d.go, d.goSub || "");
    if (d.sub !== undefined) { state.sub = d.sub; return render(); }
    if (d.field) { toggle(state.fields, d.field); return render(); }
    if (d.org) { toggle(state.orgs, d.org); return render(); }
    if (d.col) { toggle(state.cols, d.col); return render(); }
    if (d.otype !== undefined) { state.otype = state.otype === d.otype ? "" : d.otype; return render(); }
    if (d.otheme !== undefined) { state.otheme = state.otheme === d.otheme ? "" : d.otheme; return render(); }
    if (d.app) { toggle(state.apps, d.app); return render(); }
    if (d.disc) { toggle(state.discs, d.disc); return render(); }
    if (d.appGo) { Object.assign(state, { q: "", apps: new Set([d.appGo]), discs: new Set(), cols: new Set(), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", creator: "", video: false, paper: false }); return go("works"); }
    if (d.colGo) { Object.assign(state, { q: "", apps: new Set(), discs: new Set(), cols: new Set([d.colGo]), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", creator: "", video: false, paper: false }); return go("works"); }
    if (d.kind) { toggle(state.kinds, d.kind); return render(); }
    if (d.era) { state.era = state.era === d.era ? "" : d.era; return render(); }
    if (d.media !== undefined) { mediaIndex = +d.media; return showMedia(worksById[$("#player").dataset.id]); }
    if (d.open) return openWork(d.open);
    if (d.creator) return setCreator(d.creator);
    if ("clearCreator" in d) { state.creator = ""; return render(); }
    if (t.classList.contains("card")) return openWork(d.id);
  });
  $("#clear").addEventListener("click", () => { Object.assign(state, { q: "", apps: new Set(), discs: new Set(), cols: new Set(), fields: new Set(), orgs: new Set(), kinds: new Set(), era: "", creator: "", video: false, paper: false }); render(); });
  $("#hasVideo").addEventListener("click", () => { state.video = !state.video; render(); });
  $("#hasPaper").addEventListener("click", () => { state.paper = !state.paper; render(); });
  let qTimer;
  $("#q").addEventListener("input", (e) => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 160); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#playerClose").addEventListener("click", closeWork);
  $("#prev").addEventListener("click", () => step(-1));
  $("#next").addEventListener("click", () => step(1));
  $("#player").addEventListener("close", () => { $("#playerMedia").innerHTML = ""; writeHash(); });
  $("#player").addEventListener("click", (e) => { if (e.target.id === "player") closeWork(); });
  document.addEventListener("keydown", (e) => {
    if (!$("#player").open) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  $("#langToggle").addEventListener("click", () => {
    lang = zh() ? "en" : "zh";
    store.set("sri-lang", lang);
    applyStatic();
    render();
    if ($("#player").open) { const w = worksById[$("#player").dataset.id]; if (w) fillInfo(w); }
  });
  const savedTheme = store.get("sri-theme", null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $("#themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    store.set("sri-theme", next);
  });

  /* ---------- init ---------- */
  applyStatic();
  const start = readHash();
  render();
  if (start.work) openWork(start.work);
  // fetch the long texts, creators and organizations once the first screen is up
  (window.requestIdleCallback || ((fn) => setTimeout(fn, 1200)))(() => ensureDetail(), { timeout: 4000 });
})();
