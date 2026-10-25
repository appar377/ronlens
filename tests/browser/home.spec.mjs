import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("reference card order, truthful demo and seven hero-only perspectives", async ({ page }) => {
  await expect(page.locator(".paper-card h2")).toHaveText(["資料を探して答えるAI", "意味の近さを測る", "出典で回答を確かめる"]);
  await expect(page.locator(".demo-tag")).toHaveCount(3);
  await expect(page.locator(".read-link[href^=\"/paper/\"]")).toHaveCount(3);
  const labels = ["問い", "解決", "しくみ", "根拠", "発見", "活用", "次の疑問"];
  for (const label of labels) {
    await page.getByRole("button", { name: label + "の説明を表示", exact: true }).click();
    await expect(page.locator("#perspective-note strong")).toHaveText(label);
    await expect(page.locator(".light-door[aria-pressed=true]")).toHaveCount(1);
    await expect(page.locator('.light-door[aria-describedby="perspective-note"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: label + "の説明を表示", exact: true })).toHaveAttribute("aria-describedby", "perspective-note");
  }
});

test("search, saved search, reload, browser back and forward", async ({ page }) => {
  const input = page.getByRole("searchbox");
  await input.fill("ベクトル"); await input.press("Enter");
  await expect(page.locator(".paper-card")).toHaveCount(2);
  await expect(page.locator(".paper-card h2", { hasText: "意味の近さを測る" })).toBeVisible();
  await page.getByRole("button", { name: "この検索を保存", exact: true }).click();
  await page.reload();
  await expect(input).toHaveValue("ベクトル");
  await expect(page.locator(".query-chip")).toHaveCount(1);
  await input.fill("原典"); await input.press("Enter");
  await expect(page.locator(".paper-card h2")).toHaveText("出典で回答を確かめる");
  await page.goBack(); await expect(input).toHaveValue("ベクトル");
  await page.goForward(); await expect(input).toHaveValue("原典");
  await page.locator("[data-query]").click();
  await expect(input).toHaveValue("ベクトル");
  await page.locator("[data-remove-query]").click(); await page.reload();
  await expect(page.locator(".query-chip")).toHaveCount(0);
});

test("bookmark persistence, repeated operation and saved empty state", async ({ page }) => {
  const bookmark = page.locator('[data-paper="demo-retrieval"]');
  await bookmark.click(); await bookmark.click(); await bookmark.click();
  await expect(bookmark).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(bookmark).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-view="saved"]').click();
  await expect(page.locator(".paper-card")).toHaveCount(1);
  await bookmark.click();
  await expect(page.getByRole("heading", { name: "保存した論文はまだありません" })).toBeVisible();
  await expect(page.getByRole("button", { name: "すべての論文へ" })).toBeFocused();
  await page.getByRole("button", { name: "すべての論文へ" }).click();
  await expect(page.locator(".paper-card")).toHaveCount(3);
});

test("no matches, query reset, normalized input", async ({ page }) => {
  const input = page.getByRole("searchbox");
  await input.fill("存在しないキーワード"); await input.press("Enter");
  await expect(page.getByRole("heading", { name: "一致する論文・解説がありません" })).toBeVisible();
  await page.locator("#empty-state [data-clear-search]").click();
  await expect(page.locator(".paper-card")).toHaveCount(3);
  await input.fill("  ＡＩ "); await input.press("Enter");
  await expect(input).toHaveValue("ai");
  await expect(page.locator(".paper-card")).toHaveCount(3);
});

test("mobile menu supports keyboard, Escape and search focus", async ({ page }) => {
  await page.setViewportSize({ width: 335, height: 815 });
  const menu = page.getByRole("button", { name: "メニューを開く" });
  await menu.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#main-nav")).toBeVisible();
  await expect(page.locator('[data-view="all"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#main-nav").getByRole("link", { name: "論文を探す", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(page.locator("#main-nav")).toBeHidden();
  await menu.click(); await page.locator("#main-nav").getByRole("link", { name: "論文を探す", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.locator("#main-nav")).toBeHidden();
});

test("storage unavailable stays usable without reporting save success", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }));
  await page.reload();
  await expect(page.locator("#operation-status")).toContainText("保存できません");
  await page.locator('[data-paper="demo-retrieval"]').click();
  await expect(page.locator("#operation-status")).toContainText("今の画面内だけ");
  await expect(page.locator('[data-paper="demo-retrieval"]')).toHaveAttribute("aria-pressed", "true");
});

test("corrupt data is preserved and simultaneous tabs do not silently overwrite", async ({ page, context }) => {
  await page.locator('[data-paper="demo-retrieval"]').click();
  const second = await context.newPage(); await second.goto("/");
  await page.locator('[data-paper="demo-vectors"]').click();
  await second.locator('[data-paper="demo-evidence"]').click();
  await expect(second.locator("#operation-status")).toContainText("別のタブ");
  await second.reload();
  await expect(second.locator('[data-paper="demo-vectors"]')).toHaveAttribute("aria-pressed", "true");
  await expect(second.locator('[data-paper="demo-evidence"]')).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => { const key = Object.keys(localStorage).find(k => k.includes("ronlens")); localStorage.setItem(key, "{broken"); });
  await page.reload(); await page.locator('[data-paper="demo-retrieval"]').click();
  expect(await page.evaluate(() => Object.values(localStorage).includes("{broken"))).toBe(true);
  await expect(page.locator("#operation-status")).toContainText("保存できません");
});

for (const width of [320, 335, 390, 700, 701, 768, 1083, 1440]) {
  test(`no horizontal overflow or header overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 896 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const bounds = await page.locator(".brand, .header-actions").evaluateAll(nodes => nodes.map(node => { const r=node.getBoundingClientRect(); return { left:r.left, right:r.right }; }));
    expect(bounds[0].right).toBeLessThanOrEqual(bounds[1].left);
    await expect(page.locator(".paper-card")).toHaveCount(3);
  });
}

test("200 percent equivalent reflow and no runtime errors", async ({ page }) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 542, height: 448 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("unknown static routes return real 404", async ({ request }) => {
  const response = await request.get("/paper/not-a-demo");
  expect(response.status()).toBe(404);
});

test("sort-only URL overrides the persisted query", async ({ page }) => {
  await page.getByRole("searchbox").fill("資料検索");
  await page.getByRole("searchbox").press("Enter");
  await page.goto("/?sort=title");
  await expect(page).toHaveURL(/\?sort=title$/);
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.locator(".paper-card")).toHaveCount(3);
});

test("rerendered controls preserve a visible keyboard focus", async ({ page }) => {
  const input = page.getByRole("searchbox");
  await input.fill("ベクトル"); await input.press("Enter");
  await page.locator("#save-search").focus(); await page.keyboard.press("Enter");
  await expect(page.locator("[data-query]")).toBeFocused();
  await page.locator("[data-remove-query]").focus(); await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await page.locator("#result-heading [data-clear-search]").focus(); await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await page.setViewportSize({ width: 335, height: 815 });
  await page.locator(".menu-button").click();
  await page.locator('[data-view="saved"]').focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#result-heading")).toBeFocused();
  await expect(page.locator("#result-heading")).toBeVisible();
});
