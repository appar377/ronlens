import { retrievalArticle } from './retrieval-article.js';
import type { SearchQuery } from './search.js';

export const RESEARCH_STORAGE_KEY = 'ronlens.research-reader.v1';
export const ARTICLE_PATH = '/articles/' + retrievalArticle.slug;
export interface ResearchView { readonly selected: string; readonly expanded: readonly string[] }
export interface ResearchState { readonly version: 1; readonly saved: boolean; readonly visited: boolean; readonly view: ResearchView }
const initial = (): ResearchState => ({ version: 1, saved: false, visited: false, view: { selected: 'learning', expanded: ['learning', 'retrieval-practice'] } });
export function validResearchView(value: unknown): value is ResearchView {
  if (!value || typeof value !== 'object') return false;
  const view = value as Partial<ResearchView>;
  return typeof view.selected === 'string' && retrievalArticle.concepts.some(c => c.id === view.selected) && Array.isArray(view.expanded) && view.expanded.length <= retrievalArticle.concepts.length && new Set(view.expanded).size === view.expanded.length && view.expanded.every(id => typeof id === 'string' && retrievalArticle.concepts.some(c => c.id === id && retrievalArticle.concepts.some(child => child.parentId === id))) && view.expanded.includes('learning') && (view.selected !== 'free-recall' && view.selected !== 'delayed-test' || view.expanded.includes('retrieval-practice'));
}
export function selectResearchConcept(view: ResearchView, id: string): ResearchView {
  const concept = retrievalArticle.concepts.find(c => c.id === id); if (!concept) return view;
  const expanded = new Set(view.expanded); let parent = concept.parentId;
  while (parent) { expanded.add(parent); parent = retrievalArticle.concepts.find(c => c.id === parent)?.parentId ?? null; }
  return { selected: id, expanded: [...expanded] };
}
export function toggleResearchBranch(view: ResearchView): ResearchView {
  const expanded = view.expanded.includes('retrieval-practice');
  return { selected: expanded && ['free-recall', 'delayed-test'].includes(view.selected) ? 'retrieval-practice' : view.selected, expanded: expanded ? ['learning'] : ['learning', 'retrieval-practice'] };
}
export function articleUrl(view?: ResearchView): string { return ARTICLE_PATH + (view ? '?concept=' + encodeURIComponent(view.selected) : ''); }
export function researchMatches(query: SearchQuery): boolean {
  const normalize = (s: string): string => s.normalize('NFKC').toLowerCase();
  const searchable = normalize([retrievalArticle.title, retrievalArticle.summary, ...retrievalArticle.tags, ...retrievalArticle.papers.flatMap(p => [p.title, ...p.authors]), ...retrievalArticle.sections.flatMap(s => [s.title, ...s.paragraphs])].join(' '));
  return normalize(query.text).split(/\s+/).filter(Boolean).every(word => searchable.includes(word)) && query.tags.every(tag => retrievalArticle.tags.some(own => normalize(own) === normalize(tag)));
}

/** Separate from fictional-paper storage; invalid or concurrently modified values are never overwritten. */
export class ResearchReaderStore {
  state: ResearchState = initial();
  notice = '';
  private baseline: string | null = null;
  private blocked = false;
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | undefined) {
    try {
      if (!storage) throw new Error('unavailable');
      this.baseline = storage.getItem(RESEARCH_STORAGE_KEY);
      if (this.baseline === null) return;
      const value: unknown = JSON.parse(this.baseline);
      if (!value || typeof value !== 'object') throw new Error('invalid');
      const item = value as Partial<ResearchState>;
      if (item.version !== 1 || typeof item.saved !== 'boolean' || typeof item.visited !== 'boolean' || !validResearchView(item.view)) throw new Error('invalid');
      this.state = { version: 1, saved: item.saved, visited: item.visited, view: { selected: item.view.selected, expanded: [...item.view.expanded] } };
    } catch { this.blocked = true; this.notice = '解説記事の保存内容を読み込めません。元の内容は保持し、この画面内で操作できます。'; }
  }
  update(change: Partial<Pick<ResearchState, 'saved' | 'visited' | 'view'>>): void {
    if (change.view && !validResearchView(change.view)) return;
    this.state = { ...this.state, ...change };
    if (this.blocked || !this.storage) { this.notice = '解説記事の変更は、この画面内だけで保持しています。元の保存内容は上書きしていません。'; return; }
    try {
      if (this.storage.getItem(RESEARCH_STORAGE_KEY) !== this.baseline) { this.blocked = true; this.notice = '別のタブで解説記事の保存内容が変わりました。上書きせず、この画面内に保持しています。再読み込みして確認してください。'; return; }
      const next = JSON.stringify(this.state); this.storage.setItem(RESEARCH_STORAGE_KEY, next);
      if (this.storage.getItem(RESEARCH_STORAGE_KEY) !== next) { this.blocked = true; this.notice = '解説記事の保存を確認できませんでした。この画面内だけで保持しています。'; return; }
      this.baseline = next; this.notice = '';
    } catch { this.blocked = true; this.notice = '解説記事の変更をブラウザに保存できませんでした。この画面内だけで保持しています。'; }
  }
}
