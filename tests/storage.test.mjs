import test from "node:test";
import assert from "node:assert/strict";
import {
  Catalog, DEMO_DATASET, createDemoCatalog, createWorkspace, transitionWorkspace,
  currentEntry, readerContext, LocalWorkspaceStore, decodeWorkspace,
} from "../dist/index.js";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
const catalog = createDemoCatalog();
const apply = (state, action) => transitionWorkspace(catalog, state, action).state;
const read = (state, action) => apply(state, { type: "reader", action });
function scenario() {
  let state = createWorkspace(catalog);
  state = read(state, { type: "open-paper", paperId: "demo-paths", conceptId: "paths-return" });
  state = apply(state, { type: "set-paper-saved", paperId: "demo-paths", saved: true });
  state = apply(state, { type: "save-search", query: { text: "位置", tags: ["学び"], sort: "relevance" } });
  state = apply(state, { type: "set-search", query: state.savedSearches[0] });
  state = read(state, { type: "follow-link", linkId: "paths-cites-notes" });
  state = read(state, { type: "select-concept", conceptId: "notes-review" });
  return read(state, { type: "back" });
}
test("load before save is required; empty store starts with explicit empty state", () => {
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(catalog, storage);
  assert.equal(store.save(createWorkspace(catalog)).status, "load-required");
  assert.equal(store.clear().status, "load-required");
  assert.equal(store.load().status, "empty");
});
test("complete flow survives a fresh store instance, including forward history", () => {
  const storage = new MemoryStorage();
  const first = new LocalWorkspaceStore(catalog, storage);
  first.load();
  const state = scenario();
  assert.equal(first.save(state).status, "saved");
  const second = new LocalWorkspaceStore(catalog, storage);
  const restored = second.load();
  assert.equal(restored.status, "ready");
  assert.deepEqual(restored.state, state);
  assert.equal(currentEntry(restored.state.reader).selectedConceptId, "paths-return");
  const forward = read(restored.state, { type: "forward" });
  assert.equal(currentEntry(forward.reader).selectedConceptId, "notes-review");
  assert.deepEqual(forward.savedPaperIds, ["demo-paths"]);
  assert.equal(forward.search.text, "位置");
});
test("collapsed root and hidden expansion state round-trip exactly", () => {
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(catalog, storage); store.load();
  const state = read(scenario(), { type: "set-expanded", conceptId: "paths-root", expanded: false });
  assert.equal(store.save(state).status, "saved");
  assert.deepEqual(store.load().state, state);
  assert.equal(readerContext(catalog, store.load().state.reader).visibleNodes.length, 1);
});
test("accepted Unicode-expanded search remains saveable and restorable", () => {
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(catalog, storage); store.load();
  const query = { text: "㍿".repeat(125), tags: ["㍿".repeat(25)], sort: "relevance" };
  let state = apply(createWorkspace(catalog), { type: "set-search", query });
  state = apply(state, { type: "save-search", query });
  assert.equal(store.save(state).status, "saved");
  assert.deepEqual(store.load().state, state);
});
for (const [label, raw, expected] of [
  ["broken JSON", "{", "invalid"],
  ["null JSON", "null", "invalid"],
  ["future version", JSON.stringify({ ...scenario(), schemaVersion: 2 }), "unsupported-version"],
  ["other dataset", JSON.stringify({ ...scenario(), datasetId: "foreign" }), "dataset-mismatch"],
  ["extra schema fields", JSON.stringify({ ...scenario(), futureField: true }), "invalid"],
  ["invalid cursor", JSON.stringify({ ...scenario(), reader: { entries: [], cursor: 0 } }), "invalid"],
  ["invalid saved query", JSON.stringify({ ...scenario(), savedSearches: [{}] }), "invalid"],
  ["oversized payload", " ".repeat(2_000_001), "invalid"],
]) test(label + " is preserved until explicit clear", () => {
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(catalog, storage);
  storage.setItem(store.key, raw);
  assert.equal(store.load().status, expected);
  assert.equal(store.save(createWorkspace(catalog)).status, "blocked");
  assert.equal(storage.getItem(store.key), raw);
  storage.setItem("unrelated-app", "keep me");
  assert.equal(store.clear().status, "cleared");
  assert.equal(storage.getItem("unrelated-app"), "keep me");
  assert.equal(store.save(createWorkspace(catalog)).status, "saved");
});
test("missing papers/concepts are recovered against current dataset without silently writing", () => {
  const data = structuredClone(DEMO_DATASET);
  data.papers = data.papers.filter(p => p.id !== "demo-notes").map(p =>
    p.id === "demo-paths" ? { ...p, readingOrder: p.readingOrder.filter(id => id !== "paths-return") } : p);
  data.concepts = data.concepts.filter(c => c.paperId !== "demo-notes" && c.id !== "paths-return");
  data.links = data.links.filter(l => l.toPaperId !== "demo-notes");
  const parsed = Catalog.parse(data); assert.equal(parsed.ok, true);
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(parsed.value, storage);
  let state = scenario();
  state = apply(state, { type: "set-paper-saved", paperId: "demo-notes", saved: true });
  const raw = JSON.stringify(state); storage.setItem(store.key, raw);
  const result = store.load();
  assert.equal(result.status, "recovered");
  assert.equal(result.state.reader.entries.length, 1);
  assert.equal(result.state.reader.cursor, 0);
  assert.equal(currentEntry(result.state.reader).selectedConceptId, "paths-root");
  assert.deepEqual(result.state.savedPaperIds, ["demo-paths"]);
  assert.equal(storage.getItem(store.key), raw);
  assert.ok(result.warnings.length >= 3);
});
test("stale selected hidden concept is revealed during validated recovery", () => {
  const state = structuredClone(scenario());
  state.reader.entries[0].expandedConceptIds = [];
  const result = decodeWorkspace(catalog, state);
  assert.equal(result.status, "recovered");
  assert.equal(readerContext(catalog, result.state.reader).visibleNodes.length, 4);
});
test("malformed stored shapes never become a valid state", () => {
  for (const mutate of [
    s => { s.savedPaperIds = [null]; },
    s => { s.reader.entries[0].expandedConceptIds = ["notes-root", null]; },
    s => { s.reader.cursor = 0.5; },
    s => { s.reader.entries[0].selectedConceptId = 42; },
    s => { s.search.tags = new Array(1); },
  ]) {
    const state = structuredClone(scenario()); mutate(state);
    assert.equal(decodeWorkspace(catalog, state).status, "invalid");
  }
});
test("storage access denial does not report a successful load/save", () => {
  const storage = { getItem() { throw new Error("denied"); }, setItem() {}, removeItem() {} };
  const store = new LocalWorkspaceStore(catalog, storage);
  assert.equal(store.load().status, "storage-error");
  assert.equal(store.save(scenario()).status, "load-required");
});
test("quota failure preserves previous stored state and requires a fresh read", () => {
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(catalog, storage); store.load();
  const initial = createWorkspace(catalog); store.save(initial);
  const raw = storage.getItem(store.key);
  storage.setItem = () => { throw new Error("QuotaExceededError"); };
  assert.equal(store.save(scenario()).status, "storage-error");
  assert.equal(storage.getItem(store.key), raw);
  assert.equal(store.save(scenario()).status, "load-required");
});
test("two loaded tabs detect a later write before overwriting it", () => {
  const storage = new MemoryStorage();
  const first = new LocalWorkspaceStore(catalog, storage);
  const second = new LocalWorkspaceStore(catalog, storage);
  first.load(); second.load();
  assert.equal(first.save(scenario()).status, "saved");
  assert.equal(second.save(createWorkspace(catalog)).status, "conflict");
  assert.equal(second.clear().status, "conflict");
  assert.deepEqual(second.load().state, scenario());
});
test("save is only acknowledged when read-back matches", () => {
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(catalog, storage); store.load();
  storage.setItem = () => {};
  assert.equal(store.save(scenario()).status, "storage-error");
  assert.equal(store.save(scenario()).status, "load-required");
});
test("invalid state cannot overwrite a healthy saved state", () => {
  const storage = new MemoryStorage();
  const store = new LocalWorkspaceStore(catalog, storage); store.load(); store.save(scenario());
  const raw = storage.getItem(store.key);
  assert.equal(store.save({ ...scenario(), reader: { entries: [], cursor: 100 } }).status, "invalid-state");
  assert.equal(storage.getItem(store.key), raw);
});
test("recovery of all removed papers yields an explicit empty reader", () => {
  const data = { ...DEMO_DATASET, papers: [], concepts: [], links: [] };
  const emptyCatalog = Catalog.parse(data).value;
  const result = decodeWorkspace(emptyCatalog, scenario());
  assert.equal(result.status, "recovered");
  assert.deepEqual(result.state.reader, { entries: [], cursor: -1 });
  assert.deepEqual(result.state.savedPaperIds, []);
});
