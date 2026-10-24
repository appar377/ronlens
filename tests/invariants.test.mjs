import test from "node:test";
import assert from "node:assert/strict";
import { createDemoCatalog, createWorkspace, transitionWorkspace, readerContext, currentEntry, decodeWorkspace } from "../dist/index.js";

test("mixed navigation and saves preserve invariants across 1,000 deterministic operations", () => {
  const catalog = createDemoCatalog();
  const papers = catalog.dataset.papers.map(paper => paper.id);
  const concepts = catalog.dataset.concepts.map(concept => concept.id);
  let seed = 773;
  const next = maximum => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % maximum;
  };
  let state = createWorkspace(catalog);
  for (let step = 0; step < 1_000; step++) {
    const paperId = papers[next(papers.length)];
    const conceptId = concepts[next(concepts.length)];
    const actions = [
      { type: "reader", action: { type: "open-paper", paperId } },
      { type: "reader", action: { type: "select-concept", conceptId } },
      { type: "reader", action: { type: "set-expanded", conceptId, expanded: next(2) === 0 } },
      { type: "reader", action: { type: "back" } },
      { type: "reader", action: { type: "forward" } },
      { type: "set-paper-saved", paperId, saved: next(2) === 0 },
      { type: "save-search", query: { text: "位置", tags: ["学び"], sort: "relevance" } },
      { type: "reader", action: { type: "follow-link", linkId: "paths-cites-notes" } },
    ];
    const before = JSON.stringify(state);
    const previous = state;
    state = transitionWorkspace(catalog, state, actions[next(actions.length)]).state;
    assert.equal(JSON.stringify(previous), before, "previous snapshot changed at step " + step);
    assert.equal(new Set(state.savedPaperIds).size, state.savedPaperIds.length);
    const entry = currentEntry(state.reader);
    if (entry) {
      const context = readerContext(catalog, state.reader);
      assert.ok(context.visibleNodes.some(node => node.concept.id === entry.selectedConceptId), "selected node hidden at step " + step);
      assert.ok(state.reader.cursor >= 0 && state.reader.cursor < state.reader.entries.length);
      assert.equal(new Set(entry.expandedConceptIds).size, entry.expandedConceptIds.length);
      assert.equal(context.overview.length, catalog.concepts(entry.paperId).length);
      assert.ok(context.overview.every(node => node.concept.paperId === entry.paperId));
    }
    const restored = decodeWorkspace(catalog, JSON.parse(JSON.stringify(state)));
    assert.equal(restored.status, "ready", "noncanonical state at step " + step);
    assert.deepEqual(restored.state, state);
  }
});
