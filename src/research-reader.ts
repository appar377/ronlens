import { retrievalArticle } from './retrieval-article.js';
import type { SearchQuery } from './search.js';

export const RESEARCH_STORAGE_KEY = 'ronlens.research-reader.v1';
export const ARTICLE_PATH = '/articles/' + retrievalArticle.slug;
export interface ResearchView { readonly selected: string; readonly expanded: readonly string[] }
export interface ResearchState { readonly version: 1; readonly saved: boolean; readonly visited: boolean; readonly view: ResearchView }
export function initialResearchState(article = retrievalArticle): ResearchState {
  const root = article.concepts.find(c => c.parentId === null)!;
  return { version: 1, saved: false, visited: false, view: { selected: root.id, expanded: article.concepts.filter(c => article.concepts.some(child => child.parentId === c.id)).map(c => c.id) } };
}
function ancestors(id: string, article: typeof retrievalArticle): string[] {
  const result: string[] = []; let parent = article.concepts.find(c => c.id === id)?.parentId;
  while (parent && !result.includes(parent)) { result.push(parent); parent = article.concepts.find(c => c.id === parent)?.parentId; }
  return result;
}
export function validResearchView(value: unknown, article = retrievalArticle): value is ResearchView {
  if (!value || typeof value !== 'object') return false;
  const view = value as Partial<ResearchView>;
  const root = article.concepts.find(c => c.parentId === null)!;
  return typeof view.selected === 'string' && article.concepts.some(c => c.id === view.selected) && Array.isArray(view.expanded) && view.expanded.length <= article.concepts.length && new Set(view.expanded).size === view.expanded.length && view.expanded.every(id => typeof id === 'string' && article.concepts.some(child => child.parentId === id)) && view.expanded.includes(root.id) && ancestors(view.selected, article).every(id => view.expanded!.includes(id));
}
export function selectResearchConcept(view: ResearchView, id: string, article = retrievalArticle): ResearchView {
  if (!article.concepts.some(c => c.id === id)) return view;
  return { selected: id, expanded: [...new Set([...view.expanded, ...ancestors(id, article)])] };
}
export function toggleResearchBranch(view: ResearchView, id = 'retrieval-practice', article = retrievalArticle): ResearchView {
  if (!article.concepts.some(c => c.id === id && c.parentId !== null) || !article.concepts.some(c => c.parentId === id)) return view;
  const open = view.expanded.includes(id);
  return { selected: open && ancestors(view.selected, article).includes(id) ? id : view.selected, expanded: open ? view.expanded.filter(branch => branch !== id) : [...view.expanded, id] };
}
export function articleUrl(view?: ResearchView, article = retrievalArticle): string { return '/articles/' + article.slug + (view ? '?concept=' + encodeURIComponent(view.selected) : ''); }
export function researchMatches(query: SearchQuery, article = retrievalArticle): boolean {
  const normalize = (s: string): string => s.normalize('NFKC').toLowerCase();
  const searchable = normalize([article.title, article.summary, article.category, ...article.tags, ...article.papers.flatMap(p => [p.title, p.doi ?? '', ...p.authors]), ...article.sections.flatMap(s => [s.title, ...s.paragraphs])].join(' '));
  return normalize(query.text).split(/\s+/).filter(Boolean).every(word => searchable.includes(word)) && query.tags.every(tag => article.tags.some(own => normalize(own) === normalize(tag)));
}
export function researchStorageKey(article = retrievalArticle): string {
  return article.slug === retrievalArticle.slug ? RESEARCH_STORAGE_KEY : RESEARCH_STORAGE_KEY + ':' + article.slug;
}

/** Separate from fictional-paper storage; invalid or concurrently modified values are never overwritten. */
export class ResearchReaderStore {
  state: ResearchState;
  private readonly key: string;
  notice = '';
  private baseline: string | null = null;
  private blocked = false;
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | undefined, readonly article = retrievalArticle) {
    this.state = initialResearchState(article); this.key = researchStorageKey(article);
    try {
      if (!storage) throw new Error('unavailable');
      this.baseline = storage.getItem(this.key);
      if (this.baseline === null) return;
      const value: unknown = JSON.parse(this.baseline);
      if (!value || typeof value !== 'object') throw new Error('invalid');
      const item = value as Partial<ResearchState>;
      if (item.version !== 1 || typeof item.saved !== 'boolean' || typeof item.visited !== 'boolean' || !validResearchView(item.view, this.article)) throw new Error('invalid');
      this.state = { version: 1, saved: item.saved, visited: item.visited, view: { selected: item.view.selected, expanded: [...item.view.expanded] } };
    } catch { this.blocked = true; this.notice = '解説記事の保存内容を読み込めません。元の内容は保持し、この画面内で操作できます。'; }
  }
  update(change: Partial<Pick<ResearchState, 'saved' | 'visited' | 'view'>>): void {
    if (change.view && !validResearchView(change.view, this.article)) return;
    this.state = { ...this.state, ...change };
    if (this.blocked || !this.storage) { this.notice = '解説記事の変更は、この画面内だけで保持しています。元の保存内容は上書きしていません。'; return; }
    try {
      if (this.storage.getItem(this.key) !== this.baseline) { this.blocked = true; this.notice = '別のタブで解説記事の保存内容が変わりました。上書きせず、この画面内に保持しています。再読み込みして確認してください。'; return; }
      const next = JSON.stringify(this.state); this.storage.setItem(this.key, next);
      if (this.storage.getItem(this.key) !== next) { this.blocked = true; this.notice = '解説記事の保存を確認できませんでした。この画面内だけで保持しています。'; return; }
      this.baseline = next; this.notice = '';
    } catch { this.blocked = true; this.notice = '解説記事の変更をブラウザに保存できませんでした。この画面内だけで保持しています。'; }
  }
}
