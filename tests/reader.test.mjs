import test from "node:test";
import assert from "node:assert/strict";
import { createDemoCatalog, emptyReader, transitionReader, readerContext, currentEntry, MAX_READER_ENTRIES } from "../dist/index.js";

const catalog = createDemoCatalog();
const apply = (state, action) => transitionReader(catalog, state, action).state;
const open = (state, paperId, conceptId) => apply(state, { type: "open-paper", paperId, ...(conceptId ? { conceptId } : {}) });

test("empty reader and unknown paper leave state intact", () => {
  const initial = emptyReader();
  assert.deepEqual(readerContext(catalog, initial), { status: "empty" });
  const result = transitionReader(catalog, initial, { type: "open-paper", paperId: "missing" });
  assert.equal(result.status, "not-found");
  assert.equal(result.state, initial);
  assert.equal(transitionReader(catalog, initial, { type: "select-concept", conceptId: "paths-root" }).status, "not-available");
});
test("deep selection reveals ancestors and preserves parent, siblings, and full overview", () => {
  let state = open(emptyReader(), "demo-paths");
  assert.equal(readerContext(catalog, state).visibleNodes.length, 3);
  state = apply(state, { type: "select-concept", conceptId: "paths-return" });
  const view = readerContext(catalog, state);
  assert.equal(view.selected.id, "paths-return");
  assert.equal(view.parent.id, "paths-branch");
  assert.deepEqual(view.siblings.map(n => n.id), ["paths-return"]);
  assert.equal(view.overview.length, 4);
  assert.equal(view.visibleNodes.length, 4);
  assert.ok(currentEntry(state).expandedConceptIds.includes("paths-branch"));
  state = apply(state, { type: "select-concept", conceptId: "paths-context" });
  assert.deepEqual(readerContext(catalog, state).siblings.map(n => n.id), ["paths-context", "paths-branch"]);
});
test("collapse moves hidden selection to its visible ancestor; nested expansion survives reopening", () => {
  let state = open(emptyReader(), "demo-paths", "paths-return");
  state = apply(state, { type: "set-expanded", conceptId: "paths-root", expanded: false });
  assert.equal(currentEntry(state).selectedConceptId, "paths-root");
  assert.equal(readerContext(catalog, state).visibleNodes.length, 1);
  assert.equal(readerContext(catalog, state).overview.length, 4);
  state = apply(state, { type: "set-expanded", conceptId: "paths-root", expanded: true });
  assert.equal(readerContext(catalog, state).visibleNodes.length, 4);
});
test("cross-paper citation, back and forward restore exact per-entry state", () => {
  const first = open(emptyReader(), "demo-paths", "paths-return");
  let state = apply(first, { type: "follow-link", linkId: "paths-cites-notes" });
  state = apply(state, { type: "select-concept", conceptId: "notes-review" });
  const second = currentEntry(state);
  state = apply(state, { type: "back" });
  assert.deepEqual(currentEntry(state), currentEntry(first));
  assert.equal(readerContext(catalog, state).canGoForward, true);
  state = apply(state, { type: "forward" });
  assert.deepEqual(currentEntry(state), second);
});
test("citation is directional; editorial relation can be followed from both ends", () => {
  let state = open(emptyReader(), "demo-notes");
  assert.equal(transitionReader(catalog, state, { type: "follow-link", linkId: "paths-cites-notes" }).status, "not-available");
  state = open(state, "demo-paths");
  state = apply(state, { type: "follow-link", linkId: "paths-related-links" });
  assert.equal(currentEntry(state).paperId, "demo-links");
  state = apply(state, { type: "follow-link", linkId: "paths-related-links" });
  assert.equal(currentEntry(state).paperId, "demo-paths");
});
test("repeated expand, select and open operations are idempotent", () => {
  let state = open(emptyReader(), "demo-paths", "paths-return");
  const stable = state;
  for (let i = 0; i < 100; i++) {
    state = open(state, "demo-paths");
    state = apply(state, { type: "set-expanded", conceptId: "paths-branch", expanded: true });
    state = apply(state, { type: "select-concept", conceptId: "paths-return" });
  }
  assert.equal(state, stable);
  assert.equal(state.entries.length, 1);
  assert.equal(apply(state, { type: "back" }), state);
});
test("opening after back discards the forward branch, without losing the source snapshot", () => {
  let state = open(emptyReader(), "demo-paths", "paths-return");
  state = open(state, "demo-notes");
  state = apply(state, { type: "back" });
  state = open(state, "demo-links");
  assert.deepEqual(state.entries.map(e => e.paperId), ["demo-paths", "demo-links"]);
  assert.equal(apply(state, { type: "forward" }), state);
  assert.equal(currentEntry(apply(state, { type: "back" })).selectedConceptId, "paths-return");
});
test("unknown/cross-paper concept and unrelated links never alter the reader", () => {
  const state = open(emptyReader(), "demo-links");
  for (const action of [
    { type: "select-concept", conceptId: "notes-root" },
    { type: "set-expanded", conceptId: "absent", expanded: true },
    { type: "open-paper", paperId: "demo-paths", conceptId: "notes-root" },
    { type: "open-paper", paperId: "demo-paths", conceptId: "" },
    { type: "follow-link", linkId: "absent" },
    { type: "follow-link", linkId: "paths-cites-notes" },
  ]) assert.equal(transitionReader(catalog, state, action).state, state);
});
test("navigation history is bounded and its cursor remains valid", () => {
  let state = emptyReader();
  for (let i = 0; i < 150; i++) state = open(state, i % 2 ? "demo-notes" : "demo-paths");
  assert.equal(state.entries.length, MAX_READER_ENTRIES);
  assert.equal(state.cursor, MAX_READER_ENTRIES - 1);
  for (let i = 0; i < 150; i++) state = apply(state, { type: "back" });
  assert.equal(state.cursor, 0);
});
test("state snapshots cannot be mutated by the future UI", () => {
  const state = open(emptyReader(), "demo-paths");
  assert.throws(() => state.entries.push({}), TypeError);
  assert.throws(() => currentEntry(state).expandedConceptIds.push("foreign"), TypeError);
});
