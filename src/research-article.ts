import { deepFreeze } from "./model.js";

/** A site-authored explanation is distinct from the scientific works it discusses. */
export interface ResearchPaperReference {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly year: number;
  readonly venue: string;
  readonly doi: string | null;
  readonly primaryUrl: string;
  readonly fullTextUrl: string | null;
  readonly inspectedMaterial: "full-text" | "abstract-only";
  readonly publicationType: "journal-article" | "preprint";
}
export interface EvidenceReference {
  readonly paperId: string;
  /** Section/page/table/figure locator; a reference is not permission to reproduce a figure. */
  readonly locator: string;
  readonly supports: string;
  readonly verificationNote: string;
}
export interface ExplainerSection {
  readonly id: string;
  readonly title: string;
  readonly role: "context" | "method" | "finding" | "limitation" | "interpretation" | "example";
  readonly paragraphs: readonly string[];
  readonly evidence: readonly EvidenceReference[];
}
export interface ExplainerConcept {
  readonly id: string;
  readonly parentId: string | null;
  readonly label: string;
  readonly sectionId: string;
}
export interface OriginalDiagramBrief {
  readonly id: string;
  readonly kind: "original-schematic";
  readonly caption: string;
  readonly alt: string;
  readonly description: string;
  readonly sectionIds: readonly string[];
}
export interface ResearchExplainerContent {
  readonly publishedDate: string;
  readonly readingMinutes: number;
  readonly category: string;
  readonly evidenceScope: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly audience: string;
  readonly centralQuestion: string;
  readonly tags: readonly string[];
  readonly authorship: {
    readonly siteByline: string;
    readonly productionDisclosure: string;
    readonly distinction: "site-authored-explainer-not-original-paper";
  };
  readonly papers: readonly ResearchPaperReference[];
  readonly sections: readonly ExplainerSection[];
  readonly concepts: readonly ExplainerConcept[];
  readonly readingOrder: readonly string[];
  readonly diagrams: readonly OriginalDiagramBrief[];
}
export interface SourceReview {
  readonly reviewedOn: string;
  readonly reviewerLabel: string;
  readonly paperIds: readonly string[];
  readonly sectionIds: readonly string[];
  readonly notes: string;
}
export interface ResearchArticleDraft {
  readonly schemaVersion: 1;
  readonly kind: "research-explainer";
  readonly status: "draft";
  readonly slotId: string;
  readonly topicHint: string;
  readonly content: ResearchExplainerContent | null;
  readonly sourceReview: SourceReview | null;
}
export interface DraftReadiness {
  readonly status: "needs-content" | "needs-source-review" | "needs-corrections" | "ready-for-editorial-check";
  readonly issues: readonly string[];
}

/** Structural editorial checks only. This does not fact-check, publish, or change draft status. */
export function inspectArticleDraft(draft: ResearchArticleDraft): DraftReadiness {
  if (!draft.content) return deepFreeze({ status: "needs-content", issues: ["出典確認済み原稿が未受領です。"] });
  const content = draft.content;
  const issues: string[] = [];
  const text = (value: string, name: string): void => { if (!value.trim()) issues.push(name + "が未入力です。"); };
  const id = (value: string, name: string): void => { if (!/^[a-z][a-z0-9-]{0,79}$/.test(value)) issues.push(name + "は英小文字・数字・ハイフンのIDが必要です。"); };
  const url = (value: string, name: string): void => {
    try { const parsed = new URL(value); if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error(); }
    catch { issues.push(name + "は認証情報を含まないHTTPS URLが必要です。"); }
  };
  const uniqueIds = (items: readonly { readonly id: string }[], name: string): Set<string> => {
    const ids = new Set<string>();
    for (const item of items) { id(item.id, name); if (ids.has(item.id)) issues.push(name + "に重複IDがあります。"); ids.add(item.id); }
    return ids;
  };
  id(content.slug, "slug");
  for (const key of ["title", "summary", "audience", "centralQuestion"] as const) text(content[key], key);
  text(content.authorship.siteByline, "サイト側の署名");
  text(content.authorship.productionDisclosure, "制作方法の開示");
  if (content.authorship.distinction !== "site-authored-explainer-not-original-paper") issues.push("原論文とサイト解説の区別が必要です。");
  const papers = uniqueIds(content.papers, "papers");
  if (!papers.size) issues.push("一次資料の書誌情報が必要です。");
  for (const paper of content.papers) {
    text(paper.title, "原論文タイトル"); text(paper.venue, "掲載媒体");
    if (!paper.authors.length || paper.authors.some(author => !author.trim())) issues.push("原論文の著者名が必要です。");
    if (!Number.isInteger(paper.year) || paper.year < 1000 || paper.year > 9999) issues.push("発表年が不正です。");
    if (paper.doi !== null && !/^10\.\d{4,9}\/\S+$/.test(paper.doi)) issues.push("DOIの形式が不正です。");
    url(paper.primaryUrl, "一次資料URL"); if (paper.fullTextUrl !== null) url(paper.fullTextUrl, "全文URL");
  }
  const sections = uniqueIds(content.sections, "sections");
  for (const role of ["method", "finding", "limitation"] as const) {
    if (!content.sections.some(section => section.role === role)) issues.push(role + "に対応する節が必要です。");
  }
  for (const section of content.sections) {
    text(section.title, "節タイトル");
    if (!section.paragraphs.length) issues.push(section.id + "に本文がありません。");
    section.paragraphs.forEach(paragraph => text(paragraph, section.id));
    if (["method", "finding", "limitation"].includes(section.role) && !section.evidence.length) issues.push(section.id + "に主張を支える出典箇所が必要です。");
    for (const evidence of section.evidence) {
      if (!papers.has(evidence.paperId)) issues.push(section.id + "の出典IDが不明です。");
      text(evidence.locator, "出典箇所"); text(evidence.supports, "支持する主張"); text(evidence.verificationNote, "照合メモ");
    }
  }
  const concepts = uniqueIds(content.concepts, "concepts");
  if (!concepts.size || content.concepts.filter(concept => concept.parentId === null).length !== 1) issues.push("概念マップには1つのルートが必要です。");
  const byId = new Map(content.concepts.map(concept => [concept.id, concept]));
  for (const concept of content.concepts) {
    text(concept.label, "概念ラベル");
    if (!sections.has(concept.sectionId)) issues.push(concept.id + "の説明節が不明です。");
    const visited = new Set([concept.id]); let parentId = concept.parentId;
    while (parentId !== null) {
      if (visited.has(parentId)) { issues.push("概念の親子関係が循環しています。"); break; }
      visited.add(parentId); const parent = byId.get(parentId);
      if (!parent) { issues.push(concept.id + "の親概念が不明です。"); break; }
      parentId = parent.parentId;
    }
  }
  if (!content.readingOrder.length || content.readingOrder.some(conceptId => !concepts.has(conceptId)) || new Set(content.readingOrder).size !== content.readingOrder.length) issues.push("読む順序の概念IDが不正です。");
  uniqueIds(content.diagrams, "diagrams");
  if (!content.diagrams.length) issues.push("原稿をもとに作る独自の説明図の設計が必要です。");
  for (const diagram of content.diagrams) {
    if (diagram.kind !== "original-schematic") issues.push("原論文の図版転載はこの枠では扱いません。");
    text(diagram.caption, "図のキャプション"); text(diagram.alt, "図の代替説明"); text(diagram.description, "図の設計");
    if (!diagram.sectionIds.length || diagram.sectionIds.some(sectionId => !sections.has(sectionId))) issues.push("図と本文の対応が不明です。");
  }
  if (issues.length) return deepFreeze({ status: "needs-corrections", issues });
  const review = draft.sourceReview;
  if (!review) return deepFreeze({ status: "needs-source-review", issues: ["出典照合の記録が未受領です。"] });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn) || Number.isNaN(Date.parse(review.reviewedOn)) || new Date(review.reviewedOn).toISOString().slice(0, 10) !== review.reviewedOn) issues.push("出典確認日が不正です。");
  text(review.reviewerLabel, "出典確認の担当表記"); text(review.notes, "確認範囲と制限");
  if ([...papers].some(paperId => !review.paperIds.includes(paperId)) || review.paperIds.some(paperId => !papers.has(paperId))) issues.push("出典確認済み論文IDが一致しません。");
  if ([...sections].some(sectionId => !review.sectionIds.includes(sectionId)) || review.sectionIds.some(sectionId => !sections.has(sectionId))) issues.push("出典確認済み本文の範囲が一致しません。");
  return deepFreeze({ status: issues.length ? "needs-corrections" : "ready-for-editorial-check", issues });
}
