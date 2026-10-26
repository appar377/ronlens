import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedExplainers, explainerAtPath } from '../dist/research-catalog.js';
import { ResearchReaderStore, researchStorageKey, selectResearchConcept, toggleResearchBranch, validResearchView, researchMatches } from '../dist/research-reader.js';
import { inspectArticleDraft } from '../dist/research-article.js';
const recent = publishedExplainers.filter(e => e.article.publishedDate === '2026-10-26');
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) }; };
test('three individually reviewed October preprints retain methods, findings, limitations, dated versions, source mapping and separate site interpretation', () => {
 assert.equal(recent.length, 3); assert.equal(publishedExplainers.length, 4);
 const dates = ['2026-10-23', '2026-10-22', '2026-10-05'];
 recent.forEach(({article}, i) => {
  const paper = article.papers[0]; assert.equal(paper.publicationType,'preprint');assert.equal(paper.inspectedMaterial,'full-text');assert.equal(paper.record.firstPublished,dates[i]);assert.equal(paper.record.revisedOn,null);assert.equal(paper.record.peerReview,'not-confirmed');assert.equal(paper.record.version,'v1');
  assert.ok(article.sections.some(s=>s.role==='interpretation'&&s.paragraphs.some(p=>p.includes('記事側の提案'))));
  for(const s of article.sections.filter(s=>['method','finding','limitation'].includes(s.role))) assert.ok(s.evidence.length&&s.evidence.every(e=>e.url.startsWith(paper.fullTextUrl)));
  const result=inspectArticleDraft({schemaVersion:1,kind:'research-explainer',status:'draft',slotId:'recent',topicHint:'AI',content:article,sourceReview:{reviewedOn:'2026-10-26',reviewerLabel:'独立出典QA（AI）',paperIds:article.papers.map(p=>p.id),sectionIds:article.sections.map(s=>s.id),notes:'全文と原稿を独立照合済み。原データ再解析は行っていない。'}});assert.equal(result.status,'ready-for-editorial-check',result.issues.join('\n'));
 });
});
test('article-local state cannot leak across articles and legacy storage remains readable',()=>{
 const local=memory();const legacy=new ResearchReaderStore(local);legacy.update({saved:true,view:selectResearchConcept(legacy.state.view,'free-recall')});
 for(const {article} of recent){const s=new ResearchReaderStore(local,article);const child=article.concepts.find(c=>c.parentId&&article.concepts.find(p=>p.id===c.parentId)?.parentId);s.update({saved:true,visited:true,view:selectResearchConcept(s.state.view,child.id,article)});const collapsed=toggleResearchBranch(s.state.view,child.parentId,article);assert.equal(collapsed.selected,child.parentId);assert.equal(validResearchView(collapsed,article),true);assert.equal(validResearchView(collapsed),false);s.update({view:collapsed});assert.equal(new ResearchReaderStore(local,article).state.view.selected,child.parentId);}
 assert.equal(new Set(publishedExplainers.map(e=>researchStorageKey(e.article))).size,4);
 assert.equal(new ResearchReaderStore(local).state.view.selected,'free-recall');assert.equal(new ResearchReaderStore(local).state.saved,true);
 const bad=recent[0].article;local.setItem(researchStorageKey(bad),'{broken');const blocked=new ResearchReaderStore(local,bad);blocked.update({saved:true});assert.equal(local.getItem(researchStorageKey(bad)),'{broken');assert.equal(new ResearchReaderStore(local,recent[1].article).notice,'');
});
test('new originals are found by author or Japanese term, routes never admit drafts/unknown slugs',()=>{
 const query=text=>({text,tags:[],sort:'relevance'});
 assert.equal(researchMatches(query('Ｗａｒｒｅｎ 信頼度'),recent[0].article),true);
 assert.equal(researchMatches(query('GELLI 日本語'),recent[1].article),true);
 assert.equal(researchMatches(query('Dang 差の差'),recent[2].article),true);
 assert.equal(explainerAtPath('/articles/missing'),undefined);assert.equal(explainerAtPath('/articles/%zz'),undefined);assert.equal(explainerAtPath('/content/drafts/learning-memory-first'),undefined);
 for(const item of publishedExplainers)assert.equal(explainerAtPath('/articles/'+item.article.slug+'/'),item);
});
