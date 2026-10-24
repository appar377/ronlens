import type { Catalog } from "./catalog.js";
import { deepFreeze } from "./model.js";
import type { Paper } from "./model.js";
import { emptyReader, transitionReader } from "./reader.js";
import type { ReaderAction, ReaderState } from "./reader.js";
import { EMPTY_QUERY, parseSearchQuery, searchKey } from "./search.js";
import type { SearchQuery } from "./search.js";

export const MAX_SAVED_SEARCHES = 100;
export interface WorkspaceState {
  readonly schemaVersion: 1;
  readonly datasetId: string;
  readonly reader: ReaderState;
  readonly savedPaperIds: readonly string[];
  readonly savedSearches: readonly SearchQuery[];
  readonly search: SearchQuery;
}
export type WorkspaceAction =
  | { readonly type: "reader"; readonly action: ReaderAction }
  | { readonly type: "set-paper-saved"; readonly paperId: string; readonly saved: boolean }
  | { readonly type: "set-search"; readonly query: SearchQuery }
  | { readonly type: "save-search"; readonly query: SearchQuery }
  | { readonly type: "remove-search"; readonly query: SearchQuery };
export interface WorkspaceTransition {
  readonly status: "changed" | "unchanged" | "not-found" | "not-available" | "invalid-query" | "limit-reached";
  readonly state: WorkspaceState;
}
export function createWorkspace(catalog: Catalog): WorkspaceState {
  return deepFreeze({
    schemaVersion: 1, datasetId: catalog.dataset.id,
    reader: emptyReader(), savedPaperIds: [], savedSearches: [], search: EMPTY_QUERY,
  });
}

export function transitionWorkspace(catalog: Catalog, state: WorkspaceState, action: WorkspaceAction): WorkspaceTransition {
  const unchanged = (status: WorkspaceTransition["status"]): WorkspaceTransition => ({ status, state });
  if (state.datasetId !== catalog.dataset.id) return unchanged("not-available");
  switch (action.type) {
    case "reader": {
      const transition = transitionReader(catalog, state.reader, action.action);
      if (transition.status !== "changed") return unchanged(transition.status);
      return { status: "changed", state: deepFreeze({ ...state, reader: transition.state }) };
    }
    case "set-paper-saved": {
      if (!catalog.paper(action.paperId)) return unchanged("not-found");
      const exists = state.savedPaperIds.includes(action.paperId);
      if (exists === action.saved) return unchanged("unchanged");
      const savedPaperIds = action.saved
        ? [...state.savedPaperIds, action.paperId]
        : state.savedPaperIds.filter(id => id !== action.paperId);
      return { status: "changed", state: deepFreeze({ ...state, savedPaperIds }) };
    }
    case "set-search":
    case "save-search":
    case "remove-search": {
      const query = parseSearchQuery(action.query);
      if (!query) return unchanged("invalid-query");
      const key = searchKey(query);
      if (action.type === "set-search") {
        if (searchKey(state.search) === key) return unchanged("unchanged");
        return { status: "changed", state: deepFreeze({ ...state, search: query }) };
      }
      const exists = state.savedSearches.some(saved => searchKey(saved) === key);
      if (action.type === "save-search") {
        if (exists) return unchanged("unchanged");
        if (state.savedSearches.length >= MAX_SAVED_SEARCHES) return unchanged("limit-reached");
        return { status: "changed", state: deepFreeze({ ...state, savedSearches: [...state.savedSearches, query] }) };
      }
      if (!exists) return unchanged("unchanged");
      return { status: "changed", state: deepFreeze({ ...state, savedSearches: state.savedSearches.filter(saved => searchKey(saved) !== key) }) };
    }
  }
}

export type PaperCollection = { readonly status: "empty" | "ready"; readonly papers: readonly Paper[] };

export function savedPapers(catalog: Catalog, state: WorkspaceState): PaperCollection {
  const papers = state.savedPaperIds.flatMap(id => {
    const paper = catalog.paper(id); return paper ? [paper] : [];
  });
  return deepFreeze({ status: papers.length ? "ready" : "empty", papers });
}

export function readingHistory(state: WorkspaceState): {
  readonly status: "empty" | "ready";
  readonly entries: readonly { readonly paperId: string; readonly selectedConceptId: string; readonly active: boolean }[];
} {
  return deepFreeze({
    status: state.reader.entries.length ? "ready" : "empty",
    entries: state.reader.entries.map((entry, index) => ({
      paperId: entry.paperId, selectedConceptId: entry.selectedConceptId, active: index === state.reader.cursor,
    })),
  });
}
