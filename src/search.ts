import type { Catalog } from "./catalog.js";
import { deepFreeze, isRecord } from "./model.js";
import type { Paper } from "./model.js";

export interface SearchQuery {
  readonly text: string;
  readonly tags: readonly string[];
  readonly sort: "relevance" | "title";
}
export const EMPTY_QUERY: SearchQuery = deepFreeze({ text: "", tags: [], sort: "relevance" });
export function normalizeText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja").trim().replace(/\s+/gu, " ");
}

export function parseSearchQuery(input: unknown): SearchQuery | undefined {
  if (!isRecord(input) || Object.keys(input).some(key => !["text", "tags", "sort"].includes(key))) return undefined;
  if (typeof input.text !== "string" || input.text.length > 500) return undefined;
  if (!Array.isArray(input.tags) || input.tags.length > 30 || ![...input.tags].every(tag => typeof tag === "string" && tag.trim().length > 0 && tag.length <= 100)) return undefined;
  if (input.sort !== "relevance" && input.sort !== "title") return undefined;
  const text = normalizeText(input.text);
  const tags = [...new Set((input.tags as string[]).map(normalizeText))].sort();
  if (text.length > 500 || tags.some(tag => tag.length === 0 || tag.length > 100)) return undefined;
  return deepFreeze({
    text,
    tags,
    sort: input.sort,
  });
}

export function searchKey(query: SearchQuery): string {
  return JSON.stringify(query);
}

export interface SearchHit {
  readonly paper: Paper;
  readonly matchedConceptIds: readonly string[];
  readonly score: number;
}
export type SearchResult =
  | { readonly status: "invalid-query"; readonly hits: readonly []; readonly total: 0 }
  | {
      readonly status: "ready" | "empty-catalog" | "no-matches";
      readonly query: SearchQuery;
      readonly hits: readonly SearchHit[];
      readonly total: number;
      readonly availableTags: readonly string[];
    };

export function searchPapers(catalog: Catalog, input: unknown = EMPTY_QUERY): SearchResult {
  const query = parseSearchQuery(input);
  if (!query) return { status: "invalid-query", hits: [], total: 0 };
  const terms = query.text.split(" ").filter(Boolean);
  const hits: SearchHit[] = [];
  for (const paper of catalog.dataset.papers) {
    if (!query.tags.every(tag => paper.tags.some(value => normalizeText(value) === tag))) continue;
    const title = normalizeText(paper.title);
    const summary = normalizeText(paper.summary);
    const tags = normalizeText(paper.tags.join(" "));
    const concepts = catalog.concepts(paper.id).map(concept => ({
      concept,
      text: normalizeText([concept.title, concept.explanation, ...concept.terms.flatMap(term => [term.term, term.meaning])].join(" ")),
    }));
    const corpus = [title, summary, tags, ...concepts.map(concept => concept.text)].join(" ");
    if (!terms.every(term => corpus.includes(term))) continue;
    hits.push({
      paper,
      matchedConceptIds: terms.length ? concepts.filter(concept => terms.some(term => concept.text.includes(term))).map(concept => concept.concept.id) : [],
      score: terms.reduce((score, term) => score + (title.includes(term) ? 8 : 0) + (tags.includes(term) ? 4 : 0) + (summary.includes(term) ? 2 : 0) + (concepts.some(concept => concept.text.includes(term)) ? 1 : 0), 0),
    });
  }
  const byTitle = (a: SearchHit, b: SearchHit): number => a.paper.title.localeCompare(b.paper.title, "ja") || a.paper.id.localeCompare(b.paper.id);
  hits.sort((a, b) => query.sort === "title" ? byTitle(a, b) : b.score - a.score || byTitle(a, b));
  return deepFreeze({
    status: catalog.dataset.papers.length === 0 ? "empty-catalog" : hits.length === 0 ? "no-matches" : "ready",
    query, hits, total: hits.length,
    availableTags: [...new Set(catalog.dataset.papers.flatMap(paper => paper.tags))].sort((a, b) => a.localeCompare(b, "ja")),
  });
}
