import { retrievalArticle as article, verifiedCitation, articleDisclosure } from '../retrieval-article.js';
import { publishedExplainers, retrievalExplainer, type ResearchTable } from '../research-catalog.js';
import type { ResearchPaperReference } from '../research-article.js';
import { articleUrl, type ResearchState } from '../research-reader.js';
import { escapeHtml as esc } from './diagrams.js';
import { icon } from './icons.js';
const route = (url: string, text: string, css = ''): string => `<a data-route href="${esc(url)}" class="${css}">${text}</a>`;
const external = (url: string, text: string): string => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} <span aria-label="別タブで開く">↗</span></a>`;
const badge = '<span class="research-tag">実論文に基づく解説</span>';
const paragraphs = (texts: readonly string[]): string => texts.map(text => `<p>${esc(text)}</p>`).join('');
function statusLabel(paper: ResearchPaperReference): string {
  return paper.publicationType === 'preprint' ? 'プレプリント · 査読済み未確認' : '査読付き学術誌の論文';
}
export function researchBookmark(state: ResearchState, content = article): string {
  return `<button class="bookmark-button" data-research-save="${content.slug}" aria-pressed="${state.saved}" aria-label="解説記事${state.saved ? 'の保存を解除' : 'を保存'}">${icon('bookmark')}</button>`;
}
export function researchCard(state: ResearchState, resume = false, item = retrievalExplainer): string {
  const content = item.article;
  const art = item.cardSteps.map((step, i) => `${i ? '<i>→</i>' : ''}<${i === 1 ? 'strong' : 'span'}>${esc(step).replaceAll('\n', '<br>')}</${i === 1 ? 'strong' : 'span'}>`).join('');
  return `<article class="research-card" data-article="${content.slug}"><div class="research-card-art" aria-hidden="true">${art}</div><div><p class="result-eyebrow">${badge} <span>${esc(content.category)}</span></p><h2>${route(articleUrl(resume ? state.view : undefined, content), esc(content.title))}</h2><p>${esc(content.summary)}</p><p class="research-meta"><time datetime="${content.publishedDate}">${content.publishedDate}</time> · 約${content.readingMinutes}分 · 原論文${content.papers.length}本</p>${content.papers.some(p => p.publicationType === 'preprint') ? '<p class="preprint-label">プレプリントの解説 · 査読済み未確認</p>' : ''}<div class="result-actions">${researchBookmark(state, content)}${route(articleUrl(resume ? state.view : undefined, content), resume ? 'この位置から読む →' : '論文解説を読む →', 'primary-button')}</div></div></article>`;
}
function resultTable(table: ResearchTable): string {
  const numeric = (cell: string): string => /^[+−-]?\d+(?:[./]\d+)*(?:%)?$/.test(cell) ? ' class="numeric"' : '';
  return `<div class="research-table-wrap" tabindex="0" role="region" aria-label="${esc(table.label)}"><table class="research-table ${table.columns.length > 3 ? 'wide-result-table' : ''}"><caption>${table.columns.length > 3 ? '狭い画面では表を横にスクロールできます。' : ''}${esc(table.caption)}</caption><thead><tr>${table.columns.map(col => `<th scope="col"${numeric(col)}>${esc(col)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map((cell, i) => i ? `<td${numeric(cell)}>${esc(cell)}</td>` : `<th scope="row">${esc(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function sourceRecord(p: ResearchPaperReference): string {
  if (!p.record) return `<p>${statusLabel(p)}</p>`;
  const r = p.record;
  return `<dl class="source-record"><div><dt>初回公開記録（arXiv提出日）</dt><dd><time datetime="${r.firstPublished}">${r.firstPublished}</time></dd></div><div><dt>確認した版・改訂</dt><dd>${r.version} · ${r.revisedOn ? '改訂日 ' + r.revisedOn : '改訂版の登録なし'}</dd></div><div><dt>査読状況</dt><dd>${statusLabel(p)}</dd></div><div><dt>原文確認</dt><dd>${r.checkedOn} · 本文全文・参考文献${p.id === 'arxiv-2610-32883' ? '・付録A〜C' : ''}</dd></div></dl>`;
}
export function researchPage(state: ResearchState, item = retrievalExplainer): string {
  const content = item.article;
  const concept = content.concepts.find(c => c.id === state.view.selected)!;
  const root = content.concepts.find(c => c.parentId === null)!;
  const selectedSection = content.sections.find(s => s.id === concept.sectionId)!;
  const term = item.glossary.find(t => t.id === concept.id);
  const button = (id: string, css = ''): string => `<button class="${css}" data-research-concept="${id}" aria-pressed="${id === concept.id}">${esc(content.concepts.find(c => c.id === id)?.label ?? '')}</button>`;
  const branch = (id: string): string => {
    const node = content.concepts.find(c => c.id === id)!;
    const children = content.concepts.filter(c => c.parentId === id);
    const open = state.view.expanded.includes(id);
    return `<div><div class="research-branch-head">${button(id, 'research-node')}${children.length ? `<button class="branch-toggle" data-research-expand="${id}" aria-expanded="${open}" aria-label="${esc(node.label)}の枝を${open ? '閉じる' : '開く'}">${open ? '−' : '＋'}</button>` : ''}</div>${children.length ? open ? `<div class="research-leaves">${children.map(c => branch(c.id)).join('')}</div>` : `<p class="collapsed-hint">${children.length}つの用語を開く</p>` : ''}</div>`;
  };
  const sourceLinks = (id: string): string => content.sections.find(s => s.id === id)!.evidence.map(ref => {
    const p = content.papers.find(p => p.id === ref.paperId)!;
    return `<span>${external(ref.url ?? p.primaryUrl, '原論文 ' + p.year)} · ${esc(ref.locator)}</span>`;
  }).join('<br>');
  const sectionMarkup = content.sections.map(section => {
    const steps = item.steps?.sectionId === section.id ? item.steps.items : null;
    const body = steps ? paragraphs(section.paragraphs.slice(0, 1)) + '<ol class="practice-steps">' + steps.map(step => `<li>${esc(step)}</li>`).join('') + '</ol>' + paragraphs(section.paragraphs.slice(1)) : paragraphs(section.paragraphs);
    const roleLabel = section.role === 'interpretation' ? (section.id === 'burden' ? '著者の解釈と、その限界' : 'RONLENSからの提案・解釈') : '';
    return `<section id="${section.id}" class="article-section ${section.role === 'limitation' ? 'research-limitations' : ''}">${roleLabel ? `<p class="section-role">${roleLabel}</p>` : ''}${section.id !== 'introduction' && section.id !== 'delay-result' ? `<h2>${esc(section.title)}</h2>` : ''}${body}${item.tables.filter(t => t.sectionId === section.id).map(resultTable).join('')}${section.id !== 'delay-method' && section.evidence.length ? `<p class="research-source-link">${sourceLinks(section.id)}</p>` : ''}</section>`;
  }).join('');
  return `<article class="research-page" data-article="${content.slug}"><header class="research-header">${route('/library', '← 論文・解説の一覧へ', 'back-link')}<p class="research-kicker">${badge} ${esc(content.category)} / 論文解説</p><h1 id="page-heading" tabindex="-1">${esc(content.title)}</h1><p class="research-meta">解説：${esc(content.authorship.siteByline)} · <time datetime="${content.publishedDate}">${content.publishedDate}</time> · 約${content.readingMinutes}分 ${researchBookmark(state, content)}</p><p class="evidence-scope">対象範囲：${esc(content.evidenceScope)}</p>${content.papers.some(p => p.publicationType === 'preprint') ? `<p class="preprint-notice">プレプリントの解説です。2026-10-26時点で査読済みの掲載を確認できていません。以下は確認したv1の報告で、今後改訂される可能性があります。</p>` : ''}<p class="authorship-note">${esc(content.authorship.productionDisclosure)}</p></header>
  <section class="research-map" aria-labelledby="research-map-heading"><div class="research-map-heading"><div><p class="eyebrow">CONCEPT MAP</p><h2 id="research-map-heading">用語から、本文へ。</h2></div><small>この記事を読むための編集上の整理</small></div><div class="concept-context"><span>親：${concept.parentId ? button(concept.parentId) : '記事全体'}</span><span>同じ階層：${content.concepts.filter(c => c.parentId === concept.parentId).map(c => button(c.id)).join('')}</span></div>
  <div class="research-map-body"><div class="research-tree"><div class="research-tree-root">${button(root.id, 'research-node')}</div><div class="research-branches">${content.concepts.filter(c => c.parentId === root.id).map(c => branch(c.id)).join('')}</div></div><nav class="research-minimap" aria-label="記事の全体ミニマップ"><b>全体図・読む順序</b><ol>${content.readingOrder.map(id => `<li>${button(id)}</li>`).join('')}</ol></nav></div>
  <div class="research-concept-detail" aria-live="polite"><h3>${esc(concept.label)}${term?.english ? ` <small>${esc(term.english)}</small>` : ''}</h3><p>${esc(term?.meaning ?? content.centralQuestion)}</p><a href="#${concept.sectionId}">本文「${esc(selectedSection.title)}」へ ↓</a><p class="research-source-link">${sourceLinks(concept.sectionId) || 'この記事の導入です。研究結果と条件は下の本文・原論文で確認できます。'}</p></div></section>
  <div class="research-reading-layout"><nav class="research-toc" aria-label="記事の目次"><h2>この記事で読むこと</h2>${content.sections.filter(s => s.id !== 'delay-result').map(s => `<a href="#${s.id}">${esc(s.title)}</a>`).join('')}<a href="#glossary">用語</a><a href="#references">原論文</a>${route('/network#research-citations', '論文どうしの引用関係 →')}</nav><div class="research-prose">${sectionMarkup}
  <section id="glossary" class="article-section"><h2>用語</h2><dl class="research-glossary">${item.glossary.map(t => `<dt>${button(t.id)}${t.english ? '（' + esc(t.english) + '）' : ''}</dt><dd>${esc(t.meaning)}</dd>`).join('')}</dl></section>
  <section id="references" class="article-section research-references"><h2>原論文</h2><p>以下は研究の著者・書誌情報です。上の日本語解説の執筆者とは異なります。</p><ol>${content.papers.map(p => `<li id="${p.id}"><p>${esc(p.authors.join(', '))} (${p.year}). <cite>${esc(p.title)}</cite>. ${esc(p.venue)}.</p>${sourceRecord(p)}<p>${external(p.primaryUrl, p.publicationType === 'preprint' ? 'arXiv書誌・版の履歴' : 'DOI: ' + p.doi)} · ${p.fullTextUrl ? external(p.fullTextUrl, p.publicationType === 'preprint' ? '確認した原文全文（v1）' : '著者研究室公開の全文PDF') : ''}</p>${p.publicationType === 'preprint' && p.doi ? `<p>識別子：${esc(p.doi)}（リンク先の版は上記で固定）</p>` : ''}</li>`).join('')}</ol><p>${esc(content.slug === article.slug ? articleDisclosure : '本記事は実在する研究報告をもとにした日本語の解説です。図と表はRONLENSが独自に整理し、原論文の図版・本文・PDFは転載していません。')}</p>${route('/network#research-citations', '確認済みの引用関係を見る →')}</section>
  <section class="article-section related-explainers"><h2>あわせて読む</h2><p>テーマから編集で選んだ解説です。リンク自体は原論文間の引用を意味しません。</p>${publishedExplainers.filter(e => e.article.slug !== content.slug).map(e => route(articleUrl(undefined, e.article), esc(e.article.title))).join('')}</section></div></div></article>`;
}
export function researchNetwork(): string {
  const materials = publishedExplainers.find(e => e.article.slug === 'expert-verified-ai-study-materials')!.article;
  return `<section class="research-citation-network" id="research-citations"><p class="eyebrow">VERIFIED CITATION</p><h2>実論文どうしの引用関係</h2><p>2011年の論文は、参考文献8で2006年の論文を引用しています。矢印は「引用する論文 → 引用される論文」です。</p><div class="verified-citation-chain">${[article.papers[1]!, article.papers[0]!].map((p, i) => `${i ? '<span class="verified-arrow" aria-label="引用する">→</span>' : ''}<article><span>${p.year} · 実論文</span><h3>${esc(p.title)}</h3><p>${esc(p.authors.join(', '))}</p>${external(p.primaryUrl, '原論文 DOI')}</article>`).join('')}</div><p>${external(verifiedCitation.sourceUrl + '#page=5', '引用記述を確認：' + verifiedCitation.locator)}</p><p>これは原論文に記載された引用関係です。この記事の用語マップや、デモ内の編集上の関連とは区別しています。</p>${route(articleUrl(), 'この2本を日本語の解説で読む →', 'primary-button')}<div class="additional-citation"><h3>2026年の教材研究 → 2006年の記憶研究</h3><p>Dang &amp; Nguyen（2026）は、§4.4でRoediger &amp; Karpicke（2006）を引用しています。教材の効果を説明し得る別の仕組みとして論じており、今回の教材がその仕組みで効いたと確定したものではありません。</p><p>${external(materials.papers[0]!.fullTextUrl! + '#page=13', '原文§4.4（p. 13）で引用を確認')} · ${route(articleUrl(undefined, materials), '教材研究の解説を読む →')}</p></div><div class="editorial-research-links"><h3>AIと学び・情報を読み比べる</h3><p>以下はテーマから選んだ編集上の関連です。3本のあいだに引用関係があるという表示ではありません。</p>${publishedExplainers.filter(e => e.article.publishedDate === '2026-10-26').map(e => route(articleUrl(undefined, e.article), esc(e.article.title))).join('')}</div></section>`;
}
