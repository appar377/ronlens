import type { Catalog } from "./catalog.js";
import { deepFreeze, isRecord } from "./model.js";
import { MAX_READER_ENTRIES } from "./reader.js";
import type { ReaderEntry } from "./reader.js";
import { parseSearchQuery, searchKey } from "./search.js";
import type { SearchQuery } from "./search.js";
import { createWorkspace, MAX_SAVED_SEARCHES } from "./workspace.js";
import type { WorkspaceState } from "./workspace.js";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
type DecodeResult =
  | { readonly status: "ready" | "recovered"; readonly state: WorkspaceState; readonly warnings: readonly string[] }
  | { readonly status: "invalid" | "unsupported-version" | "dataset-mismatch" };
export type LoadResult =
  | { readonly status: "empty" | "ready" | "recovered"; readonly state: WorkspaceState; readonly warnings: readonly string[] }
  | { readonly status: "invalid" | "unsupported-version" | "dataset-mismatch" | "storage-error"; readonly state: WorkspaceState; readonly warnings: readonly string[] };
export type WriteResult =
  | { readonly status: "saved" | "cleared" }
  | { readonly status: "load-required" | "invalid-state" | "conflict" | "blocked" | "storage-error" };

function hasOnlyKeys(input: unknown, keys: readonly string[]): input is Record<string, unknown> {
  return isRecord(input) && Object.keys(input).every(key => keys.includes(key));
}
function idList(input: unknown, max: number): input is string[] {
  return Array.isArray(input) && input.length <= max && [...input].every(id => typeof id === "string" && id.length > 0 && id.length <= 80);
}

export function decodeWorkspace(catalog: Catalog, input: unknown): DecodeResult {
  if (!isRecord(input)) return { status: "invalid" };
  if (input.schemaVersion !== 1) return { status: "unsupported-version" };
  if (input.datasetId !== catalog.dataset.id) return { status: "dataset-mismatch" };
  if (!hasOnlyKeys(input, ["schemaVersion", "datasetId", "reader", "savedPaperIds", "savedSearches", "search"])) return { status: "invalid" };
  const search = parseSearchQuery(input.search);
  if (!search || !idList(input.savedPaperIds, 500)) return { status: "invalid" };
  if (!Array.isArray(input.savedSearches) || input.savedSearches.length > MAX_SAVED_SEARCHES) return { status: "invalid" };
  const savedSearches: SearchQuery[] = [];
  for (const saved of input.savedSearches) {
    const parsed = parseSearchQuery(saved);
    if (!parsed) return { status: "invalid" };
    if (!savedSearches.some(query => searchKey(query) === searchKey(parsed))) savedSearches.push(parsed);
  }
  if (!hasOnlyKeys(input.reader, ["entries", "cursor"])) return { status: "invalid" };
  const reader = input.reader;
  if (!Array.isArray(reader.entries) || reader.entries.length > MAX_READER_ENTRIES || !Number.isInteger(reader.cursor)) return { status: "invalid" };
  const cursor = reader.cursor as number;
  if (reader.entries.length === 0 ? cursor !== -1 : cursor < 0 || cursor >= reader.entries.length) return { status: "invalid" };
  const entries: ReaderEntry[] = [];
  const originalIndices: number[] = [];
  const warnings: string[] = [];
  for (const [index, raw] of reader.entries.entries()) {
    if (!hasOnlyKeys(raw, ["paperId", "selectedConceptId", "expandedConceptIds"]) ||
        typeof raw.paperId !== "string" || typeof raw.selectedConceptId !== "string" ||
        !idList(raw.expandedConceptIds, 5_000)) return { status: "invalid" };
    const paper = catalog.paper(raw.paperId);
    if (!paper) { warnings.push("removed-paper:" + raw.paperId); continue; }
    const selected = catalog.concept(raw.selectedConceptId);
    const selectedConceptId = selected?.paperId === paper.id ? selected.id : paper.rootConceptId;
    if (selectedConceptId !== raw.selectedConceptId) warnings.push("reset-selection:" + paper.id);
    const expanded = new Set(raw.expandedConceptIds.filter(id =>
      catalog.concept(id)?.paperId === paper.id && catalog.children(id).length > 0));
    for (const ancestor of catalog.ancestors(selectedConceptId)) expanded.add(ancestor.id);
    const expandedConceptIds = [...expanded];
    if (JSON.stringify(expandedConceptIds) !== JSON.stringify(raw.expandedConceptIds)) warnings.push("repaired-expansion:" + paper.id);
    entries.push({ paperId: paper.id, selectedConceptId, expandedConceptIds });
    originalIndices.push(index);
  }
  let restoredCursor = -1;
  if (entries.length > 0) {
    restoredCursor = 0;
    originalIndices.forEach((originalIndex, index) => {
      if (originalIndex <= cursor) restoredCursor = index;
    });
  }
  const savedPaperIds = [...new Set(input.savedPaperIds.filter(id => catalog.paper(id)))];
  if (JSON.stringify(savedPaperIds) !== JSON.stringify(input.savedPaperIds)) warnings.push("repaired-saved-papers");
  if (JSON.stringify(savedSearches) !== JSON.stringify(input.savedSearches)) warnings.push("normalized-saved-searches");
  if (JSON.stringify(search) !== JSON.stringify(input.search)) warnings.push("normalized-search");
  return deepFreeze({
    status: warnings.length ? "recovered" : "ready",
    state: {
      schemaVersion: 1, datasetId: catalog.dataset.id,
      reader: { entries, cursor: restoredCursor }, savedPaperIds, savedSearches, search,
    },
    warnings,
  });
}

/**
 * UI-independent localStorage adapter. load() must precede writes.
 * Invalid/future data remains untouched until an explicit clear().
 * Compare-before-write detects intervening changes; localStorage is not transactional.
 */
export class LocalWorkspaceStore {
  readonly key: string;
  private observedRaw: string | null | undefined;
  private blocked = false;

  constructor(private readonly catalog: Catalog, private readonly storage: StorageAdapter) {
    this.key = "ronlens:workspace:v1:" + catalog.dataset.id;
  }

  load(): LoadResult {
    const fallback = createWorkspace(this.catalog);
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
      this.observedRaw = raw;
    } catch {
      this.observedRaw = undefined;
      return { status: "storage-error", state: fallback, warnings: [] };
    }
    if (raw === null) {
      this.blocked = false;
      return { status: "empty", state: fallback, warnings: [] };
    }
    let result: DecodeResult;
    try {
      result = raw.length > 2_000_000 ? { status: "invalid" } : decodeWorkspace(this.catalog, JSON.parse(raw));
    } catch { result = { status: "invalid" }; }
    this.blocked = result.status !== "ready" && result.status !== "recovered";
    if ("state" in result) return result;
    return { ...result, state: fallback, warnings: [] };
  }

  save(state: WorkspaceState): WriteResult {
    if (this.observedRaw === undefined) return { status: "load-required" };
    if (this.blocked) return { status: "blocked" };
    const decoded = decodeWorkspace(this.catalog, state);
    if (!("state" in decoded) || decoded.status !== "ready") return { status: "invalid-state" };
    const raw = JSON.stringify(decoded.state);
    if (raw.length > 2_000_000) return { status: "invalid-state" };
    try {
      if (this.storage.getItem(this.key) !== this.observedRaw) return { status: "conflict" };
      this.storage.setItem(this.key, raw);
      if (this.storage.getItem(this.key) !== raw) {
        this.observedRaw = undefined;
        return { status: "storage-error" };
      }
      this.observedRaw = raw;
      return { status: "saved" };
    } catch {
      // The write may or may not have happened; reload before deciding whether to retry.
      this.observedRaw = undefined;
      return { status: "storage-error" };
    }
  }

  clear(): WriteResult {
    if (this.observedRaw === undefined) return { status: "load-required" };
    try {
      if (this.storage.getItem(this.key) !== this.observedRaw) return { status: "conflict" };
      this.storage.removeItem(this.key);
      if (this.storage.getItem(this.key) !== null) {
        this.observedRaw = undefined;
        return { status: "storage-error" };
      }
      this.observedRaw = null;
      this.blocked = false;
      return { status: "cleared" };
    } catch {
      this.observedRaw = undefined;
      return { status: "storage-error" };
    }
  }
}
