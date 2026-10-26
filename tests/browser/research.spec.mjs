import {test,expect} from '@playwright/test';
const article='/articles/retrieval-practice-versus-rereading';
const node=(page,id)=>page.locator('.research-tree [data-research-concept="'+id+'"]');
test('real explainer is discoverable separately from fictional demos on home, library, and saved search',async({page})=>{
 await page.goto('/');await expect(page.locator('.research-card')).toHaveCount(4);await expect(page.locator('.paper-card')).toHaveCount(3);
 await page.getByRole('searchbox').fill('想起練習');await page.getByRole('searchbox').press('Enter');await expect(page.locator('.research-card')).toBeVisible();await expect(page.locator('.paper-card')).toHaveCount(0);await expect(page.locator('#empty-state')).toBeHidden();
 await page.locator('#save-search').click();await page.goto('/saved?tab=searches');await page.locator('[data-apply-query]').click();await expect(page.getByRole('searchbox')).toHaveValue('想起練習');await expect(page.locator('.research-card')).toBeVisible();
 await page.locator('.research-card .primary-button').click();await expect(page).toHaveURL(article);await expect(page.locator('.research-header h1')).toContainText('読み返すより');await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://ronlens.vercel.app'+article);await expect(page.locator('#research-structured-data')).toHaveCount(1);await page.locator('.research-header .back-link').click();await expect(page.locator('#research-structured-data')).toHaveCount(0);
 await page.goto('/library');await page.locator('input[value="学習・記憶"]').check();await expect(page.locator('.research-card')).toHaveCount(3);await expect(page.locator('.library-card')).toHaveCount(0);
 await page.goto('/help');await expect(page.locator('#demo')).toContainText('原論文著者による記事ではありません');await expect(page.locator('.site-footer')).toContainText('実論文に基づく解説と、架空デモ');
});
test('article preserves supplied table, limitations, provenance, and external source links',async({page})=>{
 const response=await page.goto(article);expect(response.status()).toBe(200);
 await expect(page.locator('.research-table tbody tr')).toHaveText(['5分81%75%','2日54%68%','1週間42%56%']);
 await expect(page.locator('#delay-method')).toContainText('大学生120人');await expect(page.locator('#delay-result')).toContainText('同じ人を3回追跡した数字ではありません');
 await expect(page.locator('#concept-mapping')).toContainText('大学生80人を4条件');await expect(page.locator('#limitations')).toContainText('最新研究を代表するものでもなく');await expect(page.locator('#practice')).toContainText('検証したわけではありません');
 await expect(page.locator('#references')).toContainText('原論文の図版や本文は転載していません');
 const links=await page.locator('#references a').evaluateAll(nodes=>nodes.map(n=>({href:n.href,target:n.target,rel:n.rel})));
 expect(links.filter(l=>l.href.startsWith('https://doi.org/')).map(l=>l.href)).toEqual(['https://doi.org/10.1111/j.1467-9280.2006.01693.x','https://doi.org/10.1126/science.1199327']);
 expect(links.filter(l=>l.href.endsWith('.pdf'))).toHaveLength(2);expect(links.filter(l=>l.href.startsWith('https:')).every(l=>l.target==='_blank'&&l.rel.includes('noopener'))).toBe(true);
});
test('concept branches, repeated clicks, back/forward, save/history and reload retain the reading position',async({page})=>{
 await page.goto(article);await node(page,'delayed-test').click();await expect(page.locator('.research-concept-detail h3')).toContainText('遅延テスト');
 for(let i=0;i<4;i++)await page.locator('[data-research-expand]').click();await expect(node(page,'free-recall')).toBeVisible();
 await node(page,'free-recall').click();await page.locator('[data-research-save]').click();
 await page.locator('.research-toc a[data-route]').click();await expect(page.locator('#research-citations')).toBeInViewport();await page.goBack();await expect(node(page,'free-recall')).toHaveAttribute('aria-pressed','true');await expect(node(page,'free-recall')).toBeFocused();
 await page.goForward();await page.goBack();await page.reload();await expect(node(page,'free-recall')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-research-save]')).toHaveAttribute('aria-pressed','true');
 await page.goto('/saved');await expect(page.locator('.research-card')).toHaveCount(1);await expect(page.locator('.empty-state')).toHaveCount(0);
 await page.getByRole('link',{name:/閲覧履歴/}).click();await page.locator('.research-card .primary-button').click();await expect(node(page,'free-recall')).toHaveAttribute('aria-pressed','true');
 await page.goto('/?view=saved');await expect(page.locator('.research-card')).toHaveCount(1);await page.locator('[data-research-save]').click();await expect(page.locator('#empty-state')).toBeVisible();await page.reload();await expect(page.locator('.research-card')).toHaveCount(0);
});
test('verified citation is directed from 2011 to 2006; demo and editorial networks stay explicit',async({page})=>{
 await page.goto('/network#research-citations');await expect(page.locator('.verified-citation-chain article')).toHaveCount(2);
 await expect(page.locator('.verified-citation-chain article').first()).toContainText('2011');await expect(page.locator('.verified-citation-chain article').last()).toContainText('2006');
 await expect(page.locator('#research-citations')).toContainText('参考文献8');await expect(page.locator('.network-legend')).toContainText('架空原稿');await expect(page.locator('.network-legend')).toContainText('編集上の関連');
 await page.locator('#research-citations .primary-button').click();await expect(page).toHaveURL(article);
});
test('unavailable/corrupt storage stays usable and reports persistence limits',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('ronlens.research-reader.v1','{broken'));
 await page.goto(article);await node(page,'concept-map').click();await page.locator('[data-research-save]').click();await expect(page.locator('.research-status')).toContainText('上書きしていません');expect(await page.evaluate(()=>localStorage.getItem('ronlens.research-reader.v1'))).toBe('{broken');
});
test('unknown article and concept routes recover through 404',async({page})=>{
 const response=await page.goto('/articles/missing');expect(response.status()).toBe(404);await expect(page.locator('#page-heading')).toContainText('見つかりません');
 await page.goto(article+'?concept=missing');await expect(page.locator('#page-heading')).toContainText('見つかりません');
 await page.locator('.not-found .primary-button').click();await expect(page.locator('.research-card')).toHaveCount(4);
});
for(const width of [292,390,768,1126])test(`research pages and table reflow at ${width}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:844});
 for(const path of [article,'/library','/network']){await page.goto(path);await expect(page.locator('body')).toHaveAttribute('data-ready','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true)}
 await page.goto(article);const table=page.locator('.research-table-wrap');await table.scrollIntoViewIfNeeded();const bounds=await table.boundingBox();expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);await expect(page.locator('.research-minimap')).toBeVisible();expect(errors).toEqual([]);
});
test('static article remains readable without JavaScript with accurate article metadata',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try{const response=await page.goto('http://127.0.0.1:4184'+article);expect(response.status()).toBe(200);await expect(page.locator('h1')).toContainText('思い出す練習');await expect(page.locator('#limitations')).toContainText('大学生による文章学習');await expect(page.locator('#references a[href$=".pdf"]')).toHaveCount(2);await expect(page.locator('[data-research-save]')).toBeDisabled();
 expect(await page.title()).toContain('読み返すより');expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://ronlens.vercel.app'+article);
 const metadata=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());expect(metadata.author.name).toBe('RONLENS');expect(metadata.citation).toHaveLength(2);expect(metadata.datePublished).toBe('2026-10-25');
 }finally{await context.close()}
});
test('mobile glossary selection brings the selected concept and its explanation into view',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(article);
 await page.locator('.research-glossary [data-research-concept="delayed-test"]').click();
 await expect(node(page,'delayed-test')).toBeFocused();await expect(node(page,'delayed-test')).toBeInViewport();await expect(page.locator('.research-concept-detail h3')).toBeInViewport();
});
test('title ordering includes the real explainer alongside demos in library and home',async({page})=>{
 for(const path of ['/library?sort=title','/?sort=title']){
 await page.goto(path);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const cards=path.startsWith('/library')?'.library-results>article h2':'#paper-grid>article h2';
 const titles=await page.locator(cards).allTextContents();expect(titles).toHaveLength(7);expect(titles).toEqual([...titles].sort((a,b)=>a.localeCompare(b,'ja')));
 }
});
