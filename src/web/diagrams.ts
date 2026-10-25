import type { Catalog } from "../catalog.js";
import type { ReaderEntry } from "../reader.js";
import type { Concept } from "../model.js";
import { icon } from "./icons.js";

export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
export const paperLetter = (id: string): string => ({ "demo-retrieval": "A", "demo-vectors": "B", "demo-evidence": "C" }[id] ?? "");
export const conceptIcon = (id: string): string => id.includes("distance") ? "mechanism" : id.includes("vector") || id.includes("feature") ? "vector" : id.includes("similarity") ? "overlap" : id.includes("question") ? "chat" : id.includes("candidates") ? "list" : id.includes("answer") ? "spark" : id.includes("search") || id.includes("check") ? "document-search" : "document";

type Point = { x: number; y: number };
function layout(catalog: Catalog, paperId: string): Map<string, Point> {
  const paper = catalog.paper(paperId);
  const positions = new Map<string, Point>();
  if (!paper) return positions;
  if (paperId === "demo-retrieval") {
    const coordinates: Record<string, [number, number]> = {
      "retrieval-root": [500, 42], "retrieval-question": [235, 144], "retrieval-search": [500, 144], "retrieval-answer": [790, 144],
      "retrieval-distance": [380, 223], "retrieval-candidates": [665, 223], "retrieval-vector": [260, 295], "retrieval-similarity": [500, 295], "retrieval-evidence": [845, 223],
    };
    for (const [id, [x, y]] of Object.entries(coordinates)) positions.set(id, { x, y });
  } else {
    positions.set(paper.rootConceptId, { x: 500, y: 70 });
    catalog.children(paper.rootConceptId).forEach((node, index) => positions.set(node.id, { x: 300 + index * 400, y: 210 }));
  }
  return positions;
}
function edge(a: Point, b: Point): string {
  const mid = (a.y + b.y) / 2;
  return `M${a.x},${a.y + 22}V${mid}Q${a.x},${mid + 4} ${a.x + (b.x > a.x ? 4 : -4)},${mid + 4}H${b.x}V${b.y - 22}`;
}
export function miniMap(catalog: Catalog, paperId: string, selected = ""): string {
  const positions = layout(catalog, paperId);
  const nodes = catalog.concepts(paperId);
  return '<svg class="mini-tree" viewBox="0 0 1000 350" aria-hidden="true">' + nodes.map(node => {
    const point = positions.get(node.id); const parent = positions.get(node.parentId ?? "");
    return point && parent ? `<path d="${edge(parent, point)}"/>` : "";
  }).join("") + nodes.map(node => {
    const p = positions.get(node.id); if (!p) return "";
    return `<rect x="${p.x - 90}" y="${p.y - 24}" width="180" height="48" rx="10" class="${selected === node.id ? "mini-selected" : ""}"/>`;
  }).join("") + '</svg>';
}
export function conceptMap(catalog: Catalog, entry: ReaderEntry, all = false): string {
  const positions = layout(catalog, entry.paperId);
  const expanded = new Set(entry.expandedConceptIds);
  const nodes = catalog.concepts(entry.paperId).filter(node => all || catalog.ancestors(node.id).every(parent => expanded.has(parent.id)));
  const ancestorIds = new Set(catalog.ancestors(entry.selectedConceptId).map(n => n.id));
  return '<div class="concept-map"><svg class="concept-edges" viewBox="0 0 1000 350" preserveAspectRatio="none" aria-hidden="true">' + nodes.map(node => {
    const point = positions.get(node.id), parent = positions.get(node.parentId ?? "");
    return point && parent ? `<path data-map-edge="${node.id}" d="${edge(parent, point)}"/><circle data-map-dot="${node.id}" cx="${point.x}" cy="${point.y - 22}" r="4"/>` : "";
  }).join("") + '</svg>' + nodes.map(node => {
    const point = positions.get(node.id); if (!point) return "";
    const children = catalog.children(node.id); const root = node.parentId === null;
    const active = entry.selectedConceptId === node.id;
    const trail = !root && ancestorIds.has(node.id);
    return `<div class="concept-node ${root ? "root-node" : ""} ${active ? "selected" : ""} ${trail ? "trail" : ""}" style="--node-x:${point.x / 10}%;--node-y:${point.y / 3.5}%" data-node="${node.id}">
      <button class="node-select" data-concept="${node.id}" aria-pressed="${active}">${icon(conceptIcon(node.id))}<span>${root ? `<b>論文${paperLetter(entry.paperId)}</b>` : ""}${escapeHtml(node.title)}</span></button>
      ${!root && children.length ? `<button class="node-toggle" data-expand="${node.id}" aria-expanded="${expanded.has(node.id)}" aria-label="${escapeHtml(node.title)}を${expanded.has(node.id) ? "閉じる" : "開く"}">${expanded.has(node.id) ? "−" : "+"}</button>` : ""}
    </div>`;
  }).join("") + '</div>';
}
export function vectorDiagram(): string {
  return `<svg class="vector-diagram" viewBox="0 0 420 250" role="img" aria-label="原点から伸びる質問と資料Aの矢印は向きが近く、資料Bの矢印は離れている模式図">
    <defs><marker id="vector-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#0068ff" stroke="none"/></marker><marker id="vector-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#00a5ef" stroke="none"/></marker><marker id="vector-grey" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#8c9cb4" stroke="none"/></marker></defs>
    <path d="M42 205V35M42 205H365" stroke="#172b54" stroke-width="1.3"/>
    <path d="M42 205 142 101" stroke="#0068ff" stroke-width="3" marker-end="url(#vector-blue)"/><path d="M42 205 198 112" stroke="#00a5ef" stroke-width="3" marker-end="url(#vector-cyan)"/><path d="M42 205 346 173" stroke="#8c9cb4" stroke-width="3" marker-end="url(#vector-grey)"/>
    <circle cx="42" cy="205" r="6" fill="#102455"/><path d="M128 80h84" stroke="#a1c8f7"/><text x="135" y="63">向きが近い</text><text x="105" y="92" fill="#0068ff">質問</text><text x="201" y="108" fill="#0099d8">資料A</text><text x="300" y="143" fill="#677998">資料B</text><text x="282" y="161" class="diagram-small">（向きが遠い）</text><text x="15" y="230" class="diagram-small">原点（数値の空間）</text>
  </svg>`;
}
export function explanationDiagram(concept: Concept): string {
  if (/vector|distance|similarity|feature/.test(concept.id)) return vectorDiagram();
  const labels = /evidence|source|check/.test(concept.id) ? ["回答の主張", "原典を読む", "根拠を照合"] : /question/.test(concept.id) ? ["知りたいこと", "表現を整える", "検索する"] : ["質問", "資料を探す", "回答を組み立てる"];
  return '<div class="flow-diagram" role="img" aria-label="' + labels.join("から") + 'へ進む模式図">' + labels.map((label, i) => `<div>${icon(i === 0 ? "chat" : i === 1 ? "document-search" : "spark")}<span>${label}</span></div>${i < 2 ? '<span class="flow-arrow">→</span>' : ''}`).join('') + '</div>';
}
export function thumbnail(catalog: Catalog, paperId: string): string {
  const paper = catalog.paper(paperId); if (!paper) return '';
  const titles = catalog.children(paper.rootConceptId).map(c => c.title);
  return `<div class="tree-thumbnail" aria-hidden="true"><div class="thumbnail-root">${icon("document")}<span><b>論文${paperLetter(paperId)}</b>${escapeHtml(paper.title)}</span></div><div class="thumbnail-branch"></div><div class="thumbnail-children">${titles.map((title, i) => `<span class="${i === 1 && paperId === "demo-retrieval" ? "blue" : ""}">${escapeHtml(title)}</span>`).join("")}</div>${paperId === "demo-retrieval" ? '<div class="thumbnail-grandchildren"><span>近さの計算</span><span>候補を選ぶ</span></div>' : ""}</div>`;
}
