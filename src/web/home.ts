import { createWorkspace, transitionWorkspace } from "../workspace.js";
import type { WorkspaceAction } from "../workspace.js";
import { LocalWorkspaceStore } from "../storage.js";
import { EMPTY_QUERY, parseSearchQuery, searchPapers, searchKey } from "../search.js";
import type { SearchQuery } from "../search.js";
import { createHomeCatalog } from "./home-demo.js";
import { icon } from "./icons.js";

import { ResearchReaderStore, researchMatches } from "../research-reader.js";
import { researchCard } from "./research-view.js";
const research = new ResearchReaderStore((() => { try { return window.localStorage; } catch { return undefined; } })());
const catalog = createHomeCatalog();
let state = createWorkspace(catalog);
let store: LocalWorkspaceStore | undefined;
let view: "all" | "saved" = "all";
let initialNotice = "";
const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error("Missing UI element: " + selector);
  return element;
};
const escape = (text: string): string => text.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char] ?? char));

try {
  store = new LocalWorkspaceStore(catalog, window.localStorage);
  const loaded = store.load();
  state = loaded.state;
  if (loaded.status === "recovered") initialNotice = "保存内容を現在のデモに合わせて復元しました。";
  if (["invalid", "unsupported-version", "dataset-mismatch"].includes(loaded.status)) {
    initialNotice = "保存内容を読み込めませんでした。元の内容は保持し、この画面内だけで操作できます。";
  }
  if (loaded.status === "storage-error") initialNotice = "このブラウザに保存できません。今の画面内では操作できます。";
} catch {
  initialNotice = "このブラウザに保存できません。今の画面内では操作できます。";
}

function notice(message: string): void {
  const element = $("#operation-status");
  element.hidden = !message;
  element.textContent = message;
}
function dispatch(action: WorkspaceAction, success = ""): boolean {
  const result = transitionWorkspace(catalog, state, action);
  if (result.status === "invalid-query") { notice("検索語は正規化後500文字以内で入力してください。"); return false; }
  if (result.status === "limit-reached") { notice("保存できる検索は100件までです。不要な検索を解除してから保存してください。"); return false; }
  state = result.state;
  if (result.status !== "changed") return true;
  const saved = store?.save(state);
  if (saved?.status !== "saved") {
    notice(saved?.status === "conflict"
      ? "別のタブで保存内容が変わりました。上書きしていません。画面を再読み込みして確認してください。"
      : "この変更はブラウザに保存できませんでした。今の画面内だけで保持しています。");
  } else notice(success);
  return true;
}

function updateUrl(replace = false): void {
  const url = new URL(window.location.href);
  url.search = "";
  if (state.search.text) url.searchParams.set("q", state.search.text);
  for (const tag of state.search.tags) url.searchParams.append("tag", tag);
  if (state.search.sort !== "relevance") url.searchParams.set("sort", state.search.sort);
  if (view === "saved") url.searchParams.set("view", "saved");
  url.hash = "";
  if (url.href !== window.location.href) window.history[replace ? "replaceState" : "pushState"]({}, "", url);
}

function syncFromUrl(initial = false): void {
  const params = new URLSearchParams(window.location.search);
  view = params.get("view") === "saved" ? "saved" : "all";
  const query = initial && !params.has("q") && !params.has("tag") && !params.has("view") && !params.has("sort")
    ? state.search
    : { text: params.get("q") ?? "", tags: params.getAll("tag"), sort: params.get("sort") ?? "relevance" };
  const parsed = parseSearchQuery(query);
  dispatch({ type: "set-search", query: parsed ?? EMPTY_QUERY });
  if (!parsed) notice("検索条件を読み込めなかったため、条件を解除しました。");
  $("#search-input").setAttribute("value", state.search.text);
  $<HTMLInputElement>("#search-input").value = state.search.text;
  updateUrl(true);
  render();
}
function setQuery(query: SearchQuery): void {
  if (!dispatch({ type: "set-search", query })) return;
  $<HTMLInputElement>("#search-input").value = state.search.text;
  updateUrl();
  render();
}

function render(): void {
  const result = searchPapers(catalog, state.search);
  const hasQuery = !!state.search.text || state.search.tags.length > 0;
  const ordered = !hasQuery && state.search.sort === "relevance" ? catalog.dataset.papers : result.hits.map(hit => hit.paper);
  const hasResearch = researchMatches(state.search) && (view === "all" || research.state.saved);
  const papers = ordered.filter(paper => view === "all" || state.savedPaperIds.includes(paper.id));
  document.querySelectorAll<HTMLAnchorElement>("[data-view]").forEach(link => {
    if (link.dataset.view === view) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  $("#saved-count").textContent = "（" + (state.savedPaperIds.length + Number(research.state.saved)) + "件）";
  const heading = $("#result-heading");
  heading.hidden = !hasQuery && view === "all";
  heading.innerHTML = '<p>' + (view === "saved" ? "保存した論文" : "検索結果") + ' <strong>' + (papers.length + Number(hasResearch)) + '件</strong></p>' +
    (hasQuery ? '<button data-clear-search>検索条件を解除</button>' : "");
  $("#save-search").hidden = !hasQuery;
  const alreadySaved = state.savedSearches.some(query => searchKey(query) === searchKey(state.search));
  $("#save-search").textContent = alreadySaved ? "検索を保存済み" : "この検索を保存";
  $<HTMLButtonElement>("#save-search").disabled = alreadySaved;
  const searches = $("#saved-searches");
  searches.hidden = state.savedSearches.length === 0;
  searches.innerHTML = '<span>保存した検索</span>' + state.savedSearches.map((query, index) =>
    '<span class="query-chip"><button data-query="' + index + '">' + escape(query.text || "すべての論文") +
    (query.tags.length ? " · " + escape(query.tags.join(" / ")) : "") + '</button><button data-remove-query="' + index +
    '" aria-label="保存した検索「' + escape(query.text || "すべての論文") + '」を解除">×</button></span>').join("");
  if (!document.querySelector("#research-discovery")) $("#paper-grid").insertAdjacentHTML("beforebegin", '<div id="research-discovery"></div>');
  $("#research-discovery").innerHTML = hasResearch ? researchCard(research.state, view === "saved") : "";
  $("#paper-grid").innerHTML = papers.map(paper => {
    const index = catalog.dataset.papers.findIndex(item => item.id === paper.id);
    const label = ["A", "B", "C"][index] ?? "";
    const saved = state.savedPaperIds.includes(paper.id);
    return '<article class="paper-card">' +
      '<div class="paper-art art-' + index + '" aria-hidden="true"></div>' +
      '<p class="paper-eyebrow">' + icon("document") + '<span>論文' + label + '</span><span class="demo-tag">架空デモ</span></p>' +
      '<h2>' + escape(paper.title) + '</h2><p class="paper-summary">' + escape(paper.summary) + '</p>' +
      '<div class="paper-actions"><a class="read-link" href="/paper/' + paper.id + '">図解から読む ' + icon("arrow") +
      '</a><button class="bookmark-button" data-paper="' + paper.id +
      '" aria-label="「' + escape(paper.title) + '」' + (saved ? 'の保存を解除' : 'を保存') +
      '" aria-pressed="' + saved + '">' + icon("bookmark") + '</button></div></article>';
  }).join("");
  if (hasResearch && state.search.sort === "title") {
    const card = $("#research-discovery").firstElementChild;
    const grid = $("#paper-grid");
    if (card) grid.append(card);
    grid.replaceChildren(...Array.from(grid.children).sort((a, b) => (a.querySelector("h2")?.textContent ?? "").localeCompare(b.querySelector("h2")?.textContent ?? "", "ja")));
  }
  const empty = $("#empty-state");
  empty.hidden = papers.length > 0 || hasResearch;
  empty.innerHTML = view === "saved" && !hasQuery
    ? '<h2>保存した論文はまだありません</h2><p>気になった論文のしおりを押すと、ここから見返せます。</p><button data-show-all>すべての論文へ</button>'
    : '<h2>一致する論文・解説がありません</h2><p>キーワードを短くするか、検索条件を解除してみてください。</p><button data-clear-search>検索条件を解除</button>';
}

const perspectives = [
  { title: "問い", key: "question", color: "#ff3657", text: "この研究は、何を明らかにしたい？", x: 129, y: 325, mx: 36, my: 310 },
  { title: "解決", key: "solution", color: "#ff9b28", text: "どんな方法で、この問いに答える？", x: 251, y: 343, mx: 79, my: 310 },
  { title: "しくみ", key: "mechanism", color: "#ffe747", text: "中では何が起きて、どう動く？", x: 382, y: 355, mx: 122, my: 313 },
  { title: "根拠", key: "evidence", color: "#13dfa2", text: "何を調べて、その答えを確かめた？", x: 522, y: 361, mx: 168, my: 316 },
  { title: "発見", key: "discovery", color: "#19c9ff", text: "これまでと比べて、何が分かった？", x: 674, y: 350, mx: 214, my: 313 },
  { title: "活用", key: "application", color: "#377aff", text: "この知見を、どんな場面で使える？", x: 809, y: 341, mx: 256, my: 307 },
  { title: "次の疑問", key: "next", color: "#a65bff", text: "まだ分からないこと、次に知りたいことは？", x: 944, y: 316, mx: 305, my: 295 },
];

function lightRays(mobile: boolean): string {
  const start = mobile ? [167, 196] : [520, 140];
  const prefix = mobile ? "m" : "d";
  const white = mobile ? "M0 148 L131 191" : "M0 64 L450 139";
  return '<defs><filter id="' + prefix + '-glow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>' +
    '<path d="' + white + '" stroke="white" stroke-width="' + (mobile ? 10 : 15) + '" opacity=".5" filter="url(#' + prefix + '-glow)"/>' +
    '<path d="' + white + '" stroke="white" stroke-width="' + (mobile ? 3 : 4) + '"/>' +
    perspectives.map(p => {
      const x = mobile ? p.mx : p.x; const y = mobile ? p.my : p.y;
      const d = "M" + start.join(" ") + " Q" + ((start[0] ?? 0) * .35 + x * .65) + " " + (y - (mobile ? 38 : 80)) + " " + x + " " + y;
      return '<path d="' + d + '" stroke="' + p.color + '" stroke-width="' + (mobile ? 7 : 10) + '" opacity=".65" filter="url(#' + prefix + '-glow)"/>' +
        '<path d="' + d + '" stroke="' + p.color + '" stroke-width="' + (mobile ? 1.2 : 2) + '"/>' +
        '<path d="' + d + '" stroke="white" stroke-width=".6" opacity=".85"/>';
    }).join("");
}
$(".desktop-rays").innerHTML = lightRays(false);
$(".mobile-rays").innerHTML = lightRays(true);
$(".light-doors").innerHTML = perspectives.map((p, index) =>
  '<button class="light-door" style="--color:' + p.color + ';--x:' + p.x / 1083 * 100 + '%;--y:' + p.y +
  'px;--mx:' + p.mx / 335 * 100 + '%;--my:' + p.my + 'px" data-perspective="' + index +
  '" aria-label="' + p.title + 'の説明を表示" aria-pressed="' + (index === 0) +
  '" aria-describedby="perspective-note"><span class="light-orb">' + icon(p.key) +
  '</span><span class="door-label">' + p.title + '</span></button>').join("");

function selectPerspective(index: number): void {
  const p = perspectives[index];
  if (!p) return;
  const note = $("#perspective-note");
  note.innerHTML = "<strong>" + p.title + "</strong><p>" + p.text + "</p>";
  note.style.setProperty("--note-x", p.x / 1083 * 100 + "%");
  note.style.setProperty("--note-y", p.y + "px");
  note.style.setProperty("--note-mx", p.mx / 335 * 100 + "%");
  note.style.setProperty("--note-my", p.my + "px");
  document.querySelectorAll<HTMLButtonElement>("[data-perspective]").forEach(button => {
    const selected = Number(button.dataset.perspective) === index;
    button.setAttribute("aria-pressed", String(selected));
    if (selected) button.setAttribute("aria-describedby", "perspective-note");
    else button.removeAttribute("aria-describedby");
  });
}
selectPerspective(0);

function closeMenu(): void {
  $(".site-header").classList.remove("menu-open");
  $(".menu-button").setAttribute("aria-expanded", "false");
  $(".menu-button").setAttribute("aria-label", "メニューを開く");
}
function focusResults(): void {
  const heading = $("#result-heading");
  if (heading.hidden) $("#search-input").focus();
  else heading.focus({ preventScroll: true });
}
document.addEventListener("click", event => {
  const target = (event.target as Element).closest<HTMLElement>("button, a");
  if (!target) return;
  if (target.hasAttribute("data-research-save")) {
    research.update({ saved: !research.state.saved }); notice(research.notice || "解説記事の保存内容を更新しました。"); render();
    (document.querySelector<HTMLButtonElement>("[data-research-save]") ?? $("#search-input")).focus();
  }
  if (target.dataset.perspective !== undefined) selectPerspective(Number(target.dataset.perspective));
  if (target.dataset.paper) {
    const saved = !state.savedPaperIds.includes(target.dataset.paper);
    dispatch({ type: "set-paper-saved", paperId: target.dataset.paper, saved }, saved ? "論文を保存しました。" : "保存を解除しました。");
    render();
    const nextFocus = document.querySelector<HTMLButtonElement>('[data-paper="' + target.dataset.paper + '"]')
      ?? document.querySelector<HTMLButtonElement>("#paper-grid button, #empty-state button");
    nextFocus?.focus();
  }
  if (target.dataset.view) {
    event.preventDefault();
    const menuOpen = $(".site-header").classList.contains("menu-open");
    view = target.dataset.view === "saved" ? "saved" : "all";
    if (view === "all") dispatch({ type: "set-search", query: EMPTY_QUERY });
    $<HTMLInputElement>("#search-input").value = state.search.text;
    updateUrl(); render(); closeMenu();
    if (view === "saved") { $("#result-heading").scrollIntoView({ block: "nearest" }); focusResults(); }
    else if (menuOpen) $("#hero-title").focus();
  }
  if (target.hasAttribute("data-focus-search")) { event.preventDefault(); closeMenu(); $("#search-input").focus(); }
  if (target.hasAttribute("data-clear-search")) { setQuery(EMPTY_QUERY); $("#search-input").focus(); }
  if (target.hasAttribute("data-show-all")) { view = "all"; setQuery(EMPTY_QUERY); $("#search-input").focus(); }
  if (target.dataset.query !== undefined) {
    const query = state.savedSearches[Number(target.dataset.query)];
    if (query) { view = "all"; setQuery(query); focusResults(); }
  }
  if (target.dataset.removeQuery !== undefined) {
    const query = state.savedSearches[Number(target.dataset.removeQuery)];
    if (query) {
      dispatch({ type: "remove-search", query }, "検索の保存を解除しました。"); render();
      const next = document.querySelector<HTMLButtonElement>('[data-query="' + target.dataset.removeQuery + '"]')
        ?? document.querySelector<HTMLButtonElement>("[data-query]");
      (next ?? $("#search-input")).focus();
    }
  }
});
$(".search-form").addEventListener("submit", event => {
  event.preventDefault();
  setQuery({ text: $<HTMLInputElement>("#search-input").value, tags: [], sort: "relevance" });
});
$("#save-search").addEventListener("click", () => {
  if (!dispatch({ type: "save-search", query: state.search }, "検索を保存しました。")) return;
  render();
  const index = state.savedSearches.findIndex(query => searchKey(query) === searchKey(state.search));
  document.querySelector<HTMLButtonElement>('[data-query="' + index + '"]')?.focus();
});
$(".menu-button").addEventListener("click", () => {
  const open = $(".site-header").classList.toggle("menu-open");
  $(".menu-button").setAttribute("aria-expanded", String(open));
  $(".menu-button").setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  if (open) document.querySelector<HTMLAnchorElement>("#main-nav a")?.focus();
});
$(".about-button").addEventListener("click", () => {
  $("#about-note").hidden = !$("#about-note").hidden;
  $(".about-button").setAttribute("aria-expanded", String(!$("#about-note").hidden));
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const menuOpen = $(".site-header").classList.contains("menu-open");
  closeMenu();
  $("#about-note").hidden = true;
  $(".about-button").setAttribute("aria-expanded", "false");
  if (menuOpen) $(".menu-button").focus();
});
window.addEventListener("popstate", () => syncFromUrl());
syncFromUrl(true);
if (initialNotice || research.notice) notice([initialNotice, research.notice].filter(Boolean).join(" "));
