import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const output = resolve("site");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp("web", output, { recursive: true });
await cp("dist", resolve(output, "dist"), { recursive: true });
const html = await readFile("web/index.html", "utf8");
const loadingBody = `<body class="app-loading"><main aria-busy="true"><a class="brand" href="/" aria-label="RONLENS ホーム"><span class="brand-mark" aria-hidden="true"></span><span>RONLENS</span></a><p role="status">ページを読み込んでいます…</p><noscript><p>図解の操作にはJavaScriptを有効にしてください。掲載内容はすべて架空デモです。</p></noscript></main></body>`;
const innerHtml = html.replace(/<body>[\s\S]*<\/body>/, loadingBody);
for (const route of ["library", "network", "saved", "help", "paper/demo-retrieval", "paper/demo-vectors", "paper/demo-evidence"]) {
  await mkdir(resolve(output, route), { recursive: true });
  await writeFile(resolve(output, route, "index.html"), innerHtml);
}
await writeFile(resolve(output, "404.html"), innerHtml);
console.log("Built RONLENS static site in site/");
