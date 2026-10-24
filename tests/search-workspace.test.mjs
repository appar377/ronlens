import test from "node:test";
import assert from "node:assert/strict";
import {
  Catalog, DEMO_DATASET, createDemoCatalog, createWorkspace, EMPTY_QUERY,
  searchPapers, parseSearchQuery, transitionWorkspace, savedPapers, readingHistory, MAX_SAVED_SEARCHES,
} from "../dist/index.js";
const catalog = createDemoCatalog();
const query = (text = "", tags = [], sort = "relevance") => ({ text, tags, sort });
const apply = (state, action) => transitionWorkspace(catalog, state, action).state;

test("blank search returns all papers, including after whitespace normalization", () => {
  assert.equal(searchPapers(catalog).total, 3);
  assert.equal(searchPapers(catalog, query("　 \n ")).total, 3);
});
test("search includes conceptual explanations and glossary, ANDs words and selected tags", () => {
  let result = searchPapers(catalog, query("位置 保持"));
  assert.deepEqual(result.hits.map(hit => hit.paper.id), ["demo-paths"]);
  assert.ok(result.hits[0].matchedConceptIds.includes("paths-return"));
  result = searchPapers(catalog, query("", ["学び", "概念マップ"]));
  assert.deepEqual(result.hits.map(hit => hit.paper.id), ["demo-paths"]);
});
test("Unicode normalization, case and tag order produce the same saved search", () => {
  assert.deepEqual(parseSearchQuery(query(" ＵＩ　操作 ", ["学び", "概念マップ", "学び"])),
    parseSearchQuery(query("ui 操作", ["概念マップ", "学び"])));
});
test("literal special characters are not evaluated as regex or markup", () => {
  for (const text of ["[", ".*", "<script>", "' OR 1=1"]) {
    assert.equal(searchPapers(catalog, query(text)).status, "no-matches");
  }
});
test("empty catalog differs from zero search results", () => {
  const parsed = Catalog.parse({ ...DEMO_DATASET, papers: [], concepts: [], links: [] });
  assert.equal(searchPapers(parsed.value).status, "empty-catalog");
  assert.equal(searchPapers(catalog, query("存在しない文字列")).status, "no-matches");
  assert.equal(searchPapers(catalog, query("", ["unknown-tag"])).status, "no-matches");
});
test("invalid query boundaries return a typed state", () => {
  for (const input of [null, {}, query("x".repeat(501)), query("", [""]), query("", [null]), query("", [], "year"), query("", new Array(1))]) {
    assert.equal(searchPapers(catalog, input).status, "invalid-query");
  }
});
test("title sort is deterministic and never loses result membership", () => {
  const a = searchPapers(catalog, query("", [], "title"));
  const b = searchPapers(catalog, query("", [], "title"));
  assert.deepEqual(a, b);
  assert.equal(new Set(a.hits.map(hit => hit.paper.id)).size, 3);
});
test("normalization expansion respects limits and every accepted query reparses", () => {
  for (const input of [query("㍿".repeat(126)), query("", ["㍿".repeat(26)])]) {
    assert.equal(parseSearchQuery(input), undefined);
    const result = transitionWorkspace(catalog, createWorkspace(catalog), { type: "set-search", query: input });
    assert.equal(result.status, "invalid-query");
  }
  for (const input of [query("㍿".repeat(125)), query("", ["㍿".repeat(25)]), query("ﷺ"), query("ＡＢＣ　ｶﾀｶﾅ")]) {
    const normalized = parseSearchQuery(input);
    assert.ok(normalized);
    assert.deepEqual(parseSearchQuery(normalized), normalized);
  }
});
test("empty saved collection and history are distinct from no matches", () => {
  const state = createWorkspace(catalog);
  assert.equal(savedPapers(catalog, state).status, "empty");
  assert.equal(readingHistory(state).status, "empty");
});
test("repeated explicit save/remove cannot duplicate bookmarks", () => {
  let state = createWorkspace(catalog);
  for (let i = 0; i < 100; i++) state = apply(state, { type: "set-paper-saved", paperId: "demo-paths", saved: true });
  assert.deepEqual(state.savedPaperIds, ["demo-paths"]);
  assert.equal(savedPapers(catalog, state).status, "ready");
  const bad = transitionWorkspace(catalog, state, { type: "set-paper-saved", paperId: "unknown", saved: true });
  assert.equal(bad.status, "not-found"); assert.equal(bad.state, state);
  for (let i = 0; i < 100; i++) state = apply(state, { type: "set-paper-saved", paperId: "demo-paths", saved: false });
  assert.equal(savedPapers(catalog, state).status, "empty");
});
test("saved searches normalize, deduplicate, restore current search, and remove", () => {
  let state = createWorkspace(catalog);
  state = apply(state, { type: "save-search", query: query(" ＵＩ　操作 ", ["概念マップ", "学び"]) });
  for (let i = 0; i < 20; i++) state = apply(state, { type: "save-search", query: query("ui 操作", ["学び", "概念マップ"]) });
  assert.equal(state.savedSearches.length, 1);
  state = apply(state, { type: "set-search", query: state.savedSearches[0] });
  assert.equal(state.search.text, "ui 操作");
  state = apply(state, { type: "remove-search", query: query("ui 操作", ["概念マップ", "学び"]) });
  assert.deepEqual(state.savedSearches, []);
});
test("saved search limit is explicit, does not silently evict records", () => {
  let state = createWorkspace(catalog);
  for (let i = 0; i < MAX_SAVED_SEARCHES; i++) state = apply(state, { type: "save-search", query: query("search " + i) });
  const result = transitionWorkspace(catalog, state, { type: "save-search", query: query("overflow") });
  assert.equal(result.status, "limit-reached"); assert.equal(result.state, state);
});
test("invalid search and mismatched dataset actions leave workspace unchanged", () => {
  const state = createWorkspace(catalog);
  assert.equal(transitionWorkspace(catalog, state, { type: "set-search", query: {} }).state, state);
  const mismatch = { ...state, datasetId: "foreign" };
  assert.equal(transitionWorkspace(catalog, mismatch, { type: "set-search", query: EMPTY_QUERY }).status, "not-available");
});
