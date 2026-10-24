import test from "node:test";
import assert from "node:assert/strict";
import { Catalog, DEMO_DATASET, DEMO_NOTICE, createDemoCatalog, relationshipLabel } from "../dist/index.js";

const copy = () => structuredClone(DEMO_DATASET);
test("bundled manuscripts and sources explicitly identify fictional demos", () => {
  const catalog = createDemoCatalog();
  assert.equal(catalog.dataset.notice, DEMO_NOTICE);
  assert.equal(catalog.dataset.papers.length, 3);
  for (const paper of catalog.dataset.papers) assert.equal(paper.kind, "fictional-demo");
  for (const node of catalog.dataset.concepts) assert.equal(node.source.kind, "fictional-demo");
  assert.equal(relationshipLabel(catalog.link("paths-cites-notes")), "デモ内の架空引用");
  assert.equal(relationshipLabel(catalog.link("paths-related-links")), "編集上の関連（架空デモ）");
});
test("catalog owns an immutable clone", () => {
  const data = copy();
  const parsed = Catalog.parse(data);
  assert.equal(parsed.ok, true);
  data.papers[0].title = "changed externally";
  assert.notEqual(parsed.value.paper("demo-paths").title, data.papers[0].title);
  assert.throws(() => { parsed.value.paper("demo-paths").title = "mutation"; }, TypeError);
  assert.throws(() => parsed.value.children("paths-root").push({}), TypeError);
});
for (const [label, mutate] of [
  ["unlabelled dataset", d => { d.mode = "real"; }],
  ["missing demo notice", d => { delete d.notice; }],
  ["real paper metadata", d => { d.papers[0].doi = "10.fake/example"; }],
  ["real citation claim", d => { d.links[0].authenticity = "verified"; }],
  ["missing citation evidence", d => { delete d.links[0].evidence; }],
  ["editorial pretending to cite", d => { d.links[1].evidence = d.links[0].evidence; }],
  ["fabricated excerpt absent from source", d => { d.links[0].evidence.excerpt = "not present"; }],
  ["citation source in another paper", d => { d.links[0].evidence.sourceConceptId = "notes-root"; }],
  ["unknown paper link", d => { d.links[0].toPaperId = "missing"; }],
  ["self link", d => { d.links[0].toPaperId = "demo-paths"; }],
  ["duplicate paper", d => { d.papers.push(d.papers[0]); }],
  ["duplicate concept", d => { d.concepts.push(d.concepts[0]); }],
  ["duplicate link", d => { d.links.push(d.links[0]); }],
  ["missing parent", d => { d.concepts[1].parentId = "absent"; }],
  ["cross-paper parent", d => { d.concepts[1].parentId = "notes-root"; }],
  ["cycle", d => { d.concepts[2].parentId = "paths-return"; }],
  ["disconnected root", d => { d.concepts[1].parentId = null; }],
  ["wrong reading-order paper", d => { d.papers[0].readingOrder.push("notes-root"); }],
  ["unknown root", d => { d.papers[0].rootConceptId = "missing"; }],
]) test("rejects " + label, () => {
  const data = copy(); mutate(data);
  const parsed = Catalog.parse(data);
  assert.equal(parsed.ok, false);
  assert.ok(parsed.issues.length > 0);
});
test("malformed inputs return issues without throwing", () => {
  for (const value of [null, [], "bad", {}, { ...copy(), concepts: [null] }, { ...copy(), papers: new Array(1) }, Object.create(copy()), { ...copy(), links: [{ kind: "editorial" }] }]) {
    assert.equal(Catalog.parse(value).ok, false);
  }
});
test("empty catalog is a valid data state", () => {
  const parsed = Catalog.parse({ ...copy(), papers: [], concepts: [], links: [] });
  assert.equal(parsed.ok, true);
});
test("parent and sibling order is available without visual coordinates", () => {
  const catalog = createDemoCatalog();
  assert.deepEqual(catalog.ancestors("paths-return").map(n => n.id), ["paths-root", "paths-branch"]);
  assert.deepEqual(catalog.children("paths-root").map(n => n.id), ["paths-context", "paths-branch"]);
});
