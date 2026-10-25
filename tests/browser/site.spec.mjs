import { test, expect } from '@playwright/test';
const a='/paper/demo-retrieval';
const select=(page,id)=>page.locator('.map-stage [data-concept="'+id+'"]');
test('reader reveals reference state, preserves hidden expansion, and restores across citation/browser history',async({page})=>{
 await page.goto(a); await expect(select(page,'retrieval-distance')).toHaveAttribute('aria-pressed','true');
 await expect(select(page,'retrieval-vector')).toBeVisible();
 await select(page,'retrieval-similarity').click();
 await page.locator('[data-expand="retrieval-search"]').click();
 await expect(select(page,'retrieval-distance')).toHaveCount(0);
 await expect(select(page,'retrieval-search')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-expand="retrieval-search"]').click();
 await expect(select(page,'retrieval-vector')).toBeVisible();
 await select(page,'retrieval-distance').click();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('ronlens')))).reader);
 await page.locator('.citation-link').click();
 await expect(page).toHaveURL(/demo-vectors\?concept=vectors-distance/);
 await page.goBack();
 await expect(select(page,'retrieval-distance')).toHaveAttribute('aria-pressed','true');
 await expect(select(page,'retrieval-vector')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('ronlens')))).reader)).toEqual(before);
 await page.goForward(); await expect(select(page,'vectors-distance')).toHaveAttribute('aria-pressed','true');
 await page.goBack(); await expect(select(page,'retrieval-distance')).toBeFocused(); await page.reload(); await expect(select(page,'retrieval-vector')).toBeVisible();
});
test('reader full map, keyboard focus, repeated toggles and reading guide',async({page})=>{
 await page.goto(a); await page.locator('[data-full-map]').click(); await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape'); await expect(page.locator('[data-full-map]')).toBeFocused();
 for(let n=0;n<6;n++)await page.locator('.map-stage [data-expand="retrieval-distance"]').click();
 await expect(select(page,'retrieval-vector')).toBeVisible();
 await page.locator('[data-full-map]').click(); await page.locator('[data-dialog-concept="retrieval-evidence"]').click();
 await expect(select(page,'retrieval-evidence')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.concept-explanation h2')).toHaveText('出典と照合');
 await page.locator('.reading-guide').click(); await expect(page.getByRole('heading',{name:'おすすめの読む順序'})).toBeVisible();
});
test('library searches, filters, saves, restores and clears actual results',async({page})=>{
 await page.goto('/library'); await expect(page.locator('.library-card')).toHaveCount(3);
 await page.getByRole('searchbox').fill('資料検索'); await page.getByRole('searchbox').press('Enter');
 await expect(page.locator('.library-card')).toHaveCount(1); await page.locator('[data-save-query]').click();
 await page.locator('.library-card [data-bookmark]').click();
 await page.goto('/saved'); await expect(page.locator('.library-card')).toHaveCount(1);
 await page.getByRole('link',{name:/保存した検索/}).click(); await page.locator('[data-apply-query]').click();
 await expect(page.getByRole('searchbox')).toHaveValue('資料検索'); await page.reload(); await expect(page.locator('.library-card')).toHaveCount(1);
 await page.locator('[data-clear-query]').click();
 await page.locator('input[value="ベクトル"]').check(); await expect(page.locator('.library-card h2')).toHaveText('意味の近さを測る');
 await page.locator('[data-remove-tag]').click(); await expect(page.locator('.library-card')).toHaveCount(3);
 await page.getByRole('searchbox').fill('存在しない検索');await page.getByRole('searchbox').press('Enter');
 await expect(page.getByRole('heading',{name:'一致する架空論文がありません'})).toBeVisible();
 await page.goto('/library?sort=title'); await expect(page.getByRole('searchbox')).toHaveValue('');await expect(page.locator('.library-card')).toHaveCount(3);
});
test('mobile filters and header close with Escape and restore focus',async({page})=>{
 await page.setViewportSize({width:390,height:844}); await page.goto('/library');
 await page.locator('[data-filters]').click(); await expect(page.locator('.filter-close')).toBeFocused();
 await page.locator('input[value="ベクトル"]').check(); await expect(page.locator('input[value="ベクトル"]')).toBeFocused();
 await page.locator('.filter-sidebar a').last().focus(); await page.keyboard.press('Tab'); await expect(page.locator('.filter-close')).toBeFocused();
 await page.keyboard.press('Escape'); await expect(page.locator('[data-filters]')).toBeFocused();
 await page.locator('[data-menu]').click(); await expect(page.locator('#main-nav a').first()).toBeFocused();
 await page.keyboard.press('Escape'); await expect(page.locator('[data-menu]')).toBeFocused();
});
test('network keeps two directed citations separate from editorial relationship and returns to reader',async({page})=>{
 await page.goto(a); await select(page,'retrieval-similarity').click();
 await page.locator('.explanation-bottom a').click();
 await expect(page.locator('.relation-panel')).toContainText('近さの計算');
 await page.locator('.relation-two').click(); await expect(page.locator('.relation-panel')).toContainText('根拠の確認');
 await page.locator('.relation-panel summary').click(); await expect(page.locator('.relation-panel blockquote')).toContainText('論文C');
 await page.locator('.relation-editorial').click(); await expect(page.locator('.relation-panel')).toContainText('本文に引用関係があるとは主張しません');
 await expect(page.locator('.relation-panel details')).toHaveCount(0);
 await page.locator('.network-top .back-link').click();await expect(select(page,'retrieval-similarity')).toHaveAttribute('aria-pressed','true');
});
test('saved history retains exact previous reader position and bookmark removal recovers focus',async({page})=>{
 await page.goto(a); await select(page,'retrieval-vector').click(); await page.goto('/paper/demo-vectors');
 await page.goto('/saved?tab=history'); await page.locator('[data-visit="0"]').click(); await expect(select(page,'retrieval-vector')).toHaveAttribute('aria-pressed','true');
 await page.locator('.reader-breadcrumb [data-bookmark]').click(); await page.goto('/saved'); await page.locator('[data-bookmark]').click();
 await expect(page.getByRole('heading',{name:'保存した論文はまだありません'})).toBeVisible(); await expect(page.locator('#page-heading')).toBeFocused();
});
test('404, malformed encoded route, invalid concepts and help recovery',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/missing','/paper/not-a-demo','/paper/%ZZ']) { const response=await page.goto(path);expect(response.status()).toBe(404);await expect(page.getByRole('heading',{name:'このページは見つかりませんでした'})).toBeVisible(); }
 await page.goto(a+'?concept=vectors-root'); await expect(page.getByRole('heading',{name:'このページは見つかりませんでした'})).toBeVisible();
 await page.goto('/help'); await expect(page.locator('.help-steps article')).toHaveCount(4); expect(errors).toEqual([]);
});
test('unavailable storage has truthful status and remains usable',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}}));
 await page.goto(a);await select(page,'retrieval-vector').click();await expect(page.locator('.app-status')).toContainText('保存できません');
 await expect(select(page,'retrieval-vector')).toHaveAttribute('aria-pressed','true');
});
for(const width of [292,320,390,700,701,768,900,901,1126,1440]) test(`all screens reflow without horizontal overflow at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/library',a,'/network','/saved','/help','/no-page']) {
  await page.goto(route); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
  const bounds=await page.locator('.brand,.header-actions').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right}}));expect(bounds[0].right,route).toBeLessThanOrEqual(bounds[1].left);
 }
 expect(errors).toEqual([]);
});
test('delayed modules expose a loading state and never a wrong-page search input', async({page})=>{
 let release; const gate=new Promise(resolve=>release=resolve);
 await page.route('**/dist/web/app.js',async route=>{await gate;await route.continue()});
 await page.goto('/library',{waitUntil:'commit'});await expect(page.getByRole('status')).toHaveText('ページを読み込んでいます…');await expect(page.getByRole('searchbox')).toHaveCount(0);
 release();await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.getByRole('searchbox').fill('資料検索');await page.getByRole('searchbox').press('Enter');await expect(page.locator('.library-card')).toHaveCount(1);
});
test('home search waits for its module, and module failure offers retry', async({page})=>{
 let release; const gate=new Promise(resolve=>release=resolve);
 await page.route('**/dist/web/home.js',async route=>{await gate;await route.continue()});
 await page.goto('/',{waitUntil:'commit'});await expect(page.getByRole('searchbox')).toBeDisabled();release();await expect(page.getByRole('searchbox')).toBeEnabled();
 await page.route('**/dist/web/app.js',route=>route.abort());await page.goto('/library');await expect(page.getByRole('heading',{name:'ページを読み込めませんでした'})).toBeVisible();await expect(page.getByRole('button',{name:'再読み込み'})).toBeVisible();
});
