export const DEMO_NOTICE = "架空デモ：論文・概念・引用はUI検証用の創作です。実在する研究の紹介ではありません。";

export interface DemoSource {
  readonly kind: "fictional-demo";
  readonly section: string;
  readonly text: string;
}

export interface Concept {
  readonly id: string;
  readonly paperId: string;
  readonly parentId: string | null;
  readonly title: string;
  readonly explanation: string;
  readonly terms: readonly { readonly term: string; readonly meaning: string }[];
  readonly source: DemoSource;
}

export interface Paper {
  readonly id: string;
  readonly kind: "fictional-demo";
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly rootConceptId: string;
  readonly readingOrder: readonly string[];
}

interface LinkEndpoints {
  readonly id: string;
  readonly fromPaperId: string;
  readonly toPaperId: string;
}

export interface Citation extends LinkEndpoints {
  readonly kind: "citation";
  readonly authenticity: "fictional-demo";
  readonly evidence: {
    readonly sourceConceptId: string;
    readonly excerpt: string;
  };
}

export interface EditorialRelation extends LinkEndpoints {
  readonly kind: "editorial";
  readonly rationale: string;
}

export type PaperLink = Citation | EditorialRelation;

export interface DemoDataset {
  readonly schemaVersion: 1;
  readonly mode: "fictional-demo";
  readonly id: string;
  readonly notice: typeof DEMO_NOTICE;
  readonly papers: readonly Paper[];
  readonly concepts: readonly Concept[];
  readonly links: readonly PaperLink[];
}

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

export function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function relationshipLabel(link: PaperLink): string {
  return link.kind === "citation"
    ? "デモ内の架空引用"
    : "編集上の関連（架空デモ）";
}
