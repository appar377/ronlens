import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { retrievalArticle } from "../dist/retrieval-article.js";
import { researchPage } from "../dist/web/research-view.js";
import { articleCanonical, articleMetadata } from "../dist/web/research-metadata.js";
import { escapeHtml } from "../dist/web/diagrams.js";
const output = resolve("site");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp("web", output, { recursive: true });
await cp("dist", resolve(output, "dist"), { recursive: true });
const html = await readFile("web/index.html", "utf8");
const loadingBody = `<body class="app-loading"><main aria-busy="true"><a class="brand" href="/" aria-label="RONLENS ホーム"><span class="brand-mark" aria-hidden="true"></span><span>RONLENS</span></a><p role="status">ページを読み込んでいます…</p><noscript><p>図解の操作にはJavaScriptを有効にしてください。実論文に基づく解説と架空デモを区別して掲載しています。</p></noscript></main></body>`;
const innerHtml = html.replace(/<body>[\s\S]*<\/body>/, loadingBody);
for (const route of ["library", "network", "saved", "help", "paper/demo-retrieval", "paper/demo-vectors", "paper/demo-evidence"]) {
  await mkdir(resolve(output, route), { recursive: true });
  await writeFile(resolve(output, route, "index.html"), innerHtml);
}
const articleRoute = "articles/" + retrievalArticle.slug;
const articleMarkup = researchPage({ version: 1, saved: false, visited: false, view: { selected: "learning", expanded: ["learning", "retrieval-practice"] } }).replaceAll("<button ", "<button disabled data-boot-disabled ");
const articleHtml = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(retrievalArticle.title)} | RONLENS</title>`)
  .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(retrievalArticle.summary)}">`)
  .replace("</head>", `<link id="research-canonical" rel="canonical" href="${articleCanonical}"><script id="research-structured-data" type="application/ld+json">${JSON.stringify(articleMetadata).replaceAll("<", "\\u003c")}</script></head>`)
  .replace(/<body>[\s\S]*<\/body>/, `<body class="inner-page"><a class="brand" href="/">RONLENS</a><main class="app-main">${articleMarkup}<noscript><p class="noscript">本文と原論文リンクはそのまま読めます。概念の操作・保存にはJavaScriptを有効にしてください。</p></noscript></main></body>`);
await mkdir(resolve(output, articleRoute), { recursive: true });
await writeFile(resolve(output, articleRoute, "index.html"), articleHtml);
await writeFile(resolve(output, "404.html"), innerHtml);
console.log("Built RONLENS static site in site/");
