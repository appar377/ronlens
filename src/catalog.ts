import { DEMO_NOTICE, deepFreeze, isRecord } from "./model.js";
import type { Concept, DemoDataset, Paper, PaperLink, Result, ValidationIssue } from "./model.js";

const ID = /^[a-z][a-z0-9-]{0,79}$/;

export class Catalog {
  private readonly papersById: ReadonlyMap<string, Paper>;
  private readonly conceptsById: ReadonlyMap<string, Concept>;
  private readonly linksById: ReadonlyMap<string, PaperLink>;
  private readonly childrenById: ReadonlyMap<string, readonly Concept[]>;

  private constructor(readonly dataset: DemoDataset) {
    this.papersById = new Map(dataset.papers.map(paper => [paper.id, paper]));
    this.conceptsById = new Map(dataset.concepts.map(concept => [concept.id, concept]));
    this.linksById = new Map(dataset.links.map(link => [link.id, link]));
    const children = new Map<string, Concept[]>();
    for (const concept of dataset.concepts) {
      if (concept.parentId === null) continue;
      const siblings = children.get(concept.parentId) ?? [];
      siblings.push(concept);
      children.set(concept.parentId, siblings);
    }
    this.childrenById = new Map([...children].map(([id, nodes]) => [id, Object.freeze(nodes)]));
  }

  static parse(input: unknown): Result<Catalog> {
    const issues = validateDataset(input);
    if (issues.length > 0) return { ok: false, issues };
    // Clone only after validation; callers cannot mutate the catalog through their input.
    const dataset = deepFreeze(structuredClone(input as DemoDataset));
    return { ok: true, value: new Catalog(dataset) };
  }

  paper(id: string): Paper | undefined { return this.papersById.get(id); }
  concept(id: string): Concept | undefined { return this.conceptsById.get(id); }
  link(id: string): PaperLink | undefined { return this.linksById.get(id); }
  children(id: string): readonly Concept[] { return this.childrenById.get(id) ?? []; }
  concepts(paperId: string): readonly Concept[] {
    return this.dataset.concepts.filter(concept => concept.paperId === paperId);
  }
  ancestors(id: string): readonly Concept[] {
    const ancestors: Concept[] = [];
    let parentId = this.concept(id)?.parentId;
    while (parentId) {
      const parent = this.concept(parentId);
      if (!parent) break;
      ancestors.unshift(parent);
      parentId = parent.parentId;
    }
    return ancestors;
  }
}

function validateDataset(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const issue = (path: string, message: string): void => { issues.push({ path, message }); };
  const text = (value: unknown, path: string): value is string => {
    if (typeof value === "string" && value.trim().length > 0 && value.length <= 20_000) return true;
    issue(path, "空ではない文字列が必要です（20,000文字以内）。"); return false;
  };
  const identifier = (value: unknown, path: string): void => {
    if (typeof value !== "string" || !ID.test(value)) issue(path, "IDは英小文字で始まる80文字以内の英小文字・数字・ハイフンです。");
  };
  const record = (value: unknown, path: string, keys: readonly string[]): value is Record<string, unknown> => {
    if (!isRecord(value)) { issue(path, "オブジェクトが必要です。"); return false; }
    for (const key of Object.keys(value)) if (!keys.includes(key)) issue(path + "." + key, "未定義の項目です。");
    return true;
  };
  const list = (value: unknown, path: string, max = 5_000): value is unknown[] => {
    if (Array.isArray(value) && value.length <= max && Array.from(value).every((_, index) => Object.hasOwn(value, index))) return true;
    issue(path, "上限内の配列が必要です。"); return false;
  };
  const strings = (value: unknown, path: string): void => {
    if (!list(value, path, 100)) return;
    value.forEach((entry, index) => text(entry, path + "." + index));
    if (new Set(value).size !== value.length) issue(path, "重複があります。");
  };
  if (!record(input, "dataset", ["schemaVersion", "mode", "id", "notice", "papers", "concepts", "links"])) return issues;
  if (input.schemaVersion !== 1) issue("schemaVersion", "対応する版は1です。");
  if (input.mode !== "fictional-demo") issue("mode", "この版では架空デモだけを扱います。");
  if (input.notice !== DEMO_NOTICE) issue("notice", "架空デモの明示が必要です。");
  identifier(input.id, "id");
  const papers: unknown[] = list(input.papers, "papers", 500) ? input.papers : [];
  const concepts: unknown[] = list(input.concepts, "concepts") ? input.concepts : [];
  const links: unknown[] = list(input.links, "links", 10_000) ? input.links : [];
  papers.forEach((paper, index) => {
    const path = "papers." + index;
    if (!record(paper, path, ["id", "kind", "title", "summary", "tags", "rootConceptId", "readingOrder"])) return;
    identifier(paper.id, path + ".id");
    if (paper.kind !== "fictional-demo") issue(path + ".kind", "架空デモの明示が必要です。");
    text(paper.title, path + ".title"); text(paper.summary, path + ".summary");
    strings(paper.tags, path + ".tags"); strings(paper.readingOrder, path + ".readingOrder");
    identifier(paper.rootConceptId, path + ".rootConceptId");
  });
  concepts.forEach((concept, index) => {
    const path = "concepts." + index;
    if (!record(concept, path, ["id", "paperId", "parentId", "title", "explanation", "terms", "source"])) return;
    identifier(concept.id, path + ".id"); identifier(concept.paperId, path + ".paperId");
    if (concept.parentId !== null) identifier(concept.parentId, path + ".parentId");
    text(concept.title, path + ".title"); text(concept.explanation, path + ".explanation");
    if (list(concept.terms, path + ".terms", 100)) concept.terms.forEach((term, index) => {
      const termPath = path + ".terms." + index;
      if (!record(term, termPath, ["term", "meaning"])) return;
      text(term.term, termPath + ".term"); text(term.meaning, termPath + ".meaning");
    });
    if (record(concept.source, path + ".source", ["kind", "section", "text"])) {
      if (concept.source.kind !== "fictional-demo") issue(path + ".source.kind", "原典も架空デモであることを明示してください。");
      text(concept.source.section, path + ".source.section"); text(concept.source.text, path + ".source.text");
    }
  });
  links.forEach((link, index) => {
    const path = "links." + index;
    const common = ["id", "fromPaperId", "toPaperId", "kind"];
    if (!isRecord(link)) { issue(path, "オブジェクトが必要です。"); return; }
    const citation = link.kind === "citation";
    record(link, path, [...common, ...(citation ? ["authenticity", "evidence"] : ["rationale"])]);
    identifier(link.id, path + ".id");
    identifier(link.fromPaperId, path + ".fromPaperId"); identifier(link.toPaperId, path + ".toPaperId");
    if (citation) {
      if (link.authenticity !== "fictional-demo") issue(path + ".authenticity", "実際の引用として扱えません。");
      if (record(link.evidence, path + ".evidence", ["sourceConceptId", "excerpt"])) {
        identifier(link.evidence.sourceConceptId, path + ".evidence.sourceConceptId");
        text(link.evidence.excerpt, path + ".evidence.excerpt");
      }
    } else if (link.kind === "editorial") text(link.rationale, path + ".rationale");
    else issue(path + ".kind", "citationとeditorialを区別してください。");
  });
  if (issues.length > 0) return issues;

  const dataset = input as unknown as DemoDataset;
  const unique = <T extends { readonly id: string }>(entries: readonly T[], path: string): Map<string, T> => {
    const map = new Map<string, T>();
    for (const entry of entries) {
      if (map.has(entry.id)) issue(path + "." + entry.id, "IDが重複しています。");
      map.set(entry.id, entry);
    }
    return map;
  };
  const paperMap = unique(dataset.papers, "papers");
  const conceptMap = unique(dataset.concepts, "concepts");
  unique(dataset.links, "links");
  for (const paper of dataset.papers) {
    const root = conceptMap.get(paper.rootConceptId);
    if (!root || root.paperId !== paper.id || root.parentId !== null) issue(paper.id, "同じ論文のルート概念が必要です。");
    for (const id of paper.readingOrder) {
      if (conceptMap.get(id)?.paperId !== paper.id) issue(paper.id + ".readingOrder", "読む順序に別論文または不明な概念があります。");
    }
  }
  for (const concept of dataset.concepts) {
    const paper = paperMap.get(concept.paperId);
    if (!paper) issue(concept.id, "論文が存在しません。");
    const visited = new Set<string>();
    let cursor: Concept | undefined = concept;
    while (cursor) {
      if (visited.has(cursor.id)) { issue(concept.id, "概念の親子関係に循環があります。"); break; }
      visited.add(cursor.id);
      if (cursor.parentId === null) {
        if (paper?.rootConceptId !== cursor.id) issue(concept.id, "論文のルートへ接続していません。");
        break;
      }
      const parent: Concept | undefined = conceptMap.get(cursor.parentId);
      if (!parent || parent.paperId !== concept.paperId) { issue(concept.id, "親は同じ論文の既存概念である必要があります。"); break; }
      cursor = parent;
    }
  }
  for (const link of dataset.links) {
    if (!paperMap.has(link.fromPaperId) || !paperMap.has(link.toPaperId)) issue(link.id, "リンク先またはリンク元の論文がありません。");
    if (link.fromPaperId === link.toPaperId) issue(link.id, "論文間リンクは別の論文へ接続します。");
    if (link.kind === "citation") {
      const source = conceptMap.get(link.evidence.sourceConceptId);
      if (source?.paperId !== link.fromPaperId || !source.source.text.includes(link.evidence.excerpt)) {
        issue(link.id, "引用元の概念とデモ原典内の抜粋を一致させてください。");
      }
    }
  }
  return issues;
}
