import test from 'node:test';
import assert from 'node:assert/strict';
import { retrievalArticle, retrievalResults, verifiedCitation, sourceReview, articleDisclosure } from '../dist/retrieval-article.js';
import { inspectArticleDraft } from '../dist/research-article.js';
import { ResearchReaderStore, RESEARCH_STORAGE_KEY, selectResearchConcept, toggleResearchBranch, validResearchView, researchMatches } from '../dist/research-reader.js';
const draft = {schemaVersion:1,kind:'research-explainer',status:'draft',slotId:'first-research-explainer',topicHint:'学習・記憶',content:retrievalArticle,sourceReview};
const memory = () => {const items=new Map();return {getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),items};};
test('source-reviewed article has distinct site authorship, primary records, limitations, and evidence mapping',()=>{
 assert.equal(inspectArticleDraft(draft).status,'ready-for-editorial-check');
 assert.equal(retrievalArticle.authorship.distinction,'site-authored-explainer-not-original-paper');
 assert.equal(retrievalArticle.papers.length,2);assert.ok(retrievalArticle.papers.every(p=>p.inspectedMaterial==='full-text'&&p.primaryUrl==='https://doi.org/'+p.doi));
 assert.match(retrievalArticle.sections.find(s=>s.id==='limitations').paragraphs.join(''),/最新研究を代表するものでもなく/);
 assert.match(retrievalArticle.sections.find(s=>s.id==='practice').paragraphs.join(''),/検証したわけではありません/);
 assert.match(articleDisclosure,/論文の著者による記事ではありません/);
});
test('reported numbers retain separate delay groups and verified citation direction',()=>{
 assert.deepEqual(retrievalResults,[{delay:'5分',rereading:81,retrieval:75},{delay:'2日',rereading:54,retrieval:68},{delay:'1週間',rereading:42,retrieval:56}]);
 assert.match(retrievalArticle.sections.find(s=>s.id==='delay-method').paragraphs.join(''),/大学生120人/);
 assert.match(retrievalArticle.sections.find(s=>s.id==='delay-result').paragraphs.join(''),/同じ人を3回追跡した数字ではありません/);
 assert.equal(verifiedCitation.fromPaperId,'karpicke-blunt-2011');assert.equal(verifiedCitation.toPaperId,'roediger-karpicke-2006');assert.match(verifiedCitation.locator,/8/);
});
test('draft inspection refuses missing sources, incorrect concept parents, and absent review',()=>{
 assert.equal(inspectArticleDraft({...draft,content:null}).status,'needs-content');
 assert.equal(inspectArticleDraft({...draft,sourceReview:null}).status,'needs-source-review');
 assert.equal(inspectArticleDraft({...draft,content:{...retrievalArticle,papers:[]}}).status,'needs-corrections');
 assert.equal(inspectArticleDraft({...draft,content:{...retrievalArticle,concepts:retrievalArticle.concepts.map(c=>({...c,parentId:c.id}))}}).status,'needs-corrections');
});
test('search covers original authors, terminology, tags, and AND matching without mixing demo categories',()=>{
 const query=(text,tags=[])=>({text,tags,sort:'relevance'});
 assert.equal(researchMatches(query('Ｋａｒｐｉｃｋｅ 想起')),true);
 assert.equal(researchMatches(query('自由再生',['学習・記憶'])),true);
 assert.equal(researchMatches(query('想起',['AI'])),false);
 assert.equal(researchMatches(query('想起 ない語xyz')),false);
});
test('concept selection reveals ancestors, collapse moves hidden selection to parent, invalid views rejected',()=>{
 const selected=selectResearchConcept({selected:'learning',expanded:['learning']},'delayed-test');
 assert.ok(selected.expanded.includes('retrieval-practice'));assert.equal(validResearchView(selected),true);
 const collapsed=toggleResearchBranch(selected);assert.equal(collapsed.selected,'retrieval-practice');assert.deepEqual(collapsed.expanded,['learning']);
 assert.equal(validResearchView({...collapsed,selected:'free-recall'}),false);
 assert.equal(validResearchView({...selected,selected:'unknown'}),false);
 assert.equal(validResearchView({selected:'learning',expanded:['learning','learning']}),false);
});
test('article saved/history and concept state persist independently of existing demo storage',()=>{
 const local=memory();local.setItem('ronlens-demo','preserved');const store=new ResearchReaderStore(local);
 store.update({saved:true,visited:true,view:selectResearchConcept(store.state.view,'free-recall')});
 const restored=new ResearchReaderStore(local);assert.equal(restored.state.saved,true);assert.equal(restored.state.visited,true);assert.equal(restored.state.view.selected,'free-recall');assert.equal(local.getItem('ronlens-demo'),'preserved');
});
test('corrupt, future, concurrently changed, and silent failure storage never silently overwrite',()=>{
 for(const value of ['{broken',JSON.stringify({version:2}),JSON.stringify({version:1,saved:true,visited:true,view:{selected:'no',expanded:[]}})]) {
 const local=memory();local.setItem(RESEARCH_STORAGE_KEY,value);const store=new ResearchReaderStore(local);store.update({saved:true});assert.equal(local.getItem(RESEARCH_STORAGE_KEY),value);assert.ok(store.notice);
 }
 const local=memory();const first=new ResearchReaderStore(local),second=new ResearchReaderStore(local);first.update({saved:true});const saved=local.getItem(RESEARCH_STORAGE_KEY);second.update({visited:true});assert.equal(local.getItem(RESEARCH_STORAGE_KEY),saved);assert.match(second.notice,/別のタブ/);
 const silent=new ResearchReaderStore({getItem:()=>null,setItem:()=>{}});silent.update({saved:true});assert.match(silent.notice,/保存を確認できません/);
 const unavailable=new ResearchReaderStore(undefined);unavailable.update({saved:true});assert.equal(unavailable.state.saved,true);assert.ok(unavailable.notice);
});
