import { retrievalArticle } from '../retrieval-article.js';
import type { ResearchExplainerContent } from '../research-article.js';
import { articleUrl } from '../research-reader.js';
export const canonicalFor = (article: ResearchExplainerContent): string => 'https://ronlens.vercel.app' + articleUrl(undefined, article);
export const metadataFor = (article: ResearchExplainerContent) => ({
  '@context': 'https://schema.org', '@type': 'Article', headline: article.title,
  description: article.summary, datePublished: article.publishedDate,
  inLanguage: 'ja', mainEntityOfPage: canonicalFor(article),
  author: { '@type': 'Organization', name: 'RONLENS' },
  citation: article.papers.map(p => ({ '@type': 'ScholarlyArticle', name: p.title, url: p.primaryUrl, datePublished: p.record?.firstPublished ?? String(p.year), author: p.authors.map(name => ({ '@type': 'Person', name })) })),
});
export const articleCanonical = canonicalFor(retrievalArticle);
export const articleMetadata = metadataFor(retrievalArticle);
/** Keep the head truthful when routing between articles and other pages. */
export function syncArticleMetadata(article: ResearchExplainerContent | undefined): void {
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = article?.summary ?? '論文を、日本語の図解とことばで。実論文に基づく解説と、概念マップで操作を試せる架空デモ。';
  document.querySelector('#research-canonical')?.remove();
  document.querySelector('#research-structured-data')?.remove();
  if (!article) return;
  const canonical = document.createElement('link'); canonical.id = 'research-canonical'; canonical.rel = 'canonical'; canonical.href = canonicalFor(article);
  const structured = document.createElement('script'); structured.id = 'research-structured-data'; structured.type = 'application/ld+json'; structured.textContent = JSON.stringify(metadataFor(article));
  document.head.append(canonical, structured);
}
