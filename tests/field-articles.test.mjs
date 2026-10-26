import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedExplainers, explainerAtPath } from '../dist/research-catalog.js';
import { inspectArticleDraft } from '../dist/research-article.js';
import { ResearchReaderStore, researchMatches, researchStorageKey, selectResearchConcept } from '../dist/research-reader.js';
import { researchPage } from '../dist/web/research-view.js';
import { metadataFor } from '../dist/web/research-metadata.js';
const categories=['医療・健康','心理学','経済','自然科学','環境'];
const fields=publishedExplainers.filter(e=>categories.includes(e.article.category));
test('five distinct fields have full-text source records, scoped integrity checks, original concept maps and separated interpretations',()=>{
 assert.equal(fields.length,5);assert.equal(new Set(fields.map(e=>e.article.category)).size,5);assert.equal(publishedExplainers.length,9);
 for(const {article,tables,glossary} of fields){
  assert.ok(article.papers.length>=1);const paper=article.papers[0];
  assert.equal(paper.inspectedMaterial,'full-text');assert.equal(paper.publicationType,'journal-article');assert.equal(paper.record.peerReview,'peer-reviewed');assert.ok(paper.doi&&paper.fullTextUrl);assert.ok(paper.record.version&&paper.record.revisionNote&&paper.record.integrityNote&&paper.record.integritySources.length);
  assert.equal(paper.record.checkedOn,'2026-10-26');assert.equal(article.publishedDate,'2026-10-26');assert.ok(article.tags.includes(article.category));
  assert.ok(article.sections.some(s=>s.role==='interpretation'&&s.interpretationBy==='study-authors'));assert.ok(article.sections.some(s=>s.role==='interpretation'&&s.interpretationBy!=='study-authors'));
  assert.ok(glossary.every(g=>article.concepts.some(c=>c.id===g.id)));assert.ok(tables.length&&tables.every(t=>t.rows.every(row=>row.length===t.columns.length)));
  const draft={schemaVersion:1,kind:'research-explainer',status:'draft',slotId:'fields',topicHint:article.category,content:article,sourceReview:{reviewedOn:'2026-10-26',reviewerLabel:'独立出典QA',paperIds:article.papers.map(p=>p.id),sectionIds:article.sections.map(s=>s.id),notes:'一次全文と原稿を照合。原データ再解析ではない。'}};
  const result=inspectArticleDraft(draft);assert.equal(result.status,'ready-for-editorial-check',article.slug+': '+result.issues.join(';'));
 }
});
test('each field is discoverable by category and DOI and preserves its own reading state alongside all existing articles',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 for(const item of publishedExplainers){const article=item.article;const store=new ResearchReaderStore(storage,article);const leaf=article.concepts.at(-1);store.update({saved:true,visited:true,view:selectResearchConcept(store.state.view,leaf.id,article)});assert.equal(explainerAtPath('/articles/'+article.slug),item)}
 assert.equal(new Set(publishedExplainers.map(e=>researchStorageKey(e.article))).size,9);
 for(const {article} of fields){assert.equal(researchMatches({text:article.papers[0].doi,tags:[article.category],sort:'relevance'},article),true);const restored=new ResearchReaderStore(storage,article);assert.equal(restored.state.saved,true);assert.equal(restored.state.view.selected,article.concepts.at(-1).id)}
});
test('journal records do not inherit arXiv labels and collective authors remain organizations in metadata',()=>{
 for(const item of fields){const store=new ResearchReaderStore(undefined,item.article);const markup=researchPage(store.state,item);assert.ok(!markup.includes('arXiv提出日'));assert.ok(!markup.includes('著者研究室公開の全文PDF'));assert.ok(markup.includes('訂正・撤回・追研究の確認'));assert.ok(markup.includes('著者の解釈と、その限界'));assert.ok(markup.includes('RONLENSからの提案・解釈'));
 const meta=metadataFor(item.article);assert.equal(meta.author.name,'RONLENS');assert.equal(meta.citation[0].author[0]['@type'],item.article.papers[0].collectiveAuthors?'Organization':'Person');}
});
