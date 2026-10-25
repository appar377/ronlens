import { createHomeCatalog } from "./home-demo.js";
import { createWorkspace, transitionWorkspace, readingHistory } from "../workspace.js";
import type { WorkspaceAction } from "../workspace.js";
import { LocalWorkspaceStore, decodeWorkspace } from "../storage.js";
import { currentEntry, readerContext } from "../reader.js";
import type { ReaderAction } from "../reader.js";
import { EMPTY_QUERY, parseSearchQuery, searchPapers, searchKey } from "../search.js";
import { icon } from "./icons.js";
import { escapeHtml as esc, paperLetter, conceptIcon, conceptMap, miniMap, thumbnail, explanationDiagram } from "./diagrams.js";
import type { Paper, PaperLink } from "../model.js";

const catalog = createHomeCatalog();
let state = createWorkspace(catalog);
let store: LocalWorkspaceStore | undefined;
let message = "";
let filtersOpen = false;
let menuOpen = false;
let mapScale = 1;
let readerTab = "map";
const app = document.body;
const path = (): string => location.pathname.replace(/\/+$/, "") || "/";
const routePaperId = (): string => { try { return decodeURIComponent(path().slice(7)); } catch { return ""; } };
const params = (): URLSearchParams => new URLSearchParams(location.search);
const $ = <T extends HTMLElement>(selector: string): T | null => document.querySelector<T>(selector);
const link = (url: string, text: string, css = ""): string => `<a data-route href="${esc(url)}" class="${css}">${text}</a>`;
const defaultSelection = (paperId: string): string | undefined => paperId === "demo-retrieval" ? "retrieval-distance" : undefined;
const citationTarget = (relation: PaperLink): string | undefined => relation.toPaperId === "demo-vectors" ? "vectors-distance" : relation.toPaperId === "demo-evidence" ? "evidence-check" : undefined;
const paperUrl = (id: string, concept?: string): string => "/paper/" + encodeURIComponent(id) + (concept ? "?concept=" + encodeURIComponent(concept) : "");

try {
  store = new LocalWorkspaceStore(catalog, window.localStorage);
  const loaded = store.load(); state = loaded.state;
  if (loaded.status === "recovered") message = "保存内容を現在のデモに合わせて復元しました。";
  else if (!["ready", "empty"].includes(loaded.status)) message = "保存内容を読み込めませんでした。元の内容は保持し、この画面内だけで操作できます。";
} catch { message = "このブラウザに保存できません。今の画面内では操作できます。"; }

function persist(): void {
  const result = store?.save(state);
  if (result?.status === "saved") return;
  message = result?.status === "conflict" ? "別のタブで保存内容が変わりました。上書きしていません。再読み込みして確認してください。" : "この変更はブラウザに保存できませんでした。今の画面内だけで保持しています。";
}
function dispatch(action: WorkspaceAction, success = ""): boolean {
  const result = transitionWorkspace(catalog, state, action);
  if (["invalid-query", "limit-reached", "not-found", "not-available"].includes(result.status)) {
    message = result.status === "invalid-query" ? "検索語は正規化後500文字以内で入力してください。" : result.status === "limit-reached" ? "保存した検索は100件までです。不要な検索を解除してください。" : "指定された項目を開けませんでした。";
    return false;
  }
  state = result.state;
  if (result.status === "changed") { message = success; persist(); }
  return true;
}
function checkpoint(): void {
  history.replaceState({ ronlens: 1, reader: state.reader, scrollY: window.scrollY }, "", location.href);
}
function go(url: string): void {
  if (new URL(url, location.href).pathname === "/") { location.assign(url); return; }
  checkpoint(); history.pushState(null, "", url); menuOpen = false; filtersOpen = false; readerTab = "map";
  syncRoute(); render(); window.scrollTo(0, 0); if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView(); checkpoint(); $("#page-heading")?.focus({ preventScroll: true });
}
function syncRoute(): void {
  if (path() === "/library") {
    const parsed = parseSearchQuery({ text: params().get("q") ?? "", tags: params().getAll("tag"), sort: params().get("sort") ?? "relevance" });
    dispatch({ type: "set-search", query: parsed ?? EMPTY_QUERY });
    if (!parsed) message = "検索条件が不正だったため解除しました。";
  }
  if (path().startsWith("/paper/")) {
    const id = routePaperId();
    const paper = catalog.paper(id); if (!paper) return;
    const concept = params().get("concept");
    if (concept && catalog.concept(concept)?.paperId !== id) return;
    const previous = state.reader.entries.some(entry => entry.paperId === id);
    const selected = concept ?? (!previous ? defaultSelection(id) : undefined);
    dispatch({ type: "reader", action: { type: "open-paper", paperId: id, ...(selected ? { conceptId: selected } : {}) } });
    if (!previous && id === "demo-retrieval") dispatch({ type: "reader", action: { type: "set-expanded", conceptId: "retrieval-distance", expanded: true } });
  }
}
function readerChange(action: ReaderAction): void {
  if (!dispatch({ type: "reader", action })) return;
  const entry = currentEntry(state.reader);
  if (entry) history.replaceState({ ronlens: 1, reader: state.reader, scrollY: window.scrollY }, "", paperUrl(entry.paperId, entry.selectedConceptId));
  render();
}
function queryUrl(): string {
  const url = new URL("/library", location.origin);
  if (state.search.text) url.searchParams.set("q", state.search.text);
  for (const tag of state.search.tags) url.searchParams.append("tag", tag);
  if (state.search.sort !== "relevance") url.searchParams.set("sort", state.search.sort);
  return url.pathname + url.search;
}
function setQuery(query: typeof state.search, focus = "#library-search"): void {
  if (!dispatch({ type: "set-search", query })) { render(); $(focus)?.focus(); return; }
  go(queryUrl()); $(focus)?.focus();
}
function bookmark(paper: Paper): string {
  const saved = state.savedPaperIds.includes(paper.id);
  return `<button class="bookmark-button" data-bookmark="${paper.id}" aria-pressed="${saved}" aria-label="${esc(paper.title)}${saved ? "の保存を解除" : "を保存"}">${icon("bookmark")}</button>`;
}
function header(): string {
  const active = path() === "/library" ? "library" : path() === "/saved" ? "saved" : path() === "/network" || path().startsWith("/paper/") ? "network" : "";
  return `<a class="skip-link" href="#page-heading">本文へ</a><header class="site-header inner-header ${menuOpen ? "menu-open" : ""}">
    <a class="brand" href="/" aria-label="RONLENS ホーム"><span class="brand-mark" aria-hidden="true"></span><span>RONLENS</span></a>
    <nav id="main-nav" class="main-nav" aria-label="メインナビゲーション">${[["/", "home", "ホーム", "home"], ["/library", "library", "論文を探す", "search"], ["/network", "network", "つながり", "discovery"], ["/saved", "saved", "保存", "bookmark"]].map(([url, key, title, glyph]) => `<a ${key === active ? 'aria-current="page"' : ''} data-route href="${url}">${icon(glyph ?? "")}${title}</a>`).join("")}</nav>
    <div class="header-actions"><a data-route href="/library" class="icon-button" aria-label="論文を検索">${icon("search")}</a><button class="menu-button icon-button" aria-label="${menuOpen ? "メニューを閉じる" : "メニューを開く"}" aria-expanded="${menuOpen}" aria-controls="main-nav" data-menu><svg viewBox="0 0 24 24"><path d="M3 5h18M3 12h18M3 19h18"/></svg></button><a data-route href="/help" class="help-link" aria-label="使い方">${icon("question")}</a></div>
  </header>`;
}
function footer(): string {
  return `<footer class="site-footer"><p class="footer-links">${link("/help", "使い方・このデモについて")}${link("/saved", "保存・履歴")}</p><p>RONLENS（論レンズ） · 架空論文の操作デモ</p><p>論文・概念・引用は創作です。実在する研究の紹介ではありません。保存はこのブラウザ内だけで行います。</p></footer>`;
}
function demoTag(): string { return '<span class="demo-tag">架空デモ</span>'; }
function empty(title: string, description: string, url = "/library", action = "論文を探す"): string {
  return `<section class="empty-state"><div class="empty-symbol">${icon("search")}</div><h2>${title}</h2><p>${description}</p>${link(url, action, "primary-button")}</section>`;
}
function paperResult(paper: Paper): string {
  const count = catalog.concepts(paper.id).length - 1;
  const citations = catalog.dataset.links.filter(l => l.kind === "citation" && l.fromPaperId === paper.id).length;
  return `<article class="library-card">${link(paperUrl(paper.id), thumbnail(catalog, paper.id), "thumbnail-link")}<div class="library-card-body"><p class="result-eyebrow"><span>図解あり</span>論文${paperLetter(paper.id)} ${demoTag()}</p><h2>${link(paperUrl(paper.id), esc(paper.title))}</h2><p>${esc(paper.summary)}</p><div class="result-metadata"><span>${icon("chat")}${count}つの概念</span><span>${icon("document")}${citations}件の架空引用</span></div><div class="result-tags">${catalog.concepts(paper.id).slice(1, 5).map(c => link(paperUrl(paper.id, c.id), esc(c.title))).join("")}</div><div class="result-actions">${bookmark(paper)}${link(paperUrl(paper.id), "図解をひらく " + icon("arrow"), "primary-button")}</div></div></article>`;
}
function library(): string {
  const result = searchPapers(catalog, state.search);
  const papers = !state.search.text && !state.search.tags.length && state.search.sort === "relevance" ? catalog.dataset.papers : result.hits.map(hit => hit.paper);
  const current = currentEntry(state.reader);
  const filters: [string, string][] = [["AI", "AI・情報"], ["ベクトル", "ベクトル"], ["資料検索", "資料検索"], ["出典と照合", "出典と照合"]];
  const chips = [...state.search.tags.map(tag => `<button data-remove-tag="${esc(tag)}">${esc(tag)} ×</button>`), ...(state.search.text ? [`<button data-clear-text>キーワード: ${esc(state.search.text)} ×</button>`] : [])].join("");
  return `<div class="library-layout"><aside class="filter-sidebar ${filtersOpen ? "filters-open" : ""}" aria-label="絞り込み"><h2>絞り込み<button class="filter-close" data-filter-close aria-label="絞り込みを閉じる">×</button></h2><fieldset><legend>分野・キーワード</legend>${filters.map(([value, label]) => `<label><input type="checkbox" name="tag" value="${esc(value)}" ${state.search.tags.includes(value.toLowerCase()) ? "checked" : ""}>${label} <small>(${catalog.dataset.papers.filter(p => p.tags.some(t => t.toLowerCase() === value.toLowerCase())).length})</small></label>`).join("")}</fieldset><div class="filter-information"><h3>このライブラリについて</h3><p>収録している3件はすべて架空論文です。実際の著者・発表年・査読状況はありません。</p>${link("/help#demo", "デモの範囲を見る →")}</div>${current ? `<div class="resume-card"><span>続きから読む</span>${link(paperUrl(current.paperId, current.selectedConceptId), miniMap(catalog, current.paperId, current.selectedConceptId) + '<strong>' + esc(catalog.concept(current.selectedConceptId)?.title ?? "") + '</strong>') }</div>` : ""}</aside>
    <section class="library-content"><h1 id="page-heading" tabindex="-1" class="mobile-page-title">論文を探す</h1><form class="library-search" role="search"><label class="sr-only" for="library-search">論文・キーワードを検索</label><div>${icon("search")}<input id="library-search" type="search" value="${esc(state.search.text)}" maxlength="500" placeholder="論文・キーワードを検索"><button type="button" data-clear-text aria-label="検索語を消す">×</button></div><button type="submit" class="primary-button">検索</button></form>
    <div class="library-toolbar"><button data-filters class="filter-mobile-button" aria-expanded="${filtersOpen}">${icon("filter")}フィルタ</button><p role="status">${papers.length}件の架空論文が見つかりました</p><div class="filter-chips">${chips}</div><button class="text-button" data-clear-query>すべてクリア</button><label class="sort-select"><span class="sr-only">並び順</span><select id="sort"><option value="relevance" ${state.search.sort === "relevance" ? "selected" : ""}>関連度の高い順</option><option value="title" ${state.search.sort === "title" ? "selected" : ""}>タイトル順</option></select></label></div>
    ${state.search.text || state.search.tags.length ? `<button class="save-query-button" data-save-query ${state.savedSearches.some(q => searchKey(q) === searchKey(state.search)) ? "disabled" : ""}>${icon("bookmark")}${state.savedSearches.some(q => searchKey(q) === searchKey(state.search)) ? "検索を保存済み" : "この検索を保存"}</button>` : ""}
    <div class="library-results">${papers.length ? papers.map(paperResult).join("") : empty("一致する架空論文がありません", "キーワードを短くするか、検索条件を解除してみてください。", "/library", "検索条件を解除")}</div><p class="library-bottom">ⓘ 取得自動化は行っていません。架空デモ3件の範囲を表示しています。</p></section></div>`;
}
function readerSidebar(paper: Paper): string {
  const entry = currentEntry(state.reader);
  return `<aside class="reader-sidebar">${link(queryUrl(), "← 論文一覧に戻る", "back-link")}<div class="paper-summary-box"><p>${icon("document")}論文${paperLetter(paper.id)} ${demoTag()}</p><h2>${esc(paper.title)}</h2><p>${esc(paper.summary)}</p><nav aria-label="論文内の表示">${[["map", "discovery", "図解で見る"], ["overview", "question", "概要"], ["related", "document", "関連する論文"], ["source", "bookmark", "原典・保存"]].map(([tab, glyph, label]) => `<button data-reader-tab="${tab}" ${readerTab === tab ? 'aria-current="page"' : ""}>${icon(glyph ?? "")}${label}</button>`).join("")}</nav></div><h3>この論文のつながり</h3><div class="related-paper-list">${catalog.dataset.papers.map(p => link(paperUrl(p.id), `<span class="related-dot"></span><b>論文${paperLetter(p.id)}</b><small>${esc(p.title)}</small>`, p.id === paper.id ? "current" : "")).join("")}</div><div class="reader-history-controls"><button data-reader-history="back" ${state.reader.cursor <= 0 ? "disabled" : ""}>← 前の論文</button><button data-reader-history="forward" ${state.reader.cursor >= state.reader.entries.length - 1 ? "disabled" : ""}>次の論文 →</button></div>${entry ? `<small class="persistence-note">開いた枝と選択位置を、このブラウザに保存します。</small>` : ""}</aside>`;
}
function citationLink(relation: PaperLink): string {
  const target = catalog.paper(relation.toPaperId); if (!target) return "";
  return link(paperUrl(target.id, citationTarget(relation)), icon("link") + `<span>この考え方の参考文献 <strong>論文${paperLetter(target.id)}「${esc(target.title)}」</strong><small>デモ内の架空引用</small></span>` , "citation-link");
}
function reader(): string {
  const id = routePaperId(); const paper = catalog.paper(id);
  const requested = params().get("concept");
  if (!paper || requested && catalog.concept(requested)?.paperId !== id) return notFound();
  const context = readerContext(catalog, state.reader); const entry = currentEntry(state.reader);
  if (context.status !== "ready" || !entry || entry.paperId !== id) return notFound();
  const selected = context.selected;
  const related = catalog.dataset.links.filter(l => l.kind === "citation" && l.fromPaperId === paper.id && (l.evidence.sourceConceptId === selected.id || catalog.ancestors(selected.id).some(a => a.id === l.evidence.sourceConceptId)));
  const index = paper.readingOrder.indexOf(selected.id); const next = paper.readingOrder[index + 1];
  const content = readerTab === "overview" ? `<section class="reader-info-panel"><h2>この架空論文を読む</h2><p>${esc(paper.summary)}</p><h3>おすすめの読む順序</h3><ol>${paper.readingOrder.map(nodeId => `<li><button data-concept="${nodeId}">${esc(catalog.concept(nodeId)?.title ?? "")}</button></li>`).join("")}</ol></section>` : readerTab === "related" ? `<section class="reader-info-panel"><h2>引用と、編集上の関連</h2><p>実線は架空原稿に記述した引用、点線は編集上のつながりです。</p>${link("/network?paper=" + paper.id, icon("discovery") + "論文どうしのつながりをひらく", "primary-button")}<div class="related-links">${catalog.dataset.links.filter(l => l.fromPaperId === paper.id || l.toPaperId === paper.id).map(l => link("/network?relation=" + l.id, (l.kind === "citation" ? "架空引用" : "編集上の関連") + "：論文" + paperLetter(l.fromPaperId) + " → 論文" + paperLetter(l.toPaperId))).join("")}</div></section>` : "";
  return `<div class="reader-layout">${readerSidebar(paper)}<section class="reader-content"><div class="reader-breadcrumb"><h1 id="page-heading" tabindex="-1"><span>論文${paperLetter(paper.id)}</span><span>›</span>図解で見る</h1>${demoTag()}<button data-reader-tab="overview" class="reading-guide">読む順序</button>${bookmark(paper)}</div><div class="concept-context"><span>親: ${context.parent ? `<button data-concept="${context.parent.id}">${esc(context.parent.title)}</button>` : "論文全体"}</span><span>同じ階層: ${context.siblings.map(n => `<button data-concept="${n.id}" ${n.id === selected.id ? 'aria-current="true"' : ''}>${esc(n.title)}</button>`).join("")}</span></div>${content}
    <div class="map-stage" ${content || readerTab === "source" ? "hidden" : ""}><div class="map-scroll"><div class="map-canvas" style="width:${mapScale * 100}%;height:${mapScale * 100}%;">${conceptMap(catalog, entry)}</div></div><button class="overview-mini" data-full-map aria-label="全体マップを表示"><b>全体図</b>${miniMap(catalog, paper.id, selected.id)}<span>${icon("expand")}全体表示</span></button><div class="map-controls"><button data-zoom="in" aria-label="概念マップを拡大">＋</button><button data-zoom="out" aria-label="概念マップを縮小">−</button><button data-zoom="reset" aria-label="表示倍率を戻す">${icon("expand")}</button></div></div>
    <section class="concept-explanation" id="concept-explanation"><header><h2>${icon(conceptIcon(selected.id))}${esc(selected.title)}</h2>${related.map(citationLink).join("")}</header><div class="explanation-columns"><div><p class="explanation-text">${esc(selected.explanation)}</p><aside class="key-point">${icon("solution")}<div><h3>ここがポイント</h3><p>${/distance|similarity/.test(selected.id) ? "意味が近いことと、情報が正しいことは別です。図は向きの違いを見せるための模式図です。" : "まず図で位置を確認し、気になる用語をひとつずつ開いてみましょう。上のマップには親と同じ階層が残ります。"}</p></div></aside></div><figure class="explanation-figure"><figcaption>${/distance|vector|similarity|feature/.test(selected.id) ? "文章をベクトルで表し、向きの近さを比べるイメージ" : "選択した概念の流れを図で見る"}</figcaption>${explanationDiagram(selected)}<small>説明用の模式図 · 実験結果ではありません</small></figure></div>
    <details class="glossary"><summary>用語をやさしく読む</summary><dl>${selected.terms.map(term => `<dt>${esc(term.term)}</dt><dd>${esc(term.meaning)}</dd>`).join("")}</dl></details><details class="source-box" id="source-box" ${readerTab === "source" ? "open" : ""}><summary>${icon("document")}原典を確認する · ${esc(selected.source.section)}（架空）</summary><p class="source-notice">この原典はUI操作を説明するために作成した架空原稿です。実論文・著者・DOIはありません。</p><blockquote>${esc(selected.source.text)}</blockquote>${related.map(l => `<p>架空引用の記述: 「${l.kind === "citation" ? esc(l.evidence.excerpt) : ""}」</p>`).join("")}</details><div class="explanation-bottom">${link("/network?paper=" + paper.id, icon("discovery") + "論文どうしのつながり")}${next ? `<button data-concept="${next}" class="next-concept">次に読む: ${esc(catalog.concept(next)?.title ?? "")} →</button>` : '<span>この論文の読む順序を一巡しました。</span>'}</div></section></section></div>`;
}
function networkCard(id: string): string {
  const paper = catalog.paper(id); if (!paper) return '';
  return `<article class="network-paper paper-${paperLetter(id).toLowerCase()}" data-network-paper="${id}"><header>${icon("document")}<div><h2>${link(paperUrl(id), "論文" + paperLetter(id))}</h2><h3>${esc(paper.title)}</h3></div></header><p>${esc(paper.summary)}</p><div class="network-concepts"><span>主な概念</span>${id === "demo-retrieval" ? thumbnail(catalog, id) : ''}${catalog.concepts(id).filter(n => id === "demo-retrieval" ? ["retrieval-distance", "retrieval-evidence"].includes(n.id) : n.parentId !== null).map(n => `<a data-route data-network-node="${n.id}" class="network-concept" href="${paperUrl(id, n.id)}">${icon(conceptIcon(n.id))}${esc(n.title)}</a>`).join("")}</div></article>`;
}
function network(): string {
  const relationId = params().get("relation") ?? "retrieval-cites-vectors";
  const relation = catalog.link(relationId);
  const last = currentEntry(state.reader);
  const source = relation ? catalog.paper(relation.fromPaperId) : undefined;
  const target = relation ? catalog.paper(relation.toPaperId) : undefined;
  const citation = relation?.kind === "citation" ? relation : undefined;
  const title = citation ? citation.id === "retrieval-cites-vectors" ? "近さの計算で参照する考え方" : "回答の出典を確かめる手順" : "似ていることと、確かであること";
  return `<section class="network-page"><div class="network-top"><div>${link(last ? paperUrl(last.paperId, last.selectedConceptId) : paperUrl("demo-retrieval"), "← 論文" + paperLetter(last?.paperId ?? "demo-retrieval") + "の" + (last ? "続きに戻る" : "図解をひらく"), "back-link pill")}<h1 id="page-heading" tabindex="-1">架空の3論文のつながり</h1><p>概念と原典をたどりながら、論文どうしの関係を見渡します。</p>${demoTag()}</div><div class="network-overview"><b>全体マップ</b><div><span>論文B</span>←<span class="active">論文A</span>→<span>論文C</span></div><small>現在の範囲：3論文すべて</small></div></div>
    <div class="network-stage">${networkCard("demo-vectors")}${networkCard("demo-retrieval")}${networkCard("demo-evidence")}<svg class="network-edges desktop-network-edges" viewBox="0 0 1100 430" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="net-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#0068ff" stroke="none"/></marker></defs><path data-edge="retrieval-cites-vectors" d="M450 295C350 268 310 290 230 320" marker-end="url(#net-arrow)"/><path data-edge="retrieval-cites-evidence" d="M665 310C750 278 790 312 895 283" marker-end="url(#net-arrow)"/><path data-edge="vectors-related-evidence" class="editorial-edge" d="M190 380Q550 495 925 365"/></svg><svg class="network-edges mobile-network-edges" viewBox="0 0 335 250" aria-hidden="true"><defs><marker id="mobile-net-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#0068ff" stroke="none"/></marker></defs><path data-edge="retrieval-cites-vectors" d="M145 70 90 153" marker-end="url(#mobile-net-arrow)"/><path data-edge="retrieval-cites-evidence" d="M190 70 251 153" marker-end="url(#mobile-net-arrow)"/><path data-edge="vectors-related-evidence" class="editorial-edge" d="M60 195Q167 270 275 195"/></svg>
    ${link("/network?relation=retrieval-cites-vectors", "引用 [1]", "relation-label relation-one" + (relationId === "retrieval-cites-vectors" ? " active" : ""))}${link("/network?relation=retrieval-cites-evidence", "引用 [2]", "relation-label relation-two" + (relationId === "retrieval-cites-evidence" ? " active" : ""))}${link("/network?relation=vectors-related-evidence", "編集上の関連", "relation-label relation-editorial" + (relationId === "vectors-related-evidence" ? " active" : ""))}</div>
    <section class="relation-panel" aria-live="polite">${relation && source && target ? `<div><h2>${icon("link")}${citation ? "引用 [" + (citation.id.endsWith("vectors") ? "1" : "2") + "]" : "編集上の関連"} <small>論文${paperLetter(source.id)} ${citation ? "→" : "—"} 論文${paperLetter(target.id)}（架空）</small></h2><h3>${title}</h3><p>${citation ? esc(catalog.concept(citation.evidence.sourceConceptId)?.explanation ?? "") : esc(relation.kind === "editorial" ? relation.rationale : "")}</p>${citation ? `<details><summary>原典の引用記述を確認</summary><blockquote>${esc(citation.evidence.excerpt)}</blockquote>${link(paperUrl(source.id, citation.evidence.sourceConceptId), "引用元の概念へ →")}</details>` : ""}</div><div class="relation-endpoints"><h3>${citation ? "引用の出発点と到達点" : "編集で結んだ論文"}</h3><div>${link(paperUrl(source.id, citation?.evidence.sourceConceptId), icon("document") + "論文" + paperLetter(source.id) + `<small>${esc(citation ? catalog.concept(citation.evidence.sourceConceptId)?.title ?? "" : source.title)}</small>`)}<span>${citation ? "→" : "—"}</span>${link(paperUrl(target.id, citation ? citationTarget(relation) : undefined), icon("document") + "論文" + paperLetter(target.id) + `<small>${esc(citation ? catalog.concept(citationTarget(relation) ?? "")?.title ?? target.title : target.title)}</small>`)}</div></div>` : empty("関係が見つかりません", "指定された関係はこのデモに含まれていません。", "/network", "全体のつながりに戻る")}<aside class="network-legend"><h3>線の意味</h3><p><span class="solid-line"></span>実線：架空原稿に記述した引用</p><p><span class="dashed-line"></span>点線：編集上の関連</p><small>実際の論文の引用関係ではありません。</small></aside></section></section>`;
}
function saved(): string {
  const tab = params().get("tab") ?? "papers";
  const savedItems = state.savedPaperIds.flatMap(id => catalog.paper(id) ?? []);
  const historyEntries = readingHistory(state).entries;
  return `<section class="collection-page"><div class="page-intro"><p class="eyebrow">YOUR LIBRARY</p><h1 id="page-heading" tabindex="-1">保存して、また続きから。</h1><p>気になった論文と、たどってきた概念を見返せます。</p></div><nav class="collection-tabs" aria-label="保存の種類">${[["papers", "保存した論文", savedItems.length], ["history", "閲覧履歴", historyEntries.length], ["searches", "保存した検索", state.savedSearches.length]].map(([key, label, count]) => `<a data-route href="/saved${key === "papers" ? "" : "?tab=" + key}" ${tab === key ? 'aria-current="page"' : ''}>${label}<span>${count}</span></a>`).join("")}</nav><p class="local-only-note">このブラウザだけに保存されます。アカウント登録・端末間同期はありません。</p>
    ${tab === "history" ? historyEntries.length ? '<ol class="history-list">' + [...historyEntries].reverse().map((entry, reverseIndex) => `<li><span class="history-dot"></span><div><small>論文${paperLetter(entry.paperId)}</small><h2>${esc(catalog.concept(entry.selectedConceptId)?.title ?? "")}</h2><p>${esc(catalog.paper(entry.paperId)?.title ?? "")}</p></div><button data-visit="${historyEntries.length - 1 - reverseIndex}" class="secondary-button">この位置から読む ${icon("arrow")}</button></li>`).join("") + '</ol>' : empty("閲覧履歴はまだありません", "図解をひらくと、選んだ概念と開いた枝がここに残ります。") : tab === "searches" ? state.savedSearches.length ? '<div class="saved-query-list">' + state.savedSearches.map((query, index) => `<article>${icon("search")}<div><h2>${esc(query.text || "すべての論文")}</h2><p>${esc(query.tags.join(" / ") || "絞り込みなし")}</p></div><button data-apply-query="${index}" class="secondary-button">この条件で探す →</button><button data-remove-query="${index}" class="remove-query" aria-label="保存した検索を解除">×</button></article>`).join("") + '</div>' : empty("保存した検索はまだありません", "検索したあと「この検索を保存」を押すと、条件ごと見返せます。") : savedItems.length ? '<div class="saved-paper-list">' + savedItems.map(paperResult).join("") + '</div>' : empty("保存した論文はまだありません", "気になった論文のしおりを押すと、ここから見返せます。")}</section>`;
}
function help(): string {
  return `<section class="help-page"><div class="page-intro"><p class="eyebrow">WELCOME TO RONLENS</p><h1 id="page-heading" tabindex="-1">つながりをたどって、<br>図解で論文を読む。</h1><p>ひとつの概念から、次の理解へ。はじめてでも、読む場所を見失わないために。</p></div><div class="help-steps">${[["01", "search", "探す", "気になる言葉で検索し、図のカードから論文をひらきます。", "/library"], ["02", "discovery", "図解で理解", "ノードを選ぶと下に説明が開きます。＋と−で枝を開閉できます。", paperUrl("demo-retrieval")], ["03", "document", "原典を確かめる", "解説の下の原典を開き、説明と元の文章を照合します。", paperUrl("demo-retrieval", "retrieval-distance")], ["04", "link", "関連論文へ", "引用元と引用先、編集上の関連を分けてたどれます。", "/network"]].map(([number, glyph, title, body, url]) => `<article><span class="step-number">${number}</span>${icon(glyph ?? "")}<h2>${title}</h2><p>${body}</p>${link(url ?? "/library", "試してみる →")}</article>`).join("")}</div><div class="help-details"><section><h2>迷ったら、ここを確認</h2><details open><summary>概念マップはどう読む？</summary><p>上のノードが全体、その下が内訳です。選択しても親・同じ階層・全体ミニマップが残ります。「読む順序」から順番にたどることもできます。7つの視点はホームの入口の表現で、論文の固定分類ではありません。</p></details><details><summary>戻ったとき、開いた枝は残る？</summary><p>ブラウザの戻る／進むと閲覧履歴から、開いた枝と選択した概念を復元します。保存が使えない環境では注意を表示します。</p></details><details><summary>実線と点線の違いは？</summary><p>実線はデモ原稿内で明示した架空引用です。点線は読み比べるために編集で選んだ関連で、引用の証拠ではありません。</p></details><details><summary>保存はどこにある？</summary><p>このブラウザのlocalStorageだけに保存します。サーバーへの送信、アカウント作成、端末間同期は行いません。ブラウザデータを消すと保存も失われます。</p></details></section><section id="demo" class="demo-explanation"><h2>このサイトは架空デモです</h2><p>論文A・B・C、概念の原稿、引用関係は操作を説明するための創作です。実論文の研究成果を要約したものではありません。</p><p>著者・DOI・発表年・査読実績を捏造していません。実論文の取得自動化、外部資料の収集、実論文の解説公開は今回の公開範囲に含まれません。</p>${demoTag()}<h3>キーボードでの操作</h3><p>Tabで移動、Enterで選択できます。メニュー・全体図はEscapeで閉じます。拡大・縮小にはマップ右下のボタンを使います。</p></section></div></section>`;
}
function notFound(): string {
  return `<section class="not-found"><span class="error-code">404</span><h1 id="page-heading" tabindex="-1">このページは見つかりませんでした</h1><p>リンクが変わったか、この架空デモにない論文・概念かもしれません。</p><div>${link("/library", "論文を探す", "primary-button")}${link("/", "ホームに戻る", "secondary-button")}</div></section>`;
}
function render(focus?: string): void {
  let content: string;
  try { content = path() === "/library" ? library() : path().startsWith("/paper/") ? reader() : path() === "/network" ? network() : path() === "/saved" ? saved() : path() === "/help" ? help() : notFound(); }
  catch { content = '<section class="not-found"><h1 id="page-heading" tabindex="-1">表示を読み込めませんでした</h1><p>保存内容はそのままです。ページを読み直してください。</p><button data-reload class="primary-button">再読み込み</button></section>'; }
  document.title = (path() === "/library" ? "論文を探す" : path() === "/network" ? "論文どうしのつながり" : path() === "/saved" ? "保存・履歴" : path() === "/help" ? "使い方" : path().startsWith("/paper/") ? catalog.paper(routePaperId())?.title ?? "ページが見つかりません" : "ページが見つかりません") + " | RONLENS";
  app.className = "inner-page";
  app.innerHTML = header() + `<main class="app-main">${message ? `<p class="operation-status app-status" role="status">${esc(message)}</p>` : ""}${content}</main>` + footer() + '<dialog id="map-dialog" class="map-dialog"></dialog>';
  alignConceptEdges();
  alignNetworkEdges();
  if (filtersOpen) { $(".library-content")?.setAttribute("inert", ""); $(".site-header")?.setAttribute("inert", ""); $(".site-footer")?.setAttribute("inert", ""); }
  if (focus) $(focus)?.focus({ preventScroll: true });
}
function alignConceptEdges(): void {
  for (const map of Array.from(document.querySelectorAll<HTMLElement>(".concept-map"))) {
    const bounds = map.getBoundingClientRect();
    const svg = map.querySelector(".concept-edges"); if (!svg) continue;
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    for (const node of Array.from(map.querySelectorAll<HTMLElement>("[data-node]"))) {
      const concept = catalog.concept(node.dataset.node ?? "");
      const parent = map.querySelector(`[data-node="${concept?.parentId}"]`);
      if (!parent) continue;
      const a=parent.getBoundingClientRect(), b=node.getBoundingClientRect();
      const x1=(a.left+a.right)/2-bounds.left, x2=(b.left+b.right)/2-bounds.left;
      const y1=a.bottom-bounds.top, y2=b.top-bounds.top, middle=(y1+y2)/2;
      map.querySelector(`[data-map-edge="${concept?.id}"]`)?.setAttribute("d", `M${x1} ${y1}V${middle}H${x2}V${y2}`);
      const dot = map.querySelector(`[data-map-dot="${concept?.id}"]`); dot?.setAttribute("cx",String(x2)); dot?.setAttribute("cy",String(y2)); dot?.setAttribute("r","2");
    }
  }
}
function alignNetworkEdges(): void {
  const stage = $(".network-stage"); if (!stage) return;
  const box = stage.getBoundingClientRect();
  const mobile = window.matchMedia("(max-width:700px)").matches;
  const svg = stage.querySelector<SVGElement>(mobile ? ".mobile-network-edges" : ".desktop-network-edges");
  if (!svg) return;
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  for (const relation of catalog.dataset.links) {
    const from = stage.querySelector(mobile || relation.kind === "editorial" ? `[data-network-paper="${relation.fromPaperId}"]` : `[data-network-node="${relation.evidence.sourceConceptId}"]`);
    const to = stage.querySelector(mobile || relation.kind === "editorial" ? `[data-network-paper="${relation.toPaperId}"]` : `[data-network-node="${citationTarget(relation)}"]`);
    const edge = svg.querySelector(`[data-edge="${relation.id}"]`);
    if (!from || !to || !edge) continue;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    let x1 = (a.left + a.right) / 2 - box.left, y1 = a.bottom - box.top;
    let x2 = (b.left + b.right) / 2 - box.left, y2 = b.top - box.top;
    if (relation.kind === "editorial") {
      y2 = b.bottom - box.top;
      edge.setAttribute("d", `M${x1} ${y1}Q${(x1+x2)/2} ${Math.max(y1,y2)+65} ${x2} ${y2}`);
    } else {
      if (!mobile) { const right = a.left < b.left; x1 = (right ? a.right : a.left)-box.left; x2 = (right ? b.left : b.right)-box.left; y1=(a.top+a.bottom)/2-box.top; y2=(b.top+b.bottom)/2-box.top; }
      const mid = (x1+x2)/2;
      edge.setAttribute("d", `M${x1} ${y1}C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`);
    }
    edge.classList.toggle("selected-edge", relation.id === (params().get("relation") ?? "retrieval-cites-vectors"));
  }
}
window.addEventListener("resize", () => { alignConceptEdges(); alignNetworkEdges(); });
function openFullMap(): void {
  const entry = currentEntry(state.reader); if (!entry) return;
  const dialog = $<HTMLDialogElement>("#map-dialog"); if (!dialog) return;
  dialog.innerHTML = `<header><h2>論文${paperLetter(entry.paperId)}の全体図</h2><button data-close-map aria-label="全体図を閉じる">×</button></header><p>選ぶとその概念へ移動し、親の枝も開きます。</p>${conceptMap(catalog, entry, true)}<ol class="full-map-list">${catalog.concepts(entry.paperId).map(n => `<li><button data-dialog-concept="${n.id}">${esc(n.title)}</button></li>`).join("")}</ol>`;
  dialog.showModal(); alignConceptEdges();
  dialog.addEventListener("close", () => $("[data-full-map]")?.focus(), { once: true });
}

document.addEventListener("click", event => {
  const target = (event.target as Element).closest<HTMLElement>("a,button"); if (!target) return;
  if (target.matches("a[data-route]") && event instanceof MouseEvent && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault(); go((target as HTMLAnchorElement).href); return;
  }
  if (target.hasAttribute("data-menu")) { menuOpen = !menuOpen; render(menuOpen ? "#main-nav a" : "[data-menu]"); }
  if (target.hasAttribute("data-filters")) { filtersOpen = !filtersOpen; render(filtersOpen ? ".filter-close" : "[data-filters]"); }
  if (target.hasAttribute("data-filter-close")) { filtersOpen = false; render("[data-filters]"); }
  if (target.dataset.bookmark) {
    const id = target.dataset.bookmark; dispatch({ type: "set-paper-saved", paperId: id, saved: !state.savedPaperIds.includes(id) }, "保存内容を更新しました。");
    render(); ($('[data-bookmark="' + id + '"]') ?? $("#page-heading"))?.focus({ preventScroll: true });
  }
  if (target.dataset.concept) { readerTab = "map"; readerChange({ type: "select-concept", conceptId: target.dataset.concept }); $('[data-node="' + target.dataset.concept + '"] .node-select')?.focus({ preventScroll: true }); }
  if (target.dataset.expand) {
    readerChange({ type: "set-expanded", conceptId: target.dataset.expand, expanded: !currentEntry(state.reader)?.expandedConceptIds.includes(target.dataset.expand) });
    $('[data-expand="' + target.dataset.expand + '"]')?.focus({ preventScroll: true });
  }
  if (target.dataset.readerTab) { readerTab = target.dataset.readerTab; render('[data-reader-tab="' + readerTab + '"]'); if (readerTab === "source") $("#source-box")?.scrollIntoView({ block: "center" }); }
  if (target.dataset.readerHistory) {
    checkpoint(); dispatch({ type: "reader", action: { type: target.dataset.readerHistory === "back" ? "back" : "forward" } });
    const entry = currentEntry(state.reader); if (entry) { history.pushState(null, "", paperUrl(entry.paperId, entry.selectedConceptId)); checkpoint(); render("#page-heading"); }
  }
  if (target.dataset.zoom) { mapScale = target.dataset.zoom === "reset" ? 1 : Math.min(1.5, Math.max(.8, mapScale + (target.dataset.zoom === "in" ? .1 : -.1))); render('[data-zoom="' + target.dataset.zoom + '"]'); }
  if (target.hasAttribute("data-full-map")) openFullMap();
  if (target.hasAttribute("data-close-map")) $<HTMLDialogElement>("#map-dialog")?.close();
  if (target.dataset.dialogConcept) { $<HTMLDialogElement>("#map-dialog")?.close(); readerChange({ type: "select-concept", conceptId: target.dataset.dialogConcept }); $('[data-node="' + target.dataset.dialogConcept + '"] .node-select')?.focus(); }
  if (target.hasAttribute("data-clear-query")) setQuery(EMPTY_QUERY);
  if (target.hasAttribute("data-clear-text")) setQuery({ ...state.search, text: "" });
  if (target.dataset.removeTag) setQuery({ ...state.search, tags: state.search.tags.filter(t => t !== target.dataset.removeTag) });
  if (target.hasAttribute("data-save-query")) { dispatch({ type: "save-search", query: state.search }, "検索条件を保存しました。"); render("#library-search"); }
  if (target.dataset.applyQuery !== undefined) { const query = state.savedSearches[Number(target.dataset.applyQuery)]; if (query) setQuery(query); }
  if (target.dataset.removeQuery !== undefined) { const query = state.savedSearches[Number(target.dataset.removeQuery)]; if (query) { dispatch({ type: "remove-search", query }, "検索の保存を解除しました。"); render("#page-heading"); } }
  if (target.dataset.visit !== undefined) {
    const index = Number(target.dataset.visit); const entry = state.reader.entries[index];
    if (entry) { checkpoint(); state = { ...state, reader: { ...state.reader, cursor: index } }; persist(); history.pushState(null, "", paperUrl(entry.paperId, entry.selectedConceptId)); checkpoint(); render("#page-heading"); window.scrollTo(0, 0); }
  }
  if (target.hasAttribute("data-reload")) location.reload();
});
document.addEventListener("submit", event => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches(".library-search")) return;
  event.preventDefault(); setQuery({ ...state.search, text: $<HTMLInputElement>("#library-search")?.value ?? "" });
});
document.addEventListener("change", event => {
  if (event.target instanceof HTMLSelectElement && event.target.id === "sort") setQuery({ ...state.search, sort: event.target.value === "title" ? "title" : "relevance" }, "#sort");
  if (event.target instanceof HTMLInputElement && event.target.name === "tag") {
    const value = event.target.value.toLowerCase(); const tags = new Set(state.search.tags);
    if (event.target.checked) tags.add(value); else tags.delete(value);
    const wasOpen = filtersOpen;
    setQuery({ ...state.search, tags: [...tags] });
    if (wasOpen) { filtersOpen = true; render('input[name="tag"][value="' + event.target.value + '"]'); }
  }
});
document.addEventListener("keydown", event => {
  if (filtersOpen && event.key === "Tab") {
    const items = Array.from(document.querySelectorAll<HTMLElement>('.filter-sidebar button,.filter-sidebar input,.filter-sidebar a')).filter(node => node.getClientRects().length && !node.hasAttribute("disabled"));
    const first=items[0], last=items[items.length-1];
    if (event.shiftKey && document.activeElement===first) { event.preventDefault();last?.focus(); }
    else if (!event.shiftKey && document.activeElement===last) { event.preventDefault();first?.focus(); }
  }
  if (event.key !== "Escape") return;
  if (menuOpen) { menuOpen = false; render("[data-menu]"); }
  if (filtersOpen) { filtersOpen = false; render("[data-filters]"); }
});
window.addEventListener("popstate", event => {
  if (path() === "/") { location.reload(); return; }
  const restored = decodeWorkspace(catalog, { ...state, reader: event.state?.ronlens === 1 ? event.state.reader : state.reader });
  if (restored.status === "ready" || restored.status === "recovered") { state = restored.state; persist(); }
  readerTab = "map"; menuOpen = false; filtersOpen = false; syncRoute(); render(); ($(".map-stage [aria-pressed=true]") ?? $("#page-heading"))?.focus({ preventScroll: true }); window.scrollTo(0, typeof event.state?.scrollY === "number" ? event.state.scrollY : 0);
});
window.addEventListener("pagehide", checkpoint);
syncRoute(); render(); checkpoint();
