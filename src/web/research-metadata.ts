import { retrievalArticle } from '../retrieval-article.js';
import { ARTICLE_PATH } from '../research-reader.js';
export const articleCanonical = 'https://ronlens.vercel.app' + ARTICLE_PATH;
export const articleMetadata = {
  '@context': 'https://schema.org', '@type': 'Article', headline: retrievalArticle.title,
  description: retrievalArticle.summary, datePublished: retrievalArticle.publishedDate,
  inLanguage: 'ja', mainEntityOfPage: articleCanonical,
  author: { '@type': 'Organization', name: 'RONLENS' },
  citation: retrievalArticle.papers.map(paper => ({ '@type': 'ScholarlyArticle', name: paper.title, url: paper.primaryUrl, datePublished: String(paper.year), author: paper.authors.map(name => ({ '@type': 'Person', name })) })),
};
/** Keep the head truthful when in-page routing enters or leaves the explainer. */
export function syncArticleMetadata(active: boolean): void {
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = active ? retrievalArticle.summary : '論文を、日本語の図解とことばで。実論文に基づく解説と、概念マップで操作を試せる架空デモ。';
  document.querySelector('#research-canonical')?.remove();
  document.querySelector('#research-structured-data')?.remove();
  if (!active) return;
  const canonical = document.createElement('link'); canonical.id = 'research-canonical'; canonical.rel = 'canonical'; canonical.href = articleCanonical;
  const structured = document.createElement('script'); structured.id = 'research-structured-data'; structured.type = 'application/ld+json'; structured.textContent = JSON.stringify(articleMetadata);
  document.head.append(canonical, structured);
}
