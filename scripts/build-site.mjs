import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const output = resolve("site");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp("web", output, { recursive: true });
await cp("dist", resolve(output, "dist"), { recursive: true });
const html = await readFile("web/index.html", "utf8");
for (const route of ["library", "network", "saved", "help", "paper/demo-retrieval", "paper/demo-vectors", "paper/demo-evidence"]) {
  await mkdir(resolve(output, route), { recursive: true });
  await writeFile(resolve(output, route, "index.html"), html);
}
await writeFile(resolve(output, "404.html"), html);
console.log("Built RONLENS static site in site/");
