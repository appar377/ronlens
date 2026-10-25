import { Catalog } from "../catalog.js";
import { DEMO_NOTICE } from "../model.js";
import type { Concept, DemoDataset } from "../model.js";

function node(id: string, paperId: string, parentId: string | null, title: string, explanation: string): Concept {
  return { id, paperId, parentId, title, explanation, terms: [{ term: title, meaning: explanation }],
    source: { kind: "fictional-demo", section: "架空原稿・" + title, text: explanation } };
}
const dataset: DemoDataset = {
  schemaVersion: 1, mode: "fictional-demo", id: "ronlens-home-demo-v1", notice: DEMO_NOTICE,
  papers: [
    { id: "demo-retrieval", kind: "fictional-demo", title: "資料を探して答えるAI",
      summary: "質問を理解し、関連する資料を探して、根拠とともに回答を生成する仕組みを探ります。",
      tags: ["資料検索", "AI"], rootConceptId: "retrieval-root", readingOrder: ["retrieval-root", "retrieval-search", "retrieval-answer"] },
    { id: "demo-vectors", kind: "fictional-demo", title: "意味の近さを測る",
      summary: "言葉や文章をベクトルで表し、意味の近さ（類似度）を計算する方法を紹介します。",
      tags: ["ベクトル", "AI"], rootConceptId: "vectors-root", readingOrder: ["vectors-root", "vectors-distance"] },
    { id: "demo-evidence", kind: "fictional-demo", title: "出典で回答を確かめる",
      summary: "回答の根拠となる資料の出典を示し、内容を照合して正確さを確かめる方法を探ります。",
      tags: ["出典と照合", "AI"], rootConceptId: "evidence-root", readingOrder: ["evidence-root", "evidence-check"] },
  ],
  concepts: [
    node("retrieval-root", "demo-retrieval", null, "資料から回答へ", "質問に関係する資料を探し、回答の材料にする架空の仕組み。"),
    node("retrieval-search", "demo-retrieval", "retrieval-root", "資料検索", "架空原稿「意味の近さを測る」を参照して、質問に近い文章を探す。"),
    node("retrieval-answer", "demo-retrieval", "retrieval-root", "根拠を添える", "回答と一緒に、参照した資料を示す。"),
    node("vectors-root", "demo-vectors", null, "言葉のベクトル", "言葉の特徴を数値の組として表現する架空の説明。"),
    node("vectors-distance", "demo-vectors", "vectors-root", "類似度", "ベクトルの向きや距離を、比較の手掛かりとする。"),
    node("evidence-root", "demo-evidence", null, "出典と照合", "回答と資料を照らし合わせる架空の確認手順。"),
    node("evidence-check", "demo-evidence", "evidence-root", "原典を読む", "主張と、資料に実際に書かれたことを分けて確認する。"),
  ],
  links: [
    { id: "retrieval-cites-vectors", kind: "citation", authenticity: "fictional-demo",
      fromPaperId: "demo-retrieval", toPaperId: "demo-vectors",
      evidence: { sourceConceptId: "retrieval-search", excerpt: "架空原稿「意味の近さを測る」を参照" } },
    { id: "retrieval-related-evidence", kind: "editorial", fromPaperId: "demo-retrieval", toPaperId: "demo-evidence",
      rationale: "回答の生成と根拠の確認を続けて読むための編集上の案内。" },
  ],
};
export function createHomeCatalog(): Catalog {
  const result = Catalog.parse(dataset);
  if (!result.ok) throw new Error("Invalid home demo: " + JSON.stringify(result.issues));
  return result.value;
}
