import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve(process.argv[2] ?? "../evidence");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const measurements = [];
try {
  for (const [name, width, height] of [["desktop", 1083, 896], ["mobile", 335, 815]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, locale: "ja-JP", colorScheme: "light", reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:4183/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(output, "home-" + name + "-final.png") });
    measurements.push({ name, width, height, dpr: 1, zoom: 1, scroll: [0, 0], state: "empty storage, no query, question selected", errors,
      boxes: await page.locator(".site-header, .hero, .hero-copy, .search-form, .paper-card").evaluateAll(nodes => nodes.map(node => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { selector: node.className, x, y, width, height };
      })),
    });
    await page.close();
  }
  await writeFile(resolve(output, "home-browser-measurements.json"), JSON.stringify({ browser: await browser.version(), measurements }, null, 2) + "\n");
} finally { await browser.close(); }
