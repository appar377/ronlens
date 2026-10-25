import { Catalog } from "../catalog.js";
import { DEMO_NOTICE } from "../model.js";
import type { Concept, DemoDataset } from "../model.js";

function node(id: string, paperId: string, parentId: string | null, title: string, explanation: string, section: string, sourceText = explanation): Concept {
  return { id, paperId, parentId, title, explanation,
    terms: [{ term: title, meaning: explanation }],
    source: { kind: "fictional-demo", section: "架空原稿 " + section, text: sourceText } };
}
const dataset: DemoDataset = {
  schemaVersion: 1, mode: "fictional-demo", id: "ronlens-home-demo-v1", notice: DEMO_NOTICE,
  papers: [
    { id: "demo-retrieval", kind: "fictional-demo", title: "資料を探して答えるAI",
      summary: "質問を変換し、資料を探して、根拠とともに回答を組み立てる仕組みです。",
      tags: ["資料検索", "AI"], rootConceptId: "retrieval-root",
      readingOrder: ["retrieval-root", "retrieval-question", "retrieval-search", "retrieval-distance", "retrieval-vector", "retrieval-similarity", "retrieval-candidates", "retrieval-answer", "retrieval-evidence"] },
    { id: "demo-vectors", kind: "fictional-demo", title: "意味の近さを測る",
      summary: "文章どうしの意味の近さを、数値で比較する方法を紹介します。",
      tags: ["ベクトル", "AI"], rootConceptId: "vectors-root", readingOrder: ["vectors-root", "vectors-feature", "vectors-distance"] },
    { id: "demo-evidence", kind: "fictional-demo", title: "出典で回答を確かめる",
      summary: "回答に使った資料をたどり、主張と根拠を照合する方法です。",
      tags: ["出典と照合", "AI"], rootConceptId: "evidence-root", readingOrder: ["evidence-root", "evidence-source", "evidence-check"] },
  ],
  concepts: [
    node("retrieval-root", "demo-retrieval", null, "資料を探して答えるAI", "関連する資料を探し、見つけた情報にもとづいて回答を組み立てる架空の仕組みです。質問変換、資料検索、回答生成の順に読んでみましょう。", "論文A 概要"),
    node("retrieval-question", "demo-retrieval", "retrieval-root", "質問変換", "質問の中から知りたい対象を取り出し、検索に使う表現へ整えます。言い換えで意味が変わっていないか、人が確かめます。", "論文A §1"),
    node("retrieval-search", "demo-retrieval", "retrieval-root", "資料検索", "質問に関係する資料を候補から探します。架空原稿「意味の近さを測る」を参照して、近さの計算と候補の選択を組み合わせます。", "論文A §2"),
    node("retrieval-distance", "demo-retrieval", "retrieval-search", "近さの計算", "質問と資料を数値の並び（ベクトル）に変換し、向きの近さ（類似度）を計算します。近さだけで正しさは保証できません。", "論文A §2.1", "質問と資料をベクトルに変換し、向きの近さを計算します。この架空原稿では、論文Bの「類似度」の考え方を参照します。"),
    node("retrieval-vector", "demo-retrieval", "retrieval-distance", "ベクトル", "数値を順序に沿って並べたものです。この図では文章の特徴を矢印で表しています。実際の数値や学習結果ではなく、考え方を示す模式図です。", "論文A §2.1.1"),
    node("retrieval-similarity", "demo-retrieval", "retrieval-distance", "類似度", "二つのベクトルがどれほど似ているかを表す数値です。ここでは向きの近さに注目します。内容が似ていても、主張が正しいとは限りません。", "論文A §2.1.2"),
    node("retrieval-candidates", "demo-retrieval", "retrieval-search", "候補を選ぶ", "近さを手がかりに資料の候補を並べ、回答の根拠になりそうな箇所を選びます。異なる立場の資料が抜け落ちていないかも確かめます。", "論文A §2.2"),
    node("retrieval-answer", "demo-retrieval", "retrieval-root", "回答生成", "選んだ資料をもとに回答を組み立てます。資料に書かれた内容と、説明のための推測を区別し、根拠のない断定を避けます。", "論文A §3"),
    node("retrieval-evidence", "demo-retrieval", "retrieval-answer", "出典と照合", "回答に添えた出典をたどり、元の文章と意味が一致するか確かめます。この架空原稿では論文Cの「根拠の確認」を参照します。", "論文A §3.1"),
    node("vectors-root", "demo-vectors", null, "意味の近さを測る", "文章どうしの意味の近さを計算する考え方を扱う架空原稿です。ベクトルという表現から、類似度の読み方へ進みます。", "論文B 概要"),
    node("vectors-feature", "demo-vectors", "vectors-root", "ベクトル", "言葉の特徴を数値の組として表します。図の矢印は特徴の方向を説明するためのものです。文章そのものを完全に表すわけではありません。", "論文B §2"),
    node("vectors-distance", "demo-vectors", "vectors-root", "類似度", "ベクトルの向きや距離を比較の手掛かりとします。二つの向きが近いとき、ここでは意味が近いと説明します。判断には文脈も必要です。", "論文B §3"),
    node("evidence-root", "demo-evidence", null, "出典で回答を確かめる", "回答と資料を照らし合わせる架空の確認手順です。出典の取得と根拠の確認を分けて見ていきます。", "論文C 概要"),
    node("evidence-source", "demo-evidence", "evidence-root", "出典の取得", "回答が参照した資料の名前と該当箇所を記録します。このデモの原稿はすべて創作であり、実論文へのURLやDOIはありません。", "論文C §1"),
    node("evidence-check", "demo-evidence", "evidence-root", "根拠の確認", "原典を読み、回答の主張と資料に実際に書かれたことを照合します。前提や条件が省かれていないか、結論を強く言い換えていないかを確かめます。", "論文C §2"),
  ],
  links: [
    { id: "retrieval-cites-vectors", kind: "citation", authenticity: "fictional-demo", fromPaperId: "demo-retrieval", toPaperId: "demo-vectors", evidence: { sourceConceptId: "retrieval-distance", excerpt: "論文Bの「類似度」の考え方を参照" } },
    { id: "retrieval-cites-evidence", kind: "citation", authenticity: "fictional-demo", fromPaperId: "demo-retrieval", toPaperId: "demo-evidence", evidence: { sourceConceptId: "retrieval-evidence", excerpt: "論文Cの「根拠の確認」を参照" } },
    { id: "vectors-related-evidence", kind: "editorial", fromPaperId: "demo-vectors", toPaperId: "demo-evidence", rationale: "意味が近いことと、根拠が正しいことの違いを続けて読むための編集上の案内です。本文に引用関係があるとは主張しません。" },
  ],
};
export function createHomeCatalog(): Catalog {
  const result = Catalog.parse(dataset);
  if (!result.ok) throw new Error("Invalid home demo: " + JSON.stringify(result.issues));
  return result.value;
}
