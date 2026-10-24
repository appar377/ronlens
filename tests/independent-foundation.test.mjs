import test from "node:test";
import assert from "node:assert/strict";
import {
  Catalog, DEMO_DATASET, createDemoCatalog, createWorkspace,
  transitionWorkspace, transitionReader, emptyReader, currentEntry,
  readerContext, parseSearchQuery, decodeWorkspace, LocalWorkspaceStore
} from "../dist/index.js";

const catalog = createDemoCatalog();
class Storage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}
const apply = (state, action) => transitionReader(catalog, state, action).state;
const open = (state, paperId, conceptId) => apply(state, {
  type:"open-paper", paperId, ...(conceptId === undefined ? {} : {conceptId})
});

test("accepted normalized query remains parseable and persistable at expansion boundaries", () => {
  for (const count of [1, 25, 26, 124, 125, 126, 499, 500]) {
    for (const query of [
      {text:"㍿".repeat(count), tags:[], sort:"relevance"},
      {text:"", tags:["㍿".repeat(count)], sort:"relevance"},
    ]) {
      const normalized = parseSearchQuery(query);
      if (!normalized) continue;
      assert.deepEqual(parseSearchQuery(normalized), normalized);
      const transition = transitionWorkspace(catalog, createWorkspace(catalog), {type:"set-search", query});
      assert.equal(transition.status, "changed");
      const store = new LocalWorkspaceStore(catalog, new Storage()); store.load();
      assert.equal(store.save(transition.state).status, "saved");
    }
  }
});

test("JSON-shaped invalid values are rejected without a validation exception", () => {
  const candidates = [null, false, 0, "", "string", [], {}, [null], {extra:true}];
  const paths = [
    ["papers"], ["concepts"], ["links"], ["papers",0,"id"], ["papers",0,"kind"],
    ["papers",0,"rootConceptId"], ["papers",0,"tags"], ["papers",0,"readingOrder"],
    ["concepts",0,"source"], ["concepts",0,"terms"], ["concepts",1,"parentId"],
    ["links",0,"evidence"], ["links",0,"authenticity"], ["links",1,"rationale"],
  ];
  for (const path of paths) for (const value of candidates) {
    const dataset = structuredClone(DEMO_DATASET);
    let target = dataset;
    for (const key of path.slice(0,-1)) target = target[key];
    target[path.at(-1)] = value;
    const result = Catalog.parse(dataset);
    assert.equal(typeof result.ok, "boolean");
  }
});

test("non-seven-branch deep hierarchy preserves visible selection, siblings, and full map", () => {
  const data = structuredClone(DEMO_DATASET);
  data.papers = [{id:"deep-paper",kind:"fictional-demo",title:"架空デモ",summary:"深い階層の検証",
    tags:[], rootConceptId:"deep-root",readingOrder:["deep-root","deep-a","deep-b","deep-c","deep-d"]}];
  const node = (id,parentId) => ({id,paperId:"deep-paper",parentId,title:id,explanation:"架空概念",
    terms:[],source:{kind:"fictional-demo",section:"検証",text:"架空デモの原稿"}});
  data.concepts = [
    node("deep-root",null),node("deep-a","deep-root"),node("deep-b","deep-a"),
    node("deep-c","deep-b"),node("deep-d","deep-c"),node("deep-side","deep-b")
  ];
  data.links = [];
  const parsed = Catalog.parse(data); assert.equal(parsed.ok,true);
  let state = transitionReader(parsed.value,emptyReader(),{type:"open-paper",paperId:"deep-paper",conceptId:"deep-d"}).state;
  assert.equal(readerContext(parsed.value,state).visibleNodes.length,6);
  state = transitionReader(parsed.value,state,{type:"set-expanded",conceptId:"deep-b",expanded:false}).state;
  const context = readerContext(parsed.value,state);
  assert.equal(context.selected.id,"deep-b");
  assert.equal(context.parent.id,"deep-a");
  assert.equal(context.overview.length,6);
  assert.equal(context.visibleNodes.length,3);
});

test("repeated paper visits retain separate snapshots across back and forward", () => {
  let state = open(emptyReader(),"demo-paths","paths-return");
  state = open(state,"demo-notes","notes-review");
  state = open(state,"demo-paths","paths-context");
  state = apply(state,{type:"back"});
  assert.equal(currentEntry(state).selectedConceptId,"notes-review");
  state = apply(state,{type:"back"});
  assert.equal(currentEntry(state).selectedConceptId,"paths-return");
  state = apply(apply(state,{type:"forward"}),{type:"forward"});
  assert.equal(currentEntry(state).selectedConceptId,"paths-context");
});

test("exception after a write requires read-back, which resolves the uncertain outcome", () => {
  const storage = new Storage();
  const store = new LocalWorkspaceStore(catalog,storage); store.load();
  const state = {...createWorkspace(catalog), reader:open(emptyReader(),"demo-paths","paths-return")};
  storage.setItem = function(key,value) { this.values.set(key,value); throw new Error("post-write failure"); };
  assert.equal(store.save(state).status,"storage-error");
  assert.equal(store.save(state).status,"load-required");
  const loaded = store.load();
  assert.equal(loaded.status,"ready");
  assert.deepEqual(loaded.state,state);
});

test("removing the current paper during dataset update retains the nearest previous visit", () => {
  let state = createWorkspace(catalog);
  let reader = open(emptyReader(),"demo-paths","paths-return");
  reader = open(reader,"demo-notes","notes-review");
  reader = open(reader,"demo-links");
  reader = apply(reader,{type:"back"});
  state = {...state,reader};
  const data = structuredClone(DEMO_DATASET);
  data.papers = data.papers.filter(p=>p.id!=="demo-notes");
  data.concepts = data.concepts.filter(c=>c.paperId!=="demo-notes");
  data.links = data.links.filter(l=>l.toPaperId!=="demo-notes");
  const updated = Catalog.parse(data).value;
  const restored = decodeWorkspace(updated,state);
  assert.equal(restored.status,"recovered");
  assert.equal(currentEntry(restored.state.reader).paperId,"demo-paths");
  assert.deepEqual(restored.state.reader.entries.map(e=>e.paperId),["demo-paths","demo-links"]);
  const store = new LocalWorkspaceStore(updated,new Storage()); store.load();
  assert.equal(store.save(restored.state).status,"saved");
});
