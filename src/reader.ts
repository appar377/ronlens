import type { Catalog } from "./catalog.js";
import { deepFreeze } from "./model.js";
import type { Concept, Paper } from "./model.js";

export const MAX_READER_ENTRIES = 100;

export interface ReaderEntry {
  readonly paperId: string;
  readonly selectedConceptId: string;
  readonly expandedConceptIds: readonly string[];
}
export interface ReaderState {
  readonly entries: readonly ReaderEntry[];
  readonly cursor: number;
}
export type ReaderAction =
  | { readonly type: "open-paper"; readonly paperId: string; readonly conceptId?: string }
  | { readonly type: "select-concept"; readonly conceptId: string }
  | { readonly type: "set-expanded"; readonly conceptId: string; readonly expanded: boolean }
  | { readonly type: "follow-link"; readonly linkId: string }
  | { readonly type: "back" }
  | { readonly type: "forward" };

export type ReaderTransition = {
  readonly status: "changed" | "unchanged" | "not-found" | "not-available";
  readonly state: ReaderState;
};

export function emptyReader(): ReaderState {
  return deepFreeze({ entries: [], cursor: -1 });
}

export function currentEntry(state: ReaderState): ReaderEntry | undefined {
  return state.entries[state.cursor];
}

function revealConcept(catalog: Catalog, entry: ReaderEntry, conceptId: string): ReaderEntry {
  return {
    ...entry,
    selectedConceptId: conceptId,
    expandedConceptIds: [...new Set([...entry.expandedConceptIds, ...catalog.ancestors(conceptId).map(node => node.id)])],
  };
}

function replaceCurrent(state: ReaderState, entry: ReaderEntry): ReaderTransition {
  if (JSON.stringify(currentEntry(state)) === JSON.stringify(entry)) return { status: "unchanged", state };
  const entries = state.entries.map((old, index) => index === state.cursor ? entry : old);
  return { status: "changed", state: deepFreeze({ ...state, entries }) };
}

export function transitionReader(catalog: Catalog, state: ReaderState, action: ReaderAction): ReaderTransition {
  const current = currentEntry(state);
  const same = (status: ReaderTransition["status"]): ReaderTransition => ({ status, state });
  switch (action.type) {
    case "open-paper": {
      const paper = catalog.paper(action.paperId);
      if (!paper) return same("not-found");
      if (action.conceptId !== undefined && catalog.concept(action.conceptId)?.paperId !== paper.id) return same("not-found");
      if (current?.paperId === paper.id) {
        return action.conceptId !== undefined
          ? replaceCurrent(state, revealConcept(catalog, current, action.conceptId))
          : same("unchanged");
      }
      const previous = [...state.entries].reverse().find(entry => entry.paperId === paper.id);
      const base: ReaderEntry = previous ?? {
        paperId: paper.id, selectedConceptId: paper.rootConceptId,
        expandedConceptIds: catalog.children(paper.rootConceptId).length ? [paper.rootConceptId] : [],
      };
      const entry = action.conceptId !== undefined ? revealConcept(catalog, base, action.conceptId) : base;
      const entries = [...state.entries.slice(0, state.cursor + 1), entry].slice(-MAX_READER_ENTRIES);
      return { status: "changed", state: deepFreeze({ entries, cursor: entries.length - 1 }) };
    }
    case "select-concept": {
      if (!current) return same("not-available");
      if (catalog.concept(action.conceptId)?.paperId !== current.paperId) return same("not-found");
      return replaceCurrent(state, revealConcept(catalog, current, action.conceptId));
    }
    case "set-expanded": {
      if (!current) return same("not-available");
      if (catalog.concept(action.conceptId)?.paperId !== current.paperId) return same("not-found");
      if (catalog.children(action.conceptId).length === 0) return same("unchanged");
      const expanded = new Set(current.expandedConceptIds);
      if (action.expanded) {
        expanded.add(action.conceptId);
        for (const ancestor of catalog.ancestors(action.conceptId)) expanded.add(ancestor.id);
      } else expanded.delete(action.conceptId);
      const hidesSelection = !action.expanded && catalog.ancestors(current.selectedConceptId).some(node => node.id === action.conceptId);
      return replaceCurrent(state, {
        ...current,
        expandedConceptIds: [...expanded],
        selectedConceptId: hidesSelection ? action.conceptId : current.selectedConceptId,
      });
    }
    case "follow-link": {
      if (!current) return same("not-available");
      const link = catalog.link(action.linkId);
      if (!link) return same("not-found");
      if (link.fromPaperId === current.paperId) {
        return transitionReader(catalog, state, { type: "open-paper", paperId: link.toPaperId });
      }
      if (link.kind === "editorial" && link.toPaperId === current.paperId) {
        return transitionReader(catalog, state, { type: "open-paper", paperId: link.fromPaperId });
      }
      return same("not-available");
    }
    case "back":
      if (state.cursor <= 0) return same("unchanged");
      return { status: "changed", state: deepFreeze({ ...state, cursor: state.cursor - 1 }) };
    case "forward":
      if (state.cursor >= state.entries.length - 1) return same("unchanged");
      return { status: "changed", state: deepFreeze({ ...state, cursor: state.cursor + 1 }) };
  }
}

export interface MapNode {
  readonly concept: Concept;
  readonly depth: number;
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly visible: boolean;
}
export type ReaderContext =
  | { readonly status: "empty" }
  | {
      readonly status: "ready";
      readonly paper: Paper;
      readonly selected: Concept;
      readonly parent: Concept | null;
      readonly siblings: readonly Concept[];
      readonly overview: readonly MapNode[];
      readonly visibleNodes: readonly MapNode[];
      readonly canGoBack: boolean;
      readonly canGoForward: boolean;
    };

export function readerContext(catalog: Catalog, state: ReaderState): ReaderContext {
  const entry = currentEntry(state);
  if (!entry) return { status: "empty" };
  const paper = catalog.paper(entry.paperId);
  const selected = catalog.concept(entry.selectedConceptId);
  if (!paper || !selected) return { status: "empty" };
  const expanded = new Set(entry.expandedConceptIds);
  const overview: MapNode[] = [];
  const stack = [{ id: paper.rootConceptId, depth: 0, visible: true }];
  while (stack.length > 0) {
    const next = stack.pop();
    if (!next) break;
    const concept = catalog.concept(next.id);
    if (!concept) continue;
    overview.push({ concept, depth: next.depth, visible: next.visible, expanded: expanded.has(concept.id), selected: concept.id === selected.id });
    for (const child of [...catalog.children(concept.id)].reverse()) {
      stack.push({ id: child.id, depth: next.depth + 1, visible: next.visible && expanded.has(concept.id) });
    }
  }
  return deepFreeze({
    status: "ready", paper, selected,
    parent: selected.parentId ? catalog.concept(selected.parentId) ?? null : null,
    siblings: selected.parentId ? catalog.children(selected.parentId) : [selected],
    overview, visibleNodes: overview.filter(node => node.visible),
    canGoBack: state.cursor > 0, canGoForward: state.cursor < state.entries.length - 1,
  });
}
