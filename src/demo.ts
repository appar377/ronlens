import { Catalog } from "./catalog.js";
import { DEMO_NOTICE } from "./model.js";
import type { Concept, DemoDataset } from "./model.js";

function concept(
  id: string, paperId: string, parentId: string | null,
  title: string, explanation: string, sourceText = explanation,
): Concept {
  return {
    id, paperId, parentId, title, explanation,
    terms: [{ term: title, meaning: explanation }],
    source: { kind: "fictional-demo", section: "架空原稿 / " + title, text: sourceText },
  };
}

// These manuscripts, methods and links are authored fixtures, not summaries of real research.
export const DEMO_DATASET: DemoDataset = {
  schemaVersion: 1,
  mode: "fictional-demo",
  id: "ronlens-demo-v1",
  notice: DEMO_NOTICE,
  papers: [
    {
      id: "demo-paths", kind: "fictional-demo", title: "架空デモ｜分岐する読書経路",
      summary: "概念を段階的に開き、自分の読む順序を選ぶ操作のための架空原稿。",
      tags: ["学び", "概念マップ"], rootConceptId: "paths-root",
      readingOrder: ["paths-root", "paths-context", "paths-branch", "paths-return"],
    },
    {
      id: "demo-notes", kind: "fictional-demo", title: "架空デモ｜問いを残すノート",
      summary: "読む途中の問いを保存し、別の説明へ移る操作を試す架空原稿。",
      tags: ["学び", "ノート"], rootConceptId: "notes-root",
      readingOrder: ["notes-root", "notes-question", "notes-review"],
    },
    {
      id: "demo-links", kind: "fictional-demo", title: "架空デモ｜説明をつなぐ見取り図",
      summary: "引用と編集上の関連を分けて表示するための架空原稿。",
      tags: ["概念マップ", "つながり"], rootConceptId: "links-root",
      readingOrder: ["links-root", "links-origin"],
    },
  ],
  concepts: [
    concept("paths-root", "demo-paths", null, "読書経路", "関心に合わせて、次に読む概念を選ぶという架空の例。"),
    concept("paths-context", "demo-paths", "paths-root", "前提を知る", "最初に用語と、話題の範囲を確認する。"),
    concept("paths-branch", "demo-paths", "paths-root", "分岐を選ぶ", "同じ階層の概念を見比べて、一つを開く。"),
    concept("paths-return", "demo-paths", "paths-branch", "読んだ位置へ戻る",
      "別の原稿から戻っても、開いていた概念を保持する。",
      "架空原稿「問いを残すノート」を参照し、戻る操作のデモを構成する。"),
    concept("notes-root", "demo-notes", null, "問いのノート", "読む途中の疑問を次の学びへ残すという架空の例。"),
    concept("notes-question", "demo-notes", "notes-root", "問いを言葉にする", "分からなかった点を短い言葉で残す。"),
    concept("notes-review", "demo-notes", "notes-root", "問いを見直す", "説明を読んだ後で、最初の問いへ戻る。"),
    concept("links-root", "demo-links", null, "説明のつながり", "原典に書かれた参照と、編集者の案内を区別する架空の例。"),
    concept("links-origin", "demo-links", "links-root", "つながりの根拠", "引用には出所があり、編集上の関連には選定理由がある。"),
  ],
  links: [
    {
      id: "paths-cites-notes", kind: "citation", authenticity: "fictional-demo",
      fromPaperId: "demo-paths", toPaperId: "demo-notes",
      evidence: { sourceConceptId: "paths-return", excerpt: "架空原稿「問いを残すノート」を参照" },
    },
    {
      id: "paths-related-links", kind: "editorial",
      fromPaperId: "demo-paths", toPaperId: "demo-links",
      rationale: "読む位置の保持と、別の説明へ移る操作を並べて試せるため。",
    },
  ],
};

export function createDemoCatalog(): Catalog {
  const parsed = Catalog.parse(DEMO_DATASET);
  if (!parsed.ok) throw new Error("Invalid bundled demo: " + JSON.stringify(parsed.issues));
  return parsed.value;
}
